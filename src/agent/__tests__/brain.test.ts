import { decideAction, getPageSuggestions, analyzePage } from '../brain';
import type { PageSnapshot, VoiceCommand, AgentContext, PageElement } from '../../browser/types';

const mockElement: PageElement = {
  id: 1, role: 'button', tag: 'button', text: 'Sign In', label: 'Sign In',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { x: 0, y: 0, width: 100, height: 40 },
};

const mockSnapshot: PageSnapshot = {
  url: 'https://example.com', title: 'Example', elements: [mockElement],
  textContent: 'Welcome to Example', scrollY: 0, pageHeight: 1000,
  viewportHeight: 800, timestamp: Date.now(), pageType: 'general',
};

const mockContext: AgentContext = {
  stepHistory: [], retryCount: 0,
};

describe('Brain Decision Engine', () => {
  describe('decideAction()', () => {
    it('returns navigate action for navigate intent', () => {
      const intent: VoiceCommand = { intent: 'navigate', target: 'amazon.com', confidence: 0.9 };
      const { action, needsRetry } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('navigate');
      expect(needsRetry).toBe(false);
    });

    it('returns scroll action for scroll intent', () => {
      const intent: VoiceCommand = { intent: 'scroll', target: 'down', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('scroll');
    });

    it('returns read action for read intent', () => {
      const intent: VoiceCommand = { intent: 'read', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('speak');
    });

    it('returns back action for back intent', () => {
      const intent: VoiceCommand = { intent: 'back', confidence: 0.9 };
      const { action } = decideAction(intent, mockSnapshot, mockContext);
      expect(action.action).toBe('back');
    });
  });

  describe('getPageSuggestions()', () => {
    it('returns suggestions for shopping pages', () => {
      const snapshot: PageSnapshot = { ...mockSnapshot, pageType: 'shopping' };
      const suggestions = getPageSuggestions(snapshot);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('returns suggestions for search pages', () => {
      const snapshot: PageSnapshot = { ...mockSnapshot, pageType: 'search_results' };
      const suggestions = getPageSuggestions(snapshot);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('returns default suggestions for unknown pages', () => {
      const suggestions = getPageSuggestions(mockSnapshot);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('analyzePage()', () => {
    it('returns descriptive string', () => {
      const analysis = analyzePage(mockSnapshot);
      expect(typeof analysis).toBe('string');
      expect(analysis.length).toBeGreaterThan(0);
    });
  });
});
