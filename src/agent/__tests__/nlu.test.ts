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

    it('returns detected language', () => {
      const result = understand('search for headphones');
      expect(result.detectedLanguage).toBe('en');
    });
  });

  describe('Multi-Language NLU', () => {
    describe('Spanish', () => {
      it('classifies search intent in Spanish', () => {
        const result = understand('buscar auriculares');
        expect(result.intent).toBe('search');
        expect(result.detectedLanguage).toBe('es');
      });

      it('classifies navigate intent in Spanish', () => {
        const result = understand('abrir google');
        expect(result.intent).toBe('navigate');
      });

      it('classifies back intent in Spanish', () => {
        const result = understand('atrás');
        expect(result.intent).toBe('back');
      });

      it('classifies help intent in Spanish', () => {
        const result = understand('ayuda');
        expect(result.intent).toBe('help');
      });
    });

    describe('French', () => {
      it('classifies search intent in French', () => {
        const result = understand('chercher des écouteurs');
        expect(result.intent).toBe('search');
        expect(result.detectedLanguage).toBe('fr');
      });

      it('classifies navigate intent in French', () => {
        const result = understand('ouvrir google');
        expect(result.intent).toBe('navigate');
      });

      it('classifies back intent in French', () => {
        const result = understand('retourner');
        expect(result.intent).toBe('back');
      });
    });

    describe('German', () => {
      it('classifies search intent in German', () => {
        const result = understand('suche nach kopfhörern');
        expect(result.intent).toBe('search');
        expect(result.detectedLanguage).toBe('de');
      });

      it('classifies navigate intent in German', () => {
        const result = understand('öffne google');
        expect(result.intent).toBe('navigate');
      });

      it('classifies help intent in German', () => {
        const result = understand('hilfe');
        expect(result.intent).toBe('help');
      });
    });

    describe('Italian', () => {
      it('classifies search intent in Italian', () => {
        const result = understand('cerca cuffie');
        expect(result.intent).toBe('search');
        expect(result.detectedLanguage).toBe('it');
      });
    });

    describe('Portuguese', () => {
      it('classifies search intent in Portuguese', () => {
        const result = understand('buscar fones');
        expect(result.intent).toBe('search');
        expect(result.detectedLanguage).toBe('pt');
      });
    });

    describe('Russian', () => {
      it('classifies search intent in Russian', () => {
        const result = understand('найти наушники');
        expect(result.intent).toBe('search');
        expect(result.detectedLanguage).toBe('ru');
      });

      it('classifies back intent in Russian', () => {
        const result = understand('назад');
        expect(result.intent).toBe('back');
      });
    });

    describe('Japanese', () => {
      it('classifies search intent in Japanese', () => {
        const result = understand('ヘッドフォンを検索');
        expect(result.intent).toBe('search');
        expect(result.detectedLanguage).toBe('ja');
      });

      it('classifies back intent in Japanese', () => {
        const result = understand('戻る');
        expect(result.intent).toBe('back');
      });
    });

    describe('Korean', () => {
      it('classifies search intent in Korean', () => {
        const result = understand('이어폰 검색');
        expect(result.intent).toBe('search');
        expect(result.detectedLanguage).toBe('ko');
      });
    });

    describe('Chinese', () => {
      it('classifies search intent in Chinese', () => {
        const result = understand('搜索耳机');
        expect(result.intent).toBe('search');
        expect(result.detectedLanguage).toBe('zh');
      });

      it('classifies back intent in Chinese', () => {
        const result = understand('返回');
        expect(result.intent).toBe('back');
      });
    });

    describe('Arabic', () => {
      it('classifies search intent in Arabic', () => {
        const result = understand('ابحث عن سماعات');
        expect(result.intent).toBe('search');
        expect(result.detectedLanguage).toBe('ar');
      });
    });

    describe('Hindi', () => {
      it('classifies search intent in Hindi', () => {
        const result = understand('हेडफोन खोजो');
        expect(result.intent).toBe('search');
        expect(result.detectedLanguage).toBe('hi');
      });
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
