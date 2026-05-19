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

  // === Additional Regional Variants ===
  { code: 'en-AU', name: 'English (Australia)', nativeName: 'English (Australia)', sttCode: 'en-AU', ttsCode: 'en-AU' },
  { code: 'en-IN', name: 'English (India)', nativeName: 'English (India)', sttCode: 'en-IN', ttsCode: 'en-IN' },
  { code: 'en-ZA', name: 'English (South Africa)', nativeName: 'English (South Africa)', sttCode: 'en-ZA', ttsCode: 'en-ZA' },
  { code: 'en-IE', name: 'English (Ireland)', nativeName: 'English (Ireland)', sttCode: 'en-IE', ttsCode: 'en-IE' },
  { code: 'en-NZ', name: 'English (New Zealand)', nativeName: 'English (New Zealand)', sttCode: 'en-NZ', ttsCode: 'en-NZ' },
  { code: 'en-SG', name: 'English (Singapore)', nativeName: 'English (Singapore)', sttCode: 'en-SG', ttsCode: 'en-SG' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)', sttCode: 'es-MX', ttsCode: 'es-MX' },
  { code: 'es-AR', name: 'Spanish (Argentina)', nativeName: 'Español (Argentina)', sttCode: 'es-AR', ttsCode: 'es-AR' },
  { code: 'es-CO', name: 'Spanish (Colombia)', nativeName: 'Español (Colombia)', sttCode: 'es-CO', ttsCode: 'es-CO' },
  { code: 'es-CL', name: 'Spanish (Chile)', nativeName: 'Español (Chile)', sttCode: 'es-CL', ttsCode: 'es-CL' },
  { code: 'es-US', name: 'Spanish (US)', nativeName: 'Español (US)', sttCode: 'es-US', ttsCode: 'es-US' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', sttCode: 'pt-PT', ttsCode: 'pt-PT' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)', sttCode: 'zh-TW', ttsCode: 'zh-TW' },
  { code: 'zh-HK', name: 'Chinese (Hong Kong)', nativeName: '中文 (香港)', sttCode: 'zh-HK', ttsCode: 'zh-HK' },
  { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français (Canada)', sttCode: 'fr-CA', ttsCode: 'fr-CA' },
  { code: 'fr-BE', name: 'French (Belgium)', nativeName: 'Français (Belgique)', sttCode: 'fr-BE', ttsCode: 'fr-BE' },
  { code: 'fr-CH', name: 'French (Switzerland)', nativeName: 'Français (Suisse)', sttCode: 'fr-CH', ttsCode: 'fr-CH' },
  { code: 'de-AT', name: 'German (Austria)', nativeName: 'Deutsch (Österreich)', sttCode: 'de-AT', ttsCode: 'de-AT' },
  { code: 'de-CH', name: 'German (Switzerland)', nativeName: 'Deutsch (Schweiz)', sttCode: 'de-CH', ttsCode: 'de-CH' },
  { code: 'ar-EG', name: 'Arabic (Egypt)', nativeName: 'العربية (مصر)', sttCode: 'ar-EG', ttsCode: 'ar-EG', isRTL: true },
  { code: 'ar-AE', name: 'Arabic (UAE)', nativeName: 'العربية (الإمارات)', sttCode: 'ar-AE', ttsCode: 'ar-AE', isRTL: true },
  { code: 'ar-JO', name: 'Arabic (Jordan)', nativeName: 'العربية (الأردن)', sttCode: 'ar-JO', ttsCode: 'ar-JO', isRTL: true },
  { code: 'ar-LB', name: 'Arabic (Lebanon)', nativeName: 'العربية (لبنان)', sttCode: 'ar-LB', ttsCode: 'ar-LB', isRTL: true },
  { code: 'ar-MA', name: 'Arabic (Morocco)', nativeName: 'العربية (المغرب)', sttCode: 'ar-MA', ttsCode: 'ar-MA', isRTL: true },
  { code: 'ar-TN', name: 'Arabic (Tunisia)', nativeName: 'العربية (تونس)', sttCode: 'ar-TN', ttsCode: 'ar-TN', isRTL: true },
  { code: 'hi-Latn', name: 'Hindi (Latin)', nativeName: 'Hinglish', sttCode: 'hi-Latn', ttsCode: 'hi-IN' },

  // === Additional African Languages ===
  { code: 'ny', name: 'Chichewa', nativeName: 'Chichewa', sttCode: 'ny-MW', ttsCode: 'ny-MW' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', sttCode: 'so-SO', ttsCode: 'so-SO' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ', sttCode: 'ti-ET', ttsCode: 'ti-ET' },
  { code: 'ff', name: 'Fula', nativeName: 'Fulfulde', sttCode: 'ff-SN', ttsCode: 'ff-SN' },
  { code: 'bm', name: 'Bambara', nativeName: 'Bamanankan', sttCode: 'bm-ML', ttsCode: 'bm-ML' },
  { code: 'ln', name: 'Lingala', nativeName: 'Lingála', sttCode: 'ln-CD', ttsCode: 'ln-CD' },
  { code: 'kg', name: 'Kongo', nativeName: 'Kikongo', sttCode: 'kg-CD', ttsCode: 'kg-CD' },
  { code: 'lu', name: 'Luba-Katanga', nativeName: 'Tshiluba', sttCode: 'lu-CD', ttsCode: 'lu-CD' },
  { code: 'rn', name: 'Kirundi', nativeName: 'Kirundi', sttCode: 'rn-BI', ttsCode: 'rn-BI' },
  { code: 'ee', name: 'Ewe', nativeName: 'Eʋegbe', sttCode: 'ee-GH', ttsCode: 'ee-GH' },
  { code: 'tw', name: 'Twi', nativeName: 'Twi', sttCode: 'tw-GH', ttsCode: 'tw-GH' },
  { code: 've', name: 'Venda', nativeName: 'Tshivenḓa', sttCode: 've-ZA', ttsCode: 've-ZA' },
  { code: 'nr', name: 'Southern Ndebele', nativeName: 'isiNdebele', sttCode: 'nr-ZA', ttsCode: 'nr-ZA' },

  // === Additional South/Southeast Asian ===
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', sttCode: 'as-IN', ttsCode: 'as-IN' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', sttCode: 'or-IN', ttsCode: 'or-IN' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', sttCode: 'sd-PK', ttsCode: 'sd-PK', isRTL: true },
  { code: 'bo', name: 'Tibetan', nativeName: 'བོད་སྐད', sttCode: 'bo-CN', ttsCode: 'bo-CN' },
  { code: 'dz', name: 'Dzongkha', nativeName: 'རྫོང་ཁ', sttCode: 'dz-BT', ttsCode: 'dz-BT' },
  { code: 'ms-SG', name: 'Malay (Singapore)', nativeName: 'Bahasa Melayu (Singapore)', sttCode: 'ms-SG', ttsCode: 'ms-SG' },

  // === Pacific & Oceanic ===
  { code: 'ty', name: 'Tahitian', nativeName: 'Reo Tahiti', sttCode: 'ty-PF', ttsCode: 'ty-PF' },
  { code: 'ho', name: 'Hiri Motu', nativeName: 'Hiri Motu', sttCode: 'ho-PG', ttsCode: 'ho-PG' },
  { code: 'bi', name: 'Bislama', nativeName: 'Bislama', sttCode: 'bi-VU', ttsCode: 'bi-VU' },
  { code: 'na', name: 'Nauru', nativeName: 'Dorerin Naoero', sttCode: 'na-NR', ttsCode: 'na-NR' },
  { code: 'tvl', name: 'Tuvaluan', nativeName: 'Te Ggana Tuuvalu', sttCode: 'tvl-TV', ttsCode: 'tvl-TV' },
  { code: 'gil', name: 'Gilbertese', nativeName: 'Taetae ni Kiribati', sttCode: 'gil-KI', ttsCode: 'gil-KI' },
  { code: 'mh', name: 'Marshallese', nativeName: 'Kajin M̧ajeļ', sttCode: 'mh-MH', ttsCode: 'mh-MH' },
  { code: 'chk', name: 'Chuukese', nativeName: 'Chuukese', sttCode: 'chk-FM', ttsCode: 'chk-FM' },
  { code: 'pon', name: 'Pohnpeian', nativeName: 'Pohnpeian', sttCode: 'pon-FM', ttsCode: 'pon-FM' },
  { code: 'kos', name: 'Kosraean', nativeName: 'Kosraean', sttCode: 'kos-FM', ttsCode: 'kos-FM' },
  { code: 'yap', name: 'Yapese', nativeName: 'Yapese', sttCode: 'yap-FM', ttsCode: 'yap-FM' },

  // === Additional European ===
  { code: 'nn', name: 'Norwegian Nynorsk', nativeName: 'Norsk Nynorsk', sttCode: 'nn-NO', ttsCode: 'nn-NO' },
  { code: 'fo', name: 'Faroese', nativeName: 'Føroyskt', sttCode: 'fo-FO', ttsCode: 'fo-FO' },
  { code: 'kl', name: 'Greenlandic', nativeName: 'Kalaallisut', sttCode: 'kl-GL', ttsCode: 'kl-GL' },
  { code: 'hsb', name: 'Upper Sorbian', nativeName: 'Hornjoserbšćina', sttCode: 'hsb-DE', ttsCode: 'hsb-DE' },
  { code: 'dsb', name: 'Lower Sorbian', nativeName: 'Dolnoserbšćina', sttCode: 'dsb-DE', ttsCode: 'dsb-DE' },
  { code: 'lij', name: 'Ligurian', nativeName: 'Ligure', sttCode: 'lij-IT', ttsCode: 'lij-IT' },
  { code: 'pms', name: 'Piedmontese', nativeName: 'Piemontèis', sttCode: 'pms-IT', ttsCode: 'pms-IT' },
  { code: 'lmo', name: 'Lombard', nativeName: 'Lombard', sttCode: 'lmo-IT', ttsCode: 'lmo-IT' },
  { code: 'eml', name: 'Emilian-Romagnol', nativeName: 'Emigliàn-Rumagnòl', sttCode: 'eml-IT', ttsCode: 'eml-IT' },
  { code: 'an', name: 'Aragonese', nativeName: 'Aragonés', sttCode: 'an-ES', ttsCode: 'an-ES' },
  { code: 'ext', name: 'Extremaduran', nativeName: 'Estremeñu', sttCode: 'ext-ES', ttsCode: 'ext-ES' },
  { code: 'mwl', name: 'Mirandese', nativeName: 'Mirandés', sttCode: 'mwl-PT', ttsCode: 'mwl-PT' },
  { code: 'ast', name: 'Asturian', nativeName: 'Asturianu', sttCode: 'ast-ES', ttsCode: 'ast-ES' },

  // === Central Asian & Turkic ===
  { code: 'tk', name: 'Turkmen', nativeName: 'Türkmen', sttCode: 'tk-TM', ttsCode: 'tk-TM' },
  { code: 'ba', name: 'Bashkir', nativeName: 'Башҡорт', sttCode: 'ba-RU', ttsCode: 'ba-RU' },
  { code: 'tt', name: 'Tatar', nativeName: 'Татар', sttCode: 'tt-RU', ttsCode: 'tt-RU' },
  { code: 'cv', name: 'Chuvash', nativeName: 'Чăваш', sttCode: 'cv-RU', ttsCode: 'cv-RU' },
  { code: 'sah', name: 'Yakut', nativeName: 'Саха', sttCode: 'sah-RU', ttsCode: 'sah-RU' },
  { code: 'os', name: 'Ossetian', nativeName: 'Ирон', sttCode: 'os-GE', ttsCode: 'os-GE' },
  { code: 'ab', name: 'Abkhaz', nativeName: 'Аԥсуа', sttCode: 'ab-GE', ttsCode: 'ab-GE' },

  // === East Asian ===
  { code: 'yue', name: 'Cantonese', nativeName: '廣東話', sttCode: 'yue-HK', ttsCode: 'yue-HK' },
  { code: 'wuu', name: 'Wu Chinese', nativeName: '吴语', sttCode: 'wuu-CN', ttsCode: 'wuu-CN' },
  { code: 'hak', name: 'Hakka', nativeName: '客家話', sttCode: 'hak-TW', ttsCode: 'hak-TW' },
  { code: 'nan', name: 'Hokkien', nativeName: '閩南語', sttCode: 'nan-TW', ttsCode: 'nan-TW' },
  { code: 'ain', name: 'Ainu', nativeName: 'アイヌ', sttCode: 'ain-JP', ttsCode: 'ain-JP' },
  { code: 'ryu', name: 'Okinawan', nativeName: 'ウチナーグチ', sttCode: 'ryu-JP', ttsCode: 'ryu-JP' },

  // === Additional South Asian ===
  { code: 'ks', name: 'Kashmiri', nativeName: 'कॉशुर', sttCode: 'ks-IN', ttsCode: 'ks-IN' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', sttCode: 'doi-IN', ttsCode: 'doi-IN' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', sttCode: 'mai-IN', ttsCode: 'mai-IN' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', sttCode: 'sat-IN', ttsCode: 'sat-IN' },
  { code: 'mni', name: 'Meitei', nativeName: 'মৈতৈলোন্', sttCode: 'mni-IN', ttsCode: 'mni-IN' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो', sttCode: 'brx-IN', ttsCode: 'brx-IN' },
  { code: 'gon', name: 'Gondi', nativeName: 'गोंडी', sttCode: 'gon-IN', ttsCode: 'gon-IN' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', sttCode: 'kok-IN', ttsCode: 'kok-IN' },

  // === Indigenous Americas ===
  { code: 'qu', name: 'Quechua', nativeName: 'Runasimi', sttCode: 'qu-PE', ttsCode: 'qu-PE' },
  { code: 'gn', name: 'Guarani', nativeName: 'Avañe\'ẽ', sttCode: 'gn-PY', ttsCode: 'gn-PY' },
  { code: 'ay', name: 'Aymara', nativeName: 'Aymar aru', sttCode: 'ay-BO', ttsCode: 'ay-BO' },
  { code: 'nah', name: 'Nahuatl', nativeName: 'Nāhuatl', sttCode: 'nah-MX', ttsCode: 'nah-MX' },
  { code: 'yua', name: 'Yucatec Maya', nativeName: 'Maaya T\'aan', sttCode: 'yua-MX', ttsCode: 'yua-MX' },
  { code: 'cr', name: 'Cree', nativeName: 'ᓀᐦᐃᔭᐍᐏᐣ', sttCode: 'cr-CA', ttsCode: 'cr-CA' },
  { code: 'iu', name: 'Inuktitut', nativeName: 'ᐃᓄᒃᑎᑐᑦ', sttCode: 'iu-CA', ttsCode: 'iu-CA' },
  { code: 'oj', name: 'Ojibwe', nativeName: 'Anishinaabemowin', sttCode: 'oj-CA', ttsCode: 'oj-CA' },

  // === Sign Languages (text only — STT via dictation) ===
  { code: 'ase', name: 'American Sign Language', nativeName: 'ASL', sttCode: 'en-US', ttsCode: 'en-US' },
  { code: 'bfi', name: 'British Sign Language', nativeName: 'BSL', sttCode: 'en-GB', ttsCode: 'en-GB' },
  { code: 'jsl', name: 'Japanese Sign Language', nativeName: '日本手話', sttCode: 'ja-JP', ttsCode: 'ja-JP' },
  { code: 'gsg', name: 'German Sign Language', nativeName: 'DGS', sttCode: 'de-DE', ttsCode: 'de-DE' },
  { code: 'lsf', name: 'French Sign Language', nativeName: 'LSF', sttCode: 'fr-FR', ttsCode: 'fr-FR' },
  { code: 'csign', name: 'Chinese Sign Language', nativeName: '中国手语', sttCode: 'zh-CN', ttsCode: 'zh-CN' },

  // === Creole & Pidgin (additional) ===
  { code: 'jam', name: 'Jamaican Patois', nativeName: 'Patois', sttCode: 'en-JM', ttsCode: 'en-JM' },
  { code: 'tpi', name: 'Tok Pisin', nativeName: 'Tok Pisin', sttCode: 'tpi-PG', ttsCode: 'tpi-PG' },
  { code: 'pis', name: 'Solomons Pijin', nativeName: 'Pijin', sttCode: 'pis-SB', ttsCode: 'pis-SB' },
  { code: 'pcm', name: 'Nigerian Pidgin', nativeName: 'Naija', sttCode: 'pcm-NG', ttsCode: 'pcm-NG' },
  { code: 'cpe', name: 'Kriol', nativeName: 'Kriol', sttCode: 'cpe-AU', ttsCode: 'cpe-AU' },
];

export function getLanguageByCode(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find(l => l.code === code);
}

export function getLanguageName(code: string): string {
  return getLanguageByCode(code)?.name || code;
}
