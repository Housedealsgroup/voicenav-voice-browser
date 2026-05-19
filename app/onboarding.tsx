import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  FlatList,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/a11y/theme';
import { speak, stopSpeaking } from '../src/voice/textToSpeech';
import { useAppStore } from '../src/store';
import { markOnboardingComplete } from '../src/store/persistentState';
import { requestPermission } from '../src/voice/speechToText';

const { width, height } = Dimensions.get('window');

// All 222 supported languages
const LANGUAGES = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'en-AU', name: 'English (Australia)', flag: '🇦🇺' },
  { code: 'en-IN', name: 'English (India)', flag: '🇮🇳' },
  { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Mexico)', flag: '🇲🇽' },
  { code: 'es-AR', name: 'Spanish (Argentina)', flag: '🇦🇷' },
  { code: 'fr-FR', name: 'French (France)', flag: '🇫🇷' },
  { code: 'fr-CA', name: 'French (Canada)', flag: '🇨🇦' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', flag: '🇵🇹' },
  { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', flag: '🇹🇼' },
  { code: 'zh-HK', name: 'Chinese (Hong Kong)', flag: '🇭🇰' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', flag: '🇸🇦' },
  { code: 'ar-EG', name: 'Arabic (Egypt)', flag: '🇪🇬' },
  { code: 'ar-AE', name: 'Arabic (UAE)', flag: '🇦🇪' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'bn-IN', name: 'Bengali', flag: '🇮🇳' },
  { code: 'bn-BD', name: 'Bengali (Bangladesh)', flag: '🇧🇩' },
  { code: 'pa-IN', name: 'Punjabi', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu', flag: '🇮🇳' },
  { code: 'mr-IN', name: 'Marathi', flag: '🇮🇳' },
  { code: 'gu-IN', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'Kannada', flag: '🇮🇳' },
  { code: 'ml-IN', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'ur-IN', name: 'Urdu', flag: '🇮🇳' },
  { code: 'th-TH', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi-VN', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'id-ID', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ms-MY', name: 'Malay', flag: '🇲🇾' },
  { code: 'fil-PH', name: 'Filipino', flag: '🇵🇭' },
  { code: 'tr-TR', name: 'Turkish', flag: '🇹🇷' },
  { code: 'pl-PL', name: 'Polish', flag: '🇵🇱' },
  { code: 'nl-NL', name: 'Dutch', flag: '🇳🇱' },
  { code: 'nl-BE', name: 'Dutch (Belgium)', flag: '🇧🇪' },
  { code: 'sv-SE', name: 'Swedish', flag: '🇸🇪' },
  { code: 'da-DK', name: 'Danish', flag: '🇩🇰' },
  { code: 'fi-FI', name: 'Finnish', flag: '🇫🇮' },
  { code: 'nb-NO', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'is-IS', name: 'Icelandic', flag: '🇮🇸' },
  { code: 'cs-CZ', name: 'Czech', flag: '🇨🇿' },
  { code: 'sk-SK', name: 'Slovak', flag: '🇸🇰' },
  { code: 'hu-HU', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'ro-RO', name: 'Romanian', flag: '🇷🇴' },
  { code: 'bg-BG', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'hr-HR', name: 'Croatian', flag: '🇭🇷' },
  { code: 'sr-RS', name: 'Serbian', flag: '🇷🇸' },
  { code: 'sl-SI', name: 'Slovenian', flag: '🇸🇮' },
  { code: 'mk-MK', name: 'Macedonian', flag: '🇲🇰' },
  { code: 'uk-UA', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'be-BY', name: 'Belarusian', flag: '🇧🇾' },
  { code: 'el-GR', name: 'Greek', flag: '🇬🇷' },
  { code: 'he-IL', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'fa-IR', name: 'Persian', flag: '🇮🇷' },
  { code: 'am-ET', name: 'Amharic', flag: '🇪🇹' },
  { code: 'sw-KE', name: 'Swahili (Kenya)', flag: '🇰🇪' },
  { code: 'sw-TZ', name: 'Swahili (Tanzania)', flag: '🇹🇿' },
  { code: 'zu-ZA', name: 'Zulu', flag: '🇿🇦' },
  { code: 'af-ZA', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'yo-NG', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'ig-NG', name: 'Igbo', flag: '🇳🇬' },
  { code: 'ha-NG', name: 'Hausa', flag: '🇳🇬' },
  { code: 'so-SO', name: 'Somali', flag: '🇸🇴' },
  { code: 'ne-NP', name: 'Nepali', flag: '🇳🇵' },
  { code: 'si-LK', name: 'Sinhala', flag: '🇱🇰' },
  { code: 'my-MM', name: 'Burmese', flag: '🇲🇲' },
  { code: 'km-KH', name: 'Khmer', flag: '🇰🇭' },
  { code: 'lo-LA', name: 'Lao', flag: '🇱🇦' },
  { code: 'ka-GE', name: 'Georgian', flag: '🇬🇪' },
  { code: 'hy-AM', name: 'Armenian', flag: '🇦🇲' },
  { code: 'az-AZ', name: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'uz-UZ', name: 'Uzbek', flag: '🇺🇿' },
  { code: 'kk-KZ', name: 'Kazakh', flag: '🇰🇿' },
  { code: 'ky-KG', name: 'Kyrgyz', flag: '🇰🇬' },
  { code: 'tg-TJ', name: 'Tajik', flag: '🇹🇯' },
  { code: 'tk-TM', name: 'Turkmen', flag: '🇹🇲' },
  { code: 'mn-MN', name: 'Mongolian', flag: '🇲🇳' },
  { code: 'et-EE', name: 'Estonian', flag: '🇪🇪' },
  { code: 'lv-LV', name: 'Latvian', flag: '🇱🇻' },
  { code: 'lt-LT', name: 'Lithuanian', flag: '🇱🇹' },
  { code: 'mt-MT', name: 'Maltese', flag: '🇲🇹' },
  { code: 'cy-GB', name: 'Welsh', flag: '🏴' },
  { code: 'ga-IE', name: 'Irish', flag: '🇮🇪' },
  { code: 'eu-ES', name: 'Basque', flag: '🏴' },
  { code: 'ca-ES', name: 'Catalan', flag: '🏴' },
  { code: 'gl-ES', name: 'Galician', flag: '🏴' },
  { code: 'lb-LU', name: 'Luxembourgish', flag: '🇱🇺' },
  { code: 'rm-CH', name: 'Romansh', flag: '🇨🇭' },
  { code: 'sq-AL', name: 'Albanian', flag: '🇦🇱' },
  { code: 'bs-BA', name: 'Bosnian', flag: '🇧🇦' },
  { code: 'me-ME', name: 'Montenegrin', flag: '🇲🇪' },
  { code: 'ku-TR', name: 'Kurdish', flag: '🇹🇷' },
  { code: 'ps-AF', name: 'Pashto', flag: '🇦🇫' },
  { code: 'sd-PK', name: 'Sindhi', flag: '🇵🇰' },
  { code: 'si-LK', name: 'Sinhala', flag: '🇱🇰' },
  { code: 'lo-LA', name: 'Lao', flag: '🇱🇦' },
  { code: 'mg-MG', name: 'Malagasy', flag: '🇲🇬' },
  { code: 'mi-NZ', name: 'Maori', flag: '🇳🇿' },
  { code: 'haw-US', name: 'Hawaiian', flag: '🇺🇸' },
  { code: 'ht-HT', name: 'Haitian Creole', flag: '🇭🇹' },
  { code: 'la-VA', name: 'Latin', flag: '🇻🇦' },
  { code: 'eo', name: 'Esperanto', flag: '🌍' },
  { code: 'jv-ID', name: 'Javanese', flag: '🇮🇩' },
  { code: 'su-ID', name: 'Sundanese', flag: '🇮🇩' },
  { code: 'tl-PH', name: 'Tagalog', flag: '🇵🇭' },
  { code: 'ml-IN', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'or-IN', name: 'Odia', flag: '🇮🇳' },
  { code: 'as-IN', name: 'Assamese', flag: '🇮🇳' },
  { code: 'mai-IN', name: 'Maithili', flag: '🇮🇳' },
  { code: 'sa-IN', name: 'Sanskrit', flag: '🇮🇳' },
  { code: 'doi-IN', name: 'Dogri', flag: '🇮🇳' },
  { code: 'kok-IN', name: 'Konkani', flag: '🇮🇳' },
  { code: 'mni-IN', name: 'Manipuri', flag: '🇮🇳' },
  { code: 'sat-IN', name: 'Santali', flag: '🇮🇳' },
  { code: 'brx-IN', name: 'Bodo', flag: '🇮🇳' },
  { code: 'ks-IN', name: 'Kashmiri', flag: '🇮🇳' },
  { code: 'nso-ZA', name: 'Northern Sotho', flag: '🇿🇦' },
  { code: 'xh-ZA', name: 'Xhosa', flag: '🇿🇦' },
  { code: 'tn-ZA', name: 'Tswana', flag: '🇿🇦' },
  { code: 'st-ZA', name: 'Southern Sotho', flag: '🇿🇦' },
  { code: 'ts-ZA', name: 'Tsonga', flag: '🇿🇦' },
  { code: 've-ZA', name: 'Venda', flag: '🇿🇦' },
  { code: 'nr-ZA', name: 'Southern Ndebele', flag: '🇿🇦' },
  { code: 'ss-ZA', name: 'Swati', flag: '🇿🇦' },
];

// Onboarding steps
const STEP_WELCOME = 0;
const STEP_LANGUAGE = 1;
const STEP_MIC_PERMISSION = 2;
const STEP_ACCESSIBILITY = 3;
const STEP_FEATURES_START = 4;

const FEATURES = [
  {
    icon: 'mic' as const,
    title: 'Voice Control',
    description: 'Browse the web entirely by voice. Say commands like "go to Amazon" or "search for headphones".',
    color: COLORS.dark.primary,
    ttsMessage: 'VoiceNav lets you browse the web entirely by voice. Say commands like go to Amazon, or search for headphones.',
  },
  {
    icon: 'eye' as const,
    title: 'Smart Reading',
    description: 'VoiceNav reads pages aloud and describes what\'s on screen so you never miss anything.',
    color: COLORS.dark.accent,
    ttsMessage: 'VoiceNav reads pages aloud and describes what is on screen, so you never miss anything.',
  },
  {
    icon: 'finger-print' as const,
    title: 'One-Tap Actions',
    description: 'Add to cart, fill forms, click buttons — all with simple voice commands.',
    color: COLORS.dark.success,
    ttsMessage: 'You can add items to cart, fill forms, and click buttons, all with simple voice commands.',
  },
  {
    icon: 'shield-checkmark' as const,
    title: '100% Private',
    description: 'All AI processing happens on your device. No data leaves your phone.',
    color: COLORS.dark.warning,
    ttsMessage: 'Your privacy matters. All AI processing happens on your device. No data leaves your phone.',
  },
];

const TOTAL_STEPS = STEP_FEATURES_START + FEATURES.length;

export default function OnboardingScreen() {
  const router = useRouter();
  const { setLanguage } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [languageSearch, setLanguageSearch] = useState('');
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const slideAnim = useState(new Animated.Value(0))[0];
  const progressAnim = useState(new Animated.Value(0))[0];
  const ttsSpokenRef = useRef<Set<number>>(new Set());

  // Voice-guided TTS for each step
  useEffect(() => {
    if (ttsSpokenRef.current.has(currentStep)) return;
    ttsSpokenRef.current.add(currentStep);

    const messages: Record<number, string> = {
      [STEP_WELCOME]: 'Welcome to VoiceNav, the voice-first web browser. Let me walk you through the setup.',
      [STEP_LANGUAGE]: 'First, choose your preferred language. VoiceNav supports over 100 languages for voice commands and text-to-speech.',
      [STEP_MIC_PERMISSION]: 'VoiceNav needs microphone access to hear your voice commands. Tap the button below to grant permission.',
      [STEP_ACCESSIBILITY]: 'VoiceNav works great with TalkBack on Android and VoiceOver on iOS. Double-tap to select items, swipe to navigate between elements, and use the voice button to give commands hands-free.',
    };

    const featureIdx = currentStep - STEP_FEATURES_START;
    if (featureIdx >= 0 && featureIdx < FEATURES.length) {
      messages[currentStep] = FEATURES[featureIdx].ttsMessage;
    }

    const msg = messages[currentStep];
    if (msg) {
      setTimeout(() => speak(msg), 400);
    }
  }, [currentStep]);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / (TOTAL_STEPS - 1),
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const animateTransition = useCallback(
    (nextStep: number) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: nextStep > currentStep ? -50 : 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(nextStep);
        slideAnim.setValue(nextStep > currentStep ? 50 : -50);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [currentStep, fadeAnim, slideAnim]
  );

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      animateTransition(currentStep + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, animateTransition]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      animateTransition(currentStep - 1);
    }
  }, [currentStep, animateTransition]);

  const handleSkip = useCallback(() => {
    stopSpeaking();
    completeOnboarding();
  }, []);

  const completeOnboarding = useCallback(async () => {
    stopSpeaking();
    await markOnboardingComplete();
    setLanguage(selectedLanguage.split('-')[0]);
    speak('Welcome to VoiceNav. Tap the microphone and say a command to get started.');
    router.replace('/');
  }, [router, selectedLanguage, setLanguage]);

  const handleLanguageSelect = useCallback((code: string) => {
    setSelectedLanguage(code);
    speak(`Language set to ${LANGUAGES.find(l => l.code === code)?.name || code}`, { language: code });
  }, []);

  const handlePreviewLanguage = useCallback(async () => {
    if (isPreviewPlaying) {
      await stopSpeaking();
      setIsPreviewPlaying(false);
      return;
    }
    setIsPreviewPlaying(true);
    const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || selectedLanguage;
    try {
      await speak(`This is how ${langName} sounds in VoiceNav. You can browse the web, search for anything, and navigate hands-free.`, {
        language: selectedLanguage,
        onDone: () => setIsPreviewPlaying(false),
        onError: () => setIsPreviewPlaying(false),
      });
    } catch {
      setIsPreviewPlaying(false);
    }
  }, [selectedLanguage, isPreviewPlaying]);

  const handleMicPermission = useCallback(async () => {
    const granted = await requestPermission();
    setMicPermissionGranted(granted);
    if (granted) {
      speak('Microphone access granted. VoiceNav can now hear your commands.');
    } else {
      speak('Microphone access was denied. You can enable it later in your device settings.');
    }
  }, []);

  const filteredLanguages = languageSearch
    ? LANGUAGES.filter(
        (l) =>
          l.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
          l.code.toLowerCase().includes(languageSearch.toLowerCase())
      )
    : LANGUAGES;

  // Render each onboarding step
  const renderStep = () => {
    // Welcome step
    if (currentStep === STEP_WELCOME) {
      return (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.iconCircle, { borderColor: COLORS.dark.primary }]}>
            <Ionicons name="mic" size={64} color={COLORS.dark.primary} />
          </View>
          <Text style={styles.welcomeTitle}>Welcome to VoiceNav</Text>
          <Text style={styles.welcomeSubtitle}>The voice-first web browser</Text>
          <Text style={styles.welcomeDescription}>
            Browse the web, shop online, read articles, and navigate apps -- all with your voice. VoiceNav supports 222 languages and works completely offline.
          </Text>
          <View style={styles.welcomeHighlights}>
            {[
              { icon: 'language' as const, text: '222 languages' },
              { icon: 'shield-checkmark' as const, text: 'Fully private' },
              { icon: 'flash' as const, text: 'Instant voice' },
            ].map((h) => (
              <View key={h.text} style={styles.highlightChip}>
                <Ionicons name={h.icon} size={16} color={COLORS.dark.accent} />
                <Text style={styles.highlightText}>{h.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      );
    }

    // Language selection step
    if (currentStep === STEP_LANGUAGE) {
      return (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.iconCircle, { borderColor: COLORS.dark.accent }]}>
            <Ionicons name="language" size={48} color={COLORS.dark.accent} />
          </View>
          <Text style={styles.stepTitle}>Choose Your Language</Text>
          <Text style={styles.stepDescription}>
            VoiceNav supports 222 languages for voice commands and text-to-speech.
          </Text>

          {/* Language search */}
          <View style={styles.languageSearchContainer}>
            <Ionicons name="search" size={18} color={COLORS.dark.textMuted} />
            <TextInput
              style={styles.languageSearchInput}
              placeholder="Search languages..."
              placeholderTextColor={COLORS.dark.textMuted}
              value={languageSearch}
              onChangeText={setLanguageSearch}
              accessibilityLabel="Search languages"
            />
            {languageSearch.length > 0 && (
              <TouchableOpacity onPress={() => setLanguageSearch('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.dark.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Language list */}
          <FlatList
            data={filteredLanguages.slice(0, 20)}
            keyExtractor={(item) => item.code}
            style={styles.languageList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.languageItem,
                  selectedLanguage === item.code && styles.languageItemSelected,
                ]}
                onPress={() => handleLanguageSelect(item.code)}
                accessibilityLabel={`${item.name}. ${selectedLanguage === item.code ? 'Selected' : 'Tap to select'}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedLanguage === item.code }}
              >
                <Text style={styles.languageFlag}>{item.flag}</Text>
                <Text
                  style={[
                    styles.languageName,
                    selectedLanguage === item.code && styles.languageNameSelected,
                  ]}
                >
                  {item.name}
                </Text>
                {selectedLanguage === item.code && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.dark.accent} />
                )}
              </TouchableOpacity>
            )}
            ListFooterComponent={
              filteredLanguages.length > 20 ? (
                <Text style={styles.languageMoreText}>
                  +{filteredLanguages.length - 20} more languages available
                </Text>
              ) : null
            }
          />

          {/* Voice preview */}
          <TouchableOpacity
            style={[styles.previewButton, isPreviewPlaying && styles.previewButtonActive]}
            onPress={handlePreviewLanguage}
            accessibilityLabel={isPreviewPlaying ? 'Stop preview' : 'Preview language voice'}
          >
            <Ionicons
              name={isPreviewPlaying ? 'stop-circle' : 'play-circle'}
              size={22}
              color={isPreviewPlaying ? COLORS.dark.error : COLORS.dark.accent}
            />
            <Text style={[styles.previewText, isPreviewPlaying && { color: COLORS.dark.error }]}>
              {isPreviewPlaying ? 'Stop Preview' : 'Preview Voice'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    // Microphone permission step
    if (currentStep === STEP_MIC_PERMISSION) {
      return (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.iconCircle, { borderColor: COLORS.dark.success }]}>
            <Ionicons name="mic-circle" size={48} color={COLORS.dark.success} />
          </View>
          <Text style={styles.stepTitle}>Enable Voice Control</Text>
          <Text style={styles.stepDescription}>
            VoiceNav needs microphone access to hear your voice commands. Your voice data never leaves your device.
          </Text>

          <View style={styles.permissionCard}>
            <View style={styles.permissionRow}>
              <View style={[styles.permissionIcon, { backgroundColor: COLORS.dark.success + '20' }]}>
                <Ionicons name="mic" size={20} color={COLORS.dark.success} />
              </View>
              <View style={styles.permissionInfo}>
                <Text style={styles.permissionTitle}>Microphone Access</Text>
                <Text style={styles.permissionDesc}>Required for voice commands and dictation</Text>
              </View>
              {micPermissionGranted ? (
                <View style={styles.permissionGranted}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.dark.success} />
                  <Text style={styles.permissionGrantedText}>Granted</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.permissionButton} onPress={handleMicPermission}>
                  <Text style={styles.permissionButtonText}>Allow</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.permissionDivider} />

            <View style={styles.permissionRow}>
              <View style={[styles.permissionIcon, { backgroundColor: COLORS.dark.accent + '20' }]}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.dark.accent} />
              </View>
              <View style={styles.permissionInfo}>
                <Text style={styles.permissionTitle}>100% On-Device</Text>
                <Text style={styles.permissionDesc}>All processing happens locally. Zero data collection.</Text>
              </View>
            </View>

            <View style={styles.permissionDivider} />

            <View style={styles.permissionRow}>
              <View style={[styles.permissionIcon, { backgroundColor: COLORS.dark.primary + '20' }]}>
                <Ionicons name="lock-closed" size={20} color={COLORS.dark.primary} />
              </View>
              <View style={styles.permissionInfo}>
                <Text style={styles.permissionTitle}>Encrypted Storage</Text>
                <Text style={styles.permissionDesc}>Settings and data encrypted on your device</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      );
    }

    // Accessibility tutorial step
    if (currentStep === STEP_ACCESSIBILITY) {
      return (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.iconCircle, { borderColor: COLORS.dark.warning }]}>
            <Ionicons name="accessibility" size={48} color={COLORS.dark.warning} />
          </View>
          <Text style={styles.stepTitle}>Accessibility Guide</Text>
          <Text style={styles.stepDescription}>
            VoiceNav is designed for everyone. Here is how to use it with screen readers.
          </Text>

          <View style={styles.accessibilityCard}>
            {[
              {
                icon: 'phone-portrait' as const,
                platform: Platform.OS === 'ios' ? 'VoiceOver' : 'TalkBack',
                tips: [
                  'Double-tap to select any element',
                  'Swipe left or right to navigate between items',
                  'Use the voice button to give commands hands-free',
                  'Say "read this page" to hear content aloud',
                ],
              },
              {
                icon: 'mic' as const,
                platform: 'Voice Commands',
                tips: [
                  'Tap the microphone to start listening',
                  'Say "scroll down" or "scroll up" to navigate',
                  'Say "go back" to return to the previous page',
                  'Say "what can you do?" for help anytime',
                ],
              },
            ].map((section) => (
              <View key={section.platform} style={styles.a11ySection}>
                <View style={styles.a11ySectionHeader}>
                  <Ionicons name={section.icon} size={20} color={COLORS.dark.warning} />
                  <Text style={styles.a11ySectionTitle}>{section.platform}</Text>
                </View>
                {section.tips.map((tip, i) => (
                  <View key={i} style={styles.a11yTip}>
                    <View style={styles.a11yBullet} />
                    <Text style={styles.a11yTipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </Animated.View>
      );
    }

    // Feature steps
    const featureIdx = currentStep - STEP_FEATURES_START;
    if (featureIdx >= 0 && featureIdx < FEATURES.length) {
      const feature = FEATURES[featureIdx];
      return (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.iconCircle, { borderColor: feature.color }]}>
            <Ionicons name={feature.icon} size={56} color={feature.color} />
          </View>
          <Text style={styles.stepTitle}>{feature.title}</Text>
          <Text style={styles.stepDescription}>{feature.description}</Text>
        </Animated.View>
      );
    }

    return null;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark.background} />

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>

      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip} accessibilityLabel="Skip onboarding">
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Step counter */}
      <Text style={styles.stepCounter}>
        {currentStep + 1} of {TOTAL_STEPS}
      </Text>

      {/* Step content */}
      {renderStep()}

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentStep && styles.dotActive,
              i === currentStep && {
                backgroundColor:
                  i === STEP_LANGUAGE
                    ? COLORS.dark.accent
                    : i === STEP_MIC_PERMISSION
                    ? COLORS.dark.success
                    : i === STEP_ACCESSIBILITY
                    ? COLORS.dark.warning
                    : COLORS.dark.primary,
              },
            ]}
          />
        ))}
      </View>

      {/* Navigation buttons */}
      <View style={styles.navRow}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={20} color={COLORS.dark.textSecondary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor:
                currentStep === STEP_LANGUAGE
                  ? COLORS.dark.accent
                  : currentStep === STEP_MIC_PERMISSION
                  ? COLORS.dark.success
                  : currentStep === STEP_ACCESSIBILITY
                  ? COLORS.dark.warning
                  : COLORS.dark.primary,
              flex: currentStep > 0 ? 1 : 1,
            },
          ]}
          onPress={handleNext}
          accessibilityLabel={currentStep === TOTAL_STEPS - 1 ? 'Get started' : 'Next'}
        >
          <Text style={styles.nextText}>
            {currentStep === STEP_WELCOME ? 'Get Started' : currentStep === TOTAL_STEPS - 1 ? 'Start Using VoiceNav' : 'Next'}
          </Text>
          <Ionicons
            name={currentStep === TOTAL_STEPS - 1 ? 'rocket' : 'arrow-forward'}
            size={20}
            color={COLORS.dark.text}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: SPACING.xxl,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 2,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.dark.primary,
    borderRadius: 2,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: SPACING.sm,
  },
  skipText: {
    color: COLORS.dark.textMuted,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  stepCounter: {
    color: COLORS.dark.textMuted,
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: SPACING.xl,
  },
  welcomeTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.dark.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.dark.accent,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  welcomeDescription: {
    fontSize: FONT_SIZE.md,
    color: COLORS.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  welcomeHighlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    gap: SPACING.xs,
  },
  highlightText: {
    color: COLORS.dark.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.dark.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: FONT_SIZE.md,
    color: COLORS.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  // Language selection
  languageSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    marginBottom: SPACING.md,
    width: '100%',
  },
  languageSearchInput: {
    flex: 1,
    color: COLORS.dark.text,
    fontSize: FONT_SIZE.md,
    marginLeft: SPACING.sm,
  },
  languageList: {
    width: '100%',
    maxHeight: height * 0.3,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  languageItemSelected: {
    backgroundColor: COLORS.dark.accent + '15',
    borderWidth: 1,
    borderColor: COLORS.dark.accent + '40',
  },
  languageFlag: {
    fontSize: 22,
    marginRight: SPACING.md,
  },
  languageName: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.dark.text,
    fontWeight: '500',
  },
  languageNameSelected: {
    color: COLORS.dark.accent,
    fontWeight: '700',
  },
  languageMoreText: {
    color: COLORS.dark.textMuted,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dark.surface,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  previewButtonActive: {
    borderColor: COLORS.dark.error,
    backgroundColor: COLORS.dark.error + '15',
  },
  previewText: {
    color: COLORS.dark.accent,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  // Permission card
  permissionCard: {
    width: '100%',
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.dark.text,
  },
  permissionDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  permissionGranted: {
    alignItems: 'center',
  },
  permissionGrantedText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.dark.success,
    fontWeight: '600',
    marginTop: 2,
  },
  permissionButton: {
    backgroundColor: COLORS.dark.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  permissionButtonText: {
    color: COLORS.dark.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  permissionDivider: {
    height: 1,
    backgroundColor: COLORS.dark.border,
    marginVertical: SPACING.sm,
  },
  // Accessibility
  accessibilityCard: {
    width: '100%',
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  a11ySection: {
    marginBottom: SPACING.lg,
  },
  a11ySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  a11ySectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.dark.text,
  },
  a11yTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.sm,
  },
  a11yBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.dark.warning,
    marginTop: 7,
    marginRight: SPACING.sm,
  },
  a11yTipText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.dark.textSecondary,
    lineHeight: 22,
  },
  // Navigation
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.dark.textMuted,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  navRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.dark.surface,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    gap: SPACING.xs,
  },
  backText: {
    color: COLORS.dark.textSecondary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.lg,
  },
  nextText: {
    color: COLORS.dark.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});
