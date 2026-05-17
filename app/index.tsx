import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/store';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/a11y/theme';
import { speak } from '../src/voice/textToSpeech';
import { requestPermission } from '../src/voice/speechToText';

const { width } = Dimensions.get('window');

const QUICK_LINKS = [
  { name: 'Google', url: 'https://www.google.com', icon: 'search' as const },
  { name: 'Amazon', url: 'https://www.amazon.com', icon: 'cart' as const },
  { name: 'YouTube', url: 'https://www.youtube.com', icon: 'play-circle' as const },
  { name: 'Wikipedia', url: 'https://www.wikipedia.org', icon: 'book' as const },
  { name: 'Reddit', url: 'https://www.reddit.com', icon: 'chatbubbles' as const },
  { name: 'GitHub', url: 'https://www.github.com', icon: 'logo-github' as const },
];

const VOICE_COMMANDS = [
  'Go to amazon.com',
  'Search for headphones',
  'Click add to cart',
  'Read this page',
  'Scroll down',
  'Go back',
];

export default function HomeScreen() {
  const router = useRouter();
  const { setCurrentUrl, addBrowsingHistory, addCommandHistory, speechRate } = useAppStore();
  const [inputUrl, setInputUrl] = useState('');
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Request speech permissions on mount
    requestPermission();

    // Welcome message
    const timer = setTimeout(() => {
      speak('Welcome to VoiceNav. Tap the microphone and say a command, or type a web address to get started.', {
        rate: speechRate,
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [pulseAnim]);

  const navigateTo = useCallback(
    (url: string) => {
      let finalUrl = url;
      if (!finalUrl.startsWith('http')) {
        finalUrl = 'https://' + finalUrl;
      }
      setCurrentUrl(finalUrl);
      addBrowsingHistory(finalUrl);
      router.push('/browser');
    },
    [setCurrentUrl, addBrowsingHistory, router]
  );

  const handleSubmitUrl = useCallback(() => {
    if (inputUrl.trim()) {
      navigateTo(inputUrl.trim());
    }
  }, [inputUrl, navigateTo]);

  const handleVoiceCommand = useCallback(
    (command: string) => {
      addCommandHistory(command);
      // Parse simple navigation commands
      const navMatch = command.match(/(?:go to|open|visit)\s+(.+)/i);
      if (navMatch) {
        navigateTo(navMatch[1].trim());
        return;
      }
      const searchMatch = command.match(/(?:search for|search|find)\s+(.+)/i);
      if (searchMatch) {
        navigateTo(`https://www.google.com/search?q=${encodeURIComponent(searchMatch[1].trim())}`);
        return;
      }
      // Default: open browser and let agent handle it
      setCurrentUrl('https://www.google.com');
      router.push('/browser');
    },
    [navigateTo, setCurrentUrl, addCommandHistory, router]
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="mic" size={48} color={COLORS.dark.primary} />
          </View>
          <Text style={styles.appName}>VoiceNav</Text>
          <Text style={styles.tagline}>Browse the web with your voice</Text>
        </View>

        {/* URL Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="globe-outline" size={20} color={COLORS.dark.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.urlInput}
            placeholder="Enter website or search..."
            placeholderTextColor={COLORS.dark.textMuted}
            value={inputUrl}
            onChangeText={setInputUrl}
            onSubmitEditing={handleSubmitUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            accessibilityLabel="Website address or search"
            accessibilityHint="Type a web address or search query and press enter"
          />
          {inputUrl.length > 0 && (
            <TouchableOpacity onPress={handleSubmitUrl} style={styles.goButton} accessibilityLabel="Go to address">
              <Ionicons name="arrow-forward" size={20} color={COLORS.dark.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Voice Mic Button */}
        <View style={styles.micSection}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.micButton}
              onPress={() => {
                startPulse();
                speak('Voice commands are coming soon. For now, type a web address or tap a quick link.', {
                  rate: speechRate,
                  onDone: stopPulse,
                });
              }}
              accessibilityLabel="Voice command"
              accessibilityHint="Tap to speak a command"
              activeOpacity={0.8}
            >
              <Ionicons name="mic" size={36} color={COLORS.dark.text} />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.micHint}>Tap to speak</Text>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.quickLinksGrid}>
            {QUICK_LINKS.map((link) => (
              <TouchableOpacity
                key={link.name}
                style={styles.quickLink}
                onPress={() => navigateTo(link.url)}
                accessibilityLabel={`Go to ${link.name}`}
                accessibilityHint={`Opens ${link.name} in the browser`}
                activeOpacity={0.7}
              >
                <View style={styles.quickLinkIcon}>
                  <Ionicons name={link.icon} size={24} color={COLORS.dark.primary} />
                </View>
                <Text style={styles.quickLinkText}>{link.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Voice Commands Guide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Commands</Text>
          <View style={styles.commandsList}>
            {VOICE_COMMANDS.map((cmd, i) => (
              <TouchableOpacity
                key={i}
                style={styles.commandItem}
                onPress={() => handleVoiceCommand(cmd)}
                accessibilityLabel={`Try command: ${cmd}`}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={16} color={COLORS.dark.accent} />
                <Text style={styles.commandText}>{cmd}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Settings button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push('/settings')}
        accessibilityLabel="Settings"
        accessibilityHint="Open app settings"
      >
        <Ionicons name="settings-outline" size={24} color={COLORS.dark.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: SPACING.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.dark.primary,
    marginBottom: SPACING.md,
  },
  appName: {
    fontSize: FONT_SIZE.hero,
    fontWeight: '800',
    color: COLORS.dark.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: FONT_SIZE.md,
    color: COLORS.dark.textSecondary,
    marginTop: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  urlInput: {
    flex: 1,
    height: 52,
    fontSize: FONT_SIZE.md,
    color: COLORS.dark.text,
  },
  goButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  micHint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.textMuted,
    marginTop: SPACING.sm,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.dark.text,
    marginBottom: SPACING.md,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickLink: {
    width: (width - SPACING.lg * 2 - SPACING.md * 2) / 3,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  quickLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  quickLinkText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.text,
    fontWeight: '600',
  },
  commandsList: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    overflow: 'hidden',
  },
  commandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.border,
  },
  commandText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.dark.text,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  settingsButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: SPACING.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
});
