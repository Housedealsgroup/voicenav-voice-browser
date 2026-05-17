// VoiceNav Haptic Feedback — tactile feedback for voice interactions and actions
// Uses Expo Haptics for a more immersive, accessible experience

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { logger } from './logger';

let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

async function trigger(style: Haptics.ImpactFeedbackStyle): Promise<void> {
  if (!hapticsEnabled) return;
  try {
    await Haptics.impactAsync(style);
  } catch {
    // Haptics not available on this device
  }
}

async function triggerNotification(type: Haptics.NotificationFeedbackType): Promise<void> {
  if (!hapticsEnabled) return;
  try {
    await Haptics.notificationAsync(type);
  } catch {
    // Haptics not available
  }
}

async function triggerSelection(): Promise<void> {
  if (!hapticsEnabled) return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Haptics not available
  }
}

// --- Voice Interaction Haptics ---

/** Microphone activated — starting to listen */
export async function hapticListeningStart(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Medium);
}

/** Microphone deactivated — stopped listening */
export async function hapticListeningStop(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Light);
}

/** Voice command recognized */
export async function hapticCommandRecognized(): Promise<void> {
  await triggerSelection();
}

/** Processing started */
export async function hapticProcessing(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Light);
}

// --- Action Result Haptics ---

/** Action completed successfully */
export async function hapticSuccess(): Promise<void> {
  await triggerNotification(Haptics.NotificationFeedbackType.Success);
}

/** Action failed */
export async function hapticError(): Promise<void> {
  await triggerNotification(Haptics.NotificationFeedbackType.Error);
}

/** Warning — action partially failed or needs attention */
export async function hapticWarning(): Promise<void> {
  await triggerNotification(Haptics.NotificationFeedbackType.Warning);
}

// --- UI Interaction Haptics ---

/** Button pressed */
export async function hapticButtonPress(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Light);
}

/** Long press started */
export async function hapticLongPress(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Toggle switch changed */
export async function hapticToggle(): Promise<void> {
  await triggerSelection();
}

/** Selection changed (picker, list) */
export async function hapticSelectionChange(): Promise<void> {
  await triggerSelection();
}

/** Drag started */
export async function hapticDragStart(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Medium);
}

/** Drag end / snap */
export async function hapticDragEnd(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Light);
}

// --- Navigation Haptics ---

/** Page navigation started */
export async function hapticNavigate(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Light);
}

/** Scrolling boundary reached (top/bottom) */
export async function hapticBoundary(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Rigid);
}

/** Bookmark saved */
export async function hapticBookmark(): Promise<void> {
  await triggerNotification(Haptics.NotificationFeedbackType.Success);
}

/** Item added to cart */
export async function hapticAddToCart(): Promise<void> {
  await triggerNotification(Haptics.NotificationFeedbackType.Success);
}

// --- Task Haptics ---

/** Task step completed */
export async function hapticTaskStepComplete(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Light);
}

/** Task fully completed */
export async function hapticTaskComplete(): Promise<void> {
  await triggerNotification(Haptics.NotificationFeedbackType.Success);
}

/** Task failed */
export async function hapticTaskFail(): Promise<void> {
  await triggerNotification(Haptics.NotificationFeedbackType.Error);
}

// --- Onboarding Haptics ---

/** Tutorial step completed */
export async function hapticTutorialStep(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Medium);
}

/** Tutorial completed */
export async function hapticTutorialComplete(): Promise<void> {
  // Triple tap pattern for celebration
  await trigger(Haptics.ImpactFeedbackStyle.Heavy);
  setTimeout(() => trigger(Haptics.ImpactFeedbackStyle.Medium), 150);
  setTimeout(() => trigger(Haptics.ImpactFeedbackStyle.Light), 300);
}

// --- Custom Patterns ---

/** Double tap pattern */
export async function hapticDoubleTap(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Medium);
  setTimeout(() => trigger(Haptics.ImpactFeedbackStyle.Medium), 100);
}

/** Success pulse — 3 quick taps */
export async function hapticSuccessPulse(): Promise<void> {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => trigger(Haptics.ImpactFeedbackStyle.Light), i * 80);
  }
}

/** Error buzz — heavy alternating */
export async function hapticErrorBuzz(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Heavy);
  setTimeout(() => trigger(Haptics.ImpactFeedbackStyle.Heavy), 150);
}
