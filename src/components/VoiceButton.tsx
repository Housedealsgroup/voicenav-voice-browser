import React, { useEffect, useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  View,
  Text,
  Platform,
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

  useEffect(() => {
    if (isListening) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Scale up
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        useNativeDriver: true,
      }).start();
    } else {
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
      Animated.parallel([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isListening]);

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

      {/* Waveform behind button */}
      {isListening && (
        <View style={styles.waveformContainer}>
          <VoiceWaveform isActive={isListening} height={32} />
        </View>
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
                : COLORS.dark.primary,
            },
          ]}
          onPress={onPress}
          onLongPress={onLongPress}
          activeOpacity={0.8}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={
            isListening
              ? 'Tap to stop listening'
              : 'Tap to start voice command'
          }
          accessibilityRole="button"
        >
          <Ionicons
            name={isListening ? 'stop' : 'mic'}
            size={size * 0.42}
            color={COLORS.dark.text}
          />
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
        <Text style={styles.hint}>
          {isListening ? 'Listening...' : 'Tap to speak'}
        </Text>
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
  hint: {
    marginTop: SPACING.sm,
    color: COLORS.dark.textMuted,
    fontSize: FONT_SIZE.sm,
  },
});
