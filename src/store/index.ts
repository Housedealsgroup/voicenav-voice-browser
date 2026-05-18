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
  language: string;
  continuousMode: 'off' | 'wake_word' | 'always_on' | 'push_to_talk';

  // History
  browsingHistory: string[];
  commandHistory: string[];

  // Task state
  activeTaskName: string | null;
  taskProgress: { current: number; total: number } | null;

  // Assistant messages
  assistantMessages: Array<{ id: string; text: string; type: 'user' | 'assistant' | 'system'; timestamp: number }>;

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
  setContinuousMode: (mode: 'off' | 'wake_word' | 'always_on' | 'push_to_talk') => void;
  addBrowsingHistory: (url: string) => void;
  addCommandHistory: (command: string) => void;
  clearHistory: () => void;
  setActiveTaskName: (name: string | null) => void;
  setTaskProgress: (progress: { current: number; total: number } | null) => void;
  addAssistantMessage: (text: string, type: 'user' | 'assistant' | 'system') => void;
  clearAssistantMessages: () => void;
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
  continuousMode: 'off' as const,
  browsingHistory: [] as string[],
  commandHistory: [] as string[],
  activeTaskName: null as string | null,
  taskProgress: null as { current: number; total: number } | null,
  assistantMessages: [] as Array<{ id: string; text: string; type: 'user' | 'assistant' | 'system'; timestamp: number }>,
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
  setContinuousMode: (mode) => set({ continuousMode: mode }),

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

  setActiveTaskName: (name) => set({ activeTaskName: name }),
  setTaskProgress: (progress) => set({ taskProgress: progress }),

  addAssistantMessage: (text, type) => {
    const messages = get().assistantMessages;
    const newMsg = { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text, type, timestamp: Date.now() };
    set({ assistantMessages: [...messages, newMsg].slice(-50) });
  },

  clearAssistantMessages: () => set({ assistantMessages: [] }),

  reset: () => set(initialState),
}));
