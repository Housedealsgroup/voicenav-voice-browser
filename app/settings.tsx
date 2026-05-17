import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/store';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/a11y/theme';
import { speak } from '../src/voice/textToSpeech';

const SPEECH_RATES = [
  { label: 'Slow', value: 0.6 },
  { label: 'Normal', value: 0.9 },
  { label: 'Fast', value: 1.2 },
  { label: 'Very Fast', value: 1.5 },
];

export default function SettingsScreen() {
  const router = useRouter();
  const {
    speechRate, setSpeechRate,
    autoRead, setAutoRead,
    hapticFeedback, setHapticFeedback,
  } = useAppStore();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Speech Rate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Speech Rate</Text>
          <Text style={styles.sectionDescription}>How fast the app speaks to you</Text>
          <View style={styles.rateOptions}>
            {SPEECH_RATES.map((rate) => (
              <TouchableOpacity
                key={rate.label}
                style={[
                  styles.rateOption,
                  speechRate === rate.value && styles.rateOptionActive,
                ]}
                onPress={() => {
                  setSpeechRate(rate.value);
                  speak(`Speech rate set to ${rate.label}`, { rate: rate.value });
                }}
                accessibilityLabel={`${rate.label} speech rate`}
                accessibilityState={{ selected: speechRate === rate.value }}
              >
                <Text
                  style={[
                    styles.rateOptionText,
                    speechRate === rate.value && styles.rateOptionTextActive,
                  ]}
                >
                  {rate.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Auto-read pages</Text>
              <Text style={styles.toggleDescription}>
                Automatically read page content when it loads
              </Text>
            </View>
            <Switch
              value={autoRead}
              onValueChange={setAutoRead}
              trackColor={{ false: COLORS.dark.border, true: COLORS.dark.primary }}
              thumbColor={COLORS.dark.text}
              accessibilityLabel="Auto-read pages"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Haptic feedback</Text>
              <Text style={styles.toggleDescription}>
                Vibrate when actions are performed
              </Text>
            </View>
            <Switch
              value={hapticFeedback}
              onValueChange={setHapticFeedback}
              trackColor={{ false: COLORS.dark.border, true: COLORS.dark.primary }}
              thumbColor={COLORS.dark.text}
              accessibilityLabel="Haptic feedback"
            />
          </View>
        </View>

        {/* Voice Commands Reference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Commands</Text>
          <Text style={styles.sectionDescription}>
            Say these commands while browsing:
          </Text>
          <View style={styles.commandsList}>
            {[
              { cmd: 'Go to [website]', desc: 'Navigate to a website' },
              { cmd: 'Search for [query]', desc: 'Search Google' },
              { cmd: 'Click [element]', desc: 'Click an element on the page' },
              { cmd: 'Add to cart', desc: 'Click the add to cart button' },
              { cmd: 'Read this page', desc: 'Read the page content aloud' },
              { cmd: 'Scroll down/up', desc: 'Scroll the page' },
              { cmd: 'Go back', desc: 'Go to the previous page' },
              { cmd: 'Stop', desc: 'Stop the current action' },
              { cmd: 'Help', desc: 'List available commands' },
            ].map((item, i) => (
              <View key={i} style={styles.commandRow}>
                <Text style={styles.commandName}>{item.cmd}</Text>
                <Text style={styles.commandDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About VoiceNav</Text>
          <Text style={styles.aboutText}>
            VoiceNav is an AI-powered web browser designed for blind and visually impaired
            users. Browse the web, shop online, and access information using just your voice.
          </Text>
          <Text style={styles.aboutText}>
            Version 1.0.0{'\n'}
            Open Source • Free Forever
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.dark.text,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.dark.text,
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.textSecondary,
    marginBottom: SPACING.md,
  },
  rateOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rateOption: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    alignItems: 'center',
  },
  rateOptionActive: {
    backgroundColor: COLORS.dark.primary,
    borderColor: COLORS.dark.primary,
  },
  rateOptionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.text,
    fontWeight: '600',
  },
  rateOptionTextActive: {
    color: COLORS.dark.text,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  toggleInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  toggleLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.dark.text,
  },
  toggleDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  commandsList: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    overflow: 'hidden',
  },
  commandRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.border,
  },
  commandName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.dark.accent,
  },
  commandDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  aboutText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.dark.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
});
