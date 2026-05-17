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
};

export type PagePatterns = {
  hasSearch: boolean;
  hasLoginForm: boolean;
  hasNav: boolean;
  hasPagination: boolean;
  hasMoreContent: boolean;
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
  intent: 'navigate' | 'search' | 'click' | 'read' | 'scroll' | 'back' | 'stop' | 'help' | 'cart' | 'bookmark' | 'form' | 'home' | 'unknown';
  target?: string;
  params?: Record<string, string>;
};

export type AgentContext = {
  lastCommand?: string;
  lastAction?: AgentAction;
  currentPageType?: PageType;
  stepHistory: string[];
  retryCount: number;
};
