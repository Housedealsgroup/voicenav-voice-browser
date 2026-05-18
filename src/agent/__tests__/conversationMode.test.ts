import {
  processConversation, getConversationHistory, getConversationContext,
  clearConversation, getConversationSummary, setPreference, getPreference,
} from '../conversationMode';

describe('Conversation Mode', () => {
  beforeEach(() => {
    clearConversation();
  });

  describe('processConversation()', () => {
    it('responds to greetings', () => {
      const response = processConversation('hello');
      expect(response.text.toLowerCase()).toContain('voicenav');
    });

    it('responds to thank you', () => {
      const response = processConversation('thank you');
      expect(response.text.toLowerCase()).toContain('welcome');
    });

    it('responds to help request', () => {
      const response = processConversation('what can you do');
      expect(response.action).toBe('help');
      expect(response.text.toLowerCase()).toContain('navigate');
    });

    it('responds to how are you', () => {
      const response = processConversation('how are you');
      expect(response.text.toLowerCase()).toContain('ready');
    });

    it('handles confirmation with prior intent', () => {
      processConversation('search for shoes');
      const response = processConversation('yes');
      expect(response.action).toBeTruthy();
    });

    it('handles cancellation', () => {
      processConversation('search for shoes');
      const response = processConversation('cancel');
      expect(response.text.toLowerCase()).toContain('cancel');
    });

    it('handles follow-up questions with context', () => {
      processConversation('go to https://amazon.com');
      const response = processConversation('what about that');
      expect(response.text).toBeTruthy();
    });

    it('extracts entities from user text', () => {
      processConversation('go to https://google.com');
      const ctx = getConversationContext();
      expect(ctx.mentionedEntities.some(e => e.includes('google.com'))).toBe(true);
    });

    it('detects shopping topic', () => {
      processConversation('I want to buy shoes');
      const ctx = getConversationContext();
      expect(ctx.topic).toBe('shopping');
    });

    it('detects searching topic', () => {
      processConversation('search for weather');
      const ctx = getConversationContext();
      expect(ctx.topic).toBe('searching');
    });

    it('returns a context object with every response', () => {
      const response = processConversation('hello');
      expect(response.context).toBeDefined();
      expect(response.context.turnCount).toBeGreaterThan(0);
    });
  });

  describe('getConversationHistory()', () => {
    it('returns empty array initially', () => {
      expect(getConversationHistory()).toEqual([]);
    });

    it('records user and assistant turns', () => {
      processConversation('hello');
      const history = getConversationHistory();
      expect(history.length).toBe(2); // user + assistant
      expect(history[0].role).toBe('user');
      expect(history[1].role).toBe('assistant');
    });

    it('tracks turn count across multiple exchanges', () => {
      processConversation('hello');
      processConversation('thanks');
      const history = getConversationHistory();
      expect(history.length).toBe(4);
    });
  });

  describe('getConversationContext()', () => {
    it('returns default context when empty', () => {
      const ctx = getConversationContext();
      expect(ctx.topic).toBeNull();
      expect(ctx.lastIntent).toBeNull();
      expect(ctx.turnCount).toBe(0);
    });

    it('updates lastIntent after action', () => {
      processConversation('what can you do');
      const ctx = getConversationContext();
      expect(ctx.lastIntent).toBe('help');
    });
  });

  describe('clearConversation()', () => {
    it('resets all state', () => {
      processConversation('hello');
      processConversation('search for stuff');
      clearConversation();
      expect(getConversationHistory()).toEqual([]);
      const ctx = getConversationContext();
      expect(ctx.turnCount).toBe(0);
      expect(ctx.topic).toBeNull();
    });
  });

  describe('getConversationSummary()', () => {
    it('returns no conversation message when empty', () => {
      expect(getConversationSummary()).toContain('No conversation');
    });

    it('returns summary after conversation', () => {
      processConversation('hello');
      processConversation('search for news');
      const summary = getConversationSummary();
      expect(summary).toContain('turns');
    });
  });

  describe('setPreference() and getPreference()', () => {
    it('stores and retrieves preferences', () => {
      setPreference('voiceSpeed', 'fast');
      expect(getPreference('voiceSpeed')).toBe('fast');
    });

    it('returns undefined for unknown keys', () => {
      expect(getPreference('nonexistent')).toBeUndefined();
    });

    it('persists preferences across conversations', () => {
      setPreference('theme', 'dark');
      processConversation('hello');
      expect(getPreference('theme')).toBe('dark');
    });

    it('overwrites existing preference', () => {
      setPreference('lang', 'en');
      setPreference('lang', 'es');
      expect(getPreference('lang')).toBe('es');
    });
  });
});
