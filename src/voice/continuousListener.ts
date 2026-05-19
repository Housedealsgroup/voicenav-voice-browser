// VoiceNav Continuous Listener — always-on voice mode with wake word detection
// Barge-in support, silence detection, voice activity detection
// Real-time language detection and dynamic switching

import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { stopSpeaking, getIsSpeaking } from './textToSpeech';
import { detectLanguage } from './languageDetector';
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
  currentLang: string; // BCP-47 tag
  langSwitchDebounce: number; // ms
};

type ContinuousCallbacks = {
  onCommand: (text: string, lang: string) => void;
  onWakeWord: () => void;
  onListeningStart: () => void;
  onListeningEnd: () => void;
  onVolumeChange: (volume: number) => void;
  onError: (error: string) => void;
  onLanguageChange?: (lang: string) => void;
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
  currentLang: 'en-US',
  langSwitchDebounce: 2000,
};

const state = { ...DEFAULT_STATE };
let callbacks: ContinuousCallbacks | null = null;
let langSwitchTimer: ReturnType<typeof setTimeout> | null = null;
let pendingLang: string | null = null;
let interimBuffer = '';

// --- Public API ---
export function startContinuous(
  mode: ContinuousMode,
  cbs: Partial<ContinuousCallbacks> & { onCommand: (text: string, lang: string) => void }
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
  if (langSwitchTimer) {
    clearTimeout(langSwitchTimer);
    langSwitchTimer = null;
  }
  pendingLang = null;
  interimBuffer = '';
  try {
    ExpoSpeechRecognitionModule.stop();
  } catch {
    // ignore
  }
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

export function getCurrentLang(): string {
  return state.currentLang;
}

export function setLanguage(lang: string): void {
  state.currentLang = lang;
  if (state.isListening) {
    restartSTT(lang);
  }
}

// --- Push to Talk ---
export function pushToTalkStart(onResult: (text: string, lang: string) => void): void {
  state.mode = 'push_to_talk';
  state.isListening = true;
  callbacks = { onCommand: onResult } as ContinuousCallbacks;
  startSTT();
}

export function pushToTalkEnd(): void {
  if (state.mode === 'push_to_talk') {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
    // ignore
  }
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
      lang: state.currentLang,
      interimResults: true,
      continuous: true,
      addsPunctuation: true,
    });
  } catch (e: any) {
    callbacks?.onError?.(e.message || 'Failed to start speech recognition');
  }
}

function restartSTT(lang: string): void {
  logger.voice('restartSTT', { from: state.currentLang, to: lang });
  state.currentLang = lang;
  try {
    ExpoSpeechRecognitionModule.stop();
  } catch {
    // ignore
  }
  setTimeout(() => {
    if (state.mode !== 'off') {
      startSTT();
      callbacks?.onLanguageChange?.(lang);
    }
  }, 200);
}

// --- Real-Time Language Detection ---
function detectAndSwitchLanguage(interimText: string): void {
  if (!interimText || interimText.length < 3) return;

  const result = detectLanguage(interimText);
  const detectedSttCode = result.language.sttCode;

  // Only switch if confidence is high and language actually changed
  if (result.confidence < 0.7 || detectedSttCode === state.currentLang) {
    pendingLang = null;
    return;
  }

  // Debounce — don't switch too fast
  if (pendingLang === detectedSttCode) return;
  pendingLang = detectedSttCode;

  if (langSwitchTimer) {
    clearTimeout(langSwitchTimer);
  }

  langSwitchTimer = setTimeout(() => {
    if (pendingLang === detectedSttCode && state.mode !== 'off') {
      logger.voice('langSwitch', { from: state.currentLang, to: detectedSttCode, confidence: result.confidence });
      restartSTT(detectedSttCode);
    }
    pendingLang = null;
  }, state.langSwitchDebounce);
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
        try {
          ExpoSpeechRecognitionModule.stop();
        } catch {
    // ignore
  }
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

export function setLangSwitchDebounce(ms: number): void {
  state.langSwitchDebounce = Math.max(500, Math.min(10000, ms));
}

// --- Event Handlers (to be wired up by the app) ---
export function handleSpeechResult(transcript: string, isFinal: boolean): void {
  if (!isFinal) {
    // Use interim results for real-time language detection
    interimBuffer += ' ' + transcript;
    if (interimBuffer.length > 10) {
      detectAndSwitchLanguage(interimBuffer);
      interimBuffer = ''; // Reset buffer after detection attempt
    }
    resetSilenceTimer();
    return;
  }
  logger.voice('speechResult', { transcript, isFinal, mode: state.mode, lang: state.currentLang });

  // Check for wake word in wake_word mode
  if (state.mode === 'wake_word' && !state.isWakeWordDetected) {
    if (checkWakeWord(transcript)) {
      state.isWakeWordDetected = true;
      callbacks?.onWakeWord?.();
      const command = transcript.replace(/hey\s+voice\s*nav(?:igation)?|ok\s+voicenav|hello\s+voicenav/gi, '').trim();
      if (command.length > 0) {
        callbacks?.onCommand?.(command, state.currentLang);
      }
      resetSilenceTimer();
      return;
    }
    resetSilenceTimer();
    return;
  }

  if (state.mode === 'wake_word' && state.isWakeWordDetected) {
    if (/^(?:stop listening|never mind|forget it|cancel)$/i.test(transcript.trim())) {
      state.isWakeWordDetected = false;
      callbacks?.onListeningEnd?.();
      resetSilenceTimer();
      return;
    }
    callbacks?.onCommand?.(transcript.trim(), state.currentLang);
    resetSilenceTimer();
    return;
  }

  if (state.mode === 'always_on') {
    callbacks?.onCommand?.(transcript.trim(), state.currentLang);
    resetSilenceTimer();
    return;
  }

  if (state.mode === 'push_to_talk') {
    callbacks?.onCommand?.(transcript.trim(), state.currentLang);
    return;
  }
}

export function handleSpeechError(error: string): void {
  callbacks?.onError?.(error);
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
