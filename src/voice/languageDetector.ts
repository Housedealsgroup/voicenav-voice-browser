// VoiceNav Real-Time Language Detector
// Detects language from text using Unicode ranges, common words, and character frequency
// Optimized for speed — runs in <1ms on typical voice input

import { SUPPORTED_LANGUAGES, type LanguageConfig } from './languages';

export type DetectionResult = {
  language: LanguageConfig;
  confidence: number;
  alternatives: Array<{ language: LanguageConfig; confidence: number }>;
};

// Unicode range matchers for script-based detection
const SCRIPT_RANGES: Array<{ lang: string; regex: RegExp }> = [
  { lang: 'ja', regex: /[\u3040-\u309f\u30a0-\u30ff]/ }, // Hiragana/Katakana — must be before zh since Japanese uses Kanji too
  { lang: 'zh', regex: /[\u4e00-\u9fff\u3400-\u4dbf]/ },
  { lang: 'ko', regex: /[\uac00-\ud7af\u1100-\u11ff]/ },
  { lang: 'ar', regex: /[\u0600-\u06ff\u0750-\u077f]/ },
  { lang: 'he', regex: /[\u0590-\u05ff]/ },
  { lang: 'th', regex: /[\u0e00-\u0e7f]/ },
  { lang: 'hi', regex: /[\u0900-\u097f]/ },
  { lang: 'uk', regex: /[\u0400-\u04ff]/ }, // Cyrillic — shared with ru, but uk-specific words disambiguate
];

