export type PageElement = {
  id: number;
  role: string;
  tag: string;
  text: string;
  label: string;
  placeholder: string;
  href: string;
  clickable: boolean;
  typeable: boolean;
  selectable: boolean;
  visible: boolean;
  rect: { top: number; left: number; width: number; height: number };
};

export type PageSnapshot = {
  url: string;
  title: string;
  elements: PageElement[];
  textContent: string;
  scrollY: number;
  pageHeight: number;
  viewportHeight: number;
  timestamp: number;
};

export type AgentAction =
  | { action: 'click'; elementId: number; speak: string }
  | { action: 'type'; elementId: number; text: string; speak: string }
  | { action: 'select'; elementId: number; value: string; speak: string }
  | { action: 'scroll'; direction: 'down' | 'up' | 'top' | 'bottom'; speak: string }
  | { action: 'navigate'; url: string; speak: string }
  | { action: 'submit'; elementId: number; speak: string }
  | { action: 'speak'; text: string; speak?: string }
  | { action: 'done'; speak: string }
  | { action: 'wait'; ms: number; speak: string }
  | { action: 'back'; speak: string };

export type VoiceCommand = {
  intent: 'navigate' | 'search' | 'click' | 'read' | 'scroll' | 'back' | 'stop' | 'help' | 'cart' | 'unknown';
  target?: string;
  params?: Record<string, string>;
};

export type AppState = {
  currentUrl: string;
  isLoading: boolean;
  isListening: boolean;
  isAgentActive: boolean;
  agentStatus: string;
  lastSpoken: string;
  pageSnapshot: PageSnapshot | null;
  voiceTranscript: string;
  error: string | null;
  history: string[];
};
