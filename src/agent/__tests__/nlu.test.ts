import { understand, resolveSiteAlias, isValidCommand } from '../nlu';

describe('NLU Engine', () => {
  describe('understand()', () => {
    it('classifies navigation intent', () => {
      const result = understand('go to amazon');
      expect(result.intent).toBe('navigate');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('classifies search intent', () => {
      const result = understand('search for headphones');
      expect(result.intent).toBe('search');
      expect(result.target).toBe('headphones');
    });

    it('classifies click intent', () => {
      const result = understand('click the sign in button');
      expect(result.intent).toBe('click');
    });

    it('classifies scroll intent', () => {
      const result = understand('scroll down');
      expect(result.intent).toBe('scroll');
    });

    it('classifies read intent', () => {
      const result = understand('read this page');
      expect(result.intent).toBe('read');
    });

    it('classifies cart intent', () => {
      const result = understand('add to cart');
      expect(result.intent).toBe('cart');
    });

    it('classifies back intent', () => {
      const result = understand('go back');
      expect(result.intent).toBe('back');
    });

    it('classifies help intent', () => {
      const result = understand('help');
      expect(result.intent).toBe('help');
    });

    it('defaults to search for unknown input', () => {
      const result = understand('headphones');
      expect(result.intent).toBe('search');
    });

    it('extracts URL entities', () => {
      const result = understand('go to amazon.com');
      expect(result.entities.some(e => e.type === 'url' || e.type === 'site_name')).toBe(true);
    });

    it('extracts number entities', () => {
      const result = understand('click the 3rd result');
      expect(result.entities.some(e => e.type === 'number')).toBe(true);
    });

    it('handles abbreviation expansion', () => {
      const result = understand('pls go to fb');
      expect(result.normalizedText).toContain('please');
      expect(result.normalizedText).toContain('facebook');
    });

    it('returns original and normalized text', () => {
      const result = understand('  Go To AMAZON  ');
      expect(result.originalText).toBe('  Go To AMAZON  ');
      expect(result.normalizedText).toBeDefined();
    });
  });

  describe('resolveSiteAlias()', () => {
    it('resolves google', () => {
      expect(resolveSiteAlias('google')).toContain('google.com');
    });

    it('resolves amazon', () => {
      expect(resolveSiteAlias('amazon')).toContain('amazon.com');
    });

    it('resolves youtube', () => {
      expect(resolveSiteAlias('youtube')).toContain('youtube.com');
    });

    it('resolves gmail', () => {
      expect(resolveSiteAlias('gmail')).toContain('mail.google.com');
    });

    it('resolves github', () => {
      expect(resolveSiteAlias('github')).toContain('github.com');
    });

    it('passes through full URLs', () => {
      expect(resolveSiteAlias('https://example.com')).toBe('https://example.com');
    });
  });

  describe('isValidCommand()', () => {
    it('validates non-empty command', () => {
      expect(isValidCommand('go to google')).toBe(true);
    });

    it('rejects empty string', () => {
      expect(isValidCommand('')).toBe(false);
    });

    it('rejects whitespace only', () => {
      expect(isValidCommand('   ')).toBe(false);
    });
  });
});
