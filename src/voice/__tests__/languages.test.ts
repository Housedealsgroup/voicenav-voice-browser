import { SUPPORTED_LANGUAGES, getLanguageByCode, getLanguageName } from '../languages';

describe('Languages', () => {
  describe('SUPPORTED_LANGUAGES', () => {
    it('has 29 languages', () => {
      expect(SUPPORTED_LANGUAGES.length).toBe(29);
    });

    it('all languages have required fields', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(lang.code).toBeDefined();
        expect(lang.name).toBeDefined();
        expect(lang.sttCode).toBeDefined();
        expect(lang.ttsCode).toBeDefined();
      });
    });

    it('RTL languages are marked', () => {
      const arabic = getLanguageByCode('ar');
      const hebrew = getLanguageByCode('he');
      expect(arabic?.isRTL).toBe(true);
      expect(hebrew?.isRTL).toBe(true);
    });
  });

  describe('getLanguageByCode()', () => {
    it('returns English config', () => {
      const en = getLanguageByCode('en');
      expect(en).toBeDefined();
      expect(en?.name).toBe('English');
    });

    it('returns Spanish config', () => {
      const es = getLanguageByCode('es');
      expect(es).toBeDefined();
      expect(es?.name).toBe('Spanish');
    });

    it('returns undefined for unknown code', () => {
      const unknown = getLanguageByCode('xx');
      expect(unknown).toBeUndefined();
    });
  });

  describe('getLanguageName()', () => {
    it('returns language name', () => {
      expect(getLanguageName('en')).toBe('English');
      expect(getLanguageName('es')).toBe('Spanish');
      expect(getLanguageName('fr')).toBe('French');
    });

    it('returns code for unknown', () => {
      expect(getLanguageName('xx')).toBe('xx');
    });
  });
});
