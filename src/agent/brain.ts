// VoiceNav Agent Brain — enterprise-grade intent parsing with multi-step workflows
// Context-aware, retry-capable, with 30+ site aliases and fuzzy matching

import {
  PageSnapshot, AgentAction, PageElement, VoiceCommand,
  AgentContext, PageType
} from '../browser/types';

// --- Intent Parser ---

const NAVIGATION_PATTERNS = [
  /(?:go to|open|visit|navigate to|take me to|bring me to)\s+(.+)/i,
  /(?:go to|open)\s+(.+\.(?:com|org|net|io|dev|app|edu|gov))/i,
];

const SEARCH_PATTERNS = [
  /(?:search for|search|find|look up|look for|google)\s+(.+)/i,
];

const CLICK_PATTERNS = [
  /(?:click|tap|press|select|hit)\s+(?:on\s+)?(?:the\s+)?(.+)/i,
  /(?:click|tap|press)\s+(?:the\s+)?(\d+)(?:st|nd|rd|th)?\s+(.+)/i,
];

const READ_PATTERNS = [
  /(?:read|speak|tell me|what'?s on|what is on|describe|show me|what'?s here)\s*(?:the\s*)?(?:page|screen|content|this)?\s*(.*)/i,
  /(?:read)\s+(?:the\s+)?(.+)/i,
];

const SCROLL_PATTERNS = [
  /(?:scroll|go)\s*(down|up|top|bottom)/i,
  /(?:page\s*(down|up))/i,
];

const CART_PATTERNS = [
  /(?:add|put)\s+(?:the\s+)?(.+?)\s+(?:to|in|into)\s+(?:my\s+)?(?:cart|basket|bag)/i,
  /(?:add to cart|add to basket|put in cart|buy now|add to bag)/i,
  /(?:buy|purchase|order)\s+(.+)/i,
];

const BOOKMARK_PATTERNS = [
  /(?:bookmark|save)\s+(?:this\s+)?(?:page|site|website|url)/i,
  /(?:bookmark|save)\s+(?:this|it)/i,
  /(?:add\s+(?:to\s+)?bookmarks?)/i,
  /(?:remove|delete)\s+(?:the\s+)?bookmark/i,
];

const FORM_PATTERNS = [
  /(?:fill|type|enter|input)\s+(.+?)\s+(?:in|into|on)\s+(?:the\s+)?(.+)/i,
  /(?:submit|send)\s+(?:the\s+)?(?:form|search|query)/i,
  /(?:sign|log)\s*(?:in|out|up)/i,
];

const NAV_COMMANDS: [RegExp, string][] = [
  [/^(?:go\s*back|back)$/i, 'back'],
  [/^(?:go\s*forward|forward|go\s*next)$/i, 'forward'],
  [/^(?:refresh|reload)$/i, 'refresh'],
  [/^(?:stop|cancel|halt|never\s*mind)$/i, 'stop'],
  [/^(?:help|what can you do|commands|what can i say)$/i, 'help'],
  [/^(?:close|exit|quit)$/i, 'stop'],
  [/^(?:go\s*home|home)$/i, 'home'],
];

// Multi-step command patterns (commands with "then" or "and")
const MULTI_STEP_SEPARATORS = /\s+then\s+|\s+and\s+(?:then\s+)?|;\s*/;

export function parseVoiceCommand(transcript: string): VoiceCommand {
  const text = transcript.toLowerCase().trim();

  // Navigation
  for (const pattern of NAVIGATION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      let target = match[1].trim();
      if (!target.startsWith('http') && /\.\w{2,}/.test(target)) {
        target = 'https://' + target;
      }
      return { intent: 'navigate', target };
    }
  }

  // Search
  for (const pattern of SEARCH_PATTERNS) {
    const match = text.match(pattern);
    if (match) return { intent: 'search', target: match[1].trim() };
  }

  // Bookmark
  for (const pattern of BOOKMARK_PATTERNS) {
    if (pattern.test(text)) {
      return { intent: 'bookmark', target: /remove|delete/.test(text) ? 'remove' : 'add' };
    }
  }

  // Cart
  for (const pattern of CART_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return { intent: 'cart', target: match[1]?.trim() || 'first item' };
    }
  }

  // Form
  for (const pattern of FORM_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      if (/submit|send/.test(text)) return { intent: 'form', target: 'submit' };
      if (/sign|log/.test(text)) return { intent: 'click', target: match[0] };
      return { intent: 'form', target: match[2] || match[1] };
    }
  }

  // Click
  for (const pattern of CLICK_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const num = parseInt(match[1]);
      if (!isNaN(num) && match[2]) {
        return { intent: 'click', target: match[2].trim(), params: { index: String(num) } };
      }
      return { intent: 'click', target: match[1].trim() };
    }
  }

  // Read
  for (const pattern of READ_PATTERNS) {
    const match = text.match(pattern);
    if (match) return { intent: 'read', target: match[1]?.trim() };
  }

  // Scroll
  for (const pattern of SCROLL_PATTERNS) {
    const match = text.match(pattern);
    if (match) return { intent: 'scroll', target: match[1] };
  }

  // Nav commands (exact match)
  for (const [pattern, cmd] of NAV_COMMANDS) {
    if (pattern.test(text)) return { intent: cmd as VoiceCommand['intent'] };
  }

  // Default: treat as search
  if (text.length > 0) return { intent: 'search', target: text };

  return { intent: 'unknown' };
}

