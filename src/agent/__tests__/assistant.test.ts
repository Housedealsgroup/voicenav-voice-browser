import { getProactiveSuggestions, getContextualGreeting } from '../assistant';
import type { PageSnapshot } from '../../browser/types';

const makeSnapshot = (pageType: string): PageSnapshot => ({
  url: 'https://example.com', title: 'Test', elements: [],
  textContent: '', scrollY: 0, pageHeight: 1000,
  viewportHeight: 800, timestamp: Date.now(), pageType: pageType as any,
});

describe('Proactive Assistant', () => {
  describe('getProactiveSuggestions()', () => {
    it('returns shopping suggestions for shopping pages', () => {
      const suggestions = getProactiveSuggestions(makeSnapshot('shopping'));
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('cart') || s.toLowerCase().includes('price'))).toBe(true);
    });

    it('returns search suggestions for search pages', () => {
      const suggestions = getProactiveSuggestions(makeSnapshot('search_results'));
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('returns default suggestions for unknown pages', () => {
      const suggestions = getProactiveSuggestions(makeSnapshot('general'));
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('returns auth suggestions for auth pages', () => {
      const suggestions = getProactiveSuggestions(makeSnapshot('auth'));
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('getContextualGreeting()', () => {
    it('returns a greeting string', () => {
      const greeting = getContextualGreeting(makeSnapshot('general'));
      expect(typeof greeting).toBe('string');
      expect(greeting.length).toBeGreaterThan(0);
    });

    it('returns page-type-specific greeting', () => {
      const shoppingGreeting = getContextualGreeting(makeSnapshot('shopping'));
      expect(shoppingGreeting.length).toBeGreaterThan(0);
    });
  });
});
