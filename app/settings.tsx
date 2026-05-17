import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../src/store';
import { useVoiceShortcutStore, VoiceShortcut } from '../src/store/voiceCommands';
import { COLORS, SPACING, FONT_SIZE, RADIUS, ThemeName } from '../src/a11y/theme';
import { speak } from '../src/voice/textToSpeech';
import { SUPPORTED_LANGUAGES, getLanguageName } from '../src/voice/languages';
import { clearAllData } from '../src/store/persistentState';
import { useThemeStore } from '../src/store/theme';

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
    continuousListening, setContinuousListening,
    language, setLanguage,
  } = useAppStore();
  const { shortcuts, addShortcut, removeShortcut } = useVoiceShortcutStore();
  const { themeName, setTheme } = useThemeStore();

  const [showAddShortcut, setShowAddShortcut] = useState(false);
  const [newPhrase, setNewPhrase] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newAction, setNewAction] = useState<'navigate' | 'search'>('navigate');

  const handleAddShortcut = useCallback(() => {
    if (!newPhrase.trim() || !newTarget.trim()) {
      speak('Please fill in both fields.');
      return;
    }
    addShortcut(newPhrase.trim(), newAction, newTarget.trim());
    speak(`Shortcut added: ${newPhrase}`);
    setNewPhrase('');
    setNewTarget('');
    setShowAddShortcut(false);
  }, [newPhrase, newTarget, newAction, addShortcut]);

  const handleDeleteShortcut = useCallback(
    (shortcut: VoiceShortcut) => {
      Alert.alert(
        'Delete Shortcut',
        `Remove "${shortcut.phrase}" shortcut?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              removeShortcut(shortcut.id);
              speak('Shortcut removed');
            },
          },
        ]
      );
    },
    [removeShortcut]
  );

  const renderShortcut = useCallback(
    ({ item }: { item: VoiceShortcut }) => (
      <View style={styles.shortcutItem}>
        <View style={styles.shortcutIcon}>
          <Ionicons
            name={item.action === 'navigate' ? 'globe-outline' : 'search-outline'}
            size={18}
            color={COLORS.dark.accent}
          />
        </View>
        <View style={styles.shortcutInfo}>
          <Text style={styles.shortcutPhrase}>"{item.phrase}"</Text>
          <Text style={styles.shortcutTarget} numberOfLines={1}>
            {item.target}
          </Text>
        </View>
        {item.createdAt > 0 && (
          <TouchableOpacity
            onPress={() => handleDeleteShortcut(item)}
            style={styles.shortcutDelete}
            accessibilityLabel={`Delete shortcut ${item.phrase}`}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.dark.error} />
          </TouchableOpacity>
        )}
      </View>
    ),
    [handleDeleteShortcut]
  );

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

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Continuous listening</Text>
              <Text style={styles.toggleDescription}>
                Keep listening after each command until you say "stop"
              </Text>
            </View>
            <Switch
              value={continuousListening}
              onValueChange={setContinuousListening}
              trackColor={{ false: COLORS.dark.border, true: COLORS.dark.primary }}
              thumbColor={COLORS.dark.text}
              accessibilityLabel="Continuous listening"
            />
          </View>
        </View>

        {/* Theme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme</Text>
          <Text style={styles.sectionDescription}>Choose your visual theme</Text>
          <View style={styles.rateOptions}>
            {([
              { name: 'dark' as ThemeName, label: 'Dark', icon: 'moon', desc: 'Default dark theme' },
              { name: 'light' as ThemeName, label: 'Light', icon: 'sunny', desc: 'Clean light theme' },
              { name: 'highContrast' as ThemeName, label: 'High Contrast', icon: 'eye', desc: 'Maximum readability' },
              { name: 'amoled' as ThemeName, label: 'AMOLED', icon: 'contrast', desc: 'Pure black, saves battery' },
            ]).map((theme) => (
              <TouchableOpacity
                key={theme.name}
                style={[
                  styles.rateOption,
                  themeName === theme.name && styles.rateOptionActive,
                ]}
                onPress={() => {
                  setTheme(theme.name);
                  speak(`Theme set to ${theme.label}`);
                }}
                accessibilityLabel={`${theme.label} theme: ${theme.desc}`}
                accessibilityState={{ selected: themeName === theme.name }}
              >
                <Ionicons
                  name={theme.icon as any}
                  size={20}
                  color={themeName === theme.name ? COLORS.dark.primary : COLORS.dark.textMuted}
                />
                <Text
                  style={[
                    styles.rateOptionText,
                    themeName === theme.name && styles.rateOptionTextActive,
                  ]}
                >
                  {theme.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <Text style={styles.sectionDescription}>Voice recognition and speech language</Text>
          <View style={styles.languageGrid}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.languageOption, language === lang.code && styles.languageOptionActive]}
                onPress={() => {
                  setLanguage(lang.code);
                  speak(`Language set to ${lang.name}`);
                }}
                accessibilityLabel={`${lang.name} (${lang.nativeName})`}
                accessibilityState={{ selected: language === lang.code }}
              >
                <Text style={[styles.languageText, language === lang.code && styles.languageTextActive]}>
                  {lang.nativeName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Voice Shortcuts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Voice Shortcuts</Text>
              <Text style={styles.sectionDescription}>
                Custom phrases that trigger actions
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAddShortcut(!showAddShortcut)}
              style={styles.addButton}
              accessibilityLabel="Add voice shortcut"
            >
              <Ionicons
                name={showAddShortcut ? 'close' : 'add'}
                size={22}
                color={COLORS.dark.text}
              />
            </TouchableOpacity>
          </View>

          {/* Add shortcut form */}
          {showAddShortcut && (
            <View style={styles.addForm}>
              <TextInput
                style={styles.formInput}
                placeholder='Voice phrase (e.g. "go home")'
                placeholderTextColor={COLORS.dark.textMuted}
                value={newPhrase}
                onChangeText={setNewPhrase}
                autoCapitalize="none"
                accessibilityLabel="Voice phrase"
              />
              <View style={styles.actionPicker}>
                <TouchableOpacity
                  style={[
                    styles.actionOption,
                    newAction === 'navigate' && styles.actionOptionActive,
                  ]}
                  onPress={() => setNewAction('navigate')}
                >
                  <Ionicons name="globe-outline" size={16} color={newAction === 'navigate' ? COLORS.dark.text : COLORS.dark.textSecondary} />
                  <Text style={[styles.actionOptionText, newAction === 'navigate' && styles.actionOptionTextActive]}>
                    Navigate
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionOption,
                    newAction === 'search' && styles.actionOptionActive,
                  ]}
                  onPress={() => setNewAction('search')}
                >
                  <Ionicons name="search-outline" size={16} color={newAction === 'search' ? COLORS.dark.text : COLORS.dark.textSecondary} />
                  <Text style={[styles.actionOptionText, newAction === 'search' && styles.actionOptionTextActive]}>
                    Search
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.formInput}
                placeholder={newAction === 'navigate' ? 'URL (e.g. https://gmail.com)' : 'Search query'}
                placeholderTextColor={COLORS.dark.textMuted}
                value={newTarget}
                onChangeText={setNewTarget}
                autoCapitalize="none"
                keyboardType={newAction === 'navigate' ? 'url' : 'default'}
                accessibilityLabel="Target URL or search query"
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleAddShortcut}>
                <Text style={styles.saveButtonText}>Save Shortcut</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Shortcuts list */}
          <View style={styles.shortcutsList}>
            {shortcuts.map((shortcut) => (
              <View key={shortcut.id}>
                {renderShortcut({ item: shortcut })}
              </View>
            ))}
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
              { cmd: 'Bookmark this', desc: 'Save current page' },
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

        {/* Privacy & Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Data</Text>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => router.push('/privacy')}
            accessibilityLabel="View privacy policy"
          >
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Privacy Policy</Text>
              <Text style={styles.toggleDescription}>How VoiceNav protects your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.dark.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => {
              Alert.alert(
                'Clear All Data',
                'This will delete all bookmarks, history, shortcuts, and preferences. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear Everything',
                    style: 'destructive',
                    onPress: async () => {
                      await clearAllData();
                      speak('All data cleared.');
                    },
                  },
                ]
              );
            }}
            accessibilityLabel="Clear all data"
          >
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: COLORS.dark.error }]}>Clear All Data</Text>
              <Text style={styles.toggleDescription}>Delete all bookmarks, history, and preferences</Text>
            </View>
            <Ionicons name="trash-outline" size={20} color={COLORS.dark.error} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About VoiceNav</Text>
          <Text style={styles.aboutText}>
            VoiceNav is an AI-powered web browser designed for blind and visually impaired
            users. Browse the web, shop online, and access information using just your voice.
          </Text>
          <Text style={styles.aboutText}>
            Version 10.0.0 • Built by HouseDealsGroup{'\n'}
            Open Source • MIT License • Free Forever
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  addForm: {
    backgroundColor: COLORS.dark.surfaceLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    gap: SPACING.sm,
  },
  formInput: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.dark.text,
    fontSize: FONT_SIZE.md,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  actionPicker: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.dark.surface,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  actionOptionActive: {
    backgroundColor: COLORS.dark.primary,
    borderColor: COLORS.dark.primary,
  },
  actionOptionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.textSecondary,
    fontWeight: '600',
  },
  actionOptionTextActive: {
    color: COLORS.dark.text,
  },
  saveButton: {
    backgroundColor: COLORS.dark.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.dark.text,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  shortcutsList: {
    gap: SPACING.xs,
  },
  shortcutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  shortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.dark.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  shortcutInfo: {
    flex: 1,
  },
  shortcutPhrase: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.dark.accent,
  },
  shortcutTarget: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.textSecondary,
    marginTop: 2,
  },
  shortcutDelete: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  languageOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  languageOptionActive: {
    backgroundColor: COLORS.dark.primary,
    borderColor: COLORS.dark.primary,
  },
  languageText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.text,
    fontWeight: '600',
  },
  languageTextActive: {
    color: COLORS.dark.text,
  },
});
