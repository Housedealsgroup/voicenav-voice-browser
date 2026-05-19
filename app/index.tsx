import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import VoiceNavLogo from '../src/components/VoiceNavLogo';
import { isOnboardingDone } from '../src/store/persistentState';

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

const VOICE_COMMAND_CARDS = [
  {
    category: 'Navigation',
    icon: 'navigate' as const,
    color: COLORS.dark.primary,
    commands: [
      { text: 'Go to [website]', desc: 'Open any website' },
      { text: 'Search for [query]', desc: 'Google search' },
      { text: 'Go back / Go forward', desc: 'Browser navigation' },
    ],
  },
  {
    category: 'Page Control',
    icon: 'finger-print' as const,
    color: COLORS.dark.accent,
    commands: [
      { text: 'Click [element]', desc: 'Tap buttons and links' },
      { text: 'Scroll down / up', desc: 'Navigate the page' },
      { text: 'Read this page', desc: 'Hear page content' },
    ],
  },
  {
    category: 'Shopping',
    icon: 'cart' as const,
    color: '#FF9900',
    commands: [
      { text: 'Add to cart', desc: 'Add items' },
      { text: 'Compare prices', desc: 'Price comparison' },
      { text: 'Sort by price', desc: 'Filter results' },
    ],
  },
  {
    category: 'Productivity',
    icon: 'clipboard' as const,
    color: COLORS.dark.success,
    commands: [
      { text: 'Bookmark this', desc: 'Save current page' },
      { text: 'Fill in [field]', desc: 'Form input' },
      { text: 'Sign in', desc: 'Login automation' },
    ],
  },
];

const TIPS = [
  { icon: 'bulb' as const, title: 'Quick Search', text: 'Say "search for" followed by anything to instantly search Google.', color: COLORS.dark.warning },
  { icon: 'bookmark' as const, title: 'Save Anything', text: 'Say "bookmark this page" to save the current page for later.', color: COLORS.dark.primary },
  { icon: 'mic' as const, title: 'Hands-Free Mode', text: 'Long-press the microphone for continuous listening mode.', color: COLORS.dark.error },
  { icon: 'volume-high' as const, title: 'Read Aloud', text: 'Say "read this page" and VoiceNav will read the content to you.', color: COLORS.dark.accent },
  { icon: 'pricetag' as const, title: 'Smart Shopping', text: 'Say "compare prices for [item]" to find the best deals.', color: COLORS.dark.success },
  { icon: 'shield-checkmark' as const, title: 'Privacy First', text: 'All voice processing happens on your device. Nothing is sent to servers.', color: COLORS.dark.primary },
  { icon: 'globe' as const, title: 'Multi-Language', text: 'VoiceNav supports 222 languages. Change yours in Settings.', color: COLORS.dark.accent },
  { icon: 'flash' as const, title: 'Voice Shortcuts', text: 'Create custom voice shortcuts in Settings for faster navigation.', color: COLORS.dark.warning },
];

