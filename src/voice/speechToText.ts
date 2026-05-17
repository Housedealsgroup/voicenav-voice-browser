// Speech-to-text using expo-speech-recognition or fallback
// For now, we'll use a simple voice activity detection approach
// and integrate with the platform's native speech recognition

import { Platform } from 'react-native';

type STTCallbacks = {
  onResult: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onListeningChange: (isListening: boolean) => void;
};

// Try to use expo-speech-recognition if available
let SpeechRecognition: any = null;
try {
  SpeechRecognition = require('expo-speech-recognition');
} catch {
  // Module not available, will use fallback
}

let isCurrentlyListening = false;
let recognition: any = null;

export async function requestPermission(): Promise<boolean> {
  if (SpeechRecognition) {
    try {
      const result = await SpeechRecognition.requestPermissionsAsync();
      return result.granted;
    } catch {
      return false;
    }
  }
  return true; // fallback always "grants" permission
}

export async function startListening(callbacks: STTCallbacks): Promise<void> {
  if (isCurrentlyListening) {
    await stopListening();
  }

  if (SpeechRecognition) {
    try {
      const granted = await requestPermission();
      if (!granted) {
        callbacks.onError('Microphone permission denied');
        return;
      }

      isCurrentlyListening = true;
      callbacks.onListeningChange(true);

      recognition = SpeechRecognition.createSpeechRecognizer();
      recognition.onresult = (event: any) => {
        const result = event.results?.[0];
        if (result) {
          callbacks.onResult(result.transcript, result.isFinal);
        }
      };
      recognition.onerror = (event: any) => {
        callbacks.onError(event.error || 'Speech recognition error');
        isCurrentlyListening = false;
        callbacks.onListeningChange(false);
      };
      recognition.onend = () => {
        isCurrentlyListening = false;
        callbacks.onListeningChange(false);
      };

      await recognition.start({
        language: 'en-US',
        continuous: false,
        interimResults: true,
      });
    } catch (e: any) {
      isCurrentlyListening = false;
      callbacks.onListeningChange(false);
      callbacks.onError(e.message || 'Failed to start speech recognition');
    }
  } else {
    // Fallback: notify that speech recognition isn't available
    callbacks.onError('Speech recognition not available. Use the text input instead.');
  }
}

export async function stopListening(): Promise<void> {
  if (recognition) {
    try {
      await recognition.stop();
    } catch {}
    recognition = null;
  }
  isCurrentlyListening = false;
}

export function getIsListening(): boolean {
  return isCurrentlyListening;
}
