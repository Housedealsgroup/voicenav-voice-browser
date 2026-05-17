import { findMacroByVoice, expandMacro, getBuiltInMacros, BUILT_IN_MACROS } from '../voiceMacros';

describe('Voice Macros', () => {
  describe('findMacroByVoice()', () => {
    it('matches morning routine', () => {
      const result = findMacroByVoice('morning routine');
      expect(result).not.toBeNull();
      expect(result?.macro.name).toContain('Morning');
    });

    it('matches amazon shop with variable', () => {
      const result = findMacroByVoice('amazon shop for headphones');
      expect(result).not.toBeNull();
      expect(result?.variables.item).toBe('headphones');
    });

    it('matches check email', () => {
      const result = findMacroByVoice('check email');
      expect(result).not.toBeNull();
    });

    it('matches read news', () => {
      const result = findMacroByVoice('read news');
      expect(result).not.toBeNull();
    });

    it('returns null for no match', () => {
      const result = findMacroByVoice('asdfghjkl');
      expect(result).toBeNull();
    });
  });

  describe('expandMacro()', () => {
    it('substitutes variables', () => {
      const macro = BUILT_IN_MACROS.find(m => m.name.includes('Amazon'))!;
      const steps = expandMacro(macro, { item: 'laptop' });
      expect(steps.some(s => s.includes('laptop'))).toBe(true);
    });
  });

  describe('getBuiltInMacros()', () => {
    it('returns built-in macros', () => {
      const macros = getBuiltInMacros();
      expect(macros.length).toBeGreaterThan(0);
    });

    it('all macros have required fields', () => {
      const macros = getBuiltInMacros();
      macros.forEach(macro => {
        expect(macro.id).toBeDefined();
        expect(macro.name).toBeDefined();
        expect(macro.steps.length).toBeGreaterThan(0);
        expect(macro.triggerPhrases.length).toBeGreaterThan(0);
      });
    });
  });
});
