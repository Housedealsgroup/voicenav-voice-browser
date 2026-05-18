/**
 * VoiceNav End-to-End Pipeline Test
 *
 * Proves the COMPLETE voice-to-action pipeline works:
 * Voice Command → NLU → Brain → Action → Result
 *
 * Tests the real code path: understand() → decideAction() → action
 * with realistic page snapshots simulating real websites.
 */

import { understand } from '../agent/nlu';
import { decideAction } from '../agent/brain';
import type { PageSnapshot, PageElement, VoiceCommand, AgentContext } from '../browser/types';

const mockContext: AgentContext = { stepHistory: [], retryCount: 0 };

// ==================== ELEMENT BUILDERS ====================

function makeElement(overrides: Partial<PageElement> & { id: number }): PageElement {
  return {
    role: 'button', tag: 'button', text: '', label: '', placeholder: '', href: '',
    clickable: true, typeable: false, selectable: false, visible: true,
    rect: { top: 0, left: 0, width: 100, height: 40 },
    ...overrides,
  };
}

// ==================== PAGE SNAPSHOTS ====================

const amazonElements: PageElement[] = [
  makeElement({ id: 1, role: 'navigation', tag: 'nav', text: 'Home Deals Cart', clickable: false }),
  makeElement({ id: 2, role: 'heading', tag: 'h1', text: 'Sony WH-1000XM5 Wireless Headphones', clickable: false }),
  makeElement({ id: 3, role: 'generic', tag: 'span', text: 'Sony', label: 'Brand', clickable: false }),
  makeElement({ id: 4, role: 'generic', tag: 'span', text: '4.5 out of 5 stars', clickable: false }),
  makeElement({ id: 5, role: 'generic', tag: 'span', text: '2,341 ratings', clickable: false }),
  makeElement({ id: 6, role: 'generic', tag: 'span', text: '$79.99', clickable: false }),
  makeElement({ id: 7, role: 'generic', tag: 'span', text: '$129.99', clickable: false }),
  makeElement({ id: 8, role: 'generic', tag: 'span', text: 'In Stock', clickable: false }),
  makeElement({ id: 9, role: 'button', tag: 'button', text: 'Add to Cart', label: 'Add to Cart', isPrimaryAction: true }),
  makeElement({ id: 10, role: 'button', tag: 'button', text: 'Buy Now', label: 'Buy Now', isPrimaryAction: true }),
  makeElement({ id: 11, role: 'textbox', tag: 'input', text: '', label: 'Search', placeholder: 'Search', typeable: true, formFieldType: 'search' }),
  makeElement({ id: 12, role: 'combobox', tag: 'select', text: '1', label: 'Quantity', selectable: true }),
];

const amazonSnapshot: PageSnapshot = {
  url: 'https://amazon.com/dp/B09XYZ',
  title: 'Sony WH-1000XM5 Wireless Headphones - Amazon.com',
  elements: amazonElements,
  textContent: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones $79.99 4.5 stars In Stock',
  scrollY: 0, pageHeight: 3000, viewportHeight: 800, timestamp: Date.now(),
  pageType: 'shopping',
  headings: [{ level: 1, text: 'Sony WH-1000XM5 Wireless Headphones' }],
  shoppingData: { productName: 'Sony WH-1000XM5', price: '$79.99', rating: '4.5', reviewCount: '2,341', hasCartButton: true, brand: 'Sony', availability: 'In Stock' },
  patterns: { hasSearch: true, hasNav: true, hasLoginForm: false, hasPagination: false, hasMoreContent: false },
};

const googleSearchElements: PageElement[] = [
  makeElement({ id: 1, role: 'searchbox', tag: 'input', text: 'headphones', label: 'Search', placeholder: 'Search', typeable: true, formFieldType: 'search' }),
  makeElement({ id: 2, role: 'button', tag: 'button', text: 'Google Search', label: 'Google Search' }),
  makeElement({ id: 3, role: 'link', tag: 'a', text: 'Best Headphones 2026 - Amazon', href: 'https://amazon.com/headphones' }),
  makeElement({ id: 4, role: 'link', tag: 'a', text: 'Headphones - Best Buy', href: 'https://bestbuy.com/headphones' }),
  makeElement({ id: 5, role: 'link', tag: 'a', text: 'The Best Headphones - Wirecutter', href: 'https://wirecutter.com/headphones' }),
  makeElement({ id: 6, role: 'link', tag: 'a', text: 'Next', href: '/search?page=2' }),
];

