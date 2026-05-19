import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Define __DEV__ global for test environment
;(globalThis as any).__DEV__ = true

// Mock React Native AsyncStorage with localStorage for PWA/Vitest environment
vi.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>()
  return {
    default: {
      getItem: vi.fn(async (key: string) => store.get(key) ?? null),
      setItem: vi.fn(async (key: string, value: string) => { store.set(key, value) }),
      removeItem: vi.fn(async (key: string) => { store.delete(key) }),
      clear: vi.fn(async () => { store.clear() }),
      getAllKeys: vi.fn(async () => [...store.keys()]),
      multiGet: vi.fn(async (keys: string[]) => keys.map(k => [k, store.get(k) ?? null])),
      multiSet: vi.fn(async (entries: [string, string][]) => { entries.forEach(([k, v]) => store.set(k, v)) }),
      multiRemove: vi.fn(async (keys: string[]) => { keys.forEach(k => store.delete(k)) }),
    },
  }
})

// Mock expo-haptics for PWA environment
vi.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Light: 0, Medium: 1, Heavy: 2, Rigid: 3, Soft: 4 },
  NotificationFeedbackType: { Success: 0, Warning: 1, Error: 2 },
  impactAsync: vi.fn(async () => {}),
  notificationAsync: vi.fn(async () => {}),
  selectionAsync: vi.fn(async () => {}),
}))
