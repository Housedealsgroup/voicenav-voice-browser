import { create } from 'zustand';
import { PageSnapshot, AgentAction } from '../browser/types';

type AppState = {
  // Navigation
  currentUrl: string;
  canGoBack: boolean;
  canGoForward: boolean;

  // Page state
  isLoading: boolean;
  pageSnapshot: PageSnapshot | null;
  pageTitle: string;

  // Agent state
  isAgentActive: boolean;
  agentStatus: string;
  lastAction: AgentAction | null;
  agentStep: number;

  // Voice state
  isListening: boolean;
  isSpeaking: boolean;
  voiceTranscript: string;
  lastSpoken: string;

  // UI state
  showSettings: boolean;
  showHelp: boolean;
  error: string | null;

  // Settings
  speechRate: number;
  autoRead: boolean;
  hapticFeedback: boolean;

  // History
  commandHistory: string[];
  browsingHistory: string[];

  // Actions
  setCurrentUrl: (url: string) => void;
  setCanGoBack: (can: boolean) => void;
  setCanGoForward: (can: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setPageSnapshot: (snapshot: PageSnapshot | null) => void;
  setPageTitle: (title: string) => void;
  setIsAgentActive: (active: boolean) => void;
  setAgentStatus: (status: string) => void;
  setLastAction: (action: AgentAction | null) => void;
  setAgentStep: (step: number) => void;
  incrementAgentStep: () => void;
  setIsListening: (listening: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setVoiceTranscript: (transcript: string) => void;
  setLastSpoken: (text: string) => void;
  setShowSettings: (show: boolean) => void;
  setShowHelp: (show: boolean) => void;
  setError: (error: string | null) => void;
  setSpeechRate: (rate: number) => void;
  setAutoRead: (auto: boolean) => void;
  setHapticFeedback: (haptic: boolean) => void;
  addCommandHistory: (command: string) => void;
  addBrowsingHistory: (url: string) => void;
  reset: () => void;
};

const initialState = {
  currentUrl: 'https://www.google.com',
  canGoBack: false,
  canGoForward: false,
  isLoading: false,
  pageSnapshot: null as PageSnapshot | null,
  pageTitle: '',
  isAgentActive: false,
  agentStatus: '',
  lastAction: null as AgentAction | null,
  agentStep: 0,
  isListening: false,
  isSpeaking: false,
  voiceTranscript: '',
  lastSpoken: '',
  showSettings: false,
  showHelp: false,
  error: null as string | null,
  speechRate: 0.9,
  autoRead: true,
  hapticFeedback: true,
  commandHistory: [] as string[],
  browsingHistory: [] as string[],
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setCurrentUrl: (url) => set({ currentUrl: url }),
  setCanGoBack: (can) => set({ canGoBack: can }),
  setCanGoForward: (can) => set({ canGoForward: can }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setPageSnapshot: (snapshot) => set({ pageSnapshot: snapshot }),
  setPageTitle: (title) => set({ pageTitle: title }),
  setIsAgentActive: (active) => set({ isAgentActive: active }),
  setAgentStatus: (status) => set({ agentStatus: status }),
  setLastAction: (action) => set({ lastAction: action }),
  setAgentStep: (step) => set({ agentStep: step }),
  incrementAgentStep: () => set((state) => ({ agentStep: state.agentStep + 1 })),
  setIsListening: (listening) => set({ isListening: listening }),
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setVoiceTranscript: (transcript) => set({ voiceTranscript: transcript }),
  setLastSpoken: (text) => set({ lastSpoken: text }),
  setShowSettings: (show) => set({ showSettings: show }),
  setShowHelp: (show) => set({ showHelp: show }),
  setError: (error) => set({ error }),
  setSpeechRate: (rate) => set({ speechRate: rate }),
  setAutoRead: (auto) => set({ autoRead: auto }),
  setHapticFeedback: (haptic) => set({ hapticFeedback: haptic }),
  addCommandHistory: (command) =>
    set((state) => ({
      commandHistory: [command, ...state.commandHistory].slice(0, 50),
    })),
  addBrowsingHistory: (url) =>
    set((state) => ({
      browsingHistory: [url, ...state.browsingHistory.filter((u) => u !== url)].slice(0, 100),
    })),
  reset: () => set(initialState),
}));