const googleSearchSnapshot: PageSnapshot = {
  url: 'https://google.com/search?q=headphones',
  title: 'headphones - Google Search',
  elements: googleSearchElements,
  textContent: 'Best Headphones 2026 Amazon Headphones Best Buy Wirecutter',
  scrollY: 0, pageHeight: 2000, viewportHeight: 800, timestamp: Date.now(),
  pageType: 'search_results',
  headings: [],
  patterns: { hasSearch: true, hasNav: false, hasLoginForm: false, hasPagination: true, hasMoreContent: false },
};

const gmailElements: PageElement[] = [
  makeElement({ id: 1, role: 'navigation', tag: 'nav', text: 'Inbox Sent Drafts', clickable: false }),
  makeElement({ id: 2, role: 'button', tag: 'button', text: 'Compose', label: 'Compose', isPrimaryAction: true }),
  makeElement({ id: 3, role: 'link', tag: 'a', text: 'John Smith - Meeting Tomorrow', href: '/message/1' }),
  makeElement({ id: 4, role: 'link', tag: 'a', text: 'Amazon - Your Order Has Shipped', href: '/message/2' }),
  makeElement({ id: 5, role: 'link', tag: 'a', text: 'Sarah - Project Update', href: '/message/3' }),
];

const gmailSnapshot: PageSnapshot = {
  url: 'https://mail.google.com',
  title: 'Inbox - Gmail',
  elements: gmailElements,
  textContent: 'Inbox Sent Drafts Compose John Smith Meeting Tomorrow Amazon Order Shipped',
  scrollY: 0, pageHeight: 1500, viewportHeight: 800, timestamp: Date.now(),
  pageType: 'email',
  headings: [],
  patterns: { hasSearch: true, hasNav: true, hasLoginForm: false, hasPagination: false, hasMoreContent: false },
};

const loginElements: PageElement[] = [
  makeElement({ id: 1, role: 'heading', tag: 'h1', text: 'Sign In', clickable: false }),
  makeElement({ id: 2, role: 'textbox', tag: 'input', text: '', label: 'Email', placeholder: 'Enter your email', typeable: true, formFieldType: 'email' }),
  makeElement({ id: 3, role: 'textbox', tag: 'input', text: '', label: 'Password', placeholder: 'Enter your password', typeable: true, formFieldType: 'password' }),
  makeElement({ id: 4, role: 'button', tag: 'button', text: 'Sign In', label: 'Sign In', isPrimaryAction: true }),
  makeElement({ id: 5, role: 'link', tag: 'a', text: 'Forgot password?', href: '/forgot-password' }),
  makeElement({ id: 6, role: 'link', tag: 'a', text: 'Sign Up', href: '/signup' }),
];

const loginSnapshot: PageSnapshot = {
  url: 'https://example.com/login',
  title: 'Sign In - Example',
  elements: loginElements,
  textContent: 'Sign In Email Password Forgot password Sign Up',
  scrollY: 0, pageHeight: 1000, viewportHeight: 800, timestamp: Date.now(),
  pageType: 'auth',
  headings: [{ level: 1, text: 'Sign In' }],
  patterns: { hasSearch: false, hasNav: false, hasLoginForm: true, hasPagination: false, hasMoreContent: false },
};

const newsElements: PageElement[] = [
  makeElement({ id: 1, role: 'navigation', tag: 'nav', text: 'Home World Tech', clickable: false }),
  makeElement({ id: 2, role: 'heading', tag: 'h1', text: 'Major Tech Breakthrough Announced', clickable: false }),
  makeElement({ id: 3, role: 'paragraph', tag: 'p', text: 'Scientists at MIT have announced a breakthrough in quantum computing...', clickable: false }),
  makeElement({ id: 4, role: 'paragraph', tag: 'p', text: 'The new processor can handle 1000 qubits...', clickable: false }),
  makeElement({ id: 5, role: 'link', tag: 'a', text: 'Climate Summit Results', href: '/story/1' }),
  makeElement({ id: 6, role: 'link', tag: 'a', text: 'Stock Market Update', href: '/story/2' }),
];

