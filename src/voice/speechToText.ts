import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useState, useCallback, useRef } from 'react';
import type {
  ExpoSpeechRecognitionResultEvent,
  ExpoSpeechRecognitionErrorEvent,
} from 'expo-speech-recognition';

type STTCallbacks = {
  onResult: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  onPartialResult?: (text: string, confidence: number) => void;
  onConfidenceUpdate?: (confidence: number) => void;
};

export type NoiseConfig = {
  minConfidence: number; // 0-1, below this is rejected as noise
  adaptiveThreshold: boolean; // adjust threshold based on environment
  noiseFloor: number; // volume level below which audio is considered noise
  minWordLength: number; // minimum word length to accept
  debounceMs: number; // ms to wait before accepting partial results
};

const DEFAULT_NOISE_CONFIG: NoiseConfig = {
  minConfidence: 0.4,
  adaptiveThreshold: true,
  noiseFloor: 0.15,
  minWordLength: 1,
  debounceMs: 300,
};

// Language detection heuristics based on character patterns
const LANGUAGE_PATTERNS: Array<{ lang: string; pattern: RegExp; weight: number }> = [
  { lang: 'zh-CN', pattern: /[\u4e00-\u9fff]/, weight: 3 },
  { lang: 'ja-JP', pattern: /[\u3040-\u309f\u30a0-\u30ff]/, weight: 3 },
  { lang: 'ko-KR', pattern: /[\uac00-\ud7af\u1100-\u11ff]/, weight: 3 },
  { lang: 'ar-SA', pattern: /[\u0600-\u06ff]/, weight: 3 },
  { lang: 'hi-IN', pattern: /[\u0900-\u097f]/, weight: 3 },
  { lang: 'th-TH', pattern: /[\u0e00-\u0e7f]/, weight: 3 },
  { lang: 'ru-RU', pattern: /[\u0400-\u04ff]/, weight: 3 },
  { lang: 'he-IL', pattern: /[\u0590-\u05ff]/, weight: 3 },
  { lang: 'el-GR', pattern: /[\u0370-\u03ff]/, weight: 2 },
  { lang: 'uk-UA', pattern: /[\u0400-\u04ff]/, weight: 1 }, // Shares Cyrillic with Russian
];

// Common word patterns for European languages
const LANGUAGE_WORD_PATTERNS: Array<{ lang: string; words: string[] }> = [
  { lang: 'es-ES', words: ['el', 'la', 'los', 'las', 'de', 'en', 'que', 'por', 'con', 'para', 'una', 'como', 'pero', 'más'] },
  { lang: 'fr-FR', words: ['le', 'la', 'les', 'de', 'des', 'un', 'une', 'est', 'que', 'pour', 'dans', 'avec', 'pas', 'sur'] },
  { lang: 'de-DE', words: ['der', 'die', 'das', 'und', 'ist', 'ein', 'eine', 'nicht', 'sich', 'auf', 'den', 'dem', 'nach'] },
  { lang: 'it-IT', words: ['il', 'lo', 'la', 'di', 'che', 'non', 'per', 'con', 'sono', 'una', 'del', 'nel', 'anche'] },
  { lang: 'pt-BR', words: ['o', 'a', 'os', 'as', 'de', 'do', 'da', 'em', 'um', 'uma', 'que', 'não', 'com', 'para'] },
  { lang: 'nl-NL', words: ['de', 'het', 'een', 'van', 'en', 'is', 'dat', 'niet', 'op', 'te', 'voor', 'met', 'zijn'] },
  { lang: 'pl-PL', words: ['nie', 'jest', 'się', 'na', 'to', 'że', 'do', 'jak', 'ale', 'od', 'są', 'tak', 'już'] },
  { lang: 'sv-SE', words: ['och', 'att', 'det', 'som', 'för', 'med', 'den', 'har', 'inte', 'var', 'ett', 'till', 'kan'] },
  { lang: 'tr-TR', words: ['bir', 've', 'bu', 'için', 'ile', 'olan', 'da', 'de', 'çok', 'gibi', 'daha', 'ama', 'var'] },
  { lang: 'ru-RU', words: ['не', 'и', 'что', 'это', 'как', 'он', 'она', 'мы', 'вы', 'они', 'быть', 'мочь', 'весь'] },
];

export async function requestPermission(): Promise<boolean> {
  try {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return result.granted;
  } catch {
    return false;
  }
}

