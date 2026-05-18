// VoiceNav Context Actions — v9
// Context-aware action suggestions based on page content and state
// Adapts suggestions to page type, elements, and user history

import { logger } from '../utils/logger';
import type { PageSnapshot, PageElement } from '../browser/types';

export type ContextAction = {
  id: string;
  label: string;
  voiceCommand: string;
  icon: string;
  confidence: number;
  category: 'navigation' | 'content' | 'shopping' | 'form' | 'media' | 'social' | 'utility';
  description: string;
};

type PageContext = {
  type: string;
  hasForm: boolean;
  hasMedia: boolean;
  hasCart: boolean;
  hasSearch: boolean;
  hasNav: boolean;
  hasArticle: boolean;
  hasTable: boolean;
  hasLogin: boolean;
  elementCount: number;
  linkCount: number;
};

function analyzeContext(snapshot: PageSnapshot): PageContext {
  const elements = snapshot.elements || [];
  const text = (snapshot.textContent || '').toLowerCase();
  const url = (snapshot.url || '').toLowerCase();

  const hasForm = elements.some(e => e.typeable) || text.includes('sign in') || text.includes('login') || text.includes('register');
  const hasMedia = elements.some(e => e.tag === 'video' || e.tag === 'audio') || text.includes('play') || text.includes('watch');
  const hasCart = text.includes('add to cart') || text.includes('add to basket') || text.includes('buy now') || text.includes('checkout');
  const hasSearch = elements.some(e => e.tag === 'input' && (e.placeholder || '').toLowerCase().includes('search')) || text.includes('search');
  const hasNav = elements.some(e => e.tag === 'nav' || e.role === 'navigation') || text.includes('menu');
  const hasArticle = text.length > 500 && (text.includes('published') || text.includes('author') || text.includes('read more'));
  const hasTable = elements.some(e => e.tag === 'table') || text.includes('table');
  const hasLogin = text.includes('sign in') || text.includes('log in') || text.includes('username') || text.includes('password');

  return {
    type: snapshot.pageType || 'general',
    hasForm,
    hasMedia,
    hasCart,
    hasSearch,
    hasNav,
    hasArticle,
    hasTable,
    hasLogin,
    elementCount: elements.length,
    linkCount: elements.filter(e => e.href).length,
  };
}

