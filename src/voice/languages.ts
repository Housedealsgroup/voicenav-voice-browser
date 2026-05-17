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
];

export function getLanguageByCode(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find(l => l.code === code);
}

export function getLanguageName(code: string): string {
  return getLanguageByCode(code)?.name || code;
}
