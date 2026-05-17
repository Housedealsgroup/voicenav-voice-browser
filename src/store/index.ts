import { create } from 'zustand';
import { PageSnapshot } from '../browser/types';

type AppState = {
  // Browser state
  currentUrl: string;
  isLoading: boolean;
  pageTitle: string;
  pageSnapshot: PageSnapshot | null;
  error: string | null;

  // Agent state
  isAgentActive: boolean;
  agentStatus: string;

  // Voice settings
  speechRate: number;
  autoRead: boolean;
  hapticFeedback: boolean;
  continuousListening: boolean;
  language: string; // language code

  // History
  browsingHistory: string[];
  commandHistory: string[];

  // Actions
  setCurrentUrl: (url: string) => void;
  setIsLoading: (loading: boolean) => void;
  setPageTitle: (title: string) => void;
  setPageSnapshot: (snapshot: PageSnapshot | null) => void;
  setError: (error: string | null) => void;
  setIsAgentActive: (active: boolean) => void;
  setAgentStatus: (status: string) => void;
  setSpeechRate: (rate: number) => void;
  setAutoRead: (autoRead: boolean) => void;
  setHapticFeedback: (haptic: boolean) => void;
  setContinuousListening: (continuous: boolean) => void;
  setLanguage: (lang: string) => void;
  addBrowsingHistory: (url: string) => void;
  addCommandHistory: (command: string) => void;
  clearHistory: () => void;
  reset: () => void;
};

const initialState = {
  currentUrl: 'https://www.google.com',
  isLoading: false,
  pageTitle: '',
  pageSnapshot: null as PageSnapshot | null,
  error: null as string | null,
  isAgentActive: false,
  agentStatus: '',
  speechRate: 0.9,
  autoRead: false,
  hapticFeedback: true,
  continuousListening: false,
  language: 'en',
  browsingHistory: [] as string[],
  commandHistory: [] as string[],
};

export const useAppStore = create<AppState>()((set, get) => ({
  ...initialState,

  setCurrentUrl: (url) => set({ currentUrl: url }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setPageTitle: (title) => set({ pageTitle: title }),
  setPageSnapshot: (snapshot) => set({ pageSnapshot: snapshot }),
  setError: (error) => set({ error }),
  setIsAgentActive: (active) => set({ isAgentActive: active }),
  setAgentStatus: (status) => set({ agentStatus: status }),
  setSpeechRate: (rate) => set({ speechRate: rate }),
  setAutoRead: (autoRead) => set({ autoRead }),
  setHapticFeedback: (haptic) => set({ hapticFeedback: haptic }),
  setContinuousListening: (continuous) => set({ continuousListening: continuous }),
  setLanguage: (lang) => set({ language: lang }),

  addBrowsingHistory: (url) => {
    const history = get().browsingHistory;
    const filtered = history.filter((h) => h !== url);
    set({ browsingHistory: [url, ...filtered].slice(0, 50) });
  },

  addCommandHistory: (command) => {
    const history = get().commandHistory;
    set({ commandHistory: [command, ...history].slice(0, 100) });
  },

  clearHistory: () => set({ browsingHistory: [], commandHistory: [] }),

  reset: () => set(initialState),
}));