// Common stop words per language for fast matching
const STOP_WORDS: Record<string, string[]> = {
  en: ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'to', 'for', 'of', 'with', 'it', 'this', 'that', 'do', 'can', 'will', 'go', 'open', 'search', 'click'],
  es: ['el', 'la', 'los', 'las', 'de', 'en', 'y', 'que', 'es', 'un', 'una', 'por', 'con', 'para', 'del', 'al', 'se', 'no', 'abrir', 'buscar', 'ir', 'atrás', 'ayuda', 'adelante', 'clic', 'leer', 'desplazar', 'comprar', 'carrito'],
  fr: ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'est', 'en', 'que', 'pour', 'dans', 'avec', 'sur', 'pas', 'ouvrir', 'chercher', 'aller', 'aide', 'retour', 'retourner', 'avant', 'cliquer', 'lire', 'défiler', 'acheter', 'panier', 'aller', 'revenir'],
  de: ['der', 'die', 'das', 'ein', 'eine', 'und', 'ist', 'in', 'von', 'zu', 'mit', 'auf', 'für', 'nicht', 'sich', 'dem', 'den', 'öffnen', 'suchen', 'suche', 'nach', 'gehen', 'hilfe', 'zurück', 'weiter', 'klicken', 'lesen', 'scrollen', 'kaufen', 'warenkorb'],
  it: ['il', 'lo', 'la', 'i', 'gli', 'le', 'di', 'del', 'dello', 'della', 'dei', 'degli', 'delle', 'in', 'da', 'a', 'per', 'con', 'su', 'per', 'aprire', 'cercare', 'andare', 'cerca', 'aiuto', 'avanti', 'indietro', 'scorri', 'clicca'],
  pt: ['o', 'a', 'os', 'as', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'por', 'com', 'para', 'um', 'uma', 'abrir', 'procurar', 'ir', 'buscar', 'ajuda', 'voltar', 'clique', 'fones', 'ouvido', 'fone', 'buscar', 'pesquisar'],
  ru: ['и', 'в', 'не', 'на', 'я', 'что', 'он', 'как', 'это', 'по', 'но', 'к', 'за', 'из', 'они', 'мы', 'вы', 'открыть', 'открой', 'гугл', 'искать', 'идти', 'найти', 'помощь', 'назад', 'нажми', 'прокрутка'],
  ja: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'する', 'から', 'こと', 'これ', 'それ', 'あける', 'さがす', '検索', '探して', '戻る', '助けて', 'クリック'],
  ko: ['의', '에', '는', '을', '가', '이', '의', '로', '으로', '와', '과', '도', '를', '으로', '만', '까지', '부터', '열다', '검색', '가다'],
  zh: ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '打开', '搜索', '去'],
  ar: ['في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي', 'كان', 'هو', 'هي', 'فتح', 'بحث', 'اذهب'],
  hi: ['में', 'के', 'की', 'को', 'है', 'से', 'पर', 'एक', 'और', 'यह', 'वह', 'क्या', 'हो', 'गया', 'खोलो', 'खोजो', 'जाओ'],
  nl: ['de', 'het', 'een', 'van', 'en', 'in', 'is', 'dat', 'op', 'te', 'zijn', 'er', 'niet', 'ook', 'aan', 'openen', 'zoeken', 'zoek', 'naar', 'gaan'],
  pl: ['w', 'na', 'nie', 'się', 'z', 'do', 'jest', 'że', 'o', 'jak', 'ale', 'co', 'tak', 'za', 'od', 'otworzyć', 'szukać', 'iść'],
  sv: ['och', 'att', 'det', 'i', 'en', 'som', 'av', 'för', 'med', 'den', 'till', 'på', 'är', 'inte', 'har', 'efter', 'öppna', 'söka', 'gå'],
  da: ['og', 'at', 'det', 'i', 'en', 'som', 'af', 'for', 'med', 'den', 'til', 'på', 'er', 'ikke', 'har', 'åbne', 'søge', 'gå'],
  fi: ['ja', 'on', 'ei', 'se', 'että', 'oli', 'niin', 'hän', 'kun', 'jos', 'ovat', 'ole', 'tai', 'nyt', 'avata', 'hakea', 'mennä'],
  nb: ['og', 'at', 'det', 'i', 'en', 'som', 'av', 'for', 'med', 'den', 'til', 'på', 'er', 'ikke', 'har', 'åpne', 'søke', 'gå'],
  tr: ['bir', 've', 'bu', 'da', 'de', 'için', 'ile', 'mi', 'ne', 'o', 'çok', 'var', 'ama', 'gibi', 'ara', 'açmak', 'aramak', 'gitmek'],
  th: ['และ', 'ใน', 'ที่', 'เป็น', 'การ', 'มี', 'จะ', 'ไม่', 'ได้', 'ไป', 'มา', 'ทำ', 'ให้', 'เปิด', 'ค้นหา', 'ไป'],
  vi: ['và', 'của', 'là', 'cho', 'với', 'các', 'một', 'được', 'không', 'này', 'đó', 'từ', 'nhưng', 'mở', 'tìm', 'đi'],
  id: ['dan', 'di', 'yang', 'untuk', 'dengan', 'ini', 'itu', 'dari', 'tidak', 'akan', 'pada', 'juga', 'buka', 'cari', 'pergi'],
  ms: ['dan', 'di', 'yang', 'untuk', 'dengan', 'ini', 'itu', 'dari', 'tidak', 'akan', 'pada', 'juga', 'buka', 'cari', 'pergi'],
  uk: ['і', 'в', 'не', 'на', 'що', 'він', 'як', 'це', 'по', 'але', 'до', 'за', 'від', 'вони', 'ми', 'відкрити', 'шукати', 'йти'],
  cs: ['a', 'v', 'je', 'se', 'na', 'to', 'z', 'do', 'jako', 'ale', 'za', 'podle', 'tak', 'co', 'otevřít', 'hledat', 'jít'],
  el: ['και', 'σε', 'το', 'που', 'από', 'για', 'με', 'δεν', 'αυτό', 'είναι', 'αλλά', 'ή', 'ανοίγω', 'ψάχνω', 'πάω'],
  he: ['של', 'את', 'על', 'אל', 'זה', 'הוא', 'היא', 'אם', 'או', 'אבל', 'גם', 'כל', 'לא', 'פתח', 'חפש', 'לך'],
  ro: ['și', 'în', 'de', 'la', 'cu', 'pe', 'nu', 'este', 'un', 'o', 'din', 'pentru', 'care', 'deschide', 'căuta', 'merge'],
  hu: ['a', 'az', 'egy', 'és', 'van', 'nem', 'hogy', 'ez', 'de', 'is', 'meg', 'csak', 'mint', 'nyitni', 'keresni', 'menni'],
};

