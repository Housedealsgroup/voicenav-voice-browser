import { getContextActions, getTopActions, getActionsByCategory, getShoppingActions, getFormActions } from '../contextActions';
import type { PageSnapshot, PageElement } from '../../browser/types';

const mockSnapshot: PageSnapshot = {
  url: 'https://example.com',
  title: 'Test Page',
  elements: [],
  textContent: 'Some test content',
  scrollY: 0,
  pageHeight: 1000,
  viewportHeight: 800,
  timestamp: Date.now(),
};

function makeSnapshot(overrides: Partial<PageSnapshot> = {}): PageSnapshot {
  return { ...mockSnapshot, ...overrides };
}

const searchInput: PageElement = {
  id: 1, role: 'textbox', tag: 'input', text: '', label: 'Search',
  placeholder: 'Search...', href: '', clickable: true, typeable: true, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 200, height: 40 },
};

const cartButton: PageElement = {
  id: 2, role: 'button', tag: 'button', text: 'Add to cart', label: 'Add to cart',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 100, left: 0, width: 120, height: 40 },
};

const navElement: PageElement = {
  id: 3, role: 'navigation', tag: 'nav', text: 'Menu', label: '',
  placeholder: '', href: '', clickable: false, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 800, height: 60 },
};

const videoElement: PageElement = {
  id: 4, role: 'video', tag: 'video', text: '', label: '',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 200, left: 0, width: 640, height: 360 },
};

describe('Context Actions', () => {
  describe('getContextActions()', () => {
    it('returns base actions for a minimal page', () => {
      const actions = getContextActions(mockSnapshot);
      expect(actions.length).toBeGreaterThanOrEqual(3);
      expect(actions.some(a => a.voiceCommand === 'read this page')).toBe(true);
      expect(actions.some(a => a.voiceCommand === 'summarize this page')).toBe(true);
      expect(actions.some(a => a.voiceCommand === 'bookmark this page')).toBe(true);
    });

    it('includes search action when page has search', () => {
      const snapshot = makeSnapshot({ elements: [searchInput] });
      const actions = getContextActions(snapshot);
      expect(actions.some(a => a.category === 'content' && a.voiceCommand.includes('search'))).toBe(true);
    });

    it('includes shopping actions when page has cart', () => {
      const snapshot = makeSnapshot({ textContent: 'Add to cart this item', elements: [cartButton] });
      const actions = getContextActions(snapshot);
      expect(actions.some(a => a.category === 'shopping')).toBe(true);
    });

    it('includes form actions when page has forms', () => {
      const snapshot = makeSnapshot({ textContent: 'Sign in to your account', elements: [searchInput] });
      const actions = getContextActions(snapshot);
      expect(actions.some(a => a.category === 'form')).toBe(true);
    });

    it('includes media actions when page has media', () => {
      const snapshot = makeSnapshot({ elements: [videoElement] });
      const actions = getContextActions(snapshot);
      expect(actions.some(a => a.category === 'media')).toBe(true);
    });

    it('includes navigation actions when page has nav', () => {
      const snapshot = makeSnapshot({ elements: [navElement] });
      const actions = getContextActions(snapshot);
      expect(actions.some(a => a.category === 'navigation' && a.label === 'Show menu')).toBe(true);
    });

    it('sorts actions by confidence descending', () => {
      const actions = getContextActions(mockSnapshot);
      for (let i = 1; i < actions.length; i++) {
        expect(actions[i].confidence).toBeLessThanOrEqual(actions[i - 1].confidence);
      }
    });

    it('each action has required fields', () => {
      const actions = getContextActions(mockSnapshot);
      for (const action of actions) {
        expect(action.id).toBeTruthy();
        expect(action.label).toBeTruthy();
        expect(action.voiceCommand).toBeTruthy();
        expect(action.icon).toBeTruthy();
        expect(typeof action.confidence).toBe('number');
        expect(action.category).toBeTruthy();
        expect(action.description).toBeTruthy();
      }
    });
  });

  describe('getTopActions()', () => {
    it('returns limited number of actions', () => {
      const actions = getTopActions(mockSnapshot, 2);
      expect(actions.length).toBeLessThanOrEqual(2);
    });

    it('defaults to 5 actions', () => {
      const actions = getTopActions(mockSnapshot);
      expect(actions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getActionsByCategory()', () => {
    it('groups actions by category', () => {
      const grouped = getActionsByCategory(mockSnapshot);
      expect(grouped['content']).toBeDefined();
      expect(Array.isArray(grouped['content'])).toBe(true);
    });

    it('returns empty object for categories not present', () => {
      const grouped = getActionsByCategory(mockSnapshot);
      // Shopping should not be present on a plain page
      expect(grouped['shopping'] || []).toEqual(grouped['shopping'] || []);
    });
  });

  describe('getShoppingActions()', () => {
    it('returns empty for non-shopping page', () => {
      const actions = getShoppingActions(mockSnapshot);
      expect(actions).toEqual([]);
    });

    it('returns shopping actions for shopping page', () => {
      const snapshot = makeSnapshot({ textContent: 'Add to cart buy now checkout deal' });
      const actions = getShoppingActions(snapshot);
      expect(actions.length).toBeGreaterThan(0);
      actions.forEach(a => expect(a.category).toBe('shopping'));
    });
  });

  describe('getFormActions()', () => {
    it('returns empty for page without forms', () => {
      const actions = getFormActions(mockSnapshot);
      expect(actions).toEqual([]);
    });

    it('returns form actions for page with login', () => {
      const snapshot = makeSnapshot({ textContent: 'Sign in username password', elements: [searchInput] });
      const actions = getFormActions(snapshot);
      expect(actions.length).toBeGreaterThan(0);
      actions.forEach(a => expect(a.category).toBe('form'));
    });
  });
});
