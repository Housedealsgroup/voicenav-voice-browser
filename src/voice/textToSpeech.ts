import * as Speech from 'expo-speech';
import { logger } from '../utils/logger';

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
let currentLanguage = 'en-US';

// Audio cue definitions (frequency, duration pairs for Web Audio API synthesis)
export type AudioCue = {
  name: string;
  frequencies: number[]; // Hz
  durations: number[]; // ms
  volumes: number[]; // 0-1
  type: OscillatorType;
};

// Built-in audio cues
const AUDIO_CUES: Record<string, AudioCue> = {
  navigation: {
    name: 'navigation',
    frequencies: [800, 1000],
    durations: [80, 80],
    volumes: [0.3, 0.3],
    type: 'sine',
  },
  success: {
    name: 'success',
    frequencies: [523, 659, 784],
    durations: [100, 100, 150],
    volumes: [0.3, 0.3, 0.4],
    type: 'sine',
  },
  error: {
    name: 'error',
    frequencies: [300, 200],
    durations: [150, 200],
    volumes: [0.4, 0.4],
    type: 'square',
  },
  notification: {
    name: 'notification',
    frequencies: [660, 880],
    durations: [60, 100],
    volumes: [0.2, 0.3],
    type: 'sine',
  },
  start: {
    name: 'start',
    frequencies: [440, 550, 660, 880],
    durations: [80, 80, 80, 120],
    volumes: [0.2, 0.25, 0.3, 0.35],
    type: 'sine',
  },
  stop: {
    name: 'stop',
    frequencies: [880, 660, 440],
    durations: [80, 80, 150],
    volumes: [0.3, 0.25, 0.2],
    type: 'sine',
  },
  click: {
    name: 'click',
    frequencies: [1000],
    durations: [30],
    volumes: [0.2],
    type: 'square',
  },
  typing: {
    name: 'typing',
    frequencies: [1200],
    durations: [15],
    volumes: [0.1],
    type: 'square',
  },
  warning: {
    name: 'warning',
    frequencies: [440, 440, 440],
    durations: [200, 100, 200],
    volumes: [0.3, 0.1, 0.3],
    type: 'sawtooth',
  },
  scroll: {
    name: 'scroll',
    frequencies: [500, 600],
    durations: [30, 30],
    volumes: [0.1, 0.1],
    type: 'sine',
  },
};

// Custom audio cue registry
const customCues: Map<string, AudioCue> = new Map();

// Audio context for tone synthesis
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Play an audio cue
export async function playAudioCue(cueName: string): Promise<void> {
  const cue = AUDIO_CUES[cueName] || customCues.get(cueName);
  if (!cue) {
    logger.voice('audioCueNotFound', { cueName });
    return;
  }

  try {
    const ctx = getAudioContext();
    let time = ctx.currentTime;

    for (let i = 0; i < cue.frequencies.length; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = cue.type;
      oscillator.frequency.setValueAtTime(cue.frequencies[i], time);

      gainNode.gain.setValueAtTime(cue.volumes[i] ?? 0.3, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + (cue.durations[i] ?? 100) / 1000);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(time);
      oscillator.stop(time + (cue.durations[i] ?? 100) / 1000);

      time += (cue.durations[i] ?? 100) / 1000;
    }

    logger.voice('audioCuePlayed', { cueName });
  } catch (e) {
    logger.voice('audioCueError', { cueName, error: e });
  }
}

// Register a custom audio cue
export function registerAudioCue(name: string, cue: AudioCue): void {
  customCues.set(name, cue);
  logger.voice('audioCueRegistered', { name });
}

// Get available audio cues
export function getAvailableAudioCues(): string[] {
  return [...Object.keys(AUDIO_CUES), ...customCues.keys()];
}

// Speech queue management
type QueueItem = {
  id: string;
  text: string;
  options: TTSOptions;
  priority: 'high' | 'normal' | 'low';
  resolve: () => void;
  reject: (e: any) => void;
};

const speechQueue: QueueItem[] = [];
let isProcessingQueue = false;
let queueIdCounter = 0;
let queuePaused = false;

