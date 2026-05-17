import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Animated,
  Dimensions, ScrollView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/store';
import { useBookmarkStore } from '../src/store/bookmarks';
import { useVoiceShortcutStore } from '../src/store/voiceCommands';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/a11y/theme';
import { speak } from '../src/voice/textToSpeech';
import { useSpeechRecognition } from '../src/voice/speechToText';
import { understand, resolveSiteAlias } from '../src/agent/nlu';
import VoiceButton from '../src/components/VoiceButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const QUICK_LINKS = [
  { name: 'Google', url: 'https://www.google.com', icon: 'search' as const, color: '#4285F4' },
  { name: 'Amazon', url: 'https://www.amazon.com', icon: 'cart' as const, color: '#FF9900' },
  { name: 'YouTube', url: 'https://www.youtube.com', icon: 'play-circle' as const, color: '#FF0000' },
  { name: 'Wikipedia', url: 'https://www.wikipedia.org', icon: 'book' as const, color: '#000' },
  { name: 'Reddit', url: 'https://www.reddit.com', icon: 'chatbubbles' as const, color: '#FF4500' },
  { name: 'GitHub', url: 'https://www.github.com', icon: 'logo-github' as const, color: '#333' },
  { name: 'Gmail', url: 'https://mail.google.com', icon: 'mail' as const, color: '#EA4335' },
  { name: 'News', url: 'https://news.google.com', icon: 'newspaper' as const, color: '#4285F4' },
  { name: 'Spotify', url: 'https://www.spotify.com', icon: 'musical-notes' as const, color: '#1DB954' },
];

const VOICE_EXAMPLES = [
  'Go to amazon.com',
  'Search for headphones',
  'Click add to cart',
  'Read this page',
  'Scroll down',
  'Bookmark this',
  'Compare prices for laptops',
  'Sort by price',
  'Sign in',
  'What can you do?',
];

