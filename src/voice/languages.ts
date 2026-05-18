// VoiceNav Multi-Language Support — 25+ languages for voice commands

export type LanguageConfig = {
  code: string;
  name: string;
  nativeName: string;
  sttCode: string; // BCP-47 tag for speech recognition
  ttsCode: string; // BCP-47 tag for text-to-speech
  isRTL?: boolean;
};

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', sttCode: 'en-US', ttsCode: 'en-US' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', sttCode: 'es-ES', ttsCode: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', sttCode: 'fr-FR', ttsCode: 'fr-FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', sttCode: 'de-DE', ttsCode: 'de-DE' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', sttCode: 'it-IT', ttsCode: 'it-IT' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', sttCode: 'pt-BR', ttsCode: 'pt-BR' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', sttCode: 'ru-RU', ttsCode: 'ru-RU' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', sttCode: 'ja-JP', ttsCode: 'ja-JP' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', sttCode: 'ko-KR', ttsCode: 'ko-KR' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', sttCode: 'zh-CN', ttsCode: 'zh-CN' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', sttCode: 'ar-SA', ttsCode: 'ar-SA', isRTL: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', sttCode: 'hi-IN', ttsCode: 'hi-IN' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', sttCode: 'nl-NL', ttsCode: 'nl-NL' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', sttCode: 'pl-PL', ttsCode: 'pl-PL' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', sttCode: 'sv-SE', ttsCode: 'sv-SE' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', sttCode: 'da-DK', ttsCode: 'da-DK' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', sttCode: 'fi-FI', ttsCode: 'fi-FI' },
  { code: 'nb', name: 'Norwegian', nativeName: 'Norsk', sttCode: 'nb-NO', ttsCode: 'nb-NO' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', sttCode: 'tr-TR', ttsCode: 'tr-TR' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', sttCode: 'th-TH', ttsCode: 'th-TH' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', sttCode: 'vi-VN', ttsCode: 'vi-VN' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', sttCode: 'id-ID', ttsCode: 'id-ID' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', sttCode: 'ms-MY', ttsCode: 'ms-MY' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', sttCode: 'uk-UA', ttsCode: 'uk-UA' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', sttCode: 'cs-CZ', ttsCode: 'cs-CZ' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', sttCode: 'el-GR', ttsCode: 'el-GR' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', sttCode: 'he-IL', ttsCode: 'he-IL', isRTL: true },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', sttCode: 'ro-RO', ttsCode: 'ro-RO' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', sttCode: 'hu-HU', ttsCode: 'hu-HU' },

  // === European Languages ===
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', sttCode: 'bg-BG', ttsCode: 'bg-BG' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', sttCode: 'hr-HR', ttsCode: 'hr-HR' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', sttCode: 'sk-SK', ttsCode: 'sk-SK' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', sttCode: 'sl-SI', ttsCode: 'sl-SI' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', sttCode: 'lt-LT', ttsCode: 'lt-LT' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', sttCode: 'lv-LV', ttsCode: 'lv-LV' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', sttCode: 'et-EE', ttsCode: 'et-EE' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', sttCode: 'sr-RS', ttsCode: 'sr-RS' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', sttCode: 'mk-MK', ttsCode: 'mk-MK' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', sttCode: 'sq-AL', ttsCode: 'sq-AL' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', sttCode: 'is-IS', ttsCode: 'is-IS' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', sttCode: 'ga-IE', ttsCode: 'ga-IE' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', sttCode: 'cy-GB', ttsCode: 'cy-GB' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', sttCode: 'mt-MT', ttsCode: 'mt-MT' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', sttCode: 'eu-ES', ttsCode: 'eu-ES' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', sttCode: 'gl-ES', ttsCode: 'gl-ES' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', sttCode: 'ca-ES', ttsCode: 'ca-ES' },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', sttCode: 'lb-LU', ttsCode: 'lb-LU' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', sttCode: 'af-ZA', ttsCode: 'af-ZA' },

  // === South Asian Languages ===
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', sttCode: 'bn-BD', ttsCode: 'bn-BD' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', sttCode: 'ta-IN', ttsCode: 'ta-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', sttCode: 'te-IN', ttsCode: 'te-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', sttCode: 'ml-IN', ttsCode: 'ml-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', sttCode: 'kn-IN', ttsCode: 'kn-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', sttCode: 'mr-IN', ttsCode: 'mr-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', sttCode: 'gu-IN', ttsCode: 'gu-IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', sttCode: 'pa-IN', ttsCode: 'pa-IN' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', sttCode: 'ur-PK', ttsCode: 'ur-PK', isRTL: true },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', sttCode: 'ne-NP', ttsCode: 'ne-NP' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', sttCode: 'si-LK', ttsCode: 'si-LK' },

  // === Southeast Asian Languages ===
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ', sttCode: 'my-MM', ttsCode: 'my-MM' },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ', sttCode: 'km-KH', ttsCode: 'km-KH' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', sttCode: 'lo-LA', ttsCode: 'lo-LA' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол', sttCode: 'mn-MN', ttsCode: 'mn-MN' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', sttCode: 'az-AZ', ttsCode: 'az-AZ' },

  // === Caucasian & Central Asian ===
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', sttCode: 'ka-GE', ttsCode: 'ka-GE' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', sttCode: 'am-ET', ttsCode: 'am-ET' },
  { code: 'uz', name: 'Uzbek', nativeName: "O'zbek", sttCode: 'uz-UZ', ttsCode: 'uz-UZ' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ', sttCode: 'kk-KZ', ttsCode: 'kk-KZ' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргыз', sttCode: 'ky-KG', ttsCode: 'ky-KG' },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', sttCode: 'tg-TJ', ttsCode: 'tg-TJ' },

  // === African Languages ===
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', sttCode: 'sw-KE', ttsCode: 'sw-KE' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', sttCode: 'zu-ZA', ttsCode: 'zu-ZA' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', sttCode: 'xh-ZA', ttsCode: 'xh-ZA' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', sttCode: 'ha-NG', ttsCode: 'ha-NG' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', sttCode: 'yo-NG', ttsCode: 'yo-NG' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', sttCode: 'ig-NG', ttsCode: 'ig-NG' },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona', sttCode: 'sn-ZW', ttsCode: 'sn-ZW' },
  { code: 'st', name: 'Southern Sotho', nativeName: 'Sesotho', sttCode: 'st-ZA', ttsCode: 'st-ZA' },
  { code: 'tn', name: 'Tswana', nativeName: 'Setswana', sttCode: 'tn-ZA', ttsCode: 'tn-ZA' },
  { code: 'ts', name: 'Tsonga', nativeName: 'Xitsonga', sttCode: 'ts-ZA', ttsCode: 'ts-ZA' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', sttCode: 'rw-RW', ttsCode: 'rw-RW' },
  { code: 'lg', name: 'Ganda', nativeName: 'Luganda', sttCode: 'lg-UG', ttsCode: 'lg-UG' },
  { code: 'ak', name: 'Akan', nativeName: 'Akan', sttCode: 'ak-GH', ttsCode: 'ak-GH' },
  { code: 'wo', name: 'Wolof', nativeName: 'Wolof', sttCode: 'wo-SN', ttsCode: 'wo-SN' },

  // === Middle Eastern Languages ===
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', sttCode: 'fa-IR', ttsCode: 'fa-IR', isRTL: true },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', sttCode: 'ps-AF', ttsCode: 'ps-AF', isRTL: true },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî', sttCode: 'ku-TR', ttsCode: 'ku-TR' },

  // === Pacific Languages ===
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', sttCode: 'fil-PH', ttsCode: 'fil-PH' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', sttCode: 'haw-US', ttsCode: 'haw-US' },
  { code: 'mi', name: 'Maori', nativeName: 'Te Reo Māori', sttCode: 'mi-NZ', ttsCode: 'mi-NZ' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Samoa', sttCode: 'sm-WS', ttsCode: 'sm-WS' },
  { code: 'to', name: 'Tongan', nativeName: 'Lea faka-Tonga', sttCode: 'to-TO', ttsCode: 'to-TO' },
  { code: 'fj', name: 'Fijian', nativeName: 'Na Vosa Vakaviti', sttCode: 'fj-FJ', ttsCode: 'fj-FJ' },

  // === Additional European ===
  { code: 'br', name: 'Breton', nativeName: 'Brezhoneg', sttCode: 'br-FR', ttsCode: 'br-FR' },
  { code: 'oc', name: 'Occitan', nativeName: 'Occitan', sttCode: 'oc-FR', ttsCode: 'oc-FR' },
  { code: 'sc', name: 'Sardinian', nativeName: 'Sardu', sttCode: 'sc-IT', ttsCode: 'sc-IT' },
  { code: 'vec', name: 'Venetian', nativeName: 'Vèneto', sttCode: 'vec-IT', ttsCode: 'vec-IT' },
  { code: 'nap', name: 'Neapolitan', nativeName: 'Napulitano', sttCode: 'nap-IT', ttsCode: 'nap-IT' },
  { code: 'lld', name: 'Ladin', nativeName: 'Ladin', sttCode: 'lld-IT', ttsCode: 'lld-IT' },
  { code: 'rm', name: 'Romansh', nativeName: 'Rumantsch', sttCode: 'rm-CH', ttsCode: 'rm-CH' },
  { code: 'fur', name: 'Friulian', nativeName: 'Furlan', sttCode: 'fur-IT', ttsCode: 'fur-IT' },

  // === Additional Asian ===
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa', sttCode: 'jv-ID', ttsCode: 'jv-ID' },
  { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda', sttCode: 'su-ID', ttsCode: 'su-ID' },
  { code: 'ceb', name: 'Cebuano', nativeName: 'Cebuano', sttCode: 'ceb-PH', ttsCode: 'ceb-PH' },
  { code: 'hil', name: 'Hiligaynon', nativeName: 'Ilonggo', sttCode: 'hil-PH', ttsCode: 'hil-PH' },
  { code: 'war', name: 'Waray', nativeName: 'Winaray', sttCode: 'war-PH', ttsCode: 'war-PH' },
  { code: 'pam', name: 'Kapampangan', nativeName: 'Kapampangan', sttCode: 'pam-PH', ttsCode: 'pam-PH' },
  { code: 'bcl', name: 'Bikol', nativeName: 'Bikol', sttCode: 'bcl-PH', ttsCode: 'bcl-PH' },

  // === Creole & Pidgin ===
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen', sttCode: 'ht-HT', ttsCode: 'ht-HT' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy', sttCode: 'mg-MG', ttsCode: 'mg-MG' },
  { code: 'co', name: 'Corsican', nativeName: 'Corsu', sttCode: 'co-FR', ttsCode: 'co-FR' },
  { code: 'gd', name: 'Scottish Gaelic', nativeName: 'Gàidhlig', sttCode: 'gd-GB', ttsCode: 'gd-GB' },

  // === Constructed & Minority ===
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto', sttCode: 'eo', ttsCode: 'eo' },
];

export function getLanguageByCode(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find(l => l.code === code);
}

export function getLanguageName(code: string): string {
  return getLanguageByCode(code)?.name || code;
}
