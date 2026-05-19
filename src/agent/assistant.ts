// VoiceNav Proactive Assistant — detects page context and suggests actions
// Learns user patterns and provides intelligent suggestions

import type { PageSnapshot, PageType } from '../browser/types';

type AssistantSuggestion = {
  text: string;
  action: string;
  priority: number;
  category: 'navigation' | 'shopping' | 'reading' | 'form' | 'social' | 'general';
};

// Detect what the user might want to do based on page context
export function getProactiveSuggestions(snapshot: PageSnapshot): AssistantSuggestion[] {
  const suggestions: AssistantSuggestion[] = [];
  const { pageType, patterns, shoppingData, elements: _elements, headings } = snapshot;

  // Shopping pages
  if (pageType === 'shopping' || pageType === 'product_listing') {
    if (shoppingData?.hasCartButton) {
      suggestions.push({
        text: 'Add to cart',
        action: 'add to cart',
        priority: 10,
        category: 'shopping',
      });
    }
    if (shoppingData?.price) {
      suggestions.push({
        text: `Price: ${shoppingData.price}`,
        action: 'read this page',
        priority: 8,
        category: 'shopping',
      });
    }
    suggestions.push({
      text: 'Sort by price',
      action: 'sort by price',
      priority: 6,
      category: 'shopping',
    });
    suggestions.push({
      text: 'Filter results',
      action: 'filter',
      priority: 5,
      category: 'shopping',
    });
  }

  // Search results
  if (pageType === 'search_results') {
    suggestions.push({
      text: 'Click first result',
      action: 'click first result',
      priority: 9,
      category: 'navigation',
    });
    suggestions.push({
      text: 'Next page',
      action: 'next page',
      priority: 5,
      category: 'navigation',
    });
  }

  // Auth pages
  if (pageType === 'auth' || patterns?.hasLoginForm) {
    suggestions.push({
      text: 'Sign in',
      action: 'sign in',
      priority: 10,
      category: 'form',
    });
  }

  // News/reference pages
  if (pageType === 'news' || pageType === 'reference') {
    suggestions.push({
      text: 'Read article',
      action: 'read this page',
      priority: 9,
      category: 'reading',
    });
    suggestions.push({
      text: 'Summarize',
      action: 'summarize this page',
      priority: 7,
      category: 'reading',
    });
  }

  // Email pages
  if (pageType === 'email') {
    suggestions.push({
      text: 'Read latest email',
      action: 'read this page',
      priority: 9,
      category: 'reading',
    });
    suggestions.push({
      text: 'Compose new',
      action: 'compose',
      priority: 7,
      category: 'form',
    });
  }

  // Social media
  if (pageType === 'social') {
    suggestions.push({
      text: 'Read feed',
      action: 'read this page',
      priority: 8,
      category: 'reading',
    });
  }

  // Pages with search
  if (patterns?.hasSearch) {
    suggestions.push({
      text: 'Search',
      action: 'search for',
      priority: 7,
      category: 'navigation',
    });
  }

  // Pages with pagination
  if (patterns?.hasPagination) {
    suggestions.push({
      text: 'Next page',
      action: 'next page',
      priority: 4,
      category: 'navigation',
    });
  }

  // Checkout pages
  if (pageType === 'checkout') {
    suggestions.push({
      text: 'Complete checkout',
      action: 'checkout',
      priority: 10,
      category: 'shopping',
    });
  }

  // Video pages
  if (pageType === 'video') {
    suggestions.push({
      text: 'Play video',
      action: 'play',
      priority: 10,
      category: 'general',
    });
  }

  // Developer pages
  if (pageType === 'developer') {
    suggestions.push({
      text: 'Read code',
      action: 'read this page',
      priority: 8,
      category: 'reading',
    });
  }

  // Generic: always suggest reading if nothing else
  if (suggestions.length === 0) {
    suggestions.push({
      text: 'Read page',
      action: 'read this page',
      priority: 5,
      category: 'reading',
    });
    if (headings && headings.length > 0) {
      suggestions.push({
        text: `Go to "${headings[0].text}"`,
        action: `click ${headings[0].text}`,
        priority: 4,
        category: 'navigation',
      });
    }
  }

  // Sort by priority and return top 5
  return suggestions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);
}

// Generate a context-aware greeting
export function getContextualGreeting(snapshot: PageSnapshot | null): string {
  if (!snapshot) return 'What would you like to do?';

  const { pageType, title, shoppingData } = snapshot;

  if (pageType === 'shopping' && shoppingData?.productName) {
    return `Viewing ${shoppingData.productName}. Would you like to add it to cart or compare prices?`;
  }
  if (pageType === 'search_results') {
    return `Found search results. Would you like me to read them or click a result?`;
  }
  if (pageType === 'email') {
    return `You have your email open. Would you like to read your latest messages?`;
  }
  if (pageType === 'news') {
    return `Reading the news. Would you like me to read an article?`;
  }
  if (pageType === 'video') {
    return `Video page detected. Would you like to play or read the description?`;
  }

  return `You're on ${title || 'a page'}. What would you like to do?`;
}

// Detect if the user seems stuck (no commands for a while on the same page)
export function shouldOfferHelp(lastCommandTime: number, currentPageType: PageType | undefined): boolean {
  const timeSinceLastCommand = Date.now() - lastCommandTime;
  const TWO_MINUTES = 2 * 60 * 1000;

  // Offer help if user has been idle for 2+ minutes on a complex page
  if (timeSinceLastCommand > TWO_MINUTES) {
    if (currentPageType === 'shopping' || currentPageType === 'checkout' || currentPageType === 'auth') {
      return true;
    }
  }
  return false;
}
