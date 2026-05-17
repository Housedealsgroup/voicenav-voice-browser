import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type VoiceShortcut = {
  id: string;
  phrase: string;
  action: 'navigate' | 'search' | 'command';
  target: string;
  createdAt: number;
};

const DEFAULT_SHORTCUTS: VoiceShortcut[] = [
  { id: 'def-1', phrase: 'go home', action: 'navigate', target: 'https://www.google.com', createdAt: 0 },
  { id: 'def-2', phrase: 'check email', action: 'navigate', target: 'https://mail.google.com', createdAt: 0 },
  { id: 'def-3', phrase: 'watch videos', action: 'navigate', target: 'https://www.youtube.com', createdAt: 0 },
  { id: 'def-4', phrase: 'shopping', action: 'navigate', target: 'https://www.amazon.com', createdAt: 0 },
  { id: 'def-5', phrase: 'read news', action: 'navigate', target: 'https://news.google.com', createdAt: 0 },
];

type VoiceShortcutState = {
  shortcuts: VoiceShortcut[];
  addShortcut: (phrase: string, action: 'navigate' | 'search' | 'command', target: string) => void;
  removeShortcut: (id: string) => void;
  findShortcut: (phrase: string) => VoiceShortcut | undefined;
  updateShortcut: (id: string, updates: Partial<VoiceShortcut>) => void;
};

export const useVoiceShortcutStore = create<VoiceShortcutState>()(
  persist(
    (set, get) => ({
      shortcuts: DEFAULT_SHORTCUTS,

      addShortcut: (phrase, action, target) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        set((state) => ({
          shortcuts: [
            ...state.shortcuts,
            { id, phrase: phrase.toLowerCase(), action, target, createdAt: Date.now() },
          ],
        }));
      },

      removeShortcut: (id) => {
        set((state) => ({
          shortcuts: state.shortcuts.filter((s) => s.id !== id),
        }));
      },

      findShortcut: (phrase) => {
        const normalized = phrase.toLowerCase().trim();
        return get().shortcuts.find((s) =>
          normalized.includes(s.phrase) || s.phrase.includes(normalized)
        );
      },

      updateShortcut: (id, updates) => {
        set((state) => ({
          shortcuts: state.shortcuts.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },
    }),
    {
      name: 'voicenav-shortcuts',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