// Character frequency patterns for Latin-script languages
const CHAR_PATTERNS: Record<string, RegExp[]> = {
  es: [/[ñ¿¡]/, /ción$/, /mente$/],
  fr: [/[àâæçéèêëîïôœùûüÿ]/, /(?:eux|aux|eau)$/],
  de: [/[äöüß]/, /(?:ung|keit|schaft|lich)$/],
  it: [/[àèéìíîòóùú]/, /(?:zione|mente|aggio)$/],
  pt: [/[ãõç]/, /(?:ção|mente|agem)$/],
  pl: [/[ąćęłńóśźż]/],
  cs: [/[áčďéěíňóřšťúůýž]/],
  ro: [/[ăâîșț]/],
  hu: [/[áéíóöőúüű]/],
  sv: [/[åäö]/],
  da: [/[æøå]/],
  fi: [/[äö]/],
  nb: [/[æøå]/],
  el: [/[\u0370-\u03ff]/],
};

// Fast Unicode script detection
function detectScript(text: string): string | null {
  for (const { lang, regex } of SCRIPT_RANGES) {
    if (regex.test(text)) return lang;
  }
  return null;
}

// Score a text against a language's stop words
function scoreStopWords(text: string, langCode: string): number {
  const words = STOP_WORDS[langCode];
  if (!words) return 0;
  const textWords = text.toLowerCase().split(/\s+/);
  let matches = 0;
  for (const word of textWords) {
    if (words.includes(word)) matches++;
  }
  return textWords.length > 0 ? matches / textWords.length : 0;
}

// Score character patterns
function scoreCharPatterns(text: string, langCode: string): number {
  const patterns = CHAR_PATTERNS[langCode];
  if (!patterns) return 0;
  for (const pattern of patterns) {
    if (pattern instanceof RegExp ? pattern.test(text) : false) return 1;
  }
  return 0;
}

// Main detection function — optimized for speed
export function detectLanguage(text: string): DetectionResult {
  if (!text || text.trim().length === 0) {
    const en = SUPPORTED_LANGUAGES.find(l => l.code === 'en')!;
    return { language: en, confidence: 0.5, alternatives: [] };
  }

  const normalized = text.toLowerCase().trim();
  const scores: Array<{ lang: LanguageConfig; score: number }> = [];

  // Step 1: Script-based detection (instant, high confidence)
  const scriptLang = detectScript(normalized);
  if (scriptLang) {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === scriptLang);
    if (lang) {
      // For Cyrillic, disambiguate ru vs uk
      if (scriptLang === 'uk') {
        const ukScore = scoreStopWords(normalized, 'uk');
        const ruScore = scoreStopWords(normalized, 'ru');
        if (ruScore > ukScore) {
          const ru = SUPPORTED_LANGUAGES.find(l => l.code === 'ru')!;
          return { language: ru, confidence: 0.9, alternatives: [{ language: lang, confidence: 0.7 }] };
        }
      }
      return { language: lang, confidence: 0.95, alternatives: [] };
    }
  }

  // Step 2: Score all Latin-script languages
  const latinLangs = SUPPORTED_LANGUAGES.filter(l =>
    !['zh', 'ja', 'ko', 'ar', 'he', 'th', 'hi'].includes(l.code)
  );

  for (const lang of latinLangs) {
    let score = 0;
    const wordScore = scoreStopWords(normalized, lang.code);
    score += wordScore > 0 ? 0.4 + wordScore * 0.4 : 0; // Base 0.4 for any match + proportional
    const charScore = scoreCharPatterns(normalized, lang.code);
    score += charScore * 0.4; // Char patterns are 40% of score
    scores.push({ lang, score });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];
  const second = scores[1];

  if (best.score === 0) {
    // No matches — default to English
    const en = SUPPORTED_LANGUAGES.find(l => l.code === 'en')!;
    return { language: en, confidence: 0.5, alternatives: [] };
  }

  const confidence = Math.min(0.95, best.score);
  const alternatives = scores
    .slice(1, 4)
    .filter(s => s.score > 0)
    .map(s => ({ language: s.lang, confidence: s.score }));

  return {
    language: best.lang,
    confidence,
    alternatives,
  };
}

// Quick check — is this text likely a different language than expected?
export function isLanguageMismatch(text: string, expectedLangCode: string): boolean {
  const result = detectLanguage(text);
  return result.language.code !== expectedLangCode && result.confidence > 0.6;
}

// Get the BCP-47 STT code for detected language
export function detectSTTLang(text: string): string {
  return detectLanguage(text).language.sttCode;
}
