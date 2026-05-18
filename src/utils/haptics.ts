// VoiceNav Haptic Feedback — tactile feedback for voice interactions and actions
// Uses Expo Haptics for a more immersive, accessible experience
// v2: Action-specific patterns, customizable intensity, accessibility feedback

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { logger } from './logger';

let hapticsEnabled = true;
let hapticIntensity: HapticIntensity = 'normal';

// --- Intensity Levels ---

export type HapticIntensity = 'light' | 'normal' | 'strong';

/** Set global haptic intensity level */
export function setHapticIntensity(intensity: HapticIntensity): void {
  hapticIntensity = intensity;
}

/** Get current haptic intensity */
export function getHapticIntensity(): HapticIntensity {
  return hapticIntensity;
}

/** Map intensity level to impact style */
function getIntensityStyle(baseStyle: Haptics.ImpactFeedbackStyle): Haptics.ImpactFeedbackStyle {
  const intensityMap: Record<HapticIntensity, Record<string, Haptics.ImpactFeedbackStyle>> = {
    light: {
      [Haptics.ImpactFeedbackStyle.Light]: Haptics.ImpactFeedbackStyle.Light,
      [Haptics.ImpactFeedbackStyle.Medium]: Haptics.ImpactFeedbackStyle.Light,
      [Haptics.ImpactFeedbackStyle.Heavy]: Haptics.ImpactFeedbackStyle.Medium,
      [Haptics.ImpactFeedbackStyle.Rigid]: Haptics.ImpactFeedbackStyle.Medium,
      [Haptics.ImpactFeedbackStyle.Soft]: Haptics.ImpactFeedbackStyle.Soft,
    },
    normal: {
      [Haptics.ImpactFeedbackStyle.Light]: Haptics.ImpactFeedbackStyle.Light,
      [Haptics.ImpactFeedbackStyle.Medium]: Haptics.ImpactFeedbackStyle.Medium,
      [Haptics.ImpactFeedbackStyle.Heavy]: Haptics.ImpactFeedbackStyle.Heavy,
      [Haptics.ImpactFeedbackStyle.Rigid]: Haptics.ImpactFeedbackStyle.Rigid,
      [Haptics.ImpactFeedbackStyle.Soft]: Haptics.ImpactFeedbackStyle.Soft,
    },
    strong: {
      [Haptics.ImpactFeedbackStyle.Light]: Haptics.ImpactFeedbackStyle.Medium,
      [Haptics.ImpactFeedbackStyle.Medium]: Haptics.ImpactFeedbackStyle.Heavy,
      [Haptics.ImpactFeedbackStyle.Heavy]: Haptics.ImpactFeedbackStyle.Heavy,
      [Haptics.ImpactFeedbackStyle.Rigid]: Haptics.ImpactFeedbackStyle.Rigid,
      [Haptics.ImpactFeedbackStyle.Soft]: Haptics.ImpactFeedbackStyle.Light,
    },
  };
  return intensityMap[hapticIntensity]?.[baseStyle] ?? baseStyle;
}

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