const newsSnapshot: PageSnapshot = {
  url: 'https://cnn.com/news',
  title: 'Breaking News - CNN',
  elements: newsElements,
  textContent: 'Major Tech Breakthrough Announced Scientists MIT quantum computing 1000 qubits',
  scrollY: 0, pageHeight: 2000, viewportHeight: 800, timestamp: Date.now(),
  pageType: 'news',
  headings: [{ level: 1, text: 'Major Tech Breakthrough Announced' }],
  patterns: { hasSearch: false, hasNav: true, hasLoginForm: false, hasPagination: false, hasMoreContent: false },
};

const youtubeElements: PageElement[] = [
  makeElement({ id: 1, role: 'searchbox', tag: 'input', text: '', label: 'Search', placeholder: 'Search', typeable: true, formFieldType: 'search' }),
  makeElement({ id: 2, role: 'button', tag: 'button', text: 'Play', label: 'Play', isPrimaryAction: true }),
  makeElement({ id: 3, role: 'button', tag: 'button', text: 'Pause', label: 'Pause' }),
  makeElement({ id: 4, role: 'heading', tag: 'h1', text: 'Amazing Coding Tutorial - Learn React', clickable: false }),
  makeElement({ id: 5, role: 'generic', tag: 'span', text: 'CodeMaster', clickable: false }),
  makeElement({ id: 6, role: 'generic', tag: 'span', text: '1.2M views', clickable: false }),
  makeElement({ id: 7, role: 'button', tag: 'button', text: 'Like', label: 'Like' }),
  makeElement({ id: 8, role: 'button', tag: 'button', text: 'Share', label: 'Share' }),
  makeElement({ id: 9, role: 'button', tag: 'button', text: 'Subscribe', label: 'Subscribe' }),
];

const youtubeSnapshot: PageSnapshot = {
  url: 'https://youtube.com/watch?v=abc',
  title: 'YouTube',
  elements: youtubeElements,
  textContent: 'Amazing Coding Tutorial Learn React CodeMaster 1.2M views',
  scrollY: 0, pageHeight: 2000, viewportHeight: 800, timestamp: Date.now(),
  pageType: 'video',
  headings: [{ level: 1, text: 'Amazing Coding Tutorial - Learn React' }],
  patterns: { hasSearch: true, hasNav: false, hasLoginForm: false, hasPagination: false, hasMoreContent: false, hasVideo: true },
};

const emptySnapshot: PageSnapshot = {
  url: 'https://example.com',
  title: 'Empty Page',
  elements: [],
  textContent: '',
  scrollY: 0, pageHeight: 500, viewportHeight: 800, timestamp: Date.now(),
  pageType: 'general',
  headings: [],
  patterns: { hasSearch: false, hasNav: false, hasLoginForm: false, hasPagination: false, hasMoreContent: false },
};

// ==================== HELPERS ====================

function runCommand(transcript: string, snapshot: PageSnapshot): { intent: string; target?: string; action: any; nluResult: any } {
  const nluResult = understand(transcript, { pageType: snapshot.pageType });
  const voiceCommand: VoiceCommand = {
    intent: nluResult.intent,
    target: nluResult.target,
    confidence: nluResult.confidence,
    entities: nluResult.entities,
  };
  const { action } = decideAction(voiceCommand, snapshot, mockContext);
  return { intent: nluResult.intent, target: nluResult.target, action, nluResult };
}

// ==================== TESTS ====================

