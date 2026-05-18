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
  relevanceScore?: number;
  ariaLevel?: number;
  formFieldType?: string;
  isPrimaryAction?: boolean;
};

export type Heading = {
  level: number;
  text: string;
};

export type ShoppingData = {
  price?: string;
  rating?: string;
  reviewCount?: string;
  productName?: string;
  hasCartButton?: boolean;
  brand?: string;
  availability?: string;
  shipping?: string;
  comparePrices?: Array<{ store: string; price: string }>;
};

export type PagePatterns = {
  hasSearch: boolean;
  hasLoginForm: boolean;
  hasNav: boolean;
  hasPagination: boolean;
  hasMoreContent: boolean;
  hasInfiniteScroll?: boolean;
  hasModal?: boolean;
  hasVideo?: boolean;
  hasAudio?: boolean;
  hasTable?: boolean;
  hasTabs?: boolean;
  hasAccordion?: boolean;
  hasBreadcrumbs?: boolean;
};

export type PageType =
  | 'shopping'
  | 'search_results'
  | 'video'
  | 'social'
  | 'email'
  | 'news'
  | 'reference'
  | 'developer'
  | 'auth'
  | 'checkout'
  | 'product_listing'
  | 'forum'
  | 'blog'
  | 'documentation'
  | 'maps'
  | 'music'
  | 'podcast'
  | 'banking'
  | 'travel'
  | 'food'
  | 'health'
  | 'education'
  | 'government'
  | 'general';

export type PageSnapshot = {
  url: string;
  title: string;
  elements: PageElement[];
  textContent: string;
  scrollY: number;
  pageHeight: number;
  viewportHeight: number;
  timestamp: number;
  pageType?: PageType;
  headings?: Heading[];
  shoppingData?: ShoppingData | null;
  patterns?: PagePatterns;
  language?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  openGraph?: { title?: string; description?: string; image?: string };
};

export type AgentAction =
  | { action: 'click'; elementId: number; speak: string }
  | { action: 'type'; elementId: number; text: string; speak: string }
  | { action: 'select'; elementId: number; value: string; speak: string }
  | { action: 'scroll'; direction: 'down' | 'up' | 'top' | 'bottom' | 'left' | 'right'; speak: string }
  | { action: 'navigate'; url: string; speak: string }
  | { action: 'submit'; elementId: number; speak: string }
  | { action: 'speak'; text: string; speak?: string }
  | { action: 'done'; speak: string }
  | { action: 'wait'; ms: number; speak: string }
  | { action: 'back'; speak: string }
  | { action: 'forward'; speak: string }
  | { action: 'refresh'; speak: string }
  | { action: 'focus'; elementId: number; speak: string }
  | { action: 'hover'; elementId: number; speak: string }
  | { action: 'doubleClick'; elementId: number; speak: string }
  | { action: 'rightClick'; elementId: number; speak: string }
  | { action: 'keypress'; key: string; speak: string }
  | { action: 'fillForm'; fields: Array<{ elementId: number; value: string }>; speak: string }
  | { action: 'multiClick'; elementIds: number[]; speak: string };

export type VoiceCommand = {
  intent: 'navigate' | 'search' | 'click' | 'read' | 'scroll' | 'back' | 'forward' | 'refresh'
    | 'stop' | 'help' | 'cart' | 'bookmark' | 'form' | 'type' | 'select' | 'submit' | 'play'
    | 'pause' | 'next' | 'previous' | 'zoom' | 'share' | 'download' | 'copy' | 'find'
    | 'filter' | 'sort' | 'compare' | 'buy' | 'checkout' | 'login' | 'logout' | 'signup'
    | 'compose' | 'send' | 'delete' | 'open' | 'close' | 'maximize' | 'minimize'
    | 'tab_new' | 'tab_close' | 'tab_next' | 'tab_prev' | 'home' | 'unknown';
  target?: string;
  params?: Record<string, string>;
  confidence?: number;
  entities?: Array<{ type: string; value: string }>;
};

export type AgentContext = {
  lastCommand?: string;
  lastAction?: AgentAction;
  currentPageType?: PageType;
  stepHistory: string[];
  retryCount: number;
  sessionGoal?: string;
  taskSteps?: string[];
};

// Re-export from agent modules for convenience
export type { NLUResult, Entity, Intent } from '../agent/nlu';
export type { TaskDefinition, TaskStep, TaskStatus } from '../agent/taskEngine';
export type { ConversationTurn, SessionContext, EntityMemory } from '../agent/sessionMemory';
export type { VoiceMacro, MacroStep } from '../voice/voiceMacros';