export default function HomeScreen() {
  const router = useRouter();
  const { setCurrentUrl, addBrowsingHistory, addCommandHistory, speechRate, browsingHistory, commandHistory } = useAppStore();
  const { bookmarks } = useBookmarkStore();
  const { findShortcut } = useVoiceShortcutStore();
  const [inputUrl, setInputUrl] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [commandCardsExpanded, setCommandCardsExpanded] = useState(false);
  const tipAnim = useRef(new Animated.Value(1)).current;

  const { isListening, transcript, interimTranscript, start: startListening, stop: stopListening } = useSpeechRecognition();

  useEffect(() => {
    isOnboardingDone().then((done) => {
      if (!done) { router.replace('/onboarding'); }
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

  // Tips carousel auto-rotation
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(tipAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
        Animated.timing(tipAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [tipAnim]);

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

    const shortcut = findShortcut(command);
    if (shortcut) {
      if (shortcut.action === 'navigate') { speak(`Opening shortcut: ${shortcut.phrase}`); navigateTo(shortcut.target); return; }
    }

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

  // Compute recent sites with visit counts
  const siteVisitCounts = browsingHistory.reduce<Record<string, number>>((acc, url) => {
    const key = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const recentSites = Object.entries(siteVisitCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const recentHistory = browsingHistory.slice(0, 5);
  const recentBookmarks = bookmarks.slice(0, 4);
  const currentTip = TIPS[currentTipIndex];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <VoiceNavLogo size={width > 400 ? 160 : 120} />
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

        {/* Tips Carousel */}
        <Animated.View style={[styles.tipCard, { opacity: tipAnim }]}>
          <View style={[styles.tipIconContainer, { backgroundColor: currentTip.color + '20' }]}>
            <Ionicons name={currentTip.icon} size={20} color={currentTip.color} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>{currentTip.title}</Text>
            <Text style={styles.tipText}>{currentTip.text}</Text>
          </View>
          <View style={styles.tipDots}>
            {TIPS.map((_, i) => (
              <View key={i} style={[styles.tipDot, i === currentTipIndex && { backgroundColor: currentTip.color, width: 12 }]} />
            ))}
          </View>
        </Animated.View>

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

        {/* Recent Sites with Visit Count */}
        {recentSites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Visited</Text>
            <View style={styles.recentSitesContainer}>
              {recentSites.map(([domain, count], i) => (
                <TouchableOpacity
                  key={domain}
                  style={styles.recentSiteItem}
                  onPress={() => navigateTo(`https://${domain}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.recentSiteRank}>
                    <Text style={styles.recentSiteRankText}>{i + 1}</Text>
                  </View>
                  <View style={styles.recentSiteInfo}>
                    <Text style={styles.recentSiteDomain} numberOfLines={1}>{domain}</Text>
                    <Text style={styles.recentSiteVisits}>{count} visit{count > 1 ? 's' : ''}</Text>
                  </View>
                  <View style={[styles.recentSiteBadge, { backgroundColor: i === 0 ? COLORS.dark.warning + '20' : COLORS.dark.surface }]}>
                    <Ionicons
                      name={i === 0 ? 'trophy' : 'trending-up'}
                      size={14}
                      color={i === 0 ? COLORS.dark.warning : COLORS.dark.textMuted}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Voice Command Quick-Start Cards */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeaderPressable}
            onPress={() => setCommandCardsExpanded(!commandCardsExpanded)}
            accessibilityLabel={`${commandCardsExpanded ? 'Collapse' : 'Expand'} voice command guide`}
          >
            <Text style={styles.sectionTitle}>Voice Command Guide</Text>
            <Ionicons
              name={commandCardsExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.dark.textSecondary}
            />
          </TouchableOpacity>

          {commandCardsExpanded && (
            <View style={styles.commandCardsGrid}>
              {VOICE_COMMAND_CARDS.map((card) => (
                <View key={card.category} style={[styles.commandCard, { borderLeftColor: card.color }]}>
                  <View style={styles.commandCardHeader}>
                    <Ionicons name={card.icon} size={18} color={card.color} />
                    <Text style={[styles.commandCardCategory, { color: card.color }]}>{card.category}</Text>
                  </View>
                  {card.commands.map((cmd, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.commandRow}
                      onPress={() => handleVoiceCommand(cmd.text)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.commandExample}>"{cmd.text}"</Text>
                      <Text style={styles.commandDesc}>{cmd.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}

          {!commandCardsExpanded && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voiceExamplesScroll}>
              {VOICE_EXAMPLES.slice(0, 6).map((cmd, i) => (
                <TouchableOpacity key={i} style={styles.voiceExampleChip} onPress={() => handleVoiceCommand(cmd)} activeOpacity={0.7}>
                  <Ionicons name="mic-outline" size={14} color={COLORS.dark.accent} />
                  <Text style={styles.voiceExampleText}>{cmd}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
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

        {/* Voice Commands Guide - Full List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Voice Commands</Text>
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
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.dark.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.dark.border },
  inputIcon: { marginRight: SPACING.sm },
  urlInput: { flex: 1, height: 52, fontSize: FONT_SIZE.md, color: COLORS.dark.text },
  goButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.dark.primary, justifyContent: 'center', alignItems: 'center' },

  // Tips carousel
  tipCard: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    position: 'relative',
  },
  tipIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tipContent: {
    marginBottom: SPACING.sm,
  },
  tipTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.dark.text,
    marginBottom: SPACING.xs,
  },
  tipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.textSecondary,
    lineHeight: 20,
  },
  tipDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.dark.textMuted,
  },

  // Recent sites
  recentSitesContainer: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    overflow: 'hidden',
  },
  recentSiteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.border,
  },
  recentSiteRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.dark.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  recentSiteRankText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: COLORS.dark.primary,
  },
  recentSiteInfo: {
    flex: 1,
  },
  recentSiteDomain: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.dark.text,
  },
  recentSiteVisits: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.dark.textMuted,
    marginTop: 1,
  },
  recentSiteBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Voice command cards
  sectionHeaderPressable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  commandCardsGrid: {
    gap: SPACING.md,
  },
  commandCard: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    borderLeftWidth: 3,
  },
  commandCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  commandCardCategory: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  commandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.dark.border,
  },
  commandExample: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.accent,
    fontWeight: '600',
    flex: 1,
  },
  commandDesc: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.dark.textMuted,
    marginLeft: SPACING.sm,
  },
  voiceExamplesScroll: {
    gap: SPACING.sm,
    paddingRight: SPACING.lg,
  },
  voiceExampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    gap: SPACING.xs,
  },
  voiceExampleText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.text,
    fontWeight: '500',
  },

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
