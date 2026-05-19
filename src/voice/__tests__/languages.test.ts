import { SUPPORTED_LANGUAGES, getLanguageByCode, getLanguageName } from '../languages';

// Helper: check if a language is RTL
function isRTLLanguage(code: string): boolean {
  return getLanguageByCode(code)?.isRTL === true;
}

describe('Languages', () => {
  describe('SUPPORTED_LANGUAGES — Structure', () => {
    it('has 222 languages', () => {
      expect(SUPPORTED_LANGUAGES.length).toBe(222);
    });

    it('all languages have code field', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(lang.code).toBeDefined();
        expect(typeof lang.code).toBe('string');
        expect(lang.code.length).toBeGreaterThan(0);
      });
    });

    it('all languages have name field', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(lang.name).toBeDefined();
        expect(typeof lang.name).toBe('string');
        expect(lang.name.length).toBeGreaterThan(0);
      });
    });

    it('all languages have nativeName field', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(lang.nativeName).toBeDefined();
        expect(typeof lang.nativeName).toBe('string');
        expect(lang.nativeName.length).toBeGreaterThan(0);
      });
    });

    it('all languages have sttCode field', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(lang.sttCode).toBeDefined();
        expect(typeof lang.sttCode).toBe('string');
        expect(lang.sttCode.length).toBeGreaterThan(0);
      });
    });

    it('all languages have ttsCode field', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(lang.ttsCode).toBeDefined();
        expect(typeof lang.ttsCode).toBe('string');
        expect(lang.ttsCode.length).toBeGreaterThan(0);
      });
    });

    it('has unique language codes', () => {
      const codes = SUPPORTED_LANGUAGES.map(l => l.code);
      const unique = new Set(codes);
      expect(unique.size).toBe(codes.length);
    });

    it('no empty nativeName values', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(lang.nativeName.trim().length).toBeGreaterThan(0);
      });
    });

    it('sttCode is valid format', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(lang.sttCode).toMatch(/^[a-z]{2,3}(-[A-Z][a-z]{2,3}|-[[A-Z]{2})?$/);
      });
    });

    it('ttsCode is valid format', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(lang.ttsCode).toMatch(/^[a-z]{2,3}(-[A-Z][a-z]{2,3}|-[[A-Z]{2})?$/);
      });
    });
  });

  describe('RTL Languages', () => {
    it('Arabic is marked RTL', () => {
      expect(isRTLLanguage('ar')).toBe(true);
    });

    it('Hebrew is marked RTL', () => {
      expect(isRTLLanguage('he')).toBe(true);
    });

    it('Urdu is marked RTL', () => {
      expect(isRTLLanguage('ur')).toBe(true);
    });

    it('Persian is marked RTL', () => {
      expect(isRTLLanguage('fa')).toBe(true);
    });

    it('Pashto is marked RTL', () => {
      expect(isRTLLanguage('ps')).toBe(true);
    });

    it('English is not RTL', () => {
      expect(isRTLLanguage('en')).toBe(false);
    });

    it('French is not RTL', () => {
      expect(isRTLLanguage('fr')).toBe(false);
    });

    it('Chinese is not RTL', () => {
      expect(isRTLLanguage('zh')).toBe(false);
    });

    it('Hindi is not RTL', () => {
      expect(isRTLLanguage('hi')).toBe(false);
    });

    it('exactly 12 RTL languages', () => {
      const rtlLangs = SUPPORTED_LANGUAGES.filter(l => l.isRTL);
      expect(rtlLangs.length).toBe(12);
    });
  });

  describe('European Languages', () => {
    it('Bulgarian exists with correct code', () => {
      const lang = getLanguageByCode('bg');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Bulgarian');
    });

    it('Croatian exists with correct code', () => {
      const lang = getLanguageByCode('hr');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Croatian');
    });

    it('Slovak exists with correct code', () => {
      const lang = getLanguageByCode('sk');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Slovak');
    });

    it('Slovenian exists with correct code', () => {
      const lang = getLanguageByCode('sl');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Slovenian');
    });

    it('Lithuanian exists with correct code', () => {
      const lang = getLanguageByCode('lt');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Lithuanian');
    });

    it('Latvian exists with correct code', () => {
      const lang = getLanguageByCode('lv');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Latvian');
    });

    it('Estonian exists with correct code', () => {
      const lang = getLanguageByCode('et');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Estonian');
    });

    it('Serbian exists with correct code', () => {
      const lang = getLanguageByCode('sr');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Serbian');
    });

    it('Macedonian exists with correct code', () => {
      const lang = getLanguageByCode('mk');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Macedonian');
    });

    it('Albanian exists with correct code', () => {
      const lang = getLanguageByCode('sq');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Albanian');
    });

    it('Icelandic exists with correct code', () => {
      const lang = getLanguageByCode('is');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Icelandic');
    });

    it('Irish exists with correct code', () => {
      const lang = getLanguageByCode('ga');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Irish');
    });

    it('Welsh exists with correct code', () => {
      const lang = getLanguageByCode('cy');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Welsh');
    });

    it('Maltese exists with correct code', () => {
      const lang = getLanguageByCode('mt');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Maltese');
    });

    it('Basque exists with correct code', () => {
      const lang = getLanguageByCode('eu');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Basque');
    });

    it('Galician exists with correct code', () => {
      const lang = getLanguageByCode('gl');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Galician');
    });

    it('Catalan exists with correct code', () => {
      const lang = getLanguageByCode('ca');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Catalan');
    });

    it('Luxembourgish exists with correct code', () => {
      const lang = getLanguageByCode('lb');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Luxembourgish');
    });

    it('Afrikaans exists with correct code', () => {
      const lang = getLanguageByCode('af');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Afrikaans');
    });
  });

  describe('South Asian Languages', () => {
    it('Bengali exists with correct code', () => {
      const lang = getLanguageByCode('bn');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Bengali');
      expect(lang?.nativeName).toBe('বাংলা');
    });

    it('Tamil exists with correct code', () => {
      const lang = getLanguageByCode('ta');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Tamil');
    });

    it('Telugu exists with correct code', () => {
      const lang = getLanguageByCode('te');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Telugu');
    });

    it('Malayalam exists with correct code', () => {
      const lang = getLanguageByCode('ml');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Malayalam');
    });

    it('Kannada exists with correct code', () => {
      const lang = getLanguageByCode('kn');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Kannada');
    });

    it('Marathi exists with correct code', () => {
      const lang = getLanguageByCode('mr');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Marathi');
    });

    it('Gujarati exists with correct code', () => {
      const lang = getLanguageByCode('gu');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Gujarati');
    });

    it('Punjabi exists with correct code', () => {
      const lang = getLanguageByCode('pa');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Punjabi');
    });

    it('Urdu exists with correct code', () => {
      const lang = getLanguageByCode('ur');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Urdu');
    });

    it('Nepali exists with correct code', () => {
      const lang = getLanguageByCode('ne');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Nepali');
    });

    it('Sinhala exists with correct code', () => {
      const lang = getLanguageByCode('si');
      expect(lang).toBeDefined();
      expect(lang?.name).toBe('Sinhala');
    });
  });

  describe('Southeast Asian Languages', () => {
    it('Burmese exists', () => {
      expect(getLanguageByCode('my')?.name).toBe('Burmese');
    });

    it('Khmer exists', () => {
      expect(getLanguageByCode('km')?.name).toBe('Khmer');
    });

    it('Lao exists', () => {
      expect(getLanguageByCode('lo')?.name).toBe('Lao');
    });

    it('Mongolian exists', () => {
      expect(getLanguageByCode('mn')?.name).toBe('Mongolian');
    });

    it('Azerbaijani exists', () => {
      expect(getLanguageByCode('az')?.name).toBe('Azerbaijani');
    });
  });

  describe('Caucasian & Central Asian Languages', () => {
    it('Georgian exists', () => {
      expect(getLanguageByCode('ka')?.name).toBe('Georgian');
    });

    it('Amharic exists', () => {
      expect(getLanguageByCode('am')?.name).toBe('Amharic');
    });

    it('Uzbek exists', () => {
      expect(getLanguageByCode('uz')?.name).toBe('Uzbek');
    });

    it('Kazakh exists', () => {
      expect(getLanguageByCode('kk')?.name).toBe('Kazakh');
    });

    it('Kyrgyz exists', () => {
      expect(getLanguageByCode('ky')?.name).toBe('Kyrgyz');
    });

    it('Tajik exists', () => {
      expect(getLanguageByCode('tg')?.name).toBe('Tajik');
    });
  });

  describe('African Languages', () => {
    it('Swahili exists', () => {
      expect(getLanguageByCode('sw')?.name).toBe('Swahili');
    });

    it('Zulu exists', () => {
      expect(getLanguageByCode('zu')?.name).toBe('Zulu');
    });

    it('Xhosa exists', () => {
      expect(getLanguageByCode('xh')?.name).toBe('Xhosa');
    });

    it('Hausa exists', () => {
      expect(getLanguageByCode('ha')?.name).toBe('Hausa');
    });

    it('Yoruba exists', () => {
      expect(getLanguageByCode('yo')?.name).toBe('Yoruba');
    });

    it('Igbo exists', () => {
      expect(getLanguageByCode('ig')?.name).toBe('Igbo');
    });

    it('Shona exists', () => {
      expect(getLanguageByCode('sn')?.name).toBe('Shona');
    });

    it('Southern Sotho exists', () => {
      expect(getLanguageByCode('st')?.name).toBe('Southern Sotho');
    });

    it('Tswana exists', () => {
      expect(getLanguageByCode('tn')?.name).toBe('Tswana');
    });

    it('Tsonga exists', () => {
      expect(getLanguageByCode('ts')?.name).toBe('Tsonga');
    });

    it('Kinyarwanda exists', () => {
      expect(getLanguageByCode('rw')?.name).toBe('Kinyarwanda');
    });

    it('Ganda exists', () => {
      expect(getLanguageByCode('lg')?.name).toBe('Ganda');
    });

    it('Akan exists', () => {
      expect(getLanguageByCode('ak')?.name).toBe('Akan');
    });

    it('Wolof exists', () => {
      expect(getLanguageByCode('wo')?.name).toBe('Wolof');
    });
  });

  describe('Middle Eastern Languages', () => {
    it('Persian exists', () => {
      expect(getLanguageByCode('fa')?.name).toBe('Persian');
    });

    it('Pashto exists', () => {
      expect(getLanguageByCode('ps')?.name).toBe('Pashto');
    });

    it('Kurdish exists', () => {
      expect(getLanguageByCode('ku')?.name).toBe('Kurdish');
    });
  });

  describe('Pacific Languages', () => {
    it('Filipino exists', () => {
      expect(getLanguageByCode('tl')?.name).toBe('Filipino');
    });

    it('Hawaiian exists', () => {
      expect(getLanguageByCode('haw')?.name).toBe('Hawaiian');
    });

    it('Maori exists', () => {
      expect(getLanguageByCode('mi')?.name).toBe('Maori');
    });

    it('Samoan exists', () => {
      expect(getLanguageByCode('sm')?.name).toBe('Samoan');
    });

    it('Tongan exists', () => {
      expect(getLanguageByCode('to')?.name).toBe('Tongan');
    });

    it('Fijian exists', () => {
      expect(getLanguageByCode('fj')?.name).toBe('Fijian');
    });
  });

  describe('Additional European Languages', () => {
    it('Breton exists', () => {
      expect(getLanguageByCode('br')?.name).toBe('Breton');
    });

    it('Occitan exists', () => {
      expect(getLanguageByCode('oc')?.name).toBe('Occitan');
    });

    it('Sardinian exists', () => {
      expect(getLanguageByCode('sc')?.name).toBe('Sardinian');
    });

    it('Venetian exists', () => {
      expect(getLanguageByCode('vec')?.name).toBe('Venetian');
    });

    it('Neapolitan exists', () => {
      expect(getLanguageByCode('nap')?.name).toBe('Neapolitan');
    });

    it('Ladin exists', () => {
      expect(getLanguageByCode('lld')?.name).toBe('Ladin');
    });

    it('Romansh exists', () => {
      expect(getLanguageByCode('rm')?.name).toBe('Romansh');
    });

    it('Friulian exists', () => {
      expect(getLanguageByCode('fur')?.name).toBe('Friulian');
    });
  });

  describe('Additional Asian Languages', () => {
    it('Javanese exists', () => {
      expect(getLanguageByCode('jv')?.name).toBe('Javanese');
    });

    it('Sundanese exists', () => {
      expect(getLanguageByCode('su')?.name).toBe('Sundanese');
    });

    it('Cebuano exists', () => {
      expect(getLanguageByCode('ceb')?.name).toBe('Cebuano');
    });

    it('Hiligaynon exists', () => {
      expect(getLanguageByCode('hil')?.name).toBe('Hiligaynon');
    });

    it('Waray exists', () => {
      expect(getLanguageByCode('war')?.name).toBe('Waray');
    });

    it('Kapampangan exists', () => {
      expect(getLanguageByCode('pam')?.name).toBe('Kapampangan');
    });

    it('Bikol exists', () => {
      expect(getLanguageByCode('bcl')?.name).toBe('Bikol');
    });
  });

  describe('Creole & Pidgin Languages', () => {
    it('Haitian Creole exists', () => {
      expect(getLanguageByCode('ht')?.name).toBe('Haitian Creole');
    });

    it('Malagasy exists', () => {
      expect(getLanguageByCode('mg')?.name).toBe('Malagasy');
    });

    it('Corsican exists', () => {
      expect(getLanguageByCode('co')?.name).toBe('Corsican');
    });

    it('Scottish Gaelic exists', () => {
      expect(getLanguageByCode('gd')?.name).toBe('Scottish Gaelic');
    });
  });

  describe('Constructed Languages', () => {
    it('Esperanto exists', () => {
      expect(getLanguageByCode('eo')?.name).toBe('Esperanto');
    });
  });

  describe('getLanguageByCode()', () => {
    it('returns English config', () => {
      const en = getLanguageByCode('en');
      expect(en).toBeDefined();
      expect(en?.name).toBe('English');
      expect(en?.sttCode).toBe('en-US');
    });

    it('returns Spanish config', () => {
      const es = getLanguageByCode('es');
      expect(es).toBeDefined();
      expect(es?.name).toBe('Spanish');
    });

    it('returns French config', () => {
      const fr = getLanguageByCode('fr');
      expect(fr).toBeDefined();
      expect(fr?.name).toBe('French');
    });

    it('returns German config', () => {
      const de = getLanguageByCode('de');
      expect(de).toBeDefined();
      expect(de?.name).toBe('German');
    });

    it('returns Japanese config', () => {
      const ja = getLanguageByCode('ja');
      expect(ja).toBeDefined();
      expect(ja?.sttCode).toBe('ja-JP');
    });

    it('returns Arabic config with RTL', () => {
      const ar = getLanguageByCode('ar');
      expect(ar).toBeDefined();
      expect(ar?.isRTL).toBe(true);
    });

    it('returns Bengali config', () => {
      const bn = getLanguageByCode('bn');
      expect(bn).toBeDefined();
      expect(bn?.name).toBe('Bengali');
      expect(bn?.sttCode).toBe('bn-BD');
    });

    it('returns Swahili config', () => {
      const sw = getLanguageByCode('sw');
      expect(sw).toBeDefined();
      expect(sw?.name).toBe('Swahili');
      expect(sw?.sttCode).toBe('sw-KE');
    });

    it('returns Hawaiian config', () => {
      const haw = getLanguageByCode('haw');
      expect(haw).toBeDefined();
      expect(haw?.sttCode).toBe('haw-US');
    });

    it('returns Esperanto config', () => {
      const eo = getLanguageByCode('eo');
      expect(eo).toBeDefined();
      expect(eo?.name).toBe('Esperanto');
    });

    it('returns undefined for unknown code', () => {
      expect(getLanguageByCode('xx')).toBeUndefined();
    });

    it('returns undefined for empty code', () => {
      expect(getLanguageByCode('')).toBeUndefined();
    });
  });

  describe('getLanguageName()', () => {
    it('returns English for en', () => {
      expect(getLanguageName('en')).toBe('English');
    });

    it('returns Spanish for es', () => {
      expect(getLanguageName('es')).toBe('Spanish');
    });

    it('returns French for fr', () => {
      expect(getLanguageName('fr')).toBe('French');
    });

    it('returns German for de', () => {
      expect(getLanguageName('de')).toBe('German');
    });

    it('returns Bengali for bn', () => {
      expect(getLanguageName('bn')).toBe('Bengali');
    });

    it('returns Swahili for sw', () => {
      expect(getLanguageName('sw')).toBe('Swahili');
    });

    it('returns code for unknown', () => {
      expect(getLanguageName('xx')).toBe('xx');
    });

    it('returns code for empty string', () => {
      expect(getLanguageName('')).toBe('');
    });
  });
});
