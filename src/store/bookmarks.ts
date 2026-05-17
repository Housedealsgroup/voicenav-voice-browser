import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Bookmark = {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  createdAt: number;
  category?: string;
};

type BookmarkState = {
  bookmarks: Bookmark[];
  addBookmark: (title: string, url: string, category?: string) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (url: string) => boolean;
  getBookmarkByUrl: (url: string) => Bookmark | undefined;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void;
  categories: string[];
  addCategory: (category: string) => void;
};

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      categories: ['General', 'Shopping', 'News', 'Social', 'Work'],

      addBookmark: (title, url, category = 'General') => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        set((state) => ({
          bookmarks: [
            ...state.bookmarks,
            { id, title, url, createdAt: Date.now(), category },
          ],
        }));
      },

      removeBookmark: (id) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        }));
      },

      isBookmarked: (url) => {
        return get().bookmarks.some(
          (b) => b.url === url || b.url === url.replace(/\/$/, '')
        );
      },

      getBookmarkByUrl: (url) => {
        return get().bookmarks.find(
          (b) => b.url === url || b.url === url.replace(/\/$/, '')
        );
      },

      updateBookmark: (id, updates) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }));
      },

      addCategory: (category) => {
        set((state) => ({
          categories: [...new Set([...state.categories, category])],
        }));
      },
    }),
    {
      name: 'voicenav-bookmarks',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