// Check if command has multiple steps
export function hasMultipleSteps(transcript: string): boolean {
  return MULTI_STEP_SEPARATORS.test(transcript.toLowerCase());
}

export function splitIntoSteps(transcript: string): string[] {
  return transcript.split(MULTI_STEP_SEPARATORS).map(s => s.trim()).filter(Boolean);
}

// --- Site alias map ---
const SITE_MAP: Record<string, string> = {
  'google': 'https://www.google.com',
  'gmail': 'https://mail.google.com',
  'amazon': 'https://www.amazon.com',
  'youtube': 'https://www.youtube.com',
  'facebook': 'https://www.facebook.com',
  'twitter': 'https://www.twitter.com',
  'x': 'https://www.x.com',
  'wikipedia': 'https://www.wikipedia.org',
  'wiki': 'https://www.wikipedia.org',
  'reddit': 'https://www.reddit.com',
  'ebay': 'https://www.ebay.com',
  'walmart': 'https://www.walmart.com',
  'target': 'https://www.target.com',
  'best buy': 'https://www.bestbuy.com',
  'bestbuy': 'https://www.bestbuy.com',
  'netflix': 'https://www.netflix.com',
  'github': 'https://www.github.com',
  'linkedin': 'https://www.linkedin.com',
  'instagram': 'https://www.instagram.com',
  'tiktok': 'https://www.tiktok.com',
  'spotify': 'https://www.spotify.com',
  'news': 'https://news.google.com',
  'maps': 'https://maps.google.com',
  'weather': 'https://weather.com',
  'cnn': 'https://www.cnn.com',
  'bbc': 'https://www.bbc.com',
  'espn': 'https://www.espn.com',
  'apple': 'https://www.apple.com',
  'microsoft': 'https://www.microsoft.com',
  'chatgpt': 'https://chat.openai.com',
  'openai': 'https://www.openai.com',
  'pinterest': 'https://www.pinterest.com',
  'twitch': 'https://www.twitch.tv',
  'discord': 'https://discord.com',
  'slack': 'https://slack.com',
  'zoom': 'https://zoom.us',
  'paypal': 'https://www.paypal.com',
  'venmo': 'https://venmo.com',
  'uber': 'https://www.uber.com',
  'lyft': 'https://www.lyft.com',
  'doordash': 'https://www.doordash.com',
  'instacart': 'https://www.instacart.com',
  'airbnb': 'https://www.airbnb.com',
  'booking': 'https://www.booking.com',
  'expedia': 'https://www.expedia.com',
};

function resolveSiteAlias(target: string): string {
  const normalized = target.toLowerCase().replace(/https?:\/\/(www\.)?/, '').replace(/\.(com|org|net|io|dev|edu|gov)$/, '').trim();
  return SITE_MAP[normalized] || target;
}

// --- Element Matching ---

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function fuzzyMatch(target: string, candidate: string): number {
  const a = normalizeText(target);
  const b = normalizeText(candidate);
  if (!a || !b) return 0;
  if (b === a) return 1;
  if (b.includes(a) || a.includes(b)) return 0.9;
  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);
  let matches = 0;
  for (const wa of wordsA) {
    for (const wb of wordsB) {
      if (wb.includes(wa) || wa.includes(wb)) { matches++; break; }
    }
  }
  return matches / Math.max(wordsA.length, 1);
}

