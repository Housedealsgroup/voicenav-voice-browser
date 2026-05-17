// VoiceNav Gesture Navigation — v9
// Voice-activated gesture simulation and swipe-based navigation
// Enables gesture commands through voice for accessibility

import { logger } from '../utils/logger';

export type GestureType =
  | 'swipe_up' | 'swipe_down' | 'swipe_left' | 'swipe_right'
  | 'double_tap' | 'long_press' | 'pinch_in' | 'pinch_out'
  | 'two_finger_scroll_up' | 'two_finger_scroll_down';

export type GestureCommand = {
  gesture: GestureType;
  voiceTrigger: string;
  description: string;
  jsCode: string;
};

const GESTURE_COMMANDS: GestureCommand[] = [
  {
    gesture: 'swipe_up',
    voiceTrigger: 'swipe up',
    description: 'Simulates a swipe up gesture',
    jsCode: `
      const e = new TouchEvent('touchstart', { touches: [new Touch({ identifier: 0, target: document.body, clientX: 200, clientY: 600 })] });
      document.dispatchEvent(e);
      setTimeout(() => {
        const e2 = new TouchEvent('touchmove', { touches: [new Touch({ identifier: 0, target: document.body, clientX: 200, clientY: 200 })] });
        document.dispatchEvent(e2);
        setTimeout(() => {
          const e3 = new TouchEvent('touchend', { changedTouches: [new Touch({ identifier: 0, target: document.body, clientX: 200, clientY: 200 })] });
          document.dispatchEvent(e3);
        }, 100);
      }, 50);
    `,
  },
  {
    gesture: 'swipe_down',
    voiceTrigger: 'swipe down',
    description: 'Simulates a swipe down gesture',
    jsCode: `
      const e = new TouchEvent('touchstart', { touches: [new Touch({ identifier: 0, target: document.body, clientX: 200, clientY: 200 })] });
      document.dispatchEvent(e);
      setTimeout(() => {
        const e2 = new TouchEvent('touchmove', { touches: [new Touch({ identifier: 0, target: document.body, clientX: 200, clientY: 600 })] });
        document.dispatchEvent(e2);
        setTimeout(() => {
          const e3 = new TouchEvent('touchend', { changedTouches: [new Touch({ identifier: 0, target: document.body, clientX: 200, clientY: 600 })] });
          document.dispatchEvent(e3);
        }, 100);
      }, 50);
    `,
  },
  {
    gesture: 'swipe_left',
    voiceTrigger: 'swipe left',
    description: 'Simulates a swipe left gesture',
    jsCode: `
      const e = new TouchEvent('touchstart', { touches: [new Touch({ identifier: 0, target: document.body, clientX: 350, clientY: 400 })] });
      document.dispatchEvent(e);
      setTimeout(() => {
        const e2 = new TouchEvent('touchmove', { touches: [new Touch({ identifier: 0, target: document.body, clientX: 40, clientY: 400 })] });
        document.dispatchEvent(e2);
        setTimeout(() => {
          const e3 = new TouchEvent('touchend', { changedTouches: [new Touch({ identifier: 0, target: document.body, clientX: 40, clientY: 400 })] });
          document.dispatchEvent(e3);
        }, 100);
      }, 50);
    `,
  },
  {
    gesture: 'swipe_right',
    voiceTrigger: 'swipe right',
    description: 'Simulates a swipe right gesture (go back)',
    jsCode: 'window.history.back();',
  },
  {
    gesture: 'double_tap',
    voiceTrigger: 'double tap',
    description: 'Simulates a double tap gesture',
    jsCode: `
      document.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    `,
  },
  {
    gesture: 'long_press',
    voiceTrigger: 'long press',
    description: 'Simulates a long press gesture',
    jsCode: `
      const down = new MouseEvent('mousedown', { bubbles: true });
      document.activeElement?.dispatchEvent(down);
      setTimeout(() => {
        const up = new MouseEvent('mouseup', { bubbles: true });
        document.activeElement?.dispatchEvent(up);
      }, 800);
    `,
  },
  {
    gesture: 'pinch_in',
    voiceTrigger: 'zoom out',
    description: 'Simulates pinch-to-zoom out',
    jsCode: `
      document.body.style.transform = 'scale(0.8)';
      document.body.style.transformOrigin = 'center center';
    `,
  },
  {
    gesture: 'pinch_out',
    voiceTrigger: 'zoom in',
    description: 'Simulates pinch-to-zoom in',
    jsCode: `
      document.body.style.transform = 'scale(1.2)';
      document.body.style.transformOrigin = 'center center';
    `,
  },
  {
    gesture: 'two_finger_scroll_up',
    voiceTrigger: 'scroll up fast',
    description: 'Fast scroll up',
    jsCode: 'window.scrollBy({ top: -500, behavior: "smooth" });',
  },
  {
    gesture: 'two_finger_scroll_down',
    voiceTrigger: 'scroll down fast',
    description: 'Fast scroll down',
    jsCode: 'window.scrollBy({ top: 500, behavior: "smooth" });',
  },
];

export function matchGesture(command: string): GestureCommand | null {
  const q = command.toLowerCase().trim();

  // Exact match
  const exact = GESTURE_COMMANDS.find(g => q === g.voiceTrigger);
  if (exact) return exact;

  // Partial match
  const partial = GESTURE_COMMANDS.find(g => q.includes(g.voiceTrigger) || g.voiceTrigger.includes(q));
  if (partial) return partial;

  // Fuzzy match for common variations
  if (q.includes('scroll') && q.includes('up')) return GESTURE_COMMANDS.find(g => g.gesture === 'swipe_up') || null;
  if (q.includes('scroll') && q.includes('down')) return GESTURE_COMMANDS.find(g => g.gesture === 'swipe_down') || null;
  if (q.includes('go back') || q.includes('back')) return GESTURE_COMMANDS.find(g => g.gesture === 'swipe_right') || null;
  if (q.includes('zoom') && q.includes('in')) return GESTURE_COMMANDS.find(g => g.gesture === 'pinch_out') || null;
  if (q.includes('zoom') && q.includes('out')) return GESTURE_COMMANDS.find(g => g.gesture === 'pinch_in') || null;

  return null;
}

export function getGestureJsCode(command: string): string | null {
  const gesture = matchGesture(command);
  return gesture?.jsCode || null;
}

export function getAllGestures(): GestureCommand[] {
  return [...GESTURE_COMMANDS];
}

export function getGestureByType(type: GestureType): GestureCommand | null {
  return GESTURE_COMMANDS.find(g => g.gesture === type) || null;
}