// Auto-detect language from text
export function detectLanguage(text: string): string | null {
  if (!text || text.trim().length < 2) return null;

  // First check character-based patterns (CJK, Arabic, etc.)
  for (const { lang, pattern, weight } of LANGUAGE_PATTERNS) {
    const matches = text.match(new RegExp(pattern, 'g')) || [];
    const ratio = matches.length / text.length;
    if (ratio > 0.3 && weight >= 2) return lang;
    if (ratio > 0.5 && weight >= 1) return lang;
  }

  // Then check word-based patterns for European languages
  const words = text.toLowerCase().split(/\s+/);
  let bestLang: string | null = null;
  let bestScore = 0;

  for (const { lang, words: langWords } of LANGUAGE_WORD_PATTERNS) {
    let score = 0;
    for (const word of words) {
      if (langWords.includes(word)) score++;
    }
    if (score > bestScore && score >= 2) {
      bestScore = score;
      bestLang = lang;
    }
  }

  return bestLang;
}

// Calculate confidence from volume and result patterns
function calculateConfidence(volume: number, text: string, noiseConfig: NoiseConfig): number {
  let confidence = volume; // Base confidence from volume

  // Boost confidence for longer, more coherent text
  const words = text.split(/\s+/).filter(w => w.length >= noiseConfig.minWordLength);
  if (words.length > 3) confidence += 0.1;
  if (words.length > 6) confidence += 0.1;

  // Reduce confidence for very short or single-character results
  if (text.length < 3) confidence *= 0.5;
  if (words.length === 1 && text.length < 4) confidence *= 0.3;

  // Reduce confidence for repeated characters (noise indicator)
  if (/(.)\1{3,}/.test(text)) confidence *= 0.2;

  return Math.max(0, Math.min(1, confidence));
}

// Filter noise from partial results
function isNoise(text: string, volume: number, config: NoiseConfig): boolean {
  // Volume too low
  if (volume < config.noiseFloor) return true;

  // Too short
  if (text.trim().length < 2) return true;

  // Only punctuation or special characters
  // eslint-disable-next-line no-misleading-character-class
  if (/^[^a-zA-Z\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u0900-\u097F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]+$/u.test(text)) return true;

  // Repeated nonsense
  if (/(.)\1{4,}/.test(text)) return true;

  return false;
}

