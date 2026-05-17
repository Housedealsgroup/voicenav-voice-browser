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
};

export async function requestPermission(): Promise<boolean> {
  try {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return result.granted;
  } catch {
    return false;
  }
}

// React hook for speech recognition
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const callbacksRef = useRef<STTCallbacks | null>(null);

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

      if (isFinal) {
        setTranscript(text);
        setInterimTranscript('');
        callbacksRef.current?.onResult(text, true);
      } else {
        setInterimTranscript(text);
        callbacksRef.current?.onResult(text, false);
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

  const start = useCallback(async (callbacks?: STTCallbacks) => {
    callbacksRef.current = callbacks || null;
    setTranscript('');
    setInterimTranscript('');
    setError(null);

    try {
      const granted = await requestPermission();
      if (!granted) {
        setError('Microphone permission denied');
        callbacks?.onError('Microphone permission denied');
        return;
      }

      callbacks?.onListeningChange?.(true);

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
      });
    } catch (e: any) {
      setError(e.message || 'Failed to start');
      callbacks?.onListeningChange?.(false);
      callbacks?.onError(e.message || 'Failed to start');
    }
  }, []);

  const stop = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {}
  }, []);

  const abort = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {}
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    volume,
    start,
    stop,
    abort,
  };
}