async function trigger(style: Haptics.ImpactFeedbackStyle): Promise<void> {
  if (!hapticsEnabled) return;
  try {
    await Haptics.impactAsync(getIntensityStyle(style));
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

async function triggerPattern(patterns: Array<{ style: Haptics.ImpactFeedbackStyle; delay: number }>): Promise<void> {
  if (!hapticsEnabled) return;
  for (const { style, delay } of patterns) {
    await trigger(style);
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
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

// --- Action-Specific Haptic Patterns ---

/** Destructive action confirmation required (e.g., form submit, delete) */
export async function hapticConfirmRequired(): Promise<void> {
  // Two medium taps — "are you sure?"
  await triggerPattern([
    { style: Haptics.ImpactFeedbackStyle.Medium, delay: 80 },
    { style: Haptics.ImpactFeedbackStyle.Medium, delay: 0 },
  ]);
}

/** Form submission sent */
export async function hapticFormSubmit(): Promise<void> {
  // Quick light + medium — "sent"
  await triggerPattern([
    { style: Haptics.ImpactFeedbackStyle.Light, delay: 60 },
    { style: Haptics.ImpactFeedbackStyle.Medium, delay: 0 },
  ]);
}

/** Link click / navigation trigger */
export async function hapticLinkTap(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Light);
}

/** Page fully loaded */
export async function hapticPageLoaded(): Promise<void> {
  // Gentle rising pattern — light, medium
  await triggerPattern([
    { style: Haptics.ImpactFeedbackStyle.Soft, delay: 100 },
    { style: Haptics.ImpactFeedbackStyle.Light, delay: 0 },
  ]);
}

/** Page load failed */
export async function hapticPageError(): Promise<void> {
  await triggerNotification(Haptics.NotificationFeedbackType.Error);
}

/** Security warning (blocked URL, suspicious content) */
export async function hapticSecurityWarning(): Promise<void> {
  // Sharp rigid + heavy — alarming
  await triggerPattern([
    { style: Haptics.ImpactFeedbackStyle.Rigid, delay: 100 },
    { style: Haptics.ImpactFeedbackStyle.Heavy, delay: 0 },
  ]);
}

/** Search result found */
export async function hapticSearchResult(): Promise<void> {
  await triggerSelection();
}

/** Copy to clipboard */
export async function hapticCopyToClipboard(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Light);
}

/** Tab / page switch */
export async function hapticTabSwitch(): Promise<void> {
  await triggerSelection();
}

/** Download started */
export async function hapticDownloadStart(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Medium);
}

/** Download complete */
export async function hapticDownloadComplete(): Promise<void> {
  await triggerPattern([
    { style: Haptics.ImpactFeedbackStyle.Light, delay: 80 },
    { style: Haptics.ImpactFeedbackStyle.Light, delay: 80 },
    { style: Haptics.ImpactFeedbackStyle.Medium, delay: 0 },
  ]);
}

// --- Accessibility Feedback Haptics ---

/** Screen reader focus moved to a new element */
export async function hapticA11yFocusChange(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Soft);
}

/** Interactive element reached (button, link, input) */
export async function hapticA11yInteractiveElement(): Promise<void> {
  // Double soft tap — distinct from regular focus
  await triggerPattern([
    { style: Haptics.ImpactFeedbackStyle.Soft, delay: 50 },
    { style: Haptics.ImpactFeedbackStyle.Soft, delay: 0 },
  ]);
}

/** Heading landmark reached */
export async function hapticA11yHeading(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Medium);
}

/** End of list / section reached */
export async function hapticA11yEndOfSection(): Promise<void> {
  // Single rigid tap — boundary feel
  await trigger(Haptics.ImpactFeedbackStyle.Rigid);
}

/** Error in form field (validation failure) */
export async function hapticA11yFieldError(): Promise<void> {
  // Quick double buzz
  await triggerPattern([
    { style: Haptics.ImpactFeedbackStyle.Heavy, delay: 60 },
    { style: Haptics.ImpactFeedbackStyle.Heavy, delay: 0 },
  ]);
}

/** Field validation passed */
export async function hapticA11yFieldValid(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Light);
}

/** Voice input started (accessibility mode) */
export async function hapticA11yVoiceStart(): Promise<void> {
  // Rising pattern — soft, light, medium
  await triggerPattern([
    { style: Haptics.ImpactFeedbackStyle.Soft, delay: 60 },
    { style: Haptics.ImpactFeedbackStyle.Light, delay: 60 },
    { style: Haptics.ImpactFeedbackStyle.Medium, delay: 0 },
  ]);
}

/** Voice input stopped (accessibility mode) */
export async function hapticA11yVoiceStop(): Promise<void> {
  // Falling pattern — medium, light, soft
  await triggerPattern([
    { style: Haptics.ImpactFeedbackStyle.Medium, delay: 60 },
    { style: Haptics.ImpactFeedbackStyle.Light, delay: 60 },
    { style: Haptics.ImpactFeedbackStyle.Soft, delay: 0 },
  ]);
}

/** Accessibility action confirmed */
export async function hapticA11yConfirmed(): Promise<void> {
  await triggerNotification(Haptics.NotificationFeedbackType.Success);
}

/** Accessibility action rejected / cancelled */
export async function hapticA11yCancelled(): Promise<void> {
  await triggerNotification(Haptics.NotificationFeedbackType.Warning);
}

/** Page scroll boundary in accessibility mode */
export async function hapticA11yScrollBoundary(): Promise<void> {
  await trigger(Haptics.ImpactFeedbackStyle.Rigid);
}
