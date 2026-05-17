// Organic agent brain — no external API needed
// Uses smart heuristics, pattern matching, and DOM analysis

import { PageSnapshot, AgentAction, PageElement, VoiceCommand } from '../browser/types';

// --- Intent Parser ---
// Parses natural language commands into structured intents

const NAVIGATION_PATTERNS = [
  /(?:go to|open|visit|navigate to|take me to)\s+(.+)/i,
  /(?:go to|open)\s+(.+\.(?:com|org|net|io|dev|app))/i,
];

const SEARCH_PATTERNS = [
  /(?:search for|search|find|look up|look for|google)\s+(.+)/i,
  /(?:search|find)\s+(.+)/i,
];

const CLICK_PATTERNS = [
  /(?:click|tap|press|select)\s+(?:on\s+)?(?:the\s+)?(.+)/i,
  /(?:click|tap|press)\s+(?:the\s+)?(\d+)(?:st|nd|rd|th)?\s*(.+)/i,
  /(?:the\s+)?(\d+)(?:st|nd|rd|th)?\s*(.+)/i,
];

const READ_PATTERNS = [
  /(?:read|speak|tell me|what'?s on|what is on|describe|show me)\s*(?:the\s*)?(?:page|screen|content|this)?/i,
  /(?:read)\s+(?:the\s+)?(.+)/i,
];

const SCROLL_PATTERNS = [
  /(?:scroll|go)\s*(down|up|top|bottom)/i,
  /(?:scroll)\s*(down|up)/i,
  /(?:page\s*(down|up))/i,
];

const CART_PATTERNS = [
  /(?:add|put)\s+(?:the\s+)?(.+?)\s+(?:to|in|into)\s+(?:my\s+)?(?:cart|basket|bag)/i,
  /(?:add to cart|add to basket|put in cart)/i,
  /(?:buy|purchase)\s+(.+)/i,
];

const NAV_COMMANDS = [
  /(?:go\s*back|back)/i,
  /(?:go\s*forward|forward)/i,
  /(?:refresh|reload)/i,
  /(?:stop|cancel|halt)/i,
  /(?:help|what can you do)/i,
];

export function parseVoiceCommand(transcript: string): VoiceCommand {
  const text = transcript.toLowerCase().trim();

  // Navigation
  for (const pattern of NAVIGATION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      let target = match[1].trim();
      // Auto-add https:// if needed
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

  // Cart
  for (const pattern of CART_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      if (match[1]) return { intent: 'cart', target: match[1].trim() };
      return { intent: 'cart', target: 'first item' };
    }
  }

  // Click
  for (const pattern of CLICK_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const num = parseInt(match[1]);
      if (!isNaN(num)) return { intent: 'click', target: match[2] || String(num), params: { index: String(num) } };
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

  // Nav commands
  for (const pattern of NAV_COMMANDS) {
    if (pattern.test(text)) {
      if (/go\s*back|back/.test(text)) return { intent: 'back' };
      if (/stop|cancel|halt/.test(text)) return { intent: 'stop' };
      if (/help/.test(text)) return { intent: 'help' };
      return { intent: 'scroll', target: 'refresh' };
    }
  }

  // Default: treat as search or click on text
  if (text.length > 0) {
    return { intent: 'click', target: text };
  }

  return { intent: 'unknown' };
}

// --- Element Matching ---
// Finds the best matching element for a given intent/target

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function fuzzyMatch(target: string, candidate: string): number {
  const a = normalizeText(target);
  const b = normalizeText(candidate);
  if (!a || !b) return 0;
  if (b.includes(a) || a.includes(b)) return 0.9;
  // Word overlap
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
  // Priority: role=searchbox, input[type=search], input[name=q], input with search-like placeholder
  const byRole = elements.find(e => e.role === 'searchbox' || e.role === 'search');
  if (byRole) return byRole;

  const byType = elements.find(e => e.tag === 'input' && (
    e.placeholder.toLowerCase().includes('search') ||
    e.label.toLowerCase().includes('search') ||
    e.placeholder.toLowerCase().includes('find')
  ));
  if (byType) return byType;

  // Common search input names
  const byName = elements.find(e => e.tag === 'input' && /q|search|query|keyword/i.test(e.placeholder + e.label));
  if (byName) return byName;

  // Any text input that looks prominent (large, near top)
  const textInputs = elements.filter(e => e.typeable && e.tag === 'input');
  if (textInputs.length > 0) return textInputs[0];

  return null;
}

function findAddToCartButton(elements: PageElement[], target?: string): PageElement | null {
  const cartKeywords = ['add to cart', 'add to bag', 'add to basket', 'buy now', 'add to trolley', 'in den warenkorb', 'ajouter au panier'];

  // Exact match first
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
  let bestScore = 0.3; // minimum threshold

  for (const el of elements) {
    if (!el.clickable) continue;
    const score = fuzzyMatch(target, el.text + ' ' + el.label);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = el;
    }
  }
  return bestMatch;
}

function findLink(elements: PageElement[], target: string): PageElement | null {
  let bestMatch: PageElement | null = null;
  let bestScore = 0.3;

  for (const el of elements) {
    if (el.role !== 'link') continue;
    const score = fuzzyMatch(target, el.text + ' ' + el.href);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = el;
    }
  }
  return bestMatch;
}