// SSML support — convert SSML-like markup to speech parameters
type SSMLSegment = {
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  pause?: number; // ms
  emphasis?: 'strong' | 'moderate' | 'reduced';
};

function parseSSML(ssml: string): SSMLSegment[] {
  const segments: SSMLSegment[] = [];

  // Process SSML-like tags
  // <prosody rate="slow" pitch="high">text</prosody>
  // <break time="500ms"/>
  // <emphasis level="strong">text</emphasis>
  // <say-as interpret-as="number">123</say-as>

  const tagRegex = /<(break|prosody|emphasis|say-as)(?:\s+[^>]*)?\/?>|<\/(break|prosody|emphasis|say-as)>/gi;
  let lastIndex = 0;
  let currentRate: number | undefined;
  let currentPitch: number | undefined;
  let currentEmphasis: SSMLSegment['emphasis'];

  // Simple parser: find tags and extract text between them
  const parts: Array<{ text?: string; tag?: string; attrs?: string; isClose?: boolean }> = [];
  let match;

  while ((match = tagRegex.exec(ssml)) !== null) {
    // Add text before this tag
    if (match.index > lastIndex) {
      parts.push({ text: ssml.substring(lastIndex, match.index) });
    }

    if (match[0].startsWith('</')) {
      parts.push({ tag: match[2], isClose: true });
    } else {
      parts.push({ tag: match[1], attrs: match[0], isClose: false });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < ssml.length) {
    parts.push({ text: ssml.substring(lastIndex) });
  }

  // Build segments from parts
  for (const part of parts) {
    if (part.tag && !part.isClose) {
      if (part.tag === 'break') {
        const timeMatch = part.attrs?.match(/time="(\d+)ms?"/);
        if (timeMatch) {
          segments.push({ text: '', pause: parseInt(timeMatch[1]) });
        }
      } else if (part.tag === 'prosody') {
        const rateMatch = part.attrs?.match(/rate="(\w+)"/);
        const pitchMatch = part.attrs?.match(/pitch="(\w+)"/);
        if (rateMatch) {
          const rateMap: Record<string, number> = { slow: 0.6, medium: 0.9, fast: 1.3, xslow: 0.4, xfast: 1.5 };
          currentRate = rateMap[rateMatch[1]] ?? 0.9;
        }
        if (pitchMatch) {
          const pitchMap: Record<string, number> = { low: 0.7, medium: 1.0, high: 1.3, xlow: 0.5, xhigh: 1.5 };
          currentPitch = pitchMap[pitchMatch[1]] ?? 1.0;
        }
      } else if (part.tag === 'emphasis') {
        const levelMatch = part.attrs?.match(/level="(\w+)"/);
        currentEmphasis = (levelMatch?.[1] as SSMLSegment['emphasis']) ?? 'moderate';
      }
    } else if (part.tag && part.isClose) {
      if (part.tag === 'prosody') {
        currentRate = undefined;
        currentPitch = undefined;
      } else if (part.tag === 'emphasis') {
        currentEmphasis = undefined;
      }
    } else if (part.text && part.text.trim()) {
      let rate = currentRate;
      let pitch = currentPitch;

      // Apply emphasis modifications
      if (currentEmphasis === 'strong') {
        rate = (rate ?? 0.9) * 0.85; // Slow down for emphasis
        pitch = (pitch ?? 1.0) * 1.1;
      } else if (currentEmphasis === 'reduced') {
        rate = (rate ?? 0.9) * 1.1;
      }

      segments.push({
        text: part.text.trim(),
        rate,
        pitch,
        emphasis: currentEmphasis,
      });
    }
  }

  // If no segments were created, return the whole text as one segment
  if (segments.length === 0 || (segments.length === 1 && !segments[0].text)) {
    return [{ text: ssml.replace(/<[^>]+>/g, '') }];
  }

  return segments.filter(s => s.text || s.pause);
}

// Speak with SSML support
export async function speakSSML(ssml: string, baseOptions: TTSOptions = {}): Promise<void> {
  const segments = parseSSML(ssml);

  for (const segment of segments) {
    if (segment.pause) {
      await new Promise(r => setTimeout(r, segment.pause));
      continue;
    }

    if (segment.text) {
      const opts: TTSOptions = {
        ...baseOptions,
        rate: segment.rate ?? baseOptions.rate ?? DEFAULT_OPTIONS.rate,
        pitch: segment.pitch ?? baseOptions.pitch ?? DEFAULT_OPTIONS.pitch,
      };
      await speak(segment.text, opts);
    }
  }
}

// Voice preview — speak a short sample with given settings
export async function previewVoice(options: TTSOptions = {}): Promise<void> {
  const sample = 'Hello! This is a preview of the selected voice settings. How does this sound?';
  await speak(sample, options);
}

// Preview with SSML
export async function previewVoiceSSML(): Promise<void> {
  const ssml = '<prosody rate="medium" pitch="medium">Hello! This is a preview.</prosody> <break time="300ms"/> <emphasis level="strong">With emphasis on important words.</emphasis>';
  await speakSSML(ssml);
}

export async function speak(text: string, options: TTSOptions = {}): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Use current detected language if not explicitly overridden
  if (!options.language) {
    opts.language = currentLanguage;
  }

  if (isSpeaking) {
    await Speech.stop();
  }

  if (!text || text.trim().length === 0) return;

  logger.voice('speak', { text: text.substring(0, 50), language: opts.language });

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

// Set the active language for TTS
export function setTTSLanguage(lang: string): void {
  currentLanguage = lang;
  logger.voice('setTTSLanguage', { lang });
}

export function getTTSLanguage(): string {
  return currentLanguage;
}

export async function speakInterruptible(text: string, lang?: string): Promise<void> {
  await stopSpeaking();
  await speak(text, lang ? { language: lang } : {});
}

// Enhanced queue system with priority support
export function enqueueSpeech(text: string, options: TTSOptions = {}, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
  return new Promise((resolve, reject) => {
    const item: QueueItem = {
      id: `q-${++queueIdCounter}`,
      text,
      options,
      priority,
      resolve,
      reject,
    };

    // Insert based on priority
    if (priority === 'high') {
      // Find first non-high-priority item and insert before it
      const idx = speechQueue.findIndex(q => q.priority !== 'high');
      if (idx === -1) {
        speechQueue.push(item);
      } else {
        speechQueue.splice(idx, 0, item);
      }
    } else if (priority === 'low') {
      speechQueue.push(item);
    } else {
      // Normal priority: insert before any low-priority items
      const idx = speechQueue.findIndex(q => q.priority === 'low');
      if (idx === -1) {
        speechQueue.push(item);
      } else {
        speechQueue.splice(idx, 0, item);
      }
    }

    processQueue();
  });
}

async function processQueue() {
  if (isProcessingQueue || queuePaused || speechQueue.length === 0) return;
  isProcessingQueue = true;

  while (speechQueue.length > 0 && !queuePaused) {
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

export function clearSpeechQueue(): void {
  // Reject all pending items
  for (const item of speechQueue) {
    item.reject(new Error('Queue cleared'));
  }
  speechQueue.length = 0;
}

// Pause/resume queue
export function pauseSpeechQueue(): void {
  queuePaused = true;
  logger.voice('speechQueuePaused');
}

export function resumeSpeechQueue(): void {
  queuePaused = false;
  processQueue();
  logger.voice('speechQueueResumed');
}

export function isQueuePaused(): boolean {
  return queuePaused;
}

export function getQueueLength(): number {
  return speechQueue.length;
}

// Speak with audio cue before
export async function speakWithCue(text: string, cueName: string, options: TTSOptions = {}): Promise<void> {
  await playAudioCue(cueName);
  // Small gap between cue and speech
  await new Promise(r => setTimeout(r, 100));
  await speak(text, options);
}

// Speak notification (short text with notification cue)
export async function speakNotification(text: string): Promise<void> {
  await speakWithCue(text, 'notification');
}

// Speak error (with error cue)
export async function speakError(text: string): Promise<void> {
  await speakWithCue(text, 'error');
}

// Speak success (with success cue)
export async function speakSuccess(text: string): Promise<void> {
  await speakWithCue(text, 'success');
}
