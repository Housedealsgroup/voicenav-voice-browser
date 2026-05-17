import { detectLanguage, isLanguageMismatch, detectSTTLang } from '../languageDetector';

describe('LanguageDetector', () => {
  describe('detectLanguage()', () => {
    describe('English', () => {
      it('detects English commands', () => {
        const result = detectLanguage('search for headphones');
        expect(result.language.code).toBe('en');
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      it('detects English navigation', () => {
        const result = detectLanguage('go to google');
        expect(result.language.code).toBe('en');
      });

      it('detects English help', () => {
        const result = detectLanguage('what can you do');
        expect(result.language.code).toBe('en');
      });
    });

    describe('Spanish', () => {
      it('detects Spanish commands', () => {
        const result = detectLanguage('buscar auriculares');
        expect(result.language.code).toBe('es');
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      it('detects Spanish navigation', () => {
        const result = detectLanguage('abrir google');
        expect(result.language.code).toBe('es');
      });

      it('detects Spanish scroll', () => {
        const result = detectLanguage('desplazar abajo');
        expect(result.language.code).toBe('es');
      });
    });

    describe('French', () => {
      it('detects French commands', () => {
        const result = detectLanguage('chercher des écouteurs');
        expect(result.language.code).toBe('fr');
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      it('detects French navigation', () => {
        const result = detectLanguage('ouvrir google');
        expect(result.language.code).toBe('fr');
      });
    });

    describe('German', () => {
      it('detects German commands', () => {
        const result = detectLanguage('suche nach kopfhörern');
        expect(result.language.code).toBe('de');
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      it('detects German with umlauts', () => {
        const result = detectLanguage('öffne die seite');
        expect(result.language.code).toBe('de');
      });
    });

    describe('Italian', () => {
      it('detects Italian commands', () => {
        const result = detectLanguage('cerca cuffie');
        expect(result.language.code).toBe('it');
      });
    });

    describe('Portuguese', () => {
      it('detects Portuguese commands', () => {
        const result = detectLanguage('buscar fones de ouvido');
        expect(result.language.code).toBe('pt');
      });
    });

    describe('Russian', () => {
      it('detects Russian commands', () => {
        const result = detectLanguage('найти наушники');
        expect(result.language.code).toBe('ru');
      });

      it('detects Russian with Cyrillic script', () => {
        const result = detectLanguage('открой гугл');
        expect(result.language.code).toBe('ru');
      });
    });

    describe('Japanese', () => {
      it('detects Japanese with hiragana', () => {
        const result = detectLanguage('ヘッドフォンを検索');
        expect(result.language.code).toBe('ja');
      });

      it('detects Japanese with katakana', () => {
        const result = detectLanguage('グーグルを開く');
        expect(result.language.code).toBe('ja');
      });
    });

    describe('Korean', () => {
      it('detects Korean commands', () => {
        const result = detectLanguage('이어폰 검색');
        expect(result.language.code).toBe('ko');
      });
    });

    describe('Chinese', () => {
      it('detects Chinese commands', () => {
        const result = detectLanguage('搜索耳机');
        expect(result.language.code).toBe('zh');
      });
    });

    describe('Arabic', () => {
      it('detects Arabic commands', () => {
        const result = detectLanguage('ابحث عن سماعات');
        expect(result.language.code).toBe('ar');
      });
    });

    describe('Hindi', () => {
      it('detects Hindi commands', () => {
        const result = detectLanguage('हेडफोन खोजो');
        expect(result.language.code).toBe('hi');
      });
    });

    describe('Dutch', () => {
      it('detects Dutch commands', () => {
        const result = detectLanguage('zoek naar koptelefoon');
        expect(result.language.code).toBe('nl');
      });
    });

    describe('Polish', () => {
      it('detects Polish commands', () => {
        const result = detectLanguage('szukaj słuchawek');
        expect(result.language.code).toBe('pl');
      });
    });

    describe('Swedish', () => {
      it('detects Swedish commands', () => {
        const result = detectLanguage('sök efter hörlurar');
        expect(result.language.code).toBe('sv');
      });
    });

    describe('Turkish', () => {
      it('detects Turkish commands', () => {
        const result = detectLanguage('kulaklık ara');
        expect(result.language.code).toBe('tr');
      });
    });

    describe('Script-based detection', () => {
      it('detects Chinese by Unicode range', () => {
        const result = detectLanguage('打开网页');
        expect(result.language.code).toBe('zh');
        expect(result.confidence).toBeGreaterThan(0.9);
      });

      it('detects Japanese by hiragana', () => {
        const result = detectLanguage('こんにちは');
        expect(result.language.code).toBe('ja');
        expect(result.confidence).toBeGreaterThan(0.9);
      });

      it('detects Korean by Hangul', () => {
        const result = detectLanguage('안녕하세요');
        expect(result.language.code).toBe('ko');
        expect(result.confidence).toBeGreaterThan(0.9);
      });

      it('detects Arabic by Unicode range', () => {
        const result = detectLanguage('مرحبا');
        expect(result.language.code).toBe('ar');
        expect(result.confidence).toBeGreaterThan(0.9);
      });

      it('detects Hebrew by Unicode range', () => {
        const result = detectLanguage('שלום');
        expect(result.language.code).toBe('he');
        expect(result.confidence).toBeGreaterThan(0.9);
      });

      it('detects Thai by Unicode range', () => {
        const result = detectLanguage('สวัสดี');
        expect(result.language.code).toBe('th');
        expect(result.confidence).toBeGreaterThan(0.9);
      });

      it('detects Hindi by Devanagari', () => {
        const result = detectLanguage('नमस्ते');
        expect(result.language.code).toBe('hi');
        expect(result.confidence).toBeGreaterThan(0.9);
      });
    });

    describe('Edge cases', () => {
      it('defaults to English for empty text', () => {
        const result = detectLanguage('');
        expect(result.language.code).toBe('en');
      });

      it('defaults to English for whitespace', () => {
        const result = detectLanguage('   ');
        expect(result.language.code).toBe('en');
      });

      it('returns alternatives when ambiguous', () => {
        const result = detectLanguage('open the page');
        expect(result.language).toBeDefined();
        expect(result.alternatives).toBeDefined();
      });
    });
  });

  describe('isLanguageMismatch()', () => {
    it('detects mismatch when Spanish spoken but English expected', () => {
      expect(isLanguageMismatch('buscar auriculares', 'en')).toBe(true);
    });

    it('no mismatch when English spoken and English expected', () => {
      expect(isLanguageMismatch('search for headphones', 'en')).toBe(false);
    });
  });

  describe('detectSTTLang()', () => {
    it('returns en-US for English', () => {
      expect(detectSTTLang('search for headphones')).toBe('en-US');
    });

    it('returns es-ES for Spanish', () => {
      expect(detectSTTLang('buscar auriculares')).toBe('es-ES');
    });

    it('returns fr-FR for French', () => {
      expect(detectSTTLang('chercher des écouteurs')).toBe('fr-FR');
    });

    it('returns ja-JP for Japanese', () => {
      expect(detectSTTLang('ヘッドフォンを検索')).toBe('ja-JP');
    });
  });

  describe('Performance', () => {
    it('detects language in under 5ms', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        detectLanguage('search for headphones on amazon');
      }
      const elapsed = performance.now() - start;
      expect(elapsed / 1000).toBeLessThan(5); // <5ms per call
    });
  });
});