function findSearchBox(elements: PageElement[]): PageElement | null {
  const byRole = elements.find(e => e.role === 'searchbox' || e.role === 'search');
  if (byRole) return byRole;
  const byType = elements.find(e => e.tag === 'input' && (
    e.placeholder.toLowerCase().includes('search') || e.label.toLowerCase().includes('search')
  ));
  if (byType) return byType;
  const byName = elements.find(e => e.tag === 'input' && /q|search|query|keyword/i.test(e.placeholder + e.label));
  if (byName) return byName;
  const textInputs = elements.filter(e => e.typeable && e.tag === 'input');
  return textInputs[0] || null;
}

function findAddToCartButton(elements: PageElement[]): PageElement | null {
  const cartKeywords = ['add to cart', 'add to bag', 'add to basket', 'buy now', 'add to trolley'];
  for (const el of elements) {
    if (!el.clickable) continue;
    const text = normalizeText(el.text + ' ' + el.label);
    for (const keyword of cartKeywords) {
      if (text.includes(normalizeText(keyword))) return el;
    }
  }
  return null;
}

function findButton(elements: PageElement[], target: string): PageElement | null {
  let bestMatch: PageElement | null = null;
  let bestScore = 0.3;
  for (const el of elements) {
    if (!el.clickable) continue;
    const score = fuzzyMatch(target, el.text + ' ' + el.label);
    if (score > bestScore) { bestScore = score; bestMatch = el; }
  }
  return bestMatch;
}

function findLink(elements: PageElement[], target: string): PageElement | null {
  let bestMatch: PageElement | null = null;
  let bestScore = 0.3;
  for (const el of elements) {
    if (el.role !== 'link') continue;
    const score = fuzzyMatch(target, el.text + ' ' + el.href);
    if (score > bestScore) { bestScore = score; bestMatch = el; }
  }
  return bestMatch;
}

function findAnyClickable(elements: PageElement[], target: string): PageElement | null {
  let bestMatch: PageElement | null = null;
  let bestScore = 0.25;
  for (const el of elements) {
    if (!el.clickable) continue;
    const text = el.text + ' ' + el.label + ' ' + el.href;
    const score = fuzzyMatch(target, text);
    if (score > bestScore) { bestScore = score; bestMatch = el; }
  }
  return bestMatch;
}

function findFormInput(elements: PageElement[], target: string): PageElement | null {
  let bestMatch: PageElement | null = null;
  let bestScore = 0.3;
  for (const el of elements) {
    if (!el.typeable) continue;
    const text = el.label + ' ' + el.placeholder + ' ' + el.text;
    const score = fuzzyMatch(target, text);
    if (score > bestScore) { bestScore = score; bestMatch = el; }
  }
  return bestMatch;
}

// --- Context-Aware Suggestions ---

export function getPageSuggestions(snapshot: PageSnapshot): string[] {
  const suggestions: string[] = [];
  const { pageType, patterns, shoppingData, elements } = snapshot;

  if (patterns?.hasSearch) suggestions.push('Search for something');
  if (pageType === 'shopping' || pageType === 'product_listing') {
    if (shoppingData?.hasCartButton) suggestions.push('Add to cart');
    suggestions.push('Sort by price');
    suggestions.push('Filter results');
  }
  if (pageType === 'search_results') {
    suggestions.push('Click the first result');
    suggestions.push('Refine search');
  }
  if (pageType === 'auth') {
    suggestions.push('Sign in');
  }
  if (patterns?.hasLoginForm) suggestions.push('Fill in the form');
  if (patterns?.hasPagination) suggestions.push('Next page');
  if (pageType === 'news' || pageType === 'reference') {
    suggestions.push('Read this page');
  }

  const headings = snapshot.headings?.slice(0, 3).map(h => h.text) || [];
  if (headings.length > 0) {
    suggestions.push(`Click "${headings[0]}"`);
  }

  return suggestions.slice(0, 5);
}

// --- Agent Decision Engine ---

