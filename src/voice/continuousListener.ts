// VoiceNav Continuous Listener — always-on voice mode with wake word detection
// Barge-in support, silence detection, voice activity detection

import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { stopSpeaking, getIsSpeaking } from './textToSpeech';
import { logger } from '../utils/logger';

export type ContinuousMode = 'off' | 'wake_word' | 'always_on' | 'push_to_talk';

export type ContinuousListenerState = {
  mode: ContinuousMode;
  isListening: boolean;
  isWakeWordDetected: boolean;
  silenceTimer: ReturnType<typeof setTimeout> | null;
  volumeThreshold: number;
  silenceTimeout: number; // ms
  wakeWord: string;
  lastActivityTime: number;
};

type ContinuousCallbacks = {
  onCommand: (text: string) => void;
  onWakeWord: () => void;
  onListeningStart: () => void;
  onListeningEnd: () => void;
  onVolumeChange: (volume: number) => void;
  onError: (error: string) => void;
};

const DEFAULT_STATE: ContinuousListenerState = {
  mode: 'off',
  isListening: false,
  isWakeWordDetected: false,
  silenceTimer: null,
  volumeThreshold: 0.15,
  silenceTimeout: 3000,
  wakeWord: 'hey voicenav',
  lastActivityTime: 0,
};

let state = { ...DEFAULT_STATE };
let callbacks: ContinuousCallbacks | null = null;

// --- Public API ---
export function startContinuous(
  mode: ContinuousMode,
  cbs: Partial<ContinuousCallbacks> & { onCommand: (text: string) => void }
): void {
  logger.voice('startContinuous', { mode });
  callbacks = cbs as ContinuousCallbacks;
  state.mode = mode;
  state.lastActivityTime = Date.now();

  if (mode === 'always_on' || mode === 'wake_word') {
    startListeningLoop();
  }
}

export function stopContinuous(): void {
  state.mode = 'off';
  state.isListening = false;
  state.isWakeWordDetected = false;
  if (state.silenceTimer) {
    clearTimeout(state.silenceTimer);
    state.silenceTimer = null;
  }
  try {
    ExpoSpeechRecognitionModule.stop();
  } catch {}
  callbacks?.onListeningEnd?.();
}

export function setMode(mode: ContinuousMode): void {
  if (mode === 'off') {
    stopContinuous();
    return;
  }
  state.mode = mode;
  if (!state.isListening) {
    startListeningLoop();
  }
}

export function getState(): ContinuousListenerState {
  return { ...state };
}

export function isContinuousActive(): boolean {
  return state.mode !== 'off';
}

// --- Push to Talk ---
export function pushToTalkStart(onResult: (text: string) => void): void {
  state.mode = 'push_to_talk';
  state.isListening = true;
  callbacks = { onCommand: onResult } as ContinuousCallbacks;
  startSTT();
}

export function pushToTalkEnd(): void {
  if (state.mode === 'push_to_talk') {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {}
    state.isListening = false;
  }
}

// --- Internal ---
function startListeningLoop(): void {
  if (state.mode === 'off') return;
  state.isListening = true;
  callbacks?.onListeningStart?.();
  startSTT();
}

function startSTT(): void {
  try {
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: true,
      addsPunctuation: true,
    });
  } catch (e: any) {
    callbacks?.onError?.(e.message || 'Failed to start speech recognition');
  }
}

// --- Wake Word Detection ---
function checkWakeWord(transcript: string): boolean {
  const normalized = transcript.toLowerCase().trim();
  const wakeWords = ['hey voicenav', 'hey voice nav', 'hey voice navigation', 'ok voicenav', 'hello voicenav'];
  return wakeWords.some(w => normalized.includes(w));
}

// --- Silence Detection ---
function resetSilenceTimer(): void {
  if (state.silenceTimer) {
    clearTimeout(state.silenceTimer);
  }
  state.lastActivityTime = Date.now();

  if (state.mode === 'always_on' || state.mode === 'push_to_talk') {
    state.silenceTimer = setTimeout(() => {
      if (state.isListening && state.mode !== 'push_to_talk') {
        // Auto-stop after silence, but keep continuous mode active
        try {
          ExpoSpeechRecognitionModule.stop();
        } catch {}
        // Restart listening after a brief pause
        setTimeout(() => {
          if (state.mode !== 'off') {
            startSTT();
          }
        }, 500);
      }
    }, state.silenceTimeout);
  }
}

// --- Barge-in (interrupt TTS when user speaks) ---
export function enableBargeIn(): void {
  state.lastActivityTime = Date.now();
  logger.voice('bargeIn enabled');
}

export function checkBargeIn(volume: number): boolean {
  if (volume > state.volumeThreshold) {
    state.lastActivityTime = Date.now();
    resetSilenceTimer();
    if (getIsSpeaking()) {
      logger.voice('bargeIn triggered', { volume, threshold: state.volumeThreshold });
      stopSpeaking();
      return true;
    }
  }
  return false;
}

// --- Configuration ---
export function setSilenceTimeout(ms: number): void {
  state.silenceTimeout = Math.max(1000, Math.min(10000, ms));
}

export function setVolumeThreshold(threshold: number): void {
  state.volumeThreshold = Math.max(0, Math.min(1, threshold));
}

export function setWakeWord(word: string): void {
  state.wakeWord = word.toLowerCase().trim();
}

// --- Event Handlers (to be wired up by the app) ---
export function handleSpeechResult(transcript: string, isFinal: boolean): void {
  if (!isFinal) {
    resetSilenceTimer();
    return;
  }
  logger.voice('speechResult', { transcript, isFinal, mode: state.mode });

  // Check for wake word in wake_word mode
  if (state.mode === 'wake_word' && !state.isWakeWordDetected) {
    if (checkWakeWord(transcript)) {
      state.isWakeWordDetected = true;
      callbacks?.onWakeWord?.();
      // Strip wake word from command
      const command = transcript.replace(/hey\s+voice\s*nav(?:igation)?|ok\s+voicenav|hello\s+voicenav/gi, '').trim();
      if (command.length > 0) {
        callbacks?.onCommand?.(command);
      }
      resetSilenceTimer();
      return;
    }
    // Not a wake word, ignore
    resetSilenceTimer();
    return;
  }

  // In wake_word mode, after wake word detected, process commands
  if (state.mode === 'wake_word' && state.isWakeWordDetected) {
    // Check if user said "stop listening" or "never mind"
    if (/^(?:stop listening|never mind|forget it|cancel)$/i.test(transcript.trim())) {
      state.isWakeWordDetected = false;
      callbacks?.onListeningEnd?.();
      resetSilenceTimer();
      return;
    }
    callbacks?.onCommand?.(transcript.trim());
    resetSilenceTimer();
    return;
  }

  // In always_on mode, process all commands
  if (state.mode === 'always_on') {
    callbacks?.onCommand?.(transcript.trim());
    resetSilenceTimer();
    return;
  }

  // Push to talk
  if (state.mode === 'push_to_talk') {
    callbacks?.onCommand?.(transcript.trim());
    return;
  }
}

export function handleSpeechError(error: string): void {
  callbacks?.onError?.(error);
  // Restart listening if continuous mode is active
  if (state.mode !== 'off' && state.mode !== 'push_to_talk') {
    setTimeout(() => {
      if (state.mode !== 'off') {
        startSTT();
      }
    }, 1000);
  }
}

export function handleVolumeChange(volume: number): void {
  callbacks?.onVolumeChange?.(volume);
  checkBargeIn(volume);
}
