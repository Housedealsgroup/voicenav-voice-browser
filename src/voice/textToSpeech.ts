import * as Speech from 'expo-speech';

type TTSOptions = {
  rate?: number;
  pitch?: number;
  language?: string;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: any) => void;
};

const DEFAULT_OPTIONS: TTSOptions = {
  rate: 0.9,
  pitch: 1.0,
  language: 'en-US',
};

let isSpeaking = false;
let currentUtterance: string | null = null;

export async function speak(text: string, options: TTSOptions = {}): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Stop any current speech
  if (isSpeaking) {
    await Speech.stop();
  }

  if (!text || text.trim().length === 0) return;

  isSpeaking = true;
  currentUtterance = text;

  return new Promise((resolve, reject) => {
    Speech.speak(text, {
      rate: opts.rate,
      pitch: opts.pitch,
      language: opts.language,
      onStart: () => {
        opts.onStart?.();
      },
      onDone: () => {
        isSpeaking = false;
        currentUtterance = null;
        opts.onDone?.();
        resolve();
      },
      onStopped: () => {
        isSpeaking = false;
        currentUtterance = null;
        resolve();
      },
      onError: (error) => {
        isSpeaking = false;
        currentUtterance = null;
        opts.onError?.(error);
        reject(error);
      },
    });
  });
}

export async function stopSpeaking(): Promise<void> {
  if (isSpeaking) {
    await Speech.stop();
    isSpeaking = false;
    currentUtterance = null;
  }
}

export function getIsSpeaking(): boolean {
  return isSpeaking;
}

export function getCurrentUtterance(): string | null {
  return currentUtterance;
}

export async function speakInterruptible(text: string): Promise<void> {
  await stopSpeaking();
  await speak(text);
}

// Queue system for sequential speech
const speechQueue: Array<{ text: string; options?: TTSOptions; resolve: () => void; reject: (e: any) => void }> = [];
let isProcessingQueue = false;

export function enqueueSpeech(text: string, options: TTSOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    speechQueue.push({ text, options, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (isProcessingQueue || speechQueue.length === 0) return;
  isProcessingQueue = true;

  while (speechQueue.length > 0) {
    const item = speechQueue.shift()!;
    try {
      await speak(item.text, item.options);
      item.resolve();
    } catch (e) {
      item.reject(e);
    }
  }

  isProcessingQueue = false;
}

export function clearSpeechQueue() {
  speechQueue.length = 0;
}
