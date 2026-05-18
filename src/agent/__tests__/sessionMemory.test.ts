import {
  addTurn, getLastTurn, getRecentTurns, updateEntityMemory, getEntityMemory,
  resolveReference, addPageToHistory, getPageHistory, getPreviousPage,
  setCurrentGoal, getCurrentGoal, clearCurrentGoal, getContextForNLU,
  getSessionStats, resetSession,
} from '../sessionMemory';

describe('Session Memory', () => {
  beforeEach(() => {
    resetSession();
  });

  describe('Turn tracking', () => {
    it('adds and retrieves turns', () => {
      addTurn({ command: 'go to amazon', result: 'success' });
      const last = getLastTurn();
      expect(last?.command).toBe('go to amazon');
    });

    it('tracks multiple turns', () => {
      addTurn({ command: 'first', result: 'success' });
      addTurn({ command: 'second', result: 'success' });
      const recent = getRecentTurns(2);
      expect(recent.length).toBe(2);
      expect(recent[1].command).toBe('second');
    });
  });

  describe('Entity memory', () => {
    it('updates and retrieves entity memory', () => {
      updateEntityMemory({ lastSearchQuery: 'headphones' });
      const memory = getEntityMemory();
      expect(memory.lastSearchQuery).toBe('headphones');
    });
  });

  describe('Reference resolution', () => {
    it('resolves "it" reference', () => {
      updateEntityMemory({ lastElement: { id: 1, text: 'Sign In', role: 'button', label: 'Sign In' } });
      const resolved = resolveReference('click it');
      expect(resolved).not.toBeNull();
    });

    it('resolves ordinal "first one"', () => {
      const resolved = resolveReference('click the first one');
      expect(resolved).toBeDefined();
    });
  });

  describe('Page history', () => {
    it('adds and retrieves page history', () => {
      addPageToHistory('https://amazon.com', 'Amazon', 'shopping');
      const history = getPageHistory();
      expect(history.length).toBe(1);
    });

    it('gets previous page', () => {
      addPageToHistory('https://first.com', 'First', 'general');
      addPageToHistory('https://second.com', 'Second', 'general');
      const prev = getPreviousPage();
      expect(prev?.url).toBe('https://first.com');
    });
  });

  describe('Goal tracking', () => {
    it('sets and gets goal', () => {
      setCurrentGoal('Find headphones', ['search', 'compare', 'buy']);
      expect(getCurrentGoal()).toBe('Find headphones');
      clearCurrentGoal();
      expect(getCurrentGoal()).toBeUndefined();
    });
  });

  describe('Context', () => {
    it('returns NLU context', () => {
      addTurn({ command: 'test', result: 'success' });
      const context = getContextForNLU();
      expect(context).toBeDefined();
    });

    it('returns session stats', () => {
      addTurn({ command: 'test', result: 'success' });
      const stats = getSessionStats();
      expect(stats.commands).toBe(1);
    });
  });

  describe('resetSession()', () => {
    it('clears all data', () => {
      addTurn({ command: 'test', result: 'success' });
      setCurrentGoal('goal', ['shopping']);
      resetSession();
      expect(getLastTurn()).toBeUndefined();
      expect(getCurrentGoal()).toBeUndefined();
    });
  });
});
