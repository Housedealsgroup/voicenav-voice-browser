// VoiceNav Agent Brain v4 — NLU-powered intent parsing with context-aware decision making
// Integrates NLU engine, session memory, and task engine for supercomputer-level navigation

import {
  PageSnapshot, AgentAction, PageElement, VoiceCommand,
  AgentContext, PageType
} from '../browser/types';
import { understand, resolveSiteAlias, NLUResult, Intent } from './nlu';
import { getSession, getContextForNLU, updateEntityMemory, resolveReference } from './sessionMemory';
import { logger } from '../utils/logger';

// Re-export NLU for direct access
export { understand, resolveSiteAlias } from './nlu';
export { hasMultipleSteps, parseMultiStepCommand } from './taskEngine';

// --- Element Matching (enhanced with relevance scoring) ---

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
  const cartKeywords = ['add to cart', 'add to bag', 'add to basket', 'buy now', 'add to trolley', 'add to cart button'];
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

function findByIndex(elements: PageElement[], index: number, clickable: boolean = true): PageElement | null {
  const filtered = clickable ? elements.filter(e => e.clickable) : elements;
  const idx = index - 1; // 1-based to 0-based
  if (idx >= 0 && idx < filtered.length) return filtered[idx];
  if (index === -1) return filtered[filtered.length - 1]; // "last"
  return null;
}

// --- Context-Aware Suggestions (enhanced) ---

export function getPageSuggestions(snapshot: PageSnapshot): string[] {
  const suggestions: string[] = [];
  const { pageType, patterns, shoppingData, elements } = snapshot;

  if (patterns?.hasSearch) suggestions.push('Search for something');
  if (pageType === 'shopping' || pageType === 'product_listing') {
    if (shoppingData?.hasCartButton) suggestions.push('Add to cart');
    suggestions.push('Sort by price');
    suggestions.push('Filter results');
    suggestions.push('Compare prices');
  }
  if (pageType === 'search_results') {
    suggestions.push('Click the first result');
    suggestions.push('Refine search');
    suggestions.push('Read results');
  }
  if (pageType === 'auth') {
    suggestions.push('Sign in');
    suggestions.push('Create account');
  }
  if (patterns?.hasLoginForm) suggestions.push('Fill in the form');
  if (patterns?.hasPagination) suggestions.push('Next page');
  if (pageType === 'news' || pageType === 'reference') {
    suggestions.push('Read this page');
    suggestions.push('Summarize');
  }
  if (pageType === 'email') {
    suggestions.push('Read latest email');
    suggestions.push('Compose new email');
  }
  if (pageType === 'video') {
    suggestions.push('Play video');
    suggestions.push('Read description');
  }

  const headings = snapshot.headings?.slice(0, 3).map(h => h.text) || [];
  if (headings.length > 0) {
    suggestions.push(`Click "${headings[0]}"`);
  }

  return suggestions.slice(0, 6);
}

// --- NLU-Powered Intent Parsing ---

export function parseVoiceCommand(transcript: string, context?: AgentContext): VoiceCommand {
  const nluContext = getContextForNLU();
  const result = understand(transcript, nluContext);

  // Handle ambiguous results
  if (result.isAmbiguous && result.confidence < 0.7) {
    // Prefer the intent that matches page context
    const pageType = nluContext.pageType;
    if (pageType === 'shopping' && result.alternatives.some(a => a.intent === 'cart')) {
      const cartAlt = result.alternatives.find(a => a.intent === 'cart')!;
      return { intent: 'cart', target: cartAlt.target, confidence: cartAlt.confidence, entities: result.entities };
    }
  }

  // Resolve references using session memory
  let target = result.target;
  if (!target || ['it', 'that', 'this', 'them', 'those', 'that one', 'this one'].includes(target.toLowerCase())) {
    const ref = resolveReference(transcript);
    if (ref) {
      if (ref.type === 'element') target = ref.value.text;
      else if (ref.type === 'link') target = ref.value.text;
      else if (ref.type === 'button') target = ref.value.text;
      else if (ref.type === 'product') target = ref.value.name;
      else if (ref.type === 'search') target = ref.value;
      else if (ref.type === 'index') {
        return {
          intent: result.intent as VoiceCommand['intent'],
          target: String(ref.value),
          params: { index: String(ref.value) },
          confidence: result.confidence,
          entities: result.entities,
        };
      }
    }
  }

  return {
    intent: result.intent as VoiceCommand['intent'],
    target,
    params: result.params,
    confidence: result.confidence,
    entities: result.entities,
  };
}

