import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/a11y/theme';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>VoiceNav — Your Privacy Matters</Text>
        <Text style={styles.lastUpdated}>Last updated: May 17, 2026</Text>

        <Text style={styles.heading}>The Short Version</Text>
        <Text style={styles.paragraph}>
          VoiceNav processes everything on your device. We collect nothing. We send nothing. Your voice, your data, and your browsing stay 100% private.
        </Text>

        <Text style={styles.heading}>Data Collection</Text>
        <Text style={styles.paragraph}>
          VoiceNav does NOT collect, store, transmit, or share any personal data. There are no analytics, no telemetry, no tracking, and no external API calls.
        </Text>

        <Text style={styles.heading}>Voice Processing</Text>
        <Text style={styles.paragraph}>
          All speech recognition happens on-device using Apple's Speech framework (iOS) or Android's SpeechRecognizer. Your voice data is never sent to external servers.
        </Text>

        <Text style={styles.heading}>Browsing Data</Text>
        <Text style={styles.paragraph}>
          Your browsing history, bookmarks, and voice shortcuts are stored locally on your device using AsyncStorage. This data never leaves your device.
        </Text>

        <Text style={styles.heading}>Microphone Permission</Text>
        <Text style={styles.paragraph}>
          VoiceNav requires microphone access to listen for voice commands. The microphone is only active when you tap the microphone button or enable continuous listening mode. Audio is processed in real-time and is never recorded or stored.
        </Text>

        <Text style={styles.heading}>Speech Recognition Permission</Text>
        <Text style={styles.paragraph}>
          VoiceNav requires speech recognition permission to convert your voice commands into text. This processing happens entirely on your device.
        </Text>

        <Text style={styles.heading}>Third-Party Services</Text>
        <Text style={styles.paragraph}>
          VoiceNav does not integrate with any third-party analytics, advertising, or data collection services. The app is completely self-contained.
        </Text>

        <Text style={styles.heading}>Children's Privacy</Text>
        <Text style={styles.paragraph}>
          VoiceNav does not collect any data from users of any age, including children under 13.
        </Text>

        <Text style={styles.heading}>Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          If this privacy policy changes, we will update the date above. Since we collect no data, changes will only reflect clarifications in wording.
        </Text>

        <Text style={styles.heading}>Contact</Text>
        <Text style={styles.paragraph}>
          Questions? Open an issue at github.com/Housedealsgroup/voicenav
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built with care for accessibility by GITLAWB
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
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: {
    marginBottom: SPACING.sm,
  },
  backText: {
    color: COLORS.dark.accent,
    fontSize: FONT_SIZE.md,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.dark.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.dark.accent,
    marginBottom: SPACING.xs,
  },
  lastUpdated: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.dark.textMuted,
    marginBottom: SPACING.lg,
  },
  heading: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.dark.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  paragraph: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  footer: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.dark.textMuted,
  },
});