export function decideAction(
  intent: VoiceCommand,
  snapshot: PageSnapshot,
  context: AgentContext
): { action: AgentAction; needsRetry: boolean } {
  const { elements } = snapshot;

  switch (intent.intent) {
    case 'navigate': {
      let targetUrl = intent.target || '';
      targetUrl = resolveSiteAlias(targetUrl);
      if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
      return {
        action: { action: 'navigate', url: targetUrl, speak: `Going to ${targetUrl}` },
        needsRetry: false
      };
    }

    case 'search': {
      const query = intent.target || '';
      const searchBox = findSearchBox(elements);
      if (searchBox) {
        if (context.stepHistory.length === 0) {
          return {
            action: { action: 'type', elementId: searchBox.id, text: query, speak: `Searching for ${query}` },
            needsRetry: false
          };
        }
        return {
          action: { action: 'submit', elementId: searchBox.id, speak: 'Submitting search' },
          needsRetry: false
        };
      }
      return {
        action: { action: 'navigate', url: `https://www.google.com/search?q=${encodeURIComponent(query)}`, speak: `Searching for ${query}` },
        needsRetry: false
      };
    }

    case 'cart': {
      const cartButton = findAddToCartButton(elements);
      if (cartButton) {
        return {
          action: { action: 'click', elementId: cartButton.id, speak: 'Adding to cart' },
          needsRetry: false
        };
      }
      if (context.retryCount === 0) {
        return {
          action: { action: 'scroll', direction: 'down', speak: 'Looking for add to cart button...' },
          needsRetry: true
        };
      }
      return {
        action: { action: 'speak', text: 'I could not find an add to cart button on this page.' },
        needsRetry: false
      };
    }

    case 'click': {
      const target = intent.target || '';

      if (intent.params?.index) {
        const index = parseInt(intent.params.index) - 1;
        const clickable = elements.filter(e => e.clickable);
        if (index >= 0 && index < clickable.length) {
          return {
            action: { action: 'click', elementId: clickable[index].id, speak: `Clicking ${clickable[index].text || 'element ' + (index + 1)}` },
            needsRetry: false
          };
        }
      }

      const button = findButton(elements, target);
      if (button) return { action: { action: 'click', elementId: button.id, speak: `Clicking ${button.text || target}` }, needsRetry: false };

      const link = findLink(elements, target);
      if (link) return { action: { action: 'click', elementId: link.id, speak: `Clicking ${link.text || target}` }, needsRetry: false };

      const any = findAnyClickable(elements, target);
      if (any) return { action: { action: 'click', elementId: any.id, speak: `Clicking ${any.text || target}` }, needsRetry: false };

      // Retry with scroll
      if (context.retryCount === 0) {
        return {
          action: { action: 'scroll', direction: 'down', speak: `Looking for ${target}...` },
          needsRetry: true
        };
      }

      return {
        action: { action: 'navigate', url: `https://www.google.com/search?q=${encodeURIComponent(target)}`, speak: `Could not find "${target}". Searching for it.` },
        needsRetry: false
      };
    }

    case 'form': {
      const target = intent.target || '';
      if (target === 'submit') {
        const submitBtn = findButton(elements, 'submit') || findButton(elements, 'send') || findButton(elements, 'go');
        if (submitBtn) {
          return { action: { action: 'click', elementId: submitBtn.id, speak: 'Submitting form' }, needsRetry: false };
        }
        return { action: { action: 'speak', text: 'Could not find a submit button.' }, needsRetry: false };
      }
      const input = findFormInput(elements, target);
      if (input) {
        return { action: { action: 'type', elementId: input.id, text: target, speak: `Typing in ${input.label || input.placeholder || target}` }, needsRetry: false };
      }
      return { action: { action: 'speak', text: `Could not find a field for "${target}".` }, needsRetry: false };
    }

    case 'read': {
      const headings = snapshot.headings?.slice(0, 5).map(h => h.text) || [];
      const inputs = elements.filter(e => e.typeable);
      const buttons = elements.filter(e => e.clickable && e.role === 'button');
      const links = elements.filter(e => e.role === 'link');
      const mainText = snapshot.textContent.substring(0, 500);

      let summary = `Page: ${snapshot.title}. `;
      if (snapshot.pageType && snapshot.pageType !== 'general') {
        summary += `Type: ${snapshot.pageType.replace(/_/g, ' ')}. `;
      }
      if (headings.length > 0) summary += `Sections: ${headings.join('. ')}. `;
      if (snapshot.shoppingData) {
        const sd = snapshot.shoppingData;
        if (sd.productName) summary += `Product: ${sd.productName}. `;
        if (sd.price) summary += `Price: ${sd.price}. `;
        if (sd.rating) summary += `Rating: ${sd.rating}. `;
      }
      if (inputs.length > 0) summary += `${inputs.length} input fields. `;
      if (buttons.length > 0) {
        const btnNames = buttons.slice(0, 5).map(b => b.text || b.label).filter(Boolean);
        if (btnNames.length > 0) summary += `Buttons: ${btnNames.join(', ')}. `;
      }
      if (links.length > 0) summary += `${links.length} links. `;
      if (mainText) summary += mainText;

      return { action: { action: 'speak', text: summary }, needsRetry: false };
    }

    case 'scroll': {
      const dir = intent.target || 'down';
      return { action: { action: 'scroll', direction: dir as any, speak: `Scrolling ${dir}` }, needsRetry: false };
    }

    case 'back': {
      return { action: { action: 'back', speak: 'Going back' }, needsRetry: false };
    }

    case 'bookmark': {
      return { action: { action: 'speak', text: intent.target === 'remove' ? 'Removing bookmark.' : 'Bookmark saved.' }, needsRetry: false };
    }

    case 'stop': {
      return { action: { action: 'done', speak: 'Stopping' }, needsRetry: false };
    }

    case 'home': {
      return { action: { action: 'navigate', url: 'https://www.google.com', speak: 'Going home' }, needsRetry: false };
    }

    case 'help': {
      return {
        action: { action: 'speak', text: 'You can say: go to a website, search for something, click an element, read this page, scroll up or down, bookmark this page, add to cart, or go back. You can also chain commands with "then", like "search for shoes then click the first result".' },
        needsRetry: false
      };
    }

    default: {
      return {
        action: { action: 'speak', text: 'I did not understand. Say help for available commands.' },
        needsRetry: false
      };
    }
  }
}