// Debounce utility for partial results
function createDebouncer(ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (fn: () => void) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

// React hook for speech recognition with noise handling and language detection
export function useSpeechRecognition(noiseConfig: Partial<NoiseConfig> = {}) {
  const config = { ...DEFAULT_NOISE_CONFIG, ...noiseConfig };
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [currentLang, setCurrentLang] = useState('en-US');
  const [confidence, setConfidence] = useState(0);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const callbacksRef = useRef<STTCallbacks | null>(null);
  const lastPartialRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const adaptiveThresholdRef = useRef(config.minConfidence);
  const confidenceHistoryRef = useRef<number[]>([]);
  const debouncerRef = useRef(createDebouncer(config.debounceMs));

  // Adaptive threshold: adjust based on observed confidence levels
  function updateAdaptiveThreshold(newConfidence: number) {
    if (!config.adaptiveThreshold) return;

    confidenceHistoryRef.current.push(newConfidence);
    if (confidenceHistoryRef.current.length > 20) {
      confidenceHistoryRef.current.shift();
    }

    const history = confidenceHistoryRef.current;
    if (history.length >= 5) {
      const avg = history.reduce((a, b) => a + b, 0) / history.length;
      // Set threshold to 60% of average confidence, but never below 0.2
      adaptiveThresholdRef.current = Math.max(0.2, avg * 0.6);
    }
  }

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setError(null);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    setInterimTranscript('');
    callbacksRef.current?.onListeningChange?.(false);
  });

  useSpeechRecognitionEvent('result', (event: ExpoSpeechRecognitionResultEvent) => {
    const results = event.results;
    if (results && results.length > 0) {
      const last = results[results.length - 1];
      const text = last.transcript || '';
      const isFinal = event.isFinal;

      // Check for noise
      if (isNoise(text, volume, config)) {
        return;
      }

      // Calculate result confidence
      const resultConfidence = calculateConfidence(volume, text, config);
      setConfidence(resultConfidence);
      callbacksRef.current?.onConfidenceUpdate?.(resultConfidence);

      // Update adaptive threshold
      updateAdaptiveThreshold(resultConfidence);

      if (isFinal) {
        // For final results, check against adaptive threshold
        const threshold = adaptiveThresholdRef.current;
        if (resultConfidence >= threshold || text.split(/\s+/).length >= 3) {
          setTranscript(text);
          setInterimTranscript('');
          callbacksRef.current?.onResult(text, true);

          // Auto-detect language from final result
          const detected = detectLanguage(text);
          if (detected) {
            setDetectedLanguage(detected);
          }
        } else {
          // Low confidence final result — treat as noise
          callbacksRef.current?.onResult('', true);
        }
      } else {
        // Partial result handling with debouncing
        const now = Date.now();
        const timeSinceLast = now - lastPartialRef.current.time;

        // Only forward partial results that are meaningfully different
        if (text !== lastPartialRef.current.text && timeSinceLast > config.debounceMs) {
          lastPartialRef.current = { text, time: now };

          // Debounce the callback
          debouncerRef.current(() => {
            setInterimTranscript(text);
            callbacksRef.current?.onResult(text, false);
            callbacksRef.current?.onPartialResult?.(text, resultConfidence);
          });
        }
      }
    }
  });

  useSpeechRecognitionEvent('error', (event: ExpoSpeechRecognitionErrorEvent) => {
    const msg = event.message || event.error || 'Speech recognition error';
    setError(msg);
    setIsListening(false);
    callbacksRef.current?.onError(msg);
  });

  useSpeechRecognitionEvent('volumechange', (event: { value: number }) => {
    // Normalize -2..10 to 0..1
    const normalized = Math.max(0, Math.min(1, (event.value + 2) / 12));
    setVolume(normalized);
  });

  const start = useCallback(async (callbacks?: STTCallbacks, lang?: string) => {
    callbacksRef.current = callbacks || null;
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setConfidence(0);
    setDetectedLanguage(null);
    confidenceHistoryRef.current = [];
    lastPartialRef.current = { text: '', time: 0 };
    adaptiveThresholdRef.current = config.minConfidence;

    const sttLang = lang || 'en-US';
    setCurrentLang(sttLang);

    try {
      const granted = await requestPermission();
      if (!granted) {
        setError('Microphone permission denied');
        callbacks?.onError('Microphone permission denied');
        return;
      }

      callbacks?.onListeningChange?.(true);

      ExpoSpeechRecognitionModule.start({
        lang: sttLang,
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
      });
    } catch (e: any) {
      setError(e.message || 'Failed to start');
      callbacks?.onListeningChange?.(false);
      callbacks?.onError(e.message || 'Failed to start');
    }
  }, [config.minConfidence]);

  const stop = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // ignore
    }
  }, []);

  const abort = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {
      // ignore
    }
  }, []);

  // Switch language mid-session (restarts recognition)
  const switchLanguage = useCallback(async (lang: string, callbacks?: STTCallbacks) => {
    if (lang === currentLang) return;
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // ignore
    }
    await new Promise(r => setTimeout(r, 150)); // Brief pause for clean restart
    await start(callbacks || callbacksRef.current || undefined, lang);
  }, [currentLang, start]);

  // Auto-detect and switch language based on spoken content
  const autoDetectAndSwitch = useCallback(async (callbacks?: STTCallbacks) => {
    if (!detectedLanguage || detectedLanguage === currentLang) return;
    await switchLanguage(detectedLanguage, callbacks);
  }, [detectedLanguage, currentLang, switchLanguage]);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    volume,
    currentLang,
    confidence,
    detectedLanguage,
    noiseConfig: config,
    adaptiveThreshold: adaptiveThresholdRef.current,
    start,
    stop,
    abort,
    switchLanguage,
    autoDetectAndSwitch,
  };
}

// Standalone noise config helper
export function createNoiseConfig(overrides: Partial<NoiseConfig> = {}): NoiseConfig {
  return { ...DEFAULT_NOISE_CONFIG, ...overrides };
}

// Get supported languages for speech recognition
export function getSupportedLanguages(): string[] {
  return [
    'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'en-NZ', 'en-ZA',
    'es-ES', 'es-MX', 'es-AR', 'es-CO', 'es-CL', 'es-PE',
    'fr-FR', 'fr-CA', 'fr-BE', 'fr-CH',
    'de-DE', 'de-AT', 'de-CH',
    'it-IT', 'pt-BR', 'pt-PT',
    'nl-NL', 'nl-BE',
    'pl-PL', 'ru-RU', 'sv-SE', 'da-DK', 'fi-FI', 'nb-NO',
    'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW', 'zh-HK',
    'hi-IN', 'th-TH', 'vi-VN', 'id-ID', 'ms-MY',
    'ar-SA', 'ar-EG', 'he-IL', 'tr-TR', 'el-GR',
    'cs-CZ', 'ro-RO', 'hu-HU', 'sk-SK', 'uk-UA', 'bg-BG',
    'hr-HR', 'sr-RS', 'sl-SI', 'et-EE', 'lv-LV', 'lt-LT',
  ];
}
