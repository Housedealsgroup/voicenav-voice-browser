import {
  recordNavigation, goBack, goForward, predictNextUrls, findPath,
  getNavigationStats, getMostVisited, clearNavigationGraph,
  getBackStack, getForwardStack, getNavigationGraph,
} from '../smartNav';

describe('Smart Navigation', () => {
  beforeEach(() => {
    clearNavigationGraph();
  });

  describe('recordNavigation()', () => {
    it('records a navigation and creates a graph node', () => {
      recordNavigation('https://example.com', 'Example', 'general');
      const stats = getNavigationStats();
      expect(stats.totalPages).toBe(1);
      expect(stats.mostVisited?.url).toBe('https://example.com');
    });

    it('increments visit count on repeat visits', () => {
      recordNavigation('https://example.com', 'Example');
      recordNavigation('https://other.com', 'Other');
      recordNavigation('https://example.com', 'Example');
      const stats = getNavigationStats();
      expect(stats.mostVisited?.visitCount).toBe(2);
    });

    it('records transitions between pages', () => {
      recordNavigation('https://a.com', 'A');
      recordNavigation('https://b.com', 'B');
      const graph = getNavigationGraph();
      expect(graph['https://a.com'].transitions['https://b.com']).toBe(1);
    });

    it('pushes to back stack on new navigation', () => {
      recordNavigation('https://a.com', 'A');
      recordNavigation('https://b.com', 'B');
      expect(getBackStack()).toEqual(['https://a.com']);
    });

    it('clears forward stack on new navigation', () => {
      recordNavigation('https://a.com', 'A');
      recordNavigation('https://b.com', 'B');
      goBack();
      expect(getForwardStack()).toEqual(['https://b.com']);
      recordNavigation('https://c.com', 'C');
      expect(getForwardStack()).toEqual([]);
    });
  });

  describe('goBack()', () => {
    it('returns null when back stack is empty', () => {
      expect(goBack()).toBeNull();
    });

    it('navigates back to previous URL', () => {
      recordNavigation('https://a.com', 'A');
      recordNavigation('https://b.com', 'B');
      const prev = goBack();
      expect(prev).toBe('https://a.com');
    });

    it('pushes current URL to forward stack', () => {
      recordNavigation('https://a.com', 'A');
      recordNavigation('https://b.com', 'B');
      goBack();
      expect(getForwardStack()).toEqual(['https://b.com']);
    });
  });

  describe('goForward()', () => {
    it('returns null when forward stack is empty', () => {
      expect(goForward()).toBeNull();
    });

    it('navigates forward after going back', () => {
      recordNavigation('https://a.com', 'A');
      recordNavigation('https://b.com', 'B');
      goBack();
      const next = goForward();
      expect(next).toBe('https://b.com');
    });
  });

  describe('predictNextUrls()', () => {
    it('returns empty array when no current node exists', () => {
      const suggestions = predictNextUrls();
      expect(suggestions).toEqual([]);
    });

    it('suggests transition-based URLs', () => {
      recordNavigation('https://a.com', 'A');
      recordNavigation('https://b.com', 'B');
      recordNavigation('https://a.com', 'A');
      recordNavigation('https://b.com', 'B');
      recordNavigation('https://a.com', 'A');
      const suggestions = predictNextUrls();
      expect(suggestions.some(s => s.url === 'https://b.com')).toBe(true);
    });

    it('respects the limit parameter', () => {
      recordNavigation('https://a.com', 'A');
      for (let i = 0; i < 10; i++) {
        recordNavigation(`https://page${i}.com`, `Page ${i}`);
        recordNavigation('https://a.com', 'A');
      }
      const suggestions = predictNextUrls(3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('findPath()', () => {
    it('returns null when no path exists', () => {
      recordNavigation('https://a.com', 'A');
      recordNavigation('https://b.com', 'B');
      const path = findPath('https://a.com', 'https://z.com');
      expect(path).toBeNull();
    });

    it('finds a direct path between connected nodes', () => {
      recordNavigation('https://a.com', 'A');
      recordNavigation('https://b.com', 'B');
      const path = findPath('https://a.com', 'https://b.com');
      expect(path).not.toBeNull();
      expect(path?.steps).toEqual(['https://a.com', 'https://b.com']);
    });

    it('returns identity path when from equals to', () => {
      recordNavigation('https://a.com', 'A');
      const path = findPath('https://a.com', 'https://a.com');
      expect(path).not.toBeNull();
      expect(path?.steps).toEqual(['https://a.com']);
      expect(path?.confidence).toBe(1);
    });

    it('finds multi-hop paths', () => {
      recordNavigation('https://a.com', 'A');
      recordNavigation('https://b.com', 'B');
      recordNavigation('https://c.com', 'C');
      // Reset and rebuild to ensure transitions
      clearNavigationGraph();
      recordNavigation('https://a.com', 'A');
      recordNavigation('https://b.com', 'B');
      clearNavigationGraph();
      recordNavigation('https://a.com', 'A');
      recordNavigation('https://b.com', 'B');
      recordNavigation('https://c.com', 'C');
      const path = findPath('https://a.com', 'https://c.com');
      expect(path).not.toBeNull();
      expect(path?.steps.length).toBe(3);
    });
  });

  describe('getNavigationStats()', () => {
    it('returns zero stats for empty graph', () => {
      const stats = getNavigationStats();
      expect(stats.totalPages).toBe(0);
      expect(stats.totalNavigations).toBe(0);
      expect(stats.mostVisited).toBeNull();
    });

    it('calculates correct totals', () => {
      recordNavigation('https://a.com', 'A');
      recordNavigation('https://b.com', 'B');
      recordNavigation('https://a.com', 'A');
      const stats = getNavigationStats();
      expect(stats.totalPages).toBe(2);
      expect(stats.totalNavigations).toBe(3);
    });
  });

  describe('getMostVisited()', () => {
    it('returns pages sorted by visit count', () => {
      recordNavigation('https://a.com', 'A');
      recordNavigation('https://b.com', 'B');
      recordNavigation('https://b.com', 'B');
      recordNavigation('https://c.com', 'C');
      recordNavigation('https://c.com', 'C');
      recordNavigation('https://c.com', 'C');
      const most = getMostVisited(2);
      expect(most.length).toBe(2);
      expect(most[0].url).toBe('https://c.com');
      expect(most[1].url).toBe('https://b.com');
    });

    it('respects limit parameter', () => {
      for (let i = 0; i < 20; i++) {
        recordNavigation(`https://page${i}.com`, `Page ${i}`);
      }
      const most = getMostVisited(5);
      expect(most.length).toBe(5);
    });
  });

  describe('clearNavigationGraph()', () => {
    it('resets all state', () => {
      recordNavigation('https://a.com', 'A');
      recordNavigation('https://b.com', 'B');
      clearNavigationGraph();
      const stats = getNavigationStats();
      expect(stats.totalPages).toBe(0);
      expect(getBackStack()).toEqual([]);
      expect(getForwardStack()).toEqual([]);
    });
  });
});