function generateActions(ctx: PageContext, snapshot: PageSnapshot): ContextAction[] {
  const actions: ContextAction[] = [];
  let id = 0;

  // Always available
  actions.push({
    id: `ctx-${id++}`,
    label: 'Read page aloud',
    voiceCommand: 'read this page',
    icon: 'volume-high',
    confidence: 0.95,
    category: 'content',
    description: 'Have the page content read to you',
  });

  actions.push({
    id: `ctx-${id++}`,
    label: 'Summarize page',
    voiceCommand: 'summarize this page',
    icon: 'document-text',
    confidence: 0.9,
    category: 'content',
    description: 'Get a quick summary of the page',
  });

  actions.push({
    id: `ctx-${id++}`,
    label: 'Bookmark page',
    voiceCommand: 'bookmark this page',
    icon: 'bookmark',
    confidence: 0.85,
    category: 'utility',
    description: 'Save this page to bookmarks',
  });

  // Search actions
  if (ctx.hasSearch) {
    actions.push({
      id: `ctx-${id++}`,
      label: 'Search on page',
      voiceCommand: 'search on this page for ',
      icon: 'search',
      confidence: 0.92,
      category: 'content',
      description: 'Find specific content on this page',
    });
  }

  // Shopping actions
  if (ctx.hasCart) {
    actions.push({
      id: `ctx-${id++}`,
      label: 'Add to cart',
      voiceCommand: 'add to cart',
      icon: 'cart',
      confidence: 0.96,
      category: 'shopping',
      description: 'Add the current item to your cart',
    });
    actions.push({
      id: `ctx-${id++}`,
      label: 'Compare prices',
      voiceCommand: 'compare prices',
      icon: 'pricetag',
      confidence: 0.88,
      category: 'shopping',
      description: 'Compare prices across stores',
    });
    actions.push({
      id: `ctx-${id++}`,
      label: 'Buy now',
      voiceCommand: 'buy now',
      icon: 'bag',
      confidence: 0.85,
      category: 'shopping',
      description: 'Proceed to purchase',
    });
  }

  // Form actions
  if (ctx.hasForm) {
    actions.push({
      id: `ctx-${id++}`,
      label: 'Fill form',
      voiceCommand: 'fill the form',
      icon: 'create',
      confidence: 0.9,
      category: 'form',
      description: 'Start guided form filling',
    });
    if (ctx.hasLogin) {
      actions.push({
        id: `ctx-${id++}`,
        label: 'Sign in',
        voiceCommand: 'sign in',
        icon: 'log-in',
        confidence: 0.93,
        category: 'form',
        description: 'Sign in to your account',
      });
    }
    actions.push({
      id: `ctx-${id++}`,
      label: 'Submit form',
      voiceCommand: 'submit',
      icon: 'checkmark-circle',
      confidence: 0.88,
      category: 'form',
      description: 'Submit the current form',
    });
  }

  // Media actions
  if (ctx.hasMedia) {
    actions.push({
      id: `ctx-${id++}`,
      label: 'Play media',
      voiceCommand: 'play',
      icon: 'play-circle',
      confidence: 0.94,
      category: 'media',
      description: 'Play the media content',
    });
    actions.push({
      id: `ctx-${id++}`,
      label: 'Pause media',
      voiceCommand: 'pause',
      icon: 'pause-circle',
      confidence: 0.9,
      category: 'media',
      description: 'Pause the media content',
    });
  }

  // Navigation actions
  if (ctx.hasNav) {
    actions.push({
      id: `ctx-${id++}`,
      label: 'Show menu',
      voiceCommand: 'click menu',
      icon: 'menu',
      confidence: 0.87,
      category: 'navigation',
      description: 'Open the navigation menu',
    });
  }

  // Article actions
  if (ctx.hasArticle) {
    actions.push({
      id: `ctx-${id++}`,
      label: 'Read article',
      voiceCommand: 'read this article',
      icon: 'newspaper',
      confidence: 0.91,
      category: 'content',
      description: 'Read the article content',
    });
    actions.push({
      id: `ctx-${id++}`,
      label: 'Scroll down',
      voiceCommand: 'scroll down',
      icon: 'arrow-down',
      confidence: 0.82,
      category: 'navigation',
      description: 'Scroll down the page',
    });
  }

  // Table actions
  if (ctx.hasTable) {
    actions.push({
      id: `ctx-${id++}`,
      label: 'Read table',
      voiceCommand: 'read the table',
      icon: 'grid',
      confidence: 0.88,
      category: 'content',
      description: 'Read table data aloud',
    });
  }

  // Sort by confidence
  actions.sort((a, b) => b.confidence - a.confidence);

  return actions;
}

export function getContextActions(snapshot: PageSnapshot): ContextAction[] {
  const ctx = analyzeContext(snapshot);
  const actions = generateActions(ctx, snapshot);

  logger.agent('contextActions', { pageType: ctx.type, actionCount: actions.length, hasCart: ctx.hasCart, hasForm: ctx.hasForm });

  return actions;
}

export function getTopActions(snapshot: PageSnapshot, limit = 5): ContextAction[] {
  return getContextActions(snapshot).slice(0, limit);
}

export function getActionsByCategory(snapshot: PageSnapshot): Record<string, ContextAction[]> {
  const actions = getContextActions(snapshot);
  const grouped: Record<string, ContextAction[]> = {};

  for (const action of actions) {
    if (!grouped[action.category]) grouped[action.category] = [];
    grouped[action.category].push(action);
  }

  return grouped;
}

export function getShoppingActions(snapshot: PageSnapshot): ContextAction[] {
  return getContextActions(snapshot).filter(a => a.category === 'shopping');
}

export function getFormActions(snapshot: PageSnapshot): ContextAction[] {
  return getContextActions(snapshot).filter(a => a.category === 'form');
}
