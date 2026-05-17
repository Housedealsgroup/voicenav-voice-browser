import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/a11y/theme';
import { useBookmarkStore, Bookmark } from '../src/store/bookmarks';
import { useAppStore } from '../src/store';
import { speak } from '../src/voice/textToSpeech';

export default function BookmarksScreen() {
  const router = useRouter();
  const { bookmarks, removeBookmark, categories } = useBookmarkStore();
  const { setCurrentUrl } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBookmarks = bookmarks.filter((b) => {
    const matchesCategory = !selectedCategory || b.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.url.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenBookmark = useCallback(
    (bookmark: Bookmark) => {
      setCurrentUrl(bookmark.url);
      speak(`Opening ${bookmark.title}`);
      router.push('/browser');
    },
    [setCurrentUrl, router]
  );

  const handleDeleteBookmark = useCallback(
    (bookmark: Bookmark) => {
      Alert.alert(
        'Remove Bookmark',
        `Remove "${bookmark.title}" from bookmarks?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              removeBookmark(bookmark.id);
              speak('Bookmark removed');
            },
          },
        ]
      );
    },
    [removeBookmark]
  );

  const renderBookmark = useCallback(
    ({ item }: { item: Bookmark }) => (
      <TouchableOpacity
        style={styles.bookmarkItem}
        onPress={() => handleOpenBookmark(item)}
        onLongPress={() => handleDeleteBookmark(item)}
        accessibilityLabel={`${item.title}. ${item.url}`}
        accessibilityHint="Tap to open. Long press to remove."
      >
        <View style={styles.bookmarkIcon}>
          <Ionicons name="globe-outline" size={20} color={COLORS.dark.primary} />
        </View>
        <View style={styles.bookmarkInfo}>
          <Text style={styles.bookmarkTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.bookmarkUrl} numberOfLines={1}>
            {item.url.replace(/^https?:\/\/(www\.)?/, '')}
          </Text>
        </View>
        <View style={styles.bookmarkCategory}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </TouchableOpacity>
    ),
    [handleOpenBookmark, handleDeleteBookmark]
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
        <Text style={styles.title}>Bookmarks</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.dark.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search bookmarks..."
          placeholderTextColor={COLORS.dark.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search bookmarks"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.dark.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <View style={styles.categoriesContainer}>
        <TouchableOpacity
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat && styles.categoryChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookmarks list */}
      {filteredBookmarks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color={COLORS.dark.textMuted} />
          <Text style={styles.emptyTitle}>No Bookmarks</Text>
          <Text style={styles.emptyDescription}>
            {searchQuery
              ? 'No bookmarks match your search'
              : 'Save pages while browsing by saying "bookmark this page"'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookmarks}
          keyExtractor={(item) => item.id}
          renderItem={renderBookmark}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: COLORS.dark.text,
    fontSize: FONT_SIZE.md,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dark.surface,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.dark.primary,
    borderColor: COLORS.dark.primary,
  },
  categoryChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.textSecondary,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: COLORS.dark.text,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  bookmarkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.dark.text,
    marginBottom: 2,
  },
  bookmarkUrl: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.dark.textMuted,
  },
  bookmarkCategory: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dark.surfaceLight,
    marginLeft: SPACING.sm,
  },
  categoryText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.dark.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.dark.text,
    marginTop: SPACING.md,
  },
  emptyDescription: {
    fontSize: FONT_SIZE.md,
    color: COLORS.dark.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
});
