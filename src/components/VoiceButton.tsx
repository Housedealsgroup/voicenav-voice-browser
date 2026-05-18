import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  View,
  Text,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from '../a11y/theme';
import VoiceWaveform from './VoiceWaveform';

type VoiceButtonProps = {
  isListening: boolean;
  interimText?: string;
  onPress: () => void;
  onLongPress?: () => void;
  size?: number;
  accessibilityLabel?: string;
};

const HAPTIC_PATTERN = Platform.OS === 'android' ? [0, 30] : undefined;

export default function VoiceButton({
  isListening,
  interimText,
  onPress,
  onLongPress,
  size = 72,
  accessibilityLabel = 'Voice command',
}: VoiceButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0.6)).current;
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let glowLoop: Animated.CompositeAnimation | null = null;

    if (isListening) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulseLoop.start();

      glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      );
      glowLoop.start();

      Animated.spring(scaleAnim, { toValue: 1.1, useNativeDriver: true }).start();
    } else {
      Animated.parallel([
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }

    return () => {
      if (pulseLoop) pulseLoop.stop();
      if (glowLoop) glowLoop.stop();
    };
  }, [isListening]);

  // Haptic feedback on press
  const triggerHaptic = useCallback(() => {
    try {
      if (Platform.OS === 'android') {
        Vibration.vibrate(HAPTIC_PATTERN);
      } else {
        // iOS uses a light tap via Vibration
        Vibration.vibrate();
      }
    } catch {
      // Haptic may not be available on all devices
    }
  }, []);

  // Ripple animation
  const startRipple = useCallback(() => {
    setShowRipple(true);
    rippleAnim.setValue(0);
    rippleOpacity.setValue(0.6);
    Animated.parallel([
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowRipple(false);
    });
  }, [rippleAnim, rippleOpacity]);

  const handlePressIn = useCallback(() => {
    // Scale down on press
    Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true }).start();
    triggerHaptic();

    // Start long-press timer (500ms)
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        setIsLongPressing(true);
        onLongPress();
        // Extra haptic for long press
        try {
          Vibration.vibrate([0, 50, 30, 50]);
        } catch {}
      }, 500);
    }
  }, [scaleAnim, triggerHaptic, onLongPress]);

  const handlePressOut = useCallback(() => {
    // Cancel long-press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsLongPressing(false);

    // Scale back
    Animated.spring(scaleAnim, { toValue: isListening ? 1.1 : 1, useNativeDriver: true }).start();
  }, [scaleAnim, isListening]);

  const handlePress = useCallback(() => {
    startRipple();
    onPress();
  }, [startRipple, onPress]);

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  return (
    <View style={styles.wrapper}>
      {/* Outer pulse ring */}
      {isListening && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size + 40,
              height: size + 40,
              borderRadius: (size + 40) / 2,
              transform: [{ scale: pulseAnim }],
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.3],
              }),
            },
          ]}
        />
      )}

      {/* Second pulse ring for depth */}
      {isListening && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size + 60,
              height: size + 60,
              borderRadius: (size + 60) / 2,
              transform: [{ scale: pulseAnim }],
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.15],
              }),
            },
          ]}
        />
      )}

      {/* Waveform behind button */}
      {isListening && (
        <View style={styles.waveformContainer}>
          <VoiceWaveform isActive={isListening} height={32} />
        </View>
      )}

      {/* Ripple effect */}
      {showRipple && (
        <Animated.View
          style={[
            styles.ripple,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ scale: rippleScale }],
              opacity: rippleOpacity,
              backgroundColor: isListening ? COLORS.dark.error : COLORS.dark.primary,
            },
          ]}
        />
      )}

      {/* Main button */}
      <Animated.View
        style={[
          { transform: [{ scale: scaleAnim }] },
          isListening && {
            shadowColor: COLORS.dark.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 20,
            elevation: 12,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: isListening
                ? COLORS.dark.error
                : isLongPressing
                ? COLORS.dark.accent
                : COLORS.dark.primary,
            },
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={
            isListening
              ? 'Tap to stop listening. Long press for continuous mode.'
              : 'Tap to start voice command. Long press for continuous listening.'
          }
          accessibilityRole="button"
        >
          <Animated.View
            style={
              isListening
                ? {
                    transform: [
                      {
                        rotate: glowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '5deg'],
                        }),
                      },
                    ],
                  }
                : undefined
            }
          >
            <Ionicons
              name={isListening ? 'stop' : isLongPressing ? 'mic-circle' : 'mic'}
              size={size * 0.42}
              color={COLORS.dark.text}
            />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Interim text */}
      {isListening && interimText ? (
        <View style={styles.interimContainer}>
          <Text style={styles.interimText} numberOfLines={2}>
            {interimText}
          </Text>
        </View>
      ) : (
        <View style={styles.hintContainer}>
          <Text style={styles.hint}>
            {isListening ? 'Listening...' : isLongPressing ? 'Continuous mode' : 'Tap to speak'}
          </Text>
          {!isListening && (
            <Text style={styles.hintSub}>Long press for continuous</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.dark.primary,
  },
  waveformContainer: {
    position: 'absolute',
    width: 160,
    alignItems: 'center',
    zIndex: -1,
  },
  ripple: {
    position: 'absolute',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  interimContainer: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    maxWidth: 280,
  },
  interimText: {
    color: COLORS.dark.accent,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  hintContainer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  hint: {
    color: COLORS.dark.textMuted,
    fontSize: FONT_SIZE.sm,
  },
  hintSub: {
    color: COLORS.dark.textMuted,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
    opacity: 0.6,
  },
});
