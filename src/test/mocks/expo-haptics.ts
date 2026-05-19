// Mock for expo-haptics in PWA/Vitest environment
export const ImpactFeedbackStyle = {
  Light: 0,
  Medium: 1,
  Heavy: 2,
  Rigid: 3,
  Soft: 4,
} as const

export const NotificationFeedbackType = {
  Success: 0,
  Warning: 1,
  Error: 2,
} as const

export async function impactAsync(): Promise<void> {}
export async function notificationAsync(): Promise<void> {}
export async function selectionAsync(): Promise<void> {}