// --- Agent Decision Engine ---
// Given a page snapshot and user intent, decides what action to take

export function decideAction(
  intent: VoiceCommand,
  snapshot: PageSnapshot,
  step: number = 0
): AgentAction {
  const { elements, url, title } = snapshot;

  switch (intent.intent) {
    case 'navigate': {
      let targetUrl = intent.target || '';
      // Handle common site names
      const siteMap: Record<string, string> = {
        'google': 'https://www.google.com',
        'amazon': 'https://www.amazon.com',
        'youtube': 'https://www.youtube.com',
        'facebook': 'https://www.facebook.com',
        'twitter': 'https://www.twitter.com',
        'x': 'https://www.x.com',
        'wikipedia': 'https://www.wikipedia.org',
        'reddit': 'https://www.reddit.com',
        'ebay': 'https://www.ebay.com',
        'walmart': 'https://www.walmart.com',
        'target': 'https://www.target.com',
        'best buy': 'https://www.bestbuy.com',
        'netflix': 'https://www.netflix.com',
        'github': 'https://www.github.com',
        'linkedin': 'https://www.linkedin.com',
        'instagram': 'https://www.instagram.com',
      };
      const normalized = targetUrl.toLowerCase().replace(/https?:\/\/(www\.)?/, '').replace(/\.(com|org|net|io)$/, '');
      if (siteMap[normalized]) targetUrl = siteMap[normalized];
      if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

      return {
        action: 'navigate',
        url: targetUrl,
        speak: `Going to ${targetUrl}`,
      };
    }

    case 'search': {
      const query = intent.target || '';
      const searchBox = findSearchBox(elements);

      if (searchBox) {
        if (step === 0) {
          return {
            action: 'type',
            elementId: searchBox.id,
            text: query,
            speak: `Searching for ${query}`,
          };
        } else if (step === 1) {
          return {
            action: 'submit',
            elementId: searchBox.id,
            speak: `Submitting search`,
          };
        }
      }

      // If on Google, navigate to search
      if (url.includes('google.com')) {
        return {
          action: 'navigate',
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          speak: `Searching Google for ${query}`,
        };
      }

      // Navigate to Google search
      return {
        action: 'navigate',
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        speak: `Searching for ${query}`,
      };
    }

    case 'cart': {
      const cartButton = findAddToCartButton(elements);
      if (cartButton) {
        return {
          action: 'click',
          elementId: cartButton.id,
          speak: `Adding to cart`,
        };
      }
      return {
        action: 'speak',
        text: `I couldn't find an add to cart button on this page.`,
      };
    }

    case 'click': {
      const target = intent.target || '';

      // Check for index-based click ("click the 3rd link")
      if (intent.params?.index) {
        const index = parseInt(intent.params.index) - 1;
        const clickable = elements.filter(e => e.clickable);
        if (index >= 0 && index < clickable.length) {
          return {
            action: 'click',
            elementId: clickable[index].id,
            speak: `Clicking ${clickable[index].text || 'element ' + (index + 1)}`,
          };
        }
      }

      // Find by text match
      const button = findButton(elements, target);
      if (button) {
        return {
          action: 'click',
          elementId: button.id,
          speak: `Clicking ${button.text || target}`,
        };
      }

      // Try link match
      const link = findLink(elements, target);
      if (link) {
        return {
          action: 'click',
          elementId: link.id,
          speak: `Clicking ${link.text || target}`,
        };
      }

      // Try Google search for it
      return {
        action: 'navigate',
        url: `https://www.google.com/search?q=${encodeURIComponent(target)}`,
        speak: `I couldn't find "${target}" on this page. Searching Google for it.`,
      };
    }

    case 'read': {
      // Summarize the page content
      const headings = elements
        .filter(e => e.role === 'heading' && e.text)
        .map(e => e.text)
        .slice(0, 5);

      const mainText = snapshot.textContent.substring(0, 500);

      let summary = `This page is: ${title}. `;
      if (headings.length > 0) {
        summary += `Main sections: ${headings.join('. ')}. `;
      }
      if (mainText) {
        summary += mainText;
      }

      return {
        action: 'speak',
        text: summary,
      };
    }

    case 'scroll': {
      const dir = intent.target || 'down';
      return {
        action: 'scroll',
        direction: dir as any,
        speak: `Scrolling ${dir}`,
      };
    }

    case 'back': {
      return {
        action: 'back',
        speak: 'Going back',
      };
    }

    case 'stop': {
      return {
        action: 'done',
        speak: 'Stopping',
      };
    }

    case 'help': {
      return {
        action: 'speak',
        text: `I can help you browse the web. Say things like: go to amazon dot com, search for headphones, click add to cart, read this page, scroll down, or go back. What would you like to do?`,
      };
    }

    default: {
      return {
        action: 'speak',
        text: `I didn't understand that. Try saying: go to a website, search for something, click an element, or say help for more options.`,
      };
    }
  }
}

