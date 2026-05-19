import { matchGesture, getGestureJsCode, getAllGestures, getGestureByType } from '../gestureNav';

describe('Gesture Navigation', () => {
  describe('matchGesture()', () => {
    it('matches exact voice trigger', () => {
      const gesture = matchGesture('swipe up');
      expect(gesture).not.toBeNull();
      expect(gesture?.gesture).toBe('swipe_up');
    });

    it('matches swipe down', () => {
      const gesture = matchGesture('swipe down');
      expect(gesture).not.toBeNull();
      expect(gesture?.gesture).toBe('swipe_down');
    });

    it('matches swipe left', () => {
      const gesture = matchGesture('swipe left');
      expect(gesture).not.toBeNull();
      expect(gesture?.gesture).toBe('swipe_left');
    });

    it('matches swipe right', () => {
      const gesture = matchGesture('swipe right');
      expect(gesture).not.toBeNull();
      expect(gesture?.gesture).toBe('swipe_right');
    });

    it('matches double tap', () => {
      const gesture = matchGesture('double tap');
      expect(gesture).not.toBeNull();
      expect(gesture?.gesture).toBe('double_tap');
    });

    it('matches zoom in via fuzzy match', () => {
      const gesture = matchGesture('zoom in');
      expect(gesture).not.toBeNull();
      expect(gesture?.gesture).toBe('pinch_out');
    });

    it('matches zoom out via fuzzy match', () => {
      const gesture = matchGesture('zoom out');
      expect(gesture).not.toBeNull();
      expect(gesture?.gesture).toBe('pinch_in');
    });

    it('matches go back to swipe right', () => {
      const gesture = matchGesture('go back');
      expect(gesture).not.toBeNull();
      expect(gesture?.gesture).toBe('swipe_right');
    });

    it('matches scroll up to a scroll gesture', () => {
      const gesture = matchGesture('scroll up');
      expect(gesture).not.toBeNull();
      // "scroll up" partial-matches two_finger_scroll_up before fuzzy fallback
      expect(['swipe_up', 'two_finger_scroll_up']).toContain(gesture?.gesture);
    });

    it('returns null for unrecognized command', () => {
      const gesture = matchGesture('dance the macarena');
      expect(gesture).toBeNull();
    });
  });

  describe('getGestureJsCode()', () => {
    it('returns JS code for valid gesture', () => {
      const code = getGestureJsCode('swipe up');
      expect(code).toBeTruthy();
      expect(typeof code).toBe('string');
    });

    it('returns null for invalid gesture', () => {
      const code = getGestureJsCode('unknown gesture');
      expect(code).toBeNull();
    });

    it('returns history.back for swipe right', () => {
      const code = getGestureJsCode('swipe right');
      expect(code).toContain('history.back');
    });
  });

  describe('getAllGestures()', () => {
    it('returns all gesture commands', () => {
      const gestures = getAllGestures();
      expect(gestures.length).toBeGreaterThanOrEqual(10);
    });

    it('each gesture has required fields', () => {
      const gestures = getAllGestures();
      for (const g of gestures) {
        expect(g.gesture).toBeTruthy();
        expect(g.voiceTrigger).toBeTruthy();
        expect(g.description).toBeTruthy();
        expect(g.jsCode).toBeTruthy();
      }
    });

    it('includes all gesture types', () => {
      const gestures = getAllGestures();
      const types = gestures.map(g => g.gesture);
      expect(types).toContain('swipe_up');
      expect(types).toContain('swipe_down');
      expect(types).toContain('swipe_left');
      expect(types).toContain('swipe_right');
      expect(types).toContain('double_tap');
      expect(types).toContain('long_press');
      expect(types).toContain('pinch_in');
      expect(types).toContain('pinch_out');
    });
  });

  describe('getGestureByType()', () => {
    it('finds gesture by type', () => {
      const gesture = getGestureByType('double_tap');
      expect(gesture).not.toBeNull();
      expect(gesture?.voiceTrigger).toBe('double tap');
    });

    it('returns null for unknown type', () => {
      // @ts-expect-error - testing invalid type
      const gesture = getGestureByType('unknown_type');
      expect(gesture).toBeNull();
    });

    it('returns zoom in gesture', () => {
      const gesture = getGestureByType('pinch_out');
      expect(gesture?.voiceTrigger).toBe('zoom in');
    });

    it('returns zoom out gesture', () => {
      const gesture = getGestureByType('pinch_in');
      expect(gesture?.voiceTrigger).toBe('zoom out');
    });
  });
});
