// VoiceNav Command Palette — searchable command palette with categories
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  Animated, Modal, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../a11y/theme';

export type CommandEntry = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  action: string;
  isRecent?: boolean;
  isSuggestion?: boolean;
};

type CommandPaletteProps = {
  visible: boolean;
  onClose: () => void;
  onExecute: (command: string) => void;
  commands: CommandEntry[];
  recentCommands?: string[];
  contextSuggestions?: string[];
};

const CATEGORY_ICONS: Record<string, string> = {
  Navigation: 'compass',
  Shopping: 'cart',
  Reading: 'book',
  Forms: 'document-text',
  Media: 'play-circle',
  Tabs: 'layers',
  Custom: 'star',
  Recent: 'time',
  Suggested: 'bulb',
};

const CATEGORY_COLORS: Record<string, string> = {
  Navigation: '#4285F4',
  Shopping: '#FF9900',
  Reading: '#00E676',
  Forms: '#FF6B6B',
  Media: '#E040FB',
  Tabs: '#00BCD4',
  Custom: '#FFD600',
  Recent: '#A0A0C0',
  Suggested: '#00D9FF',
};

export default function CommandPalette({
  visible, onClose, onExecute, commands, recentCommands = [], contextSuggestions = [],
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setSelectedCategory(null);
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  // Build entries with recent + suggestions
  const allEntries = useMemo(() => {
    const entries: CommandEntry[] = [];

    // Suggestions
    if (contextSuggestions.length > 0) {
      entries.push(...contextSuggestions.map((s, i) => ({
        id: `sug-${i}`, name: s, description: 'Suggested based on current page',
        category: 'Suggested', icon: 'bulb', action: s, isSuggestion: true,
      })));
    }

    // Recent
    if (recentCommands.length > 0) {
      entries.push(...recentCommands.slice(0, 5).map((s, i) => ({
        id: `recent-${i}`, name: s, description: 'Recently used',
        category: 'Recent', icon: 'time', action: s, isRecent: true,
      })));
    }

    // All commands
    entries.push(...commands);

    return entries;
  }, [commands, recentCommands, contextSuggestions]);

  // Filter
  const filtered = useMemo(() => {
    let result = allEntries;
    if (selectedCategory) {
      result = result.filter(e => e.category === selectedCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allEntries, query, selectedCategory]);

  // Categories
  const categories = useMemo(() => {
    const cats = new Set(allEntries.map(e => e.category));
    return Array.from(cats);
  }, [allEntries]);

  const handleExecute = useCallback((command: string) => {
    onExecute(command);
    onClose();
  }, [onExecute, onClose]);

  const renderItem = useCallback(({ item }: { item: CommandEntry }) => {
    const catColor = CATEGORY_COLORS[item.category] || COLORS.dark.primary;
    const catIcon = CATEGORY_ICONS[item.category] || 'chevron-forward';
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleExecute(item.action)}
        activeOpacity={0.7}
      >
        <View style={[styles.itemIcon, { backgroundColor: catColor + '20' }]}>
          <Ionicons name={catIcon as any} size={18} color={catColor} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
        </View>
        <View style={[styles.itemCategory, { backgroundColor: catColor + '15' }]}>
          <Text style={[styles.itemCategoryText, { color: catColor }]}>{item.category}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [handleExecute]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[styles.container, {
          transform: [{
            translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }),
          }],
          opacity: slideAnim,
        }]}>
          {/* Search Input */}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={20} color={COLORS.dark.textMuted} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search commands..."
              placeholderTextColor={COLORS.dark.textMuted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="go"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.dark.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filters */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[null, ...categories]}
            keyExtractor={(item) => item || 'all'}
            contentContainerStyle={styles.categoryRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === item && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[styles.categoryChipText, selectedCategory === item && styles.categoryChipTextActive]}>
                  {item || 'All'}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* Command List */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={32} color={COLORS.dark.textMuted} />
                <Text style={styles.emptyText}>No commands found</Text>
              </View>
            }
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  container: {
    backgroundColor: COLORS.dark.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.border,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.dark.text,
    height: 40,
  },
  categoryRow: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dark.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.dark.primary + '20',
    borderColor: COLORS.dark.primary,
  },
  categoryChipText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.dark.textSecondary,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: COLORS.dark.primary,
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    gap: SPACING.sm,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: { flex: 1 },
  itemName: { fontSize: FONT_SIZE.md, color: COLORS.dark.text, fontWeight: '600' },
  itemDesc: { fontSize: FONT_SIZE.xs, color: COLORS.dark.textMuted, marginTop: 1 },
  itemCategory: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  itemCategoryText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  empty: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.dark.textMuted, marginTop: SPACING.sm },
});
