import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/a11y/theme';
import { useBookmarkStore, Bookmark } from '../src/store/bookmarks';
import { useAppStore } from '../src/store';
import { speak } from '../src/voice/textToSpeech';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80;
const TAG_COLORS = [COLORS.dark.primary, COLORS.dark.accent, COLORS.dark.success, COLORS.dark.warning, COLORS.dark.error, '#E040FB', '#FF6D00', '#00BFA5'];

// Bookmark item with swipe gesture
function SwipeableBookmarkRow({
  item,
  onOpen,
  onDelete,
  onTag,
}: {
  item: Bookmark;
  onOpen: (b: Bookmark) => void;
  onDelete: (b: Bookmark) => void;
  onTag: (b: Bookmark) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10 && Math.abs(gesture.dy) < 10,
      onPanResponderMove: (_, gesture) => {
        const newVal = lastOffset.current + gesture.dx;
        translateX.setValue(Math.min(0, newVal));
      },
      onPanResponderRelease: (_, gesture) => {
        const newVal = lastOffset.current + gesture.dx;
        if (newVal < SWIPE_THRESHOLD) {
          // Swipe far enough - show delete
          Animated.spring(translateX, { toValue: -100, useNativeDriver: true }).start();
          lastOffset.current = -100;
        } else {
          // Snap back
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          lastOffset.current = 0;
        }
      },
    })
  ).current;

  const handleDelete = useCallback(() => {
    Animated.timing(translateX, { toValue: -SCREEN_WIDTH, duration: 250, useNativeDriver: true }).start(() => {
      onDelete(item);
    });
  }, [item, onDelete, translateX]);

  return (
    <View style={styles.swipeableContainer}>
      {/* Delete action behind */}
      <View style={styles.swipeActions}>
        <TouchableOpacity style={styles.swipeDeleteButton} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color={COLORS.dark.text} />
          <Text style={styles.swipeDeleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Bookmark row */}
      <Animated.View
        style={[styles.bookmarkItemWrapper, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.bookmarkItem}
          onPress={() => onOpen(item)}
          onLongPress={() => onTag(item)}
          accessibilityLabel={`${item.title}. ${item.url}. ${item.category || 'Uncategorized'}`}
          accessibilityHint="Tap to open. Long press to add tags. Swipe left to delete."
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
            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {item.tags.map((tag, i) => (
                  <View key={tag} style={[styles.tagChip, { backgroundColor: TAG_COLORS[i % TAG_COLORS.length] + '20', borderColor: TAG_COLORS[i % TAG_COLORS.length] + '40' }]}>
                    <Text style={[styles.tagText, { color: TAG_COLORS[i % TAG_COLORS.length] }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <View style={styles.bookmarkMeta}>
            <View style={styles.bookmarkCategory}>
              <Text style={styles.categoryText}>{item.category || 'General'}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function BookmarksScreen() {
  const router = useRouter();
  const { bookmarks, removeBookmark, categories, updateBookmark } = useBookmarkStore();
  const { setCurrentUrl } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'folders'>('list');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [tagTarget, setTagTarget] = useState<Bookmark | null>(null);
  const [newTagText, setNewTagText] = useState('');

  const filteredBookmarks = bookmarks.filter((b) => {
    const matchesCategory = !selectedCategory || b.category === selectedCategory;
    const matchesFolder = !selectedFolder || b.category === selectedFolder;
    const matchesSearch =
      !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.tags && b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesFolder && matchesSearch;
  });

  // Compute folder data
  const folders = categories.map((cat) => ({
    name: cat,
    count: bookmarks.filter((b) => b.category === cat).length,
    icon: getCategoryIcon(cat),
    color: getCategoryColor(cat),
  }));

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
      removeBookmark(bookmark.id);
      speak('Bookmark removed');
    },
    [removeBookmark]
  );

  const handleTagBookmark = useCallback(
    (bookmark: Bookmark) => {
      setTagTarget(bookmark);
      setNewTagText('');
      setTagModalVisible(true);
    },
    []
  );

  const handleAddTag = useCallback(() => {
    if (!tagTarget || !newTagText.trim()) return;
    const existingTags = tagTarget.tags || [];
    const tag = newTagText.trim().toLowerCase();
    if (!existingTags.includes(tag)) {
      updateBookmark(tagTarget.id, { tags: [...existingTags, tag] });
      speak(`Tag "${tag}" added`);
    }
    setNewTagText('');
  }, [tagTarget, newTagText, updateBookmark]);

  const handleRemoveTag = useCallback(
    (tag: string) => {
      if (!tagTarget) return;
      const existingTags = tagTarget.tags || [];
      updateBookmark(tagTarget.id, { tags: existingTags.filter((t) => t !== tag) });
      speak(`Tag "${tag}" removed`);
    },
    [tagTarget, updateBookmark]
  );

  const handleFolderPress = useCallback((folderName: string) => {
    setSelectedFolder(selectedFolder === folderName ? null : folderName);
    setSelectedCategory(selectedFolder === folderName ? null : folderName);
  }, [selectedFolder]);

  // Folder view
  const renderFolderView = () => (
    <View style={styles.foldersGrid}>
      {folders.filter(f => f.count > 0).map((folder) => (
        <TouchableOpacity
          key={folder.name}
          style={[styles.folderCard, selectedFolder === folder.name && styles.folderCardActive]}
          onPress={() => handleFolderPress(folder.name)}
          accessibilityLabel={`${folder.name} folder. ${folder.count} bookmarks.`}
        >
          <View style={[styles.folderIcon, { backgroundColor: folder.color + '20' }]}>
            <Ionicons name={folder.icon} size={28} color={folder.color} />
          </View>
          <Text style={styles.folderName}>{folder.name}</Text>
          <Text style={styles.folderCount}>{folder.count}</Text>
        </TouchableOpacity>
      ))}

      {/* Uncategorized count */}
      {bookmarks.filter(b => !b.category).length > 0 && (
        <TouchableOpacity
          style={[styles.folderCard, selectedFolder === null && selectedCategory === null && styles.folderCardActive]}
          onPress={() => { setSelectedFolder(null); setSelectedCategory(null); }}
        >
          <View style={[styles.folderIcon, { backgroundColor: COLORS.dark.textMuted + '20' }]}>
            <Ionicons name="folder-open" size={28} color={COLORS.dark.textMuted} />
          </View>
          <Text style={styles.folderName}>Uncategorized</Text>
          <Text style={styles.folderCount}>{bookmarks.filter(b => !b.category).length}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Bookmark list
  const renderBookmark = useCallback(
    ({ item }: { item: Bookmark }) => (
      <SwipeableBookmarkRow
        item={item}
        onOpen={handleOpenBookmark}
        onDelete={handleDeleteBookmark}
        onTag={handleTagBookmark}
      />
    ),
    [handleOpenBookmark, handleDeleteBookmark, handleTagBookmark]
  );

  // Tag modal
  const renderTagModal = () => {
    if (!tagModalVisible || !tagTarget) return null;
    const existingTags = tagTarget.tags || [];

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tags for {tagTarget.title}</Text>
            <TouchableOpacity onPress={() => setTagModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.dark.text} />
            </TouchableOpacity>
          </View>

          {/* Existing tags */}
          <View style={styles.modalTagsContainer}>
            {existingTags.length > 0 ? (
              existingTags.map((tag, i) => (
                <View key={tag} style={[styles.modalTag, { backgroundColor: TAG_COLORS[i % TAG_COLORS.length] + '20', borderColor: TAG_COLORS[i % TAG_COLORS.length] + '40' }]}>
                  <Text style={[styles.modalTagText, { color: TAG_COLORS[i % TAG_COLORS.length] }]}>{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                    <Ionicons name="close-circle" size={16} color={TAG_COLORS[i % TAG_COLORS.length]} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noTagsText}>No tags yet</Text>
            )}
          </View>

          {/* Add tag input */}
          <View style={styles.addTagRow}>
            <TextInput
              style={styles.addTagInput}
              placeholder="Add a tag..."
              placeholderTextColor={COLORS.dark.textMuted}
              value={newTagText}
              onChangeText={setNewTagText}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addTagButton, !newTagText.trim() && styles.addTagButtonDisabled]}
              onPress={handleAddTag}
              disabled={!newTagText.trim()}
            >
              <Ionicons name="add" size={20} color={newTagText.trim() ? COLORS.dark.text : COLORS.dark.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Suggested tags */}
          <Text style={styles.suggestedLabel}>Suggested</Text>
          <View style={styles.suggestedTags}>
            {['important', 'read later', 'work', 'personal', 'reference'].filter(t => !existingTags.includes(t)).map((tag) => (
              <TouchableOpacity key={tag} style={styles.suggestedTag} onPress={() => { setNewTagText(tag); }}>
                <Text style={styles.suggestedTagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

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
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode(viewMode === 'list' ? 'folders' : 'list')}
          accessibilityLabel={viewMode === 'list' ? 'Switch to folder view' : 'Switch to list view'}
        >
          <Ionicons name={viewMode === 'list' ? 'folder-outline' : 'list'} size={22} color={COLORS.dark.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.dark.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search bookmarks and tags..."
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
          onPress={() => { setSelectedCategory(null); setSelectedFolder(null); }}
        >
          <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            onPress={() => { setSelectedCategory(selectedCategory === cat ? null : cat); setSelectedFolder(selectedCategory === cat ? null : cat); }}
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

      {/* Content */}
      {viewMode === 'folders' ? (
        <ScrollView style={styles.foldersScrollView}>
          {renderFolderView()}
          {/* Show bookmarks in selected folder */}
          {selectedFolder && filteredBookmarks.length > 0 && (
            <View style={styles.folderBookmarksSection}>
              <Text style={styles.folderBookmarksTitle}>{selectedFolder}</Text>
              <FlatList
                data={filteredBookmarks}
                keyExtractor={(item) => item.id}
                renderItem={renderBookmark}
                scrollEnabled={false}
              />
            </View>
          )}
        </ScrollView>
      ) : filteredBookmarks.length === 0 ? (
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

      {/* Tag modal */}
      {renderTagModal()}
    </View>
  );
}

function getCategoryIcon(cat: string): keyof typeof Ionicons.glyphMap {
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    General: 'folder',
    Shopping: 'cart',
    News: 'newspaper',
    Social: 'people',
    Work: 'briefcase',
    Entertainment: 'film',
    Education: 'school',
    Finance: 'wallet',
    Health: 'fitness',
    Travel: 'airplane',
  };
  return map[cat] || 'folder';
}

function getCategoryColor(cat: string): string {
  const map: Record<string, string> = {
    General: COLORS.dark.primary,
    Shopping: '#FF9900',
    News: '#4285F4',
    Social: '#E040FB',
    Work: COLORS.dark.accent,
    Entertainment: '#FF5252',
    Education: '#00E676',
    Finance: '#FFD600',
    Health: '#00BFA5',
    Travel: '#FF6D00',
  };
  return map[cat] || COLORS.dark.textMuted;
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
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.dark.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
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

  // Swipeable row
  swipeableContainer: {
    marginBottom: SPACING.sm,
    position: 'relative',
  },
  swipeActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dark.error,
    borderRadius: RADIUS.md,
  },
  swipeDeleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  swipeDeleteText: {
    color: COLORS.dark.text,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  bookmarkItemWrapper: {
    backgroundColor: COLORS.dark.background,
    borderRadius: RADIUS.md,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
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
  bookmarkMeta: {
    alignItems: 'flex-end',
    marginLeft: SPACING.sm,
  },
  bookmarkCategory: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dark.surfaceLight,
  },
  categoryText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.dark.textSecondary,
    fontWeight: '500',
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  tagText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },

  // Folders view
  foldersScrollView: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  foldersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  folderCard: {
    width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    alignItems: 'center',
  },
  folderCardActive: {
    borderColor: COLORS.dark.primary,
    backgroundColor: COLORS.dark.primary + '10',
  },
  folderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  folderName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.dark.text,
    marginBottom: SPACING.xs,
  },
  folderCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.textMuted,
  },
  folderBookmarksSection: {
    marginTop: SPACING.lg,
  },
  folderBookmarksTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.dark.text,
    marginBottom: SPACING.md,
  },

  // Empty state
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

  // Tag modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.dark.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContent: {
    width: SCREEN_WIDTH - SPACING.xl * 2,
    backgroundColor: COLORS.dark.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.dark.text,
    flex: 1,
    marginRight: SPACING.md,
  },
  modalTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  modalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  modalTagText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  noTagsText: {
    color: COLORS.dark.textMuted,
    fontSize: FONT_SIZE.md,
    fontStyle: 'italic',
  },
  addTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surfaceLight,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    marginBottom: SPACING.md,
  },
  addTagInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: SPACING.md,
    color: COLORS.dark.text,
    fontSize: FONT_SIZE.md,
  },
  addTagButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.dark.primary,
    borderTopRightRadius: RADIUS.sm - 1,
    borderBottomRightRadius: RADIUS.sm - 1,
  },
  addTagButtonDisabled: {
    backgroundColor: COLORS.dark.surface,
  },
  suggestedLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.textMuted,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  suggestedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  suggestedTag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.dark.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  suggestedTagText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.dark.textSecondary,
    fontWeight: '500',
  },
});
