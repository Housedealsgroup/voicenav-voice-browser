import {
  addCommand, searchCommands, getRecentCommands, getFavoriteCommands,
  toggleFavorite, deleteCommand, clearHistory, getCommandsByPage,
  getCommandsByIntent, replayCommand, getCommandStats, getPatternSuggestions,
  exportHistory, importHistory,
} from '../commandHistory';

describe('Command History', () => {
  beforeEach(() => {
    clearHistory();
  });

  describe('addCommand()', () => {
    it('adds a command to history', () => {
      const entry = addCommand('go to amazon');
      expect(entry.command).toBe('go to amazon');
      expect(entry.id).toBeTruthy();
      expect(entry.success).toBe(true);
    });

    it('normalizes command to lowercase', () => {
      const entry = addCommand('GO TO Amazon');
      expect(entry.command).toBe('go to amazon');
    });

    it('stores optional metadata', () => {
      const entry = addCommand('click sign in', {
        intent: 'click',
        target: 'sign in',
        success: true,
        pageUrl: 'https://example.com',
        duration: 150,
        tags: ['auth'],
      });
      expect(entry.intent).toBe('click');
      expect(entry.target).toBe('sign in');
      expect(entry.pageUrl).toBe('https://example.com');
      expect(entry.tags).toEqual(['auth']);
    });

    it('defaults success to true', () => {
      const entry = addCommand('test');
      expect(entry.success).toBe(true);
    });

    it('records failed commands', () => {
      const entry = addCommand('bad command', { success: false });
      expect(entry.success).toBe(false);
    });
  });

  describe('searchCommands()', () => {
    it('returns recent commands for empty query', () => {
      addCommand('command one');
      addCommand('command two');
      const results = searchCommands('');
      expect(results.length).toBe(2);
    });

    it('searches by command text', () => {
      addCommand('go to amazon');
      addCommand('search for shoes');
      addCommand('go to ebay');
      const results = searchCommands('go to');
      expect(results.length).toBe(2);
    });

    it('searches by intent', () => {
      addCommand('click button', { intent: 'click' });
      addCommand('type text', { intent: 'type' });
      const results = searchCommands('click');
      expect(results.length).toBe(1);
    });

    it('respects limit parameter', () => {
      for (let i = 0; i < 20; i++) addCommand(`command ${i}`);
      const results = searchCommands('command', 5);
      expect(results.length).toBe(5);
    });
  });

  describe('getRecentCommands()', () => {
    it('returns recent commands in order', () => {
      addCommand('first');
      addCommand('second');
      addCommand('third');
      const recent = getRecentCommands(2);
      expect(recent.length).toBe(2);
      expect(recent[0].command).toBe('third');
      expect(recent[1].command).toBe('second');
    });
  });

  describe('getFavoriteCommands()', () => {
    it('returns only favorited commands', () => {
      const entry1 = addCommand('fav command');
      const _entry2 = addCommand('normal command');
      toggleFavorite(entry1.id);
      const favorites = getFavoriteCommands();
      expect(favorites.length).toBe(1);
      expect(favorites[0].id).toBe(entry1.id);
    });
  });

  describe('toggleFavorite()', () => {
    it('toggles favorite status on', () => {
      const entry = addCommand('test');
      expect(toggleFavorite(entry.id)).toBe(true);
      expect(getFavoriteCommands().length).toBe(1);
    });

    it('toggles favorite status off', () => {
      const entry = addCommand('test');
      toggleFavorite(entry.id);
      expect(toggleFavorite(entry.id)).toBe(false);
      expect(getFavoriteCommands().length).toBe(0);
    });

    it('returns false for non-existent id', () => {
      expect(toggleFavorite('fake-id')).toBe(false);
    });
  });

  describe('deleteCommand()', () => {
    it('deletes a command', () => {
      const entry = addCommand('to delete');
      expect(deleteCommand(entry.id)).toBe(true);
      expect(getRecentCommands().length).toBe(0);
    });

    it('returns false for non-existent id', () => {
      expect(deleteCommand('fake-id')).toBe(false);
    });
  });

  describe('clearHistory()', () => {
    it('clears all history', () => {
      addCommand('one');
      addCommand('two');
      clearHistory();
      expect(getRecentCommands()).toEqual([]);
    });
  });

  describe('getCommandsByPage()', () => {
    it('filters commands by page URL', () => {
      addCommand('cmd1', { pageUrl: 'https://a.com' });
      addCommand('cmd2', { pageUrl: 'https://b.com' });
      addCommand('cmd3', { pageUrl: 'https://a.com' });
      const results = getCommandsByPage('https://a.com');
      expect(results.length).toBe(2);
    });
  });

  describe('getCommandsByIntent()', () => {
    it('filters commands by intent', () => {
      addCommand('cmd1', { intent: 'click' });
      addCommand('cmd2', { intent: 'navigate' });
      addCommand('cmd3', { intent: 'click' });
      const results = getCommandsByIntent('click');
      expect(results.length).toBe(2);
    });
  });

  describe('replayCommand()', () => {
    it('returns command text for replay', () => {
      const entry = addCommand('go to google');
      expect(replayCommand(entry.id)).toBe('go to google');
    });

    it('returns null for non-existent id', () => {
      expect(replayCommand('fake-id')).toBeNull();
    });
  });

  describe('getCommandStats()', () => {
    it('returns correct stats', () => {
      addCommand('go to amazon', { intent: 'navigate', success: true });
      addCommand('click button', { intent: 'click', success: true });
      addCommand('fail command', { success: false });
      const stats = getCommandStats();
      expect(stats.totalCommands).toBe(3);
      expect(stats.successRate).toBeCloseTo(2 / 3);
      expect(stats.topCommands.length).toBeGreaterThan(0);
      expect(stats.topIntents.length).toBeGreaterThan(0);
    });

    it('handles empty history', () => {
      const stats = getCommandStats();
      expect(stats.totalCommands).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });

  describe('getPatternSuggestions()', () => {
    it('returns suggestions based on command patterns', () => {
      addCommand('open site');
      addCommand('scroll down');
      addCommand('open site');
      addCommand('scroll down');
      const suggestions = getPatternSuggestions('open site');
      expect(suggestions).toContain('scroll down');
    });

    it('returns empty for unknown command', () => {
      addCommand('something');
      const suggestions = getPatternSuggestions('unknown');
      expect(suggestions).toEqual([]);
    });
  });

  describe('exportHistory() and importHistory()', () => {
    it('exports history as JSON', () => {
      addCommand('test command');
      const json = exportHistory();
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
    });

    it('imports history from JSON', () => {
      const data = JSON.stringify([
        { id: 'imported-1', command: 'imported', timestamp: Date.now(), success: true, isFavorite: false, tags: [] },
      ]);
      expect(importHistory(data)).toBe(true);
      expect(getRecentCommands().length).toBe(1);
    });

    it('returns false for invalid JSON', () => {
      expect(importHistory('not json')).toBe(false);
    });

    it('returns false for non-array JSON', () => {
      expect(importHistory('{}')).toBe(false);
    });
  });
});