const TASK_TEMPLATES = [
  { name: 'Shop', icon: 'cart', color: '#FF9900', command: 'shop for headphones on amazon' },
  { name: 'Compare', icon: 'pricetag', color: '#00E676', command: 'compare prices for laptop' },
  { name: 'Read News', icon: 'newspaper', color: '#4285F4', command: 'read news' },
  { name: 'Check Email', icon: 'mail', color: '#EA4335', command: 'check my email' },
  { name: 'Watch Video', icon: 'play-circle', color: '#FF0000', command: 'watch youtube' },
  { name: 'Read Page', icon: 'book', color: '#9C27B0', command: 'read this page' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { setCurrentUrl, addBrowsingHistory, addCommandHistory, speechRate, browsingHistory, commandHistory } = useAppStore();
  const { bookmarks } = useBookmarkStore();
  const { findShortcut } = useVoiceShortcutStore();
  const [inputUrl, setInputUrl] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  const { isListening, transcript, interimTranscript, start: startListening, stop: stopListening } = useSpeechRecognition();

  useEffect(() => {
    AsyncStorage.getItem('voicenav-onboarded').then((val) => {
      if (val !== 'true') { router.replace('/onboarding'); }
      else { setHasOnboarded(true); }
    });
  }, []);

  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start(); }, []);

  useEffect(() => {
    if (hasOnboarded) {
      const timer = setTimeout(() => { speak('Welcome to VoiceNav. Tap the microphone and say a command, or type a web address.', { rate: speechRate }); }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasOnboarded]);

  const navigateTo = useCallback((url: string) => {
    let finalUrl = url;
    if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
    setCurrentUrl(finalUrl);
    addBrowsingHistory(finalUrl);
    router.push('/browser');
  }, [setCurrentUrl, addBrowsingHistory, router]);

  const handleSubmitUrl = useCallback(() => { if (inputUrl.trim()) navigateTo(inputUrl.trim()); }, [inputUrl, navigateTo]);

  const handleVoiceCommand = useCallback((command: string) => {
    if (!command.trim()) return;
    addCommandHistory(command);

    // Check voice shortcuts
    const shortcut = findShortcut(command);
    if (shortcut) {
      if (shortcut.action === 'navigate') { speak(`Opening shortcut: ${shortcut.phrase}`); navigateTo(shortcut.target); return; }
    }

    // Use NLU for intent understanding
    const result = understand(command);

    if (result.intent === 'navigate' && result.target) {
      navigateTo(result.target);
      return;
    }

    if (result.intent === 'search' && result.target) {
      speak(`Searching for ${result.target}`);
      navigateTo(`https://www.google.com/search?q=${encodeURIComponent(result.target)}`);
      return;
    }

    if (result.intent === 'help') {
      speak('You can say things like: go to Amazon, search for headphones, click a button, read this page, scroll down, bookmark this, compare prices, sort by price, sign in, and much more. What would you like to do?');
      return;
    }

    // Default: open browser with Google search
    speak(`Let me search for ${command}`);
    navigateTo(`https://www.google.com/search?q=${encodeURIComponent(command)}`);
  }, [navigateTo, addCommandHistory, findShortcut]);

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      stopListening();
      if (transcript) handleVoiceCommand(transcript);
    } else {
      startListening({
        onResult: (text, isFinal) => { if (isFinal) handleVoiceCommand(text); },
        onError: () => { speak('Voice recognition error. Try again or type your command.'); },
      });
    }
  }, [isListening, transcript, startListening, stopListening, handleVoiceCommand]);

  const recentHistory = browsingHistory.slice(0, 5);
  const recentBookmarks = bookmarks.slice(0, 4);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="mic" size={40} color={COLORS.dark.text} />
          </View>
          <Text style={styles.appName}>VoiceNav</Text>
          <Text style={styles.tagline}>Supercomputer-level voice navigation</Text>
        </View>

        {/* Voice Button */}
        <VoiceButton isListening={isListening} interimText={interimTranscript} onPress={handleVoiceToggle} />

        {/* URL Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="globe-outline" size={20} color={COLORS.dark.textMuted} style={styles.inputIcon} />
          <TextInput style={styles.urlInput} placeholder="Enter website or search..." placeholderTextColor={COLORS.dark.textMuted} value={inputUrl} onChangeText={setInputUrl} onSubmitEditing={handleSubmitUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" returnKeyType="go" />
          {inputUrl.length > 0 && (
            <TouchableOpacity onPress={handleSubmitUrl} style={styles.goButton}><Ionicons name="arrow-forward" size={20} color={COLORS.dark.text} /></TouchableOpacity>
          )}
        </View>

        {/* Task Templates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Tasks</Text>
          <View style={styles.quickLinksGrid}>
            {TASK_TEMPLATES.map((tmpl) => (
              <TouchableOpacity key={tmpl.name} style={styles.quickLink} onPress={() => handleVoiceCommand(tmpl.command)} activeOpacity={0.7}>
                <View style={[styles.quickLinkIcon, { backgroundColor: tmpl.color + '20' }]}>
                  <Ionicons name={tmpl.icon as any} size={22} color={tmpl.color} />
                </View>
                <Text style={styles.quickLinkText}>{tmpl.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.quickLinksGrid}>
            {QUICK_LINKS.map((link) => (
              <TouchableOpacity key={link.name} style={styles.quickLink} onPress={() => navigateTo(link.url)} activeOpacity={0.7}>
                <View style={[styles.quickLinkIcon, { backgroundColor: link.color + '20' }]}>
                  <Ionicons name={link.icon} size={22} color={link.color} />
                </View>
                <Text style={styles.quickLinkText}>{link.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bookmarks */}
        {recentBookmarks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bookmarks</Text>
              <TouchableOpacity onPress={() => router.push('/bookmarks')}><Text style={styles.seeAllText}>See all</Text></TouchableOpacity>
            </View>
            <View style={styles.bookmarksRow}>
              {recentBookmarks.map((bm) => (
                <TouchableOpacity key={bm.id} style={styles.bookmarkChip} onPress={() => navigateTo(bm.url)}>
                  <Ionicons name="bookmark" size={14} color={COLORS.dark.primary} />
                  <Text style={styles.bookmarkChipText} numberOfLines={1}>{bm.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Recent History */}
        {recentHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent</Text>
            {recentHistory.map((url, i) => (
              <TouchableOpacity key={i} style={styles.historyItem} onPress={() => navigateTo(url)}>
                <Ionicons name="time-outline" size={16} color={COLORS.dark.textMuted} />
                <Text style={styles.historyText} numberOfLines={1}>{url.replace(/^https?:\/\/(www\.)?/, '').substring(0, 50)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Voice Commands Guide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Commands</Text>
          <View style={styles.commandsList}>
            {VOICE_EXAMPLES.map((cmd, i) => (
              <TouchableOpacity key={i} style={styles.commandItem} onPress={() => handleVoiceCommand(cmd)} activeOpacity={0.7}>
                <View style={styles.commandIcon}><Ionicons name="chevron-forward" size={14} color={COLORS.dark.accent} /></View>
                <Text style={styles.commandText}>{cmd}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Settings + Bookmarks buttons */}
      <View style={styles.topButtons}>
        <TouchableOpacity style={styles.topButton} onPress={() => router.push('/bookmarks')}><Ionicons name="bookmark-outline" size={22} color={COLORS.dark.textSecondary} /></TouchableOpacity>
        <TouchableOpacity style={styles.topButton} onPress={() => router.push('/settings')}><Ionicons name="settings-outline" size={22} color={COLORS.dark.textSecondary} /></TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.background },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'ios' ? 80 : 60, paddingBottom: SPACING.xxl },
  topButtons: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: SPACING.lg, flexDirection: 'row', gap: SPACING.sm },
  topButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.dark.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.dark.border },
  logoContainer: { alignItems: 'center', marginBottom: SPACING.lg },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.dark.primary, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md, shadowColor: COLORS.dark.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  appName: { fontSize: FONT_SIZE.hero, fontWeight: '800', color: COLORS.dark.text, letterSpacing: -1 },
  tagline: { fontSize: FONT_SIZE.md, color: COLORS.dark.textSecondary, marginTop: SPACING.xs },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.dark.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.dark.border },
  inputIcon: { marginRight: SPACING.sm },
  urlInput: { flex: 1, height: 52, fontSize: FONT_SIZE.md, color: COLORS.dark.text },
  goButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.dark.primary, justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.dark.text, marginBottom: SPACING.md },
  seeAllText: { fontSize: FONT_SIZE.sm, color: COLORS.dark.primary, fontWeight: '600' },
  quickLinksGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quickLink: { width: (width - SPACING.lg * 2 - SPACING.md * 2) / 3, alignItems: 'center', paddingVertical: SPACING.md, marginBottom: SPACING.md, backgroundColor: COLORS.dark.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.dark.border },
  quickLinkIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs },
  quickLinkText: { fontSize: FONT_SIZE.sm, color: COLORS.dark.text, fontWeight: '600' },
  bookmarksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  bookmarkChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.dark.surface, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderWidth: 1, borderColor: COLORS.dark.border, gap: SPACING.xs },
  bookmarkChipText: { fontSize: FONT_SIZE.sm, color: COLORS.dark.text, fontWeight: '500', maxWidth: 120 },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm + 2, paddingHorizontal: SPACING.md, backgroundColor: COLORS.dark.surface, borderRadius: RADIUS.sm, marginBottom: SPACING.xs, gap: SPACING.sm },
  historyText: { fontSize: FONT_SIZE.sm, color: COLORS.dark.textSecondary, flex: 1 },
  commandsList: { backgroundColor: COLORS.dark.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.dark.border, overflow: 'hidden' },
  commandItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, borderBottomWidth: 1, borderBottomColor: COLORS.dark.border },
  commandIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.dark.accent + '20', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  commandText: { fontSize: FONT_SIZE.md, color: COLORS.dark.text, fontWeight: '500' },
});