// --- Multi-step Agent ---
// Handles multi-step operations (search + submit, add to cart flow, etc.)

export type AgentStep = {
  action: AgentAction;
  isComplete: boolean;
  nextStep: number;
};

export function getAgentStep(
  intent: VoiceCommand,
  snapshot: PageSnapshot,
  currentStep: number
): AgentStep {
  const action = decideAction(intent, snapshot, currentStep);

  // Search needs 2 steps: type then submit
  if (intent.intent === 'search' && currentStep === 0 && action.action === 'type') {
    return { action, isComplete: false, nextStep: 1 };
  }

  // Cart might need: find product, then click add to cart
  if (intent.intent === 'cart' && action.action === 'speak' && currentStep === 0) {
    // Try scrolling down to find more content
    return {
      action: { action: 'scroll', direction: 'down', speak: 'Looking for add to cart button...' },
      isComplete: false,
      nextStep: 1,
    };
  }

  return { action, isComplete: true, nextStep: 0 };
}

// --- Page Analysis ---
// Provides natural language descriptions of page state

export function analyzePage(snapshot: PageSnapshot): string {
  const { elements, title, url, textContent } = snapshot;

  const interactive = elements.filter(e => e.clickable);
  const inputs = elements.filter(e => e.typeable);
  const links = elements.filter(e => e.role === 'link');
  const buttons = elements.filter(e => e.role === 'button');

  let analysis = `Page: ${title}. `;

  if (inputs.length > 0) {
    analysis += `${inputs.length} input field${inputs.length > 1 ? 's' : ''} available. `;
  }
  if (buttons.length > 0) {
    const btnNames = buttons.slice(0, 5).map(b => b.text || b.label).filter(Boolean);
    if (btnNames.length > 0) {
      analysis += `Buttons: ${btnNames.join(', ')}. `;
    }
  }
  if (links.length > 0) {
    analysis += `${links.length} links on the page. `;
  }

  return analysis;
}
