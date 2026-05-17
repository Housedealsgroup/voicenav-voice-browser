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
  { lang: 'uk', regex: /[\u0400-\u04ff]/ }, // Cyrillic — shared with ru, bg, sr, mk, mn, kk, ky, tg — disambiguated via stop words
  { lang: 'bn', regex: /[\u0980-\u09ff]/ }, // Bengali
  { lang: 'ta', regex: /[\u0b80-\u0bff]/ }, // Tamil
  { lang: 'te', regex: /[\u0c00-\u0c7f]/ }, // Telugu
  { lang: 'ml', regex: /[\u0d00-\u0d7f]/ }, // Malayalam
  { lang: 'kn', regex: /[\u0c80-\u0cff]/ }, // Kannada
  { lang: 'gu', regex: /[\u0a80-\u0aff]/ }, // Gujarati
  { lang: 'pa', regex: /[\u0a00-\u0a7f]/ }, // Gurmukhi (Punjabi)
  { lang: 'si', regex: /[\u0d80-\u0dff]/ }, // Sinhala
  { lang: 'my', regex: /[\u1000-\u109f]/ }, // Myanmar
  { lang: 'km', regex: /[\u1780-\u17ff]/ }, // Khmer
  { lang: 'lo', regex: /[\u0e80-\u0eff]/ }, // Lao
  { lang: 'ka', regex: /[\u10a0-\u10ff]/ }, // Georgian
  { lang: 'am', regex: /[\u1200-\u137f]/ }, // Ethiopic (Amharic)
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

  // === European Languages ===
  bg: ['и', 'на', 'за', 'от', 'в', 'се', 'да', 'не', 'е', 'с', 'по', 'но', 'като', 'това', 'са', 'му', 'ги', 'отвори', 'търси', 'отида'],
  hr: ['i', 'u', 'je', 'na', 'za', 'se', 'da', 'ne', 'od', 'su', 'što', 'kao', 'ili', 'ali', 'otvoriti', 'tražiti', 'ići', 'pomoć'],
  sk: ['a', 'v', 'je', 'na', 'sa', 'do', 'to', 'z', 'od', 'ale', 'ako', 'čo', 'tak', 'sú', 'otvoriť', 'hľadať', 'ísť'],
  sl: ['in', 'je', 'na', 'za', 'v', 'se', 'da', 'ni', 'od', 'so', 'kaj', 'kot', 'ali', 'ampak', 'odpreti', 'iskati', 'iti'],
  lt: ['ir', 'yra', 'kad', 'tai', 'su', 'bet', 'ne', 'iš', 'į', 'buvo', 'jį', 'jos', 'jų', 'atidaryti', 'ieškoti', 'eiti'],
  lv: ['un', 'ir', 'ka', 'ar', 'no', 'uz', 'bet', 'vai', 'tas', 'tā', 'par', 'ne', 'bija', 'atvērt', 'meklēt', 'iet'],
  et: ['ja', 'on', 'ei', 'see', 'et', 'oli', 'kui', 'mis', 'aga', 'ka', 'ning', 'tema', 'ta', 'avata', 'otsida', 'minna'],
  sr: ['и', 'у', 'на', 'за', 'се', 'да', 'не', 'од', 'су', 'што', 'као', 'или', 'али', 'отворити', 'тражити', 'ићи', 'помоћ'],
  mk: ['и', 'во', 'на', 'за', 'од', 'се', 'да', 'не', 'е', 'со', 'по', 'но', 'што', 'кои', 'отвори', 'бараш', 'оди', 'помош'],
  sq: ['dhe', 'e', 'të', 'në', 'për', 'me', 'që', 'është', 'i', 'një', 'ka', 'ose', 'por', 'si', 'hap', 'kërko', 'shko'],
  is: ['og', 'er', 'að', 'í', 'það', 'sem', 'ekki', 'til', 'af', 'með', 'en', 'eða', 'hann', 'hún', 'opna', 'leita', 'fara'],
  ga: ['agus', 'an', 'na', 'ar', 'is', 'le', 'ní', 'go', 'do', 'den', 'sé', 'sí', 'a', 'níos', 'oscail', 'cuardaigh', 'téigh'],
  cy: ['a', 'yn', 'y', 'yr', 'o', 'i', 'ei', 'am', 'ac', 'ond', 'neu', 'ma', 'ef', 'hi', 'agor', 'chwilio', 'mynd'],
  mt: ['u', 'ta', 'li', 'fil', 'lil', 'għal', 'minn', 'ma', 'huwa', 'hija', 'jew', 'imma', 'ftit', 'iftħ', 'fittex', 'mur'],
  eu: ['eta', 'da', 'ez', 'bat', 'dira', 'du', 'baina', 'ere', 'horren', 'nire', 'zure', 'haren', 'ireki', 'bilatu', 'joan'],
  gl: ['e', 'de', 'a', 'o', 'que', 'en', 'do', 'da', 'non', 'un', 'unha', 'por', 'con', 'para', 'abrir', 'buscar', 'ir'],
  ca: ['i', 'de', 'la', 'el', 'en', 'que', 'un', 'una', 'per', 'amb', 'no', 'és', 'del', 'al', 'obre', 'cerca', 'anar'],
  lb: ['an', 'den', 'op', 'fir', 'mat', 'ass', 'net', 'oder', 'mä', 'datt', 'opmaachen', 'sichen', 'goen', 'wäer'],
  af: ['en', 'die', 'van', 'is', 'in', 'op', 'dat', 'vir', 'met', 'nie', 'dit', 'om', 'wat', 'maar', 'of', 'oop', 'soek', 'gaan'],

  // === South Asian Languages ===
  bn: ['এবং', 'এর', 'এই', 'তার', 'কি', 'না', 'হয়', 'করে', 'থেকে', 'জন্য', 'সাথে', 'ও', 'কিন্তু', 'খোলো', 'অনুসন্ধান', 'যাও'],
  ta: ['மற்றும்', 'இது', 'அது', 'என்று', 'ஒரு', 'இல்', 'போன்ற', 'அல்லது', 'ஆனால்', 'இருந்து', 'உடன்', 'திற', 'தேடு', 'செல்'],
  te: ['మరియు', 'ఈ', 'అది', 'అని', 'ఒక', 'లో', 'కానీ', 'లేదా', 'తో', 'నుండి', 'కోసం', 'తెరువు', 'వెతక', 'వెళ్ళు'],
  ml: ['ഉം', 'ഇത്', 'അത്', 'എന്ന്', 'ഒരു', 'ൽ', 'അല്ലെങ്കിൽ', 'പക്ഷേ', 'ഇൽ', 'നിന്ന്', 'വേണ്ടി', 'തുറക്കുക', 'തിരയുക', 'പോകുക'],
  kn: ['ಮತ್ತು', 'ಇದು', 'ಅದು', 'ಎಂದು', 'ಒಂದು', 'ಅಲ್ಲಿ', 'ಆದರೆ', 'ಅಥವಾ', 'ಜೊತೆ', 'ನಿಂದ', 'ಗಾಗಿ', 'ತೆರೆ', 'ಹುಡುಕ', 'ಹೋಗ'],
  mr: ['आणि', 'या', 'त्या', 'मध्ये', 'एक', 'आहे', 'की', 'नाही', 'पण', 'किंवा', 'साठी', 'शोध', 'उघडा', 'जा'],
  gu: ['અને', 'આ', 'તે', 'છે', 'એક', 'માં', 'થી', 'ને', 'પણ', 'કે', 'શોધ', 'ખોલો', 'જા', 'માટે'],
  pa: ['ਅਤੇ', 'ਇਹ', 'ਉਹ', 'ਹੈ', 'ਇੱਕ', 'ਵਿੱਚ', 'ਤੋਂ', 'ਨੂੰ', 'ਪਰ', 'ਜਾਂ', 'ਖੋਲ੍ਹੋ', 'ਲੱਭੋ', 'ਜਾਓ'],
  ur: ['اور', 'ہے', 'میں', 'کو', 'سے', 'پر', 'ایک', 'یہ', 'وہ', 'کا', 'لیے', 'کھولو', 'تلاش', 'جاؤ'],
  ne: ['र', 'को', 'मा', 'लाई', 'बाट', 'पर', 'एक', 'यो', 'त्यो', 'छ', 'कि', 'तर', 'वा', 'खोल', 'खोज', 'जा'],
  si: ['සහ', 'මෙම', 'එම', 'වේ', 'එකක්', 'තුළ', 'නැත', 'හෝ', 'නමුත්', 'සඳහා', 'විවෘත', 'සොයන්න', 'යන්න'],

  // === Southeast Asian Languages ===
  my: ['နှင့်', '၏', 'တွင်', 'သည်', 'ကို', 'မှ', 'မ', 'သော', 'ဖြစ်', 'အား', 'ဖွင့်', 'ရှာ', 'သွား'],
  km: ['និង', 'ក្នុង', 'នៃ', 'ជា', 'មួយ', 'ដែល', 'មិន', 'ទេ', 'ឬ', 'ប៉ុន្តែ', 'សម្រាប់', 'បើក', 'ស្វែងរក', 'ទៅ'],
  lo: ['ແລະ', 'ໃນ', 'ຂອງ', 'ເປັນ', 'ກັບ', 'ທີ່', 'ບໍ່', 'ໄດ້', 'ຫຼື', 'ແຕ່', 'ສໍາລັບ', 'ເປີດ', 'ຊອກຫາ', 'ໄປ'],
  mn: ['ба', 'нь', 'ний', 'байна', 'нэг', 'энэ', 'тэр', 'гэхдээ', 'эсвэл', 'харин', 'нээх', 'хайх', 'явах'],
  az: ['və', 'bu', 'bir', 'olan', 'ilə', 'üçün', 'də', 'ki', 'amma', 'deyil', 'açmaq', 'axtarış', 'getmək'],

  // === Caucasian & Central Asian ===
  ka: ['და', 'ეს', 'ის', 'რომ', 'არის', 'არ', 'ერთი', 'მისი', 'ჩემი', 'შენი', 'მაგრამ', 'ან', 'გახსნა', 'ძებნა', 'წასვლა'],
  am: ['እና', 'ይህ', 'ያ', 'ነው', 'አንድ', 'ላይ', 'ከ', 'ወደ', 'ስለ', 'ግን', 'ወይም', 'ክፈት', 'ፈልግ', 'ሂድ'],
  uz: ['va', 'bu', 'bir', 'bilan', 'uchun', 'lekin', 'yoki', 'emas', 'edi', 'deb', 'ham', 'ochish', 'qidirish', 'ketish'],
  kk: ['және', 'бұл', 'ол', 'бір', 'мен', 'үшін', 'бірақ', 'немесе', 'емес', 'болды', 'ашу', 'іздеу', 'бару'],
  ky: ['жана', 'бул', 'ал', 'бир', 'менен', 'үчүн', 'бирок', 'же', 'эмес', 'болду', 'ачуу', 'издөө', 'баруу'],
  tg: ['ва', 'ин', 'он', 'як', 'бо', 'барои', 'аммо', 'ё', 'не', 'аст', 'кушодан', 'ҷустуҷӯ', 'рафтан'],

  // === African Languages ===
  sw: ['na', 'ya', 'kwa', 'ni', 'wa', 'la', 'za', 'katika', 'kuwa', 'hii', 'hiyo', 'lakini', 'au', 'fungua', 'tafuta', 'enda'],
  zu: ['futhi', 'kanye', 'ukuthi', 'ngokuthi', 'kungaba', 'kodwa', 'noma', 'ngoba', 'kakhulu', 'vula', 'cinga', 'hamba'],
  xh: ['kwaye', 'okanye', 'ngokuba', 'kodwa', 'ukuba', 'ngoko', 'kakade', 'vula', 'khangela', 'hamba', 'kunye'],
  ha: ['da', 'kuma', 'shi', 'ita', 'wani', 'amma', 'ko', 'ba', 'ne', 'ce', 'a', 'bude', 'bincika', 'je'],
  yo: ['ati', 'ni', 'ti', 'si', 'fun', 'nipa', 'pẹlu', 'ṣugbọn', 'tabi', 'jẹ', 'ṣí', 'wá', 'lọ', 'púpọ̀'],
  ig: ['na', 'nke', 'bụ', 'site', 'ọ bụghị', 'ma', 'ọ bụ', 'maka', 'ọ', 'ya', 'mee', 'chọọ', 'ga'],
  sn: ['uye', 'iyo', 'iyi', 'kana', 'asi', 'kuti', 'zvakadaro', 'saka', 'vavhura', 'tsvaka', 'enda', 'kwazvo'],
  st: ['le', 'la', 'ka', 'ho', 'ya', 'ba', 'empa', 'kapa', 'hore', 'bona', 'bula', 'batla', 'tsamaea'],
  tn: ['le', 'la', 'ka', 'go', 'ya', 'ba', 'efela', 'gongwe', 'gore', 'bona', 'bula', 'batla', 'tsamaya'],
  ts: ['na', 'la', 'ka', 'ku', 'ya', 'va', 'kambe', 'kumbe', 'ku ri', 'vona', 'pfulele', 'lavisisa', 'tshika'],
  rw: ['na', 'ya', 'kuri', 'ni', 'mu', 'wa', 'ko', 'ariyo', 'cyangwa', 'none', 'fungura', 'shakisha', 'jya'],
  lg: ['ne', 'ya', 'mu', 'na', 'eri', 'oba', 'nga', 'kubanga', 'wabula', 'naye', 'gule', 'noonya', 'genda'],
  ak: ['ne', 'na', 'mu', 'sɛ', 'nanso', 'anaa', 'de', 'yi', 'no', 'bue', 'hwehwɛ', 'kɔ'],
  wo: ['ak', 'ci', 'bu', 'mu', 'la', 'li', 'te', 'nde', 'naan', 'wax', 'teere', 'bind', 'dem'],

  // === Middle Eastern Languages ===
  fa: ['و', 'در', 'به', 'از', 'که', 'این', 'است', 'با', 'را', 'برای', 'اما', 'یا', 'باز', 'کردن', 'جستجو', 'رفتن'],
  ps: ['او', 'په', 'د', 'له', 'چې', 'دا', 'دی', 'نه', 'یا', 'خو', 'پرانیستل', 'لټون', 'تل'],
  ku: ['û', 'di', 'ji', 'li', 'ku', 'ev', 'ew', 'ne', 'yan', 'lê', 'vê', 'veke', 'lêbigere', 'here'],

  // === Pacific Languages ===
  tl: ['ang', 'ng', 'sa', 'na', 'at', 'ay', 'mga', 'ito', 'niya', 'ko', 'mo', 'para', 'ngunit', 'o', 'buksan', 'hanapin', 'pumunta'],
  haw: ['a', 'ka', 'na', 'o', 'ma', 'he', 'no', 'me', 'i', 'e', 'ke', 'mai', 'akā', 'pehea', 'wehe', 'imi', 'hele'],
  mi: ['te', 'he', 'ko', 'ka', 'ki', 'i', 'a', 'na', 'ma', 'mo', 'engari', 'ranei', 'whakatuwhera', 'rapu', 'haere'],
  sm: ['le', 'o', 'a', 'ma', 'i', 'e', 'ina', 'leai', 'ae', 'po', 'faamatalaga', 'saili', 'aluga'],
  to: ['ko', 'e', 'a', 'mo', 'ha', 'na', 'mei', 'ka', 'pe', 'kae', 'fakatonutonu', 'kumi', 'alu'],
  fj: ['na', 'ka', 'ke', 'ni', 'me', 'mai', 'e', 'ko', 'se', 'vakarau', 'cakacaka', 'lako'],

  // === Additional European ===
  br: ['ha', 'a', 'e', 'war', 'da', 'evit', 'gant', 'na', 'eo', 'pa', 'ma', 'pe', 'digeri', 'klask', 'mont'],
  oc: ['e', 'de', 'la', 'lo', 'que', 'en', 'per', 'amb', 'non', 'un', 'una', 'es', 'obrir', 'cercar', 'anar'],
  sc: ['e', 'de', 'su', 'sa', 'chi', 'in', 'non', 'un', 'una', 'pro', 'cun', 'abèrrere', 'chircare', 'andare'],
  vec: ['e', 'de', 'el', 'ła', 'che', 'in', 'no', 'un', 'par', 'co', 'verzer', 'sercar', 'andar'],
  nap: ['e', 'a', 'o', 'che', 'pe', 'nu', 'na', 'non', 'c\'è', 'chi', 'apre', 'cercà', 'annà'],
  lld: ['y', 'de', 'l', 'la', 'che', 'en', 'per', 'cun', 'non', 'un', 'ë', 'vërtier', 'circher', 'andé'],
  rm: ['e', 'il', 'la', 'che', 'en', 'per', 'cun', 'na', 'non', 'in', 'avair', 'tschertgar', 'ir'],
  fur: ['e', 'di', 'il', 'la', 'che', 'in', 'par', 'cun', 'no', 'un', 'une', 'vierzi', 'cirçâ', 'lâ'],

  // === Additional Asian ===
  jv: ['lan', 'ing', 'kang', 'sing', 'saka', 'karo', 'nanging', 'utawa', 'ora', 'ana', 'mbukak', 'golek', 'lunga'],
  su: ['jeung', 'di', 'anu', 'ti', 'ku', 'tapi', 'atanapi', 'henteu', 'ayeuna', 'buka', 'milarian', 'indit'],
  ceb: ['ug', 'ang', 'sa', 'ni', 'si', 'nga', 'kay', 'o', 'dili', 'niini', 'abli', 'pangita', 'adto'],
  hil: ['kag', 'sang', 'sa', 'sing', 'nga', 'kay', 'o', 'indi', 'sini', 'abre', 'pangita', 'kadto'],
  war: ['ngan', 'han', 'ha', 'nga', 'kay', 'o', 'diri', 'ini', 'abri', 'pangita', 'adto'],
  pam: ['at', 'ning', 'ya', 'ing', 'ne', 'mu', 'ampong', 'o', 'ali', 'nini', 'buksan', 'maghanap', 'pumunta'],
  bcl: ['as', 'nin', 'sa', 'su', 'na', 'dai', 'ini', 'abri', 'pangiton', 'mauli'],

  // === Creole & Pidgin ===
  ht: ['ak', 'nan', 'de', 'pou', 'pa', 'ki', 'se', 'ou', 'men', 'li', 'mwen', 'ouvrè', 'chèche', 'ale'],
  mg: ['ary', 'ny', 'amin\'ny', 'ho', 'ka', 'izy', 'tsy', 'na', 'satria', 'efa', 'sokafana', 'karoka', 'mandeha'],
  co: ['è', 'di', 'u', 'a', 'chì', 'in', 'cù', 'nò', 'un', 'una', 'apre', 'circà', 'andà'],
  gd: ['agus', 'an', 'na', 'gu', 'air', 'le', 'a', 'is', 'ach', 'no', 'fhosgladh', 'lorg', 'rach'],

  // === Constructed ===
  eo: ['kaj', 'de', 'la', 'estas', 'en', 'ke', 'ne', 'kun', 'por', 'sed', 'aŭ', 'mi', 'vi', 'li', 'malfermi', 'serĉi', 'iri'],
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
  hr: [/[čćđšž]/],
  sk: [/[áäčďéíĺľňóôŕšťúýž]/],
  sl: [/[čšž]/],
  lt: [/[ąčęėįšųūž]/],
  lv: [/[āčēģīķļņšūž]/],
  et: [/[äöõüšž]/],
  sq: [/[çë]/],
  is: [/[ðþæö]/],
  cy: [/[âêîôûŵŷ]/],
  mt: [/[ċġħż]/],
  ca: [/[àèéíïòóúüç]/],
  af: [/[ëï]/],
  eo: [/[ĉĝĥĵŝŭ]/],
  ht: [/[èòù]/],
  co: [/[àèìòù]/],
  gd: [/[àèìòù]/],
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
      // Disambiguate shared scripts using stop words
      const SCRIPT_DISAMBIGUATION: Record<string, string[]> = {
        'uk': ['uk', 'ru', 'bg', 'sr', 'mk', 'mn', 'kk', 'ky', 'tg'], // Cyrillic
        'ar': ['ar', 'fa', 'ps', 'ur'], // Arabic script
        'hi': ['hi', 'mr', 'ne'], // Devanagari
      };

      const disambigGroup = SCRIPT_DISAMBIGUATION[scriptLang];
      if (disambigGroup) {
        let bestMatch = scriptLang;
        let bestScore = 0;
        for (const cl of disambigGroup) {
          const s = scoreStopWords(normalized, cl);
          if (s > bestScore) {
            bestScore = s;
            bestMatch = cl;
          }
        }
        if (bestMatch !== scriptLang) {
          const bestLang = SUPPORTED_LANGUAGES.find(l => l.code === bestMatch)!;
          return { language: bestLang, confidence: 0.9, alternatives: [{ language: lang, confidence: 0.7 }] };
        }
      }
      return { language: lang, confidence: 0.95, alternatives: [] };
    }
  }

  // Step 2: Score all Latin-script languages
  const NON_LATIN = new Set([
    'zh', 'ja', 'ko', 'ar', 'he', 'th', 'hi', // original non-Latin
    'bn', 'ta', 'te', 'ml', 'kn', 'gu', 'pa', 'si', // Indic scripts
    'my', 'km', 'lo', // Southeast Asian scripts
    'ka', 'am', // Caucasian/Ethiopic scripts
    'fa', 'ps', 'ur', // Arabic-script languages
    'bg', 'sr', 'mk', 'mn', 'kk', 'ky', 'tg', // Cyrillic-script languages
    'mr', 'ne', // Devanagari (shared with hi)
  ]);
  const latinLangs = SUPPORTED_LANGUAGES.filter(l => !NON_LATIN.has(l.code));

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