// --- Multi-step Agent ---

export type AgentStep = {
  action: AgentAction;
  isComplete: boolean;
  nextStep: number;
  needsRetry: boolean;
};

export function getAgentStep(
  intent: VoiceCommand,
  snapshot: PageSnapshot,
  context: AgentContext
): AgentStep {
  const { action, needsRetry } = decideAction(intent, snapshot, context);

  // Search needs 2 steps: type then submit
  if (intent.intent === 'search' && context.stepHistory.length === 0 && action.action === 'type') {
    return { action, isComplete: false, nextStep: 1, needsRetry: false };
  }

  // Cart might need scroll first
  if (intent.intent === 'cart' && action.action === 'scroll' && context.retryCount === 0) {
    return { action, isComplete: false, nextStep: 1, needsRetry: true };
  }

  return { action, isComplete: true, nextStep: 0, needsRetry };
}

// --- Page Analysis ---

export function analyzePage(snapshot: PageSnapshot): string {
  const { elements, title, pageType, headings, shoppingData, patterns } = snapshot;

  const inputs = elements.filter(e => e.typeable);
  const buttons = elements.filter(e => e.role === 'button');
  const links = elements.filter(e => e.role === 'link');

  let analysis = `Page: ${title}. `;

  if (pageType && pageType !== 'general') {
    analysis += `This is a ${pageType.replace(/_/g, ' ')} page. `;
  }

  if (headings && headings.length > 0) {
    analysis += `Sections: ${headings.slice(0, 5).map(h => h.text).join('. ')}. `;
  }

  if (shoppingData) {
    if (shoppingData.productName) analysis += `Product: ${shoppingData.productName}. `;
    if (shoppingData.price) analysis += `Price: ${shoppingData.price}. `;
    if (shoppingData.rating) analysis += `Rating: ${shoppingData.rating}. `;
    if (shoppingData.reviewCount) analysis += `Reviews: ${shoppingData.reviewCount}. `;
  }

  if (patterns) {
    if (patterns.hasSearch) analysis += 'There is a search bar. ';
    if (patterns.hasLoginForm) analysis += 'There is a login form. ';
    if (patterns.hasPagination) analysis += 'There are more pages. ';
  }

  if (inputs.length > 0) analysis += `${inputs.length} input fields. `;
  if (buttons.length > 0) {
    const btnNames = buttons.slice(0, 5).map(b => b.text || b.label).filter(Boolean);
    if (btnNames.length > 0) analysis += `Buttons: ${btnNames.join(', ')}. `;
  }
  if (links.length > 0) analysis += `${links.length} links on the page. `;

  const snippet = snapshot.textContent.substring(0, 300).trim();
  if (snippet) analysis += snippet;

  return analysis;
}