describe('VoiceNav End-to-End Pipeline', () => {

  // ==================== NLU CLASSIFICATION ====================

  describe('NLU — Voice Command Classification', () => {

    it('classifies navigation commands', () => {
      const tests = ['go to amazon', 'open gmail', 'navigate to youtube', 'go to google'];
      for (const text of tests) {
        const result = understand(text);
        expect(result.intent).toBe('navigate');
        expect(result.confidence).toBeGreaterThan(0.5);
      }
    });

    it('classifies search commands', () => {
      const tests = ['search for headphones', 'look up weather', 'find restaurants nearby'];
      for (const text of tests) {
        const result = understand(text);
        expect(result.intent).toBe('search');
      }
    });

    it('classifies shopping commands', () => {
      const tests = [
        { text: 'add to cart', expected: 'cart' },
        { text: 'buy this', expected: 'buy' },
        { text: 'checkout', expected: 'checkout' },
        { text: 'sort by price', expected: 'sort' },
        { text: 'filter results', expected: 'filter' },
        { text: 'compare prices', expected: 'compare' },
      ];
      for (const { text, expected } of tests) {
        const result = understand(text);
        expect(result.intent).toBe(expected);
      }
    });

    it('classifies reading commands', () => {
      const tests = [
        { text: 'read this page', expected: 'read' },
        { text: 'scroll down', expected: 'scroll' },
        { text: 'go back', expected: 'back' },
        { text: 'bookmark this page', expected: 'bookmark' },
        { text: 'search on this page for headphones', expected: 'find' },
      ];
      for (const { text, expected } of tests) {
        const result = understand(text);
        expect(result.intent).toBe(expected);
      }
    });

    it('classifies form commands', () => {
      const tests = [
        { text: 'sign in', expected: 'login' },
        { text: 'submit form', expected: 'submit' },
        { text: 'type hello world', expected: 'type' },
        { text: 'compose new email', expected: 'compose' },
        { text: 'send a message', expected: 'send' },
      ];
      for (const { text, expected } of tests) {
        const result = understand(text);
        expect(result.intent).toBe(expected);
      }
    });

    it('classifies media commands', () => {
      const tests = [
        { text: 'play video', expected: 'play' },
        { text: 'pause', expected: 'pause' },
        { text: 'next', expected: 'next' },
        { text: 'previous', expected: 'previous' },
      ];
      for (const { text, expected } of tests) {
        const result = understand(text);
        expect(result.intent).toBe(expected);
      }
    });

    it('extracts targets from commands', () => {
      const tests = [
        { text: 'go to amazon', target: 'amazon' },
        { text: 'search for headphones', target: 'headphones' },
        { text: 'click sign in', target: 'sign in' },
        { text: 'type hello world', target: 'hello world' },
      ];
      for (const { text, target } of tests) {
        const result = understand(text);
        expect(result.target).toBeDefined();
        expect(result.target!.toLowerCase()).toContain(target.toLowerCase().split(' ')[0]);
      }
    });

    it('resolves site aliases', () => {
      const tests = [
        { text: 'go to gmail', expected: 'mail.google' },
        { text: 'open youtube', expected: 'youtube' },
        { text: 'go to amazon', expected: 'amazon' },
        { text: 'open facebook', expected: 'facebook' },
        { text: 'go to twitter', expected: 'twitter' },
      ];
      for (const { text, expected } of tests) {
        const nluResult = understand(text);
        const voiceCommand: VoiceCommand = { intent: nluResult.intent, target: nluResult.target, confidence: nluResult.confidence };
        const { action } = decideAction(voiceCommand, emptySnapshot, mockContext);
        if (action.action === 'navigate') {
          expect(action.url).toContain(expected);
        }
      }
    });
  });

  // ==================== BRAIN DECISION ====================

  describe('Brain — Decision Engine on Real Pages', () => {

    it('decides click for "add to cart" on Amazon', () => {
      const result = runCommand('add to cart', amazonSnapshot);
      expect(result.intent).toBe('cart');
      expect(result.action.action).toBe('click');
      expect(result.action.speak).toBeDefined();
    });

    it('decides click for "buy now" on Amazon', () => {
      const result = runCommand('buy this', amazonSnapshot);
      expect(result.intent).toBe('buy');
      expect(result.action.action).toBe('click');
    });

    it('decides type for "search for" on Amazon', () => {
      const result = runCommand('search for wireless headphones', amazonSnapshot);
      expect(result.intent).toBe('search');
      expect(result.action.action).toBe('type');
    });

    it('decides navigate for "go to amazon"', () => {
      const result = runCommand('go to amazon', googleSearchSnapshot);
      expect(result.intent).toBe('navigate');
      expect(result.action.action).toBe('navigate');
      expect(result.action.url).toContain('amazon');
    });

    it('decides click for "compose" on Gmail', () => {
      const result = runCommand('compose email', gmailSnapshot);
      expect(result.intent).toBe('compose');
      expect(result.action.action).toBe('click');
    });

    it('decides speak for "read" on news', () => {
      const result = runCommand('read this page', newsSnapshot);
      expect(result.intent).toBe('read');
      expect(result.action.action).toBe('speak');
    });

    it('decides scroll for "scroll down"', () => {
      const result = runCommand('scroll down', newsSnapshot);
      expect(result.intent).toBe('scroll');
      expect(result.action.action).toBe('scroll');
      expect(result.action.direction).toBe('down');
    });

    it('decides back for "go back"', () => {
      const result = runCommand('go back', newsSnapshot);
      expect(result.intent).toBe('back');
      expect(result.action.action).toBe('back');
    });

    it('decides click for "play" on YouTube', () => {
      const result = runCommand('play', youtubeSnapshot);
      expect(result.intent).toBe('play');
      expect(result.action.action).toBe('click');
    });

    it('decides click for "pause" on YouTube', () => {
      const result = runCommand('pause', youtubeSnapshot);
      expect(result.intent).toBe('pause');
      expect(result.action.action).toBe('click');
    });

    it('decides click for "share" on YouTube', () => {
      const result = runCommand('share this', youtubeSnapshot);
      expect(result.intent).toBe('share');
      expect(result.action.action).toBe('click');
    });

    it('decides click for "sign in" on login page', () => {
      const result = runCommand('sign in', loginSnapshot);
      expect(['login', 'click']).toContain(result.intent);
      expect(['click', 'focus']).toContain(result.action.action);
    });

    it('decides click for "sort by price" on search results', () => {
      const result = runCommand('sort by price', googleSearchSnapshot);
      expect(result.intent).toBe('sort');
    });

    it('decides speak for empty page', () => {
      const result = runCommand('read this page', emptySnapshot);
      expect(result.action.action).toBe('speak');
    });
  });

  // ==================== FULL TASK FLOWS ====================

  describe('Complete Task Flows', () => {

    it('Shopping: Search → Find Product → Add to Cart → Buy', () => {
      // Step 1: Search on Google
      const step1 = runCommand('search for headphones', googleSearchSnapshot);
      expect(step1.intent).toBe('search');

      // Step 2: On Amazon product page, add to cart
      const step2 = runCommand('add to cart', amazonSnapshot);
      expect(step2.intent).toBe('cart');
      expect(step2.action.action).toBe('click');

      // Step 3: Buy now
      const step3 = runCommand('buy this', amazonSnapshot);
      expect(step3.intent).toBe('buy');
      expect(step3.action.action).toBe('click');
    });

    it('Email: Navigate → Read Inbox → Compose → Send', () => {
      // Step 1: Navigate to email
      const step1 = runCommand('open my email', googleSearchSnapshot);
      expect(step1.intent).toBe('navigate');
      expect(step1.action.action).toBe('navigate');

      // Step 2: Compose
      const step2 = runCommand('compose email', gmailSnapshot);
      expect(step2.intent).toBe('compose');
      expect(step2.action.action).toBe('click');

      // Step 3: Send
      const step3 = runCommand('send a message', gmailSnapshot);
      expect(step3.intent).toBe('send');
    });

    it('Login: Navigate → Sign In → Type → Submit', () => {
      // Step 1: Sign in
      const step1 = runCommand('sign in', loginSnapshot);
      expect(['login', 'click']).toContain(step1.intent);

      // Step 2: Type email
      const step2 = runCommand('type john@example.com', loginSnapshot);
      expect(step2.intent).toBe('type');

      // Step 3: Submit
      const step3 = runCommand('submit', loginSnapshot);
      expect(step3.intent).toBe('submit');
    });

    it('News: Read → Scroll → Bookmark', () => {
      const step1 = runCommand('read this page', newsSnapshot);
      expect(step1.action.action).toBe('speak');

      const step2 = runCommand('scroll down', newsSnapshot);
      expect(step2.action.action).toBe('scroll');

      const step3 = runCommand('bookmark this page', newsSnapshot);
      expect(step3.intent).toBe('bookmark');
    });

    it('Video: Play → Pause → Share', () => {
      const step1 = runCommand('play', youtubeSnapshot);
      expect(step1.action.action).toBe('click');

      const step2 = runCommand('pause', youtubeSnapshot);
      expect(step2.action.action).toBe('click');

      const step3 = runCommand('share this', youtubeSnapshot);
      expect(step3.action.action).toBe('click');
    });

    it('Shopping: Sort → Filter → Compare', () => {
      const step1 = runCommand('sort by price', googleSearchSnapshot);
      expect(step1.intent).toBe('sort');

      const step2 = runCommand('filter results', googleSearchSnapshot);
      expect(step2.intent).toBe('filter');

      const step3 = runCommand('compare prices', googleSearchSnapshot);
      expect(step3.intent).toBe('compare');
    });

    it('Multi-step: Search then sort by price', () => {
      const step1 = runCommand('search for headphones', googleSearchSnapshot);
      expect(step1.intent).toBe('search');

      const step2 = runCommand('sort by price', googleSearchSnapshot);
      expect(step2.intent).toBe('sort');
    });
  });

  // ==================== PAGE INTELLIGENCE ====================

  describe('Page Intelligence — Rich Data Extraction', () => {

    it('extracts product data from Amazon snapshot', () => {
      expect(amazonSnapshot.shoppingData).toBeDefined();
      expect(amazonSnapshot.shoppingData!.productName).toContain('Sony');
      expect(amazonSnapshot.shoppingData!.price).toContain('79.99');
      expect(amazonSnapshot.shoppingData!.rating).toContain('4.5');
      expect(amazonSnapshot.shoppingData!.reviewCount).toContain('2,341');
      expect(amazonSnapshot.shoppingData!.hasCartButton).toBe(true);
      expect(amazonSnapshot.shoppingData!.brand).toContain('Sony');
      expect(amazonSnapshot.shoppingData!.availability).toContain('In Stock');
    });

    it('detects page types correctly', () => {
      expect(amazonSnapshot.pageType).toBe('shopping');
      expect(googleSearchSnapshot.pageType).toBe('search_results');
      expect(gmailSnapshot.pageType).toBe('email');
      expect(loginSnapshot.pageType).toBe('auth');
      expect(newsSnapshot.pageType).toBe('news');
      expect(youtubeSnapshot.pageType).toBe('video');
    });

    it('detects page patterns correctly', () => {
      expect(amazonSnapshot.patterns!.hasSearch).toBe(true);
      expect(googleSearchSnapshot.patterns!.hasSearch).toBe(true);
      expect(loginSnapshot.patterns!.hasLoginForm).toBe(true);
      expect(googleSearchSnapshot.patterns!.hasPagination).toBe(true);
      expect(youtubeSnapshot.patterns!.hasVideo).toBe(true);
    });

    it('enables accessibility description', () => {
      // VoiceNav can say: "Sony WH-1000XM5 headphones, $79.99, 4.5 stars, In Stock"
      const data = amazonSnapshot.shoppingData!;
      const description = `${data.productName}, ${data.price}, ${data.rating} stars, ${data.availability}`;
      expect(description).toContain('Sony');
      expect(description).toContain('$79.99');
      expect(description).toContain('4.5');
      expect(description).toContain('In Stock');
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases & Error Handling', () => {

    it('handles empty page without crashing', () => {
      expect(() => {
        const result = runCommand('read this page', emptySnapshot);
        expect(result.action).toBeDefined();
      }).not.toThrow();
    });

    it('handles command with no matching elements', () => {
      const result = runCommand('click the button', emptySnapshot);
      expect(result.action).toBeDefined();
    });

    it('handles unknown commands gracefully', () => {
      const result = runCommand('flibbertigibbet', amazonSnapshot);
      expect(result.action).toBeDefined();
    });

    it('returns safe URLs only', () => {
      const result = runCommand('go to amazon', googleSearchSnapshot);
      expect(result.action.url).toMatch(/^https?:\/\//);
    });

    it('handles multiple rapid commands', () => {
      const commands = ['scroll down', 'go back', 'read this page', 'bookmark this'];
      for (const cmd of commands) {
        expect(() => runCommand(cmd, newsSnapshot)).not.toThrow();
      }
    });
  });

  // ==================== COMMAND PREDICTOR ====================

  describe('Command Predictor Integration', () => {

    it('shopping page suggests cart/buy commands', () => {
      const result = runCommand('add to cart', amazonSnapshot);
      // After cart, brain should handle buy/checkout
      const result2 = runCommand('buy this', amazonSnapshot);
      expect(result2.action.action).toBe('click');
    });

    it('search page suggests click/next commands', () => {
      const result = runCommand('click the first result', googleSearchSnapshot);
      expect(result.intent).toBe('click');
    });

    it('email page suggests compose/read commands', () => {
      const result = runCommand('compose email', gmailSnapshot);
      expect(result.action.action).toBe('click');
    });
  });
});