// --- Agent Decision Engine (enhanced) ---

export function decideAction(
  intent: VoiceCommand,
  snapshot: PageSnapshot,
  context: AgentContext
): { action: AgentAction; needsRetry: boolean } {
  logger.agent('decideAction', { intent: intent.intent, target: intent.target, confidence: intent.confidence });
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

    case 'buy': {
      // Try add to cart first, then checkout
      const cartButton = findAddToCartButton(elements);
      if (cartButton) {
        return {
          action: { action: 'click', elementId: cartButton.id, speak: 'Adding to cart for purchase' },
          needsRetry: false
        };
      }
      const checkoutBtn = findButton(elements, 'checkout') || findButton(elements, 'buy now') || findButton(elements, 'proceed');
      if (checkoutBtn) {
        return {
          action: { action: 'click', elementId: checkoutBtn.id, speak: 'Proceeding to checkout' },
          needsRetry: false
        };
      }
      return {
        action: { action: 'speak', text: 'I could not find a purchase button. Let me search for the item.' },
        needsRetry: false
      };
    }

    case 'checkout': {
      const checkoutBtn = findButton(elements, 'checkout') || findButton(elements, 'proceed to checkout') || findButton(elements, 'place order');
      if (checkoutBtn) {
        return {
          action: { action: 'click', elementId: checkoutBtn.id, speak: 'Proceeding to checkout' },
          needsRetry: false
        };
      }
      return {
        action: { action: 'speak', text: 'I could not find a checkout button on this page.' },
        needsRetry: false
      };
    }

    case 'compare': {
      const query = intent.target || snapshot.shoppingData?.productName || 'product';
      return {
        action: { action: 'navigate', url: `https://www.google.com/search?q=${encodeURIComponent(query + ' price comparison')}`, speak: `Comparing prices for ${query}` },
        needsRetry: false
      };
    }

    case 'sort': {
      const sortBtn = findButton(elements, intent.target || 'sort') || findButton(elements, 'sort by');
      if (sortBtn) {
        return { action: { action: 'click', elementId: sortBtn.id, speak: `Sorting by ${intent.target || 'default'}` }, needsRetry: false };
      }
      return { action: { action: 'speak', text: 'I could not find a sort option on this page.' }, needsRetry: false };
    }

    case 'filter': {
      const filterBtn = findButton(elements, intent.target || 'filter') || findButton(elements, 'refine');
      if (filterBtn) {
        return { action: { action: 'click', elementId: filterBtn.id, speak: 'Filtering results' }, needsRetry: false };
      }
      return { action: { action: 'speak', text: 'I could not find a filter option on this page.' }, needsRetry: false };
    }

    case 'click': {
      const target = intent.target || '';

      // Index-based click
      if (intent.params?.index) {
        const index = parseInt(intent.params.index);
        const el = findByIndex(elements, index);
        if (el) {
          updateEntityMemory({ lastElement: { id: el.id, text: el.text, role: el.role, label: el.label } });
          return {
            action: { action: 'click', elementId: el.id, speak: `Clicking ${el.text || 'element ' + index}` },
            needsRetry: false
          };
        }
      }

      const button = findButton(elements, target);
      if (button) {
        updateEntityMemory({ lastButton: { text: button.text, id: button.id } });
        return { action: { action: 'click', elementId: button.id, speak: `Clicking ${button.text || target}` }, needsRetry: false };
      }

      const link = findLink(elements, target);
      if (link) {
        updateEntityMemory({ lastLink: { href: link.href, text: link.text } });
        return { action: { action: 'click', elementId: link.id, speak: `Clicking ${link.text || target}` }, needsRetry: false };
      }

      const any = findAnyClickable(elements, target);
      if (any) {
        updateEntityMemory({ lastElement: { id: any.id, text: any.text, role: any.role, label: any.label } });
        return { action: { action: 'click', elementId: any.id, speak: `Clicking ${any.text || target}` }, needsRetry: false };
      }

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
        updateEntityMemory({ lastInput: { id: input.id, placeholder: input.placeholder, label: input.label } });
        return { action: { action: 'type', elementId: input.id, text: target, speak: `Typing in ${input.label || input.placeholder || target}` }, needsRetry: false };
      }
      return { action: { action: 'speak', text: `Could not find a field for "${target}".` }, needsRetry: false };
    }

    case 'login': {
      // Find login/sign in button
      const loginBtn = findButton(elements, 'sign in') || findButton(elements, 'log in') || findButton(elements, 'login') || findButton(elements, 'sign in button');
      if (loginBtn) {
        return { action: { action: 'click', elementId: loginBtn.id, speak: 'Clicking sign in' }, needsRetry: false };
      }
      // Find password field as indicator
      const passwordField = elements.find(e => e.typeable && (e.formFieldType === 'password' || e.placeholder.toLowerCase().includes('password')));
      if (passwordField) {
        return { action: { action: 'focus', elementId: passwordField.id, speak: 'Found login form. Please enter your credentials.' }, needsRetry: false };
      }
      return { action: { action: 'speak', text: 'I could not find a login button or form on this page.' }, needsRetry: false };
    }

    case 'signup': {
      const signupBtn = findButton(elements, 'sign up') || findButton(elements, 'create account') || findButton(elements, 'register');
      if (signupBtn) {
        return { action: { action: 'click', elementId: signupBtn.id, speak: 'Clicking sign up' }, needsRetry: false };
      }
      return { action: { action: 'speak', text: 'I could not find a sign up button.' }, needsRetry: false };
    }

    case 'type': {
      const target = intent.target || '';
      const input = findFormInput(elements, target);
      if (input) {
        return { action: { action: 'type', elementId: input.id, text: target, speak: `Typing ${target}` }, needsRetry: false };
      }
      return { action: { action: 'speak', text: `Could not find an input field.` }, needsRetry: false };
    }

    case 'submit': {
      const submitBtn = findButton(elements, 'submit') || findButton(elements, 'send') || findButton(elements, 'go') || findButton(elements, 'apply');
      if (submitBtn) {
        return { action: { action: 'click', elementId: submitBtn.id, speak: 'Submitting' }, needsRetry: false };
      }
      return { action: { action: 'speak', text: 'Could not find a submit button.' }, needsRetry: false };
    }

    case 'select': {
      const target = intent.target || '';
      const selectEl = elements.find(e => e.selectable && fuzzyMatch(target, e.text + ' ' + e.label) > 0.3);
      if (selectEl) {
        return { action: { action: 'select', elementId: selectEl.id, value: target, speak: `Selecting ${target}` }, needsRetry: false };
      }
      return { action: { action: 'speak', text: `Could find a dropdown for "${target}".` }, needsRetry: false };
    }

    case 'read': {
      const headings = snapshot.headings?.slice(0, 5).map(h => h.text) || [];
      const inputs = elements.filter(e => e.typeable);
      const buttons = elements.filter(e => e.clickable && e.role === 'button');
      const links = elements.filter(e => e.role === 'link');
      const mainText = snapshot.textContent.substring(0, 600);

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
        if (sd.brand) summary += `Brand: ${sd.brand}. `;
        if (sd.availability) summary += `Availability: ${sd.availability}. `;
      }
      if (snapshot.patterns?.hasSearch) summary += 'There is a search bar. ';
      if (snapshot.patterns?.hasLoginForm) summary += 'There is a login form. ';
      if (snapshot.patterns?.hasPagination) summary += 'There are more pages. ';
      if (inputs.length > 0) summary += `${inputs.length} input fields. `;
      if (buttons.length > 0) {
        const btnNames = buttons.slice(0, 5).map(b => b.text || b.label).filter(Boolean);
        if (btnNames.length > 0) summary += `Buttons: ${btnNames.join(', ')}. `;
      }
      if (links.length > 0) summary += `${links.length} links. `;
      if (mainText) summary += mainText;

      return { action: { action: 'speak', text: summary }, needsRetry: false };
    }

    case 'find': {
      const query = intent.target || '';
      return {
        action: { action: 'keypress', key: 'ctrl+f', speak: `Finding "${query}" on page` },
        needsRetry: false
      };
    }

    case 'scroll': {
      const dir = intent.target || 'down';
      return { action: { action: 'scroll', direction: dir as any, speak: `Scrolling ${dir}` }, needsRetry: false };
    }

    case 'back': {
      return { action: { action: 'back', speak: 'Going back' }, needsRetry: false };
    }

    case 'forward': {
      return { action: { action: 'forward', speak: 'Going forward' }, needsRetry: false };
    }

    case 'refresh': {
      return { action: { action: 'refresh', speak: 'Refreshing page' }, needsRetry: false };
    }

    case 'bookmark': {
      return { action: { action: 'speak', text: intent.target === 'remove' ? 'Removing bookmark.' : 'Bookmark saved.' }, needsRetry: false };
    }

    case 'play': {
      const playBtn = findButton(elements, 'play') || elements.find(e => e.clickable && /play/i.test(e.text + e.label));
      if (playBtn) {
        return { action: { action: 'click', elementId: playBtn.id, speak: 'Playing' }, needsRetry: false };
      }
      return { action: { action: 'speak', text: 'Could not find a play button.' }, needsRetry: false };
    }

    case 'pause': {
      const pauseBtn = findButton(elements, 'pause') || elements.find(e => e.clickable && /pause/i.test(e.text + e.label));
      if (pauseBtn) {
        return { action: { action: 'click', elementId: pauseBtn.id, speak: 'Paused' }, needsRetry: false };
      }
      return { action: { action: 'speak', text: 'Could not find a pause button.' }, needsRetry: false };
    }

    case 'next': {
      const nextBtn = findButton(elements, 'next') || findLink(elements, 'next');
      if (nextBtn) {
        return { action: { action: 'click', elementId: nextBtn.id, speak: 'Going to next' }, needsRetry: false };
      }
      return { action: { action: 'scroll', direction: 'down', speak: 'Scrolling to next section' }, needsRetry: false };
    }

    case 'previous': {
      const prevBtn = findButton(elements, 'previous') || findButton(elements, 'prev') || findLink(elements, 'previous');
      if (prevBtn) {
        return { action: { action: 'click', elementId: prevBtn.id, speak: 'Going to previous' }, needsRetry: false };
      }
      return { action: { action: 'scroll', direction: 'up', speak: 'Scrolling up' }, needsRetry: false };
    }

    case 'zoom': {
      const dir = intent.target || 'in';
      return { action: { action: 'speak', text: `Zooming ${dir}` }, needsRetry: false };
    }

    case 'share': {
      const shareBtn = findButton(elements, 'share');
      if (shareBtn) {
        return { action: { action: 'click', elementId: shareBtn.id, speak: 'Opening share dialog' }, needsRetry: false };
      }
      return { action: { action: 'speak', text: 'Could not find a share button.' }, needsRetry: false };
    }

    case 'download': {
      const downloadBtn = findButton(elements, 'download') || elements.find(e => e.clickable && /download/i.test(e.text + e.label));
      if (downloadBtn) {
        return { action: { action: 'click', elementId: downloadBtn.id, speak: 'Downloading' }, needsRetry: false };
      }
      return { action: { action: 'speak', text: 'Could not find a download button.' }, needsRetry: false };
    }

    case 'copy': {
      return { action: { action: 'speak', text: 'Copied to clipboard.' }, needsRetry: false };
    }

    case 'compose': {
      const composeBtn = findButton(elements, 'compose') || findButton(elements, 'new') || findButton(elements, 'write');
      if (composeBtn) {
        return { action: { action: 'click', elementId: composeBtn.id, speak: 'Opening compose' }, needsRetry: false };
      }
      return { action: { action: 'speak', text: 'Could not find a compose button.' }, needsRetry: false };
    }

    case 'send': {
      const sendBtn = findButton(elements, 'send') || findButton(elements, 'submit');
      if (sendBtn) {
        return { action: { action: 'click', elementId: sendBtn.id, speak: 'Sending' }, needsRetry: false };
      }
      return { action: { action: 'speak', text: 'Could not find a send button.' }, needsRetry: false };
    }

    case 'delete': {
      const deleteBtn = findButton(elements, 'delete') || findButton(elements, 'remove') || findButton(elements, 'trash');
      if (deleteBtn) {
        return { action: { action: 'click', elementId: deleteBtn.id, speak: 'Deleting' }, needsRetry: false };
      }
      return { action: { action: 'speak', text: 'Could not find a delete button.' }, needsRetry: false };
    }

    case 'open': {
      const target = intent.target || '';
      if (target) {
        let url = resolveSiteAlias(target);
        if (!url.startsWith('http')) url = 'https://' + url;
        return { action: { action: 'navigate', url, speak: `Opening ${target}` }, needsRetry: false };
      }
      return { action: { action: 'speak', text: 'What would you like to open?' }, needsRetry: false };
    }

    case 'tab_new': {
      return { action: { action: 'speak', text: 'Opening new tab' }, needsRetry: false };
    }

    case 'tab_close': {
      return { action: { action: 'speak', text: 'Closing tab' }, needsRetry: false };
    }

    case 'stop': {
      return { action: { action: 'done', speak: 'Stopping' }, needsRetry: false };
    }

    case 'home': {
      return { action: { action: 'navigate', url: 'https://www.google.com', speak: 'Going home' }, needsRetry: false };
    }

    case 'help': {
      return {
        action: { action: 'speak', text: 'You can say: go to a website, search for something, click an element, read this page, scroll up or down, bookmark this page, add to cart, buy something, compare prices, sort by price, filter results, fill a form, sign in, play media, go back, and much more. You can chain commands with "then".' },
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

  // Buy might need multiple steps
  if (intent.intent === 'buy' && action.action === 'click' && context.stepHistory.length === 0) {
    return { action, isComplete: false, nextStep: 1, needsRetry: false };
  }

  return { action, isComplete: true, nextStep: 0, needsRetry };
}

// --- Page Analysis (enhanced) ---

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
    if (shoppingData.brand) analysis += `Brand: ${shoppingData.brand}. `;
    if (shoppingData.availability) analysis += `Availability: ${shoppingData.availability}. `;
    if (shoppingData.shipping) analysis += `Shipping: ${shoppingData.shipping}. `;
  }

  if (patterns) {
    if (patterns.hasSearch) analysis += 'There is a search bar. ';
    if (patterns.hasLoginForm) analysis += 'There is a login form. ';
    if (patterns.hasPagination) analysis += 'There are more pages. ';
    if (patterns.hasVideo) analysis += 'There is a video on this page. ';
    if (patterns.hasTable) analysis += 'There is data in table format. ';
  }

  if (inputs.length > 0) analysis += `${inputs.length} input fields. `;
  if (buttons.length > 0) {
    const btnNames = buttons.slice(0, 5).map(b => b.text || b.label).filter(Boolean);
    if (btnNames.length > 0) analysis += `Buttons: ${btnNames.join(', ')}. `;
  }
  if (links.length > 0) analysis += `${links.length} links on the page. `;

  const snippet = snapshot.textContent.substring(0, 400).trim();
  if (snippet) analysis += snippet;

  return analysis;
}
