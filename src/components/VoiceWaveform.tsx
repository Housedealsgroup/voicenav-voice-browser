import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../a11y/theme';

const BAR_COUNT = 24;

type VoiceWaveformProps = {
  isActive: boolean;
  color?: string;
  height?: number;
  barWidth?: number;
  gap?: number;
};

export default function VoiceWaveform({
  isActive,
  color = COLORS.dark.primary,
  height = 48,
  barWidth = 3,
  gap = 3,
}: VoiceWaveformProps) {
  const bars = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.15))
  ).current;
  const animations = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    if (isActive) {
      startWave();
    } else {
      stopWave();
    }
    return () => {
      animations.current.forEach((a) => a.stop());
    };
  }, [isActive]);

  const startWave = () => {
    animations.current = bars.map((bar) => {
      const randomDelay = Math.random() * 200;
      const randomDuration = 200 + Math.random() * 300;
      const randomHeight = 0.3 + Math.random() * 0.7;

      return Animated.loop(
        Animated.sequence([
          Animated.delay(randomDelay),
          Animated.timing(bar, {
            toValue: randomHeight,
            duration: randomDuration,
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: 0.15,
            duration: randomDuration,
            useNativeDriver: false,
          }),
        ])
      );
    });
    animations.current.forEach((a) => a.start());
  };

  const stopWave = () => {
    animations.current.forEach((a) => a.stop());
    Animated.parallel(
      bars.map((bar) =>
        Animated.timing(bar, {
          toValue: 0.15,
          duration: 300,
          useNativeDriver: false,
        })
      )
    ).start();
  };

  return (
    <View style={[styles.container, { height }]} accessibilityLabel={isActive ? 'Voice waveform active' : 'Voice waveform'} accessibilityRole="image">
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              width: barWidth,
              marginHorizontal: gap / 2,
              backgroundColor: color,
              height: bar.interpolate({
                inputRange: [0, 1],
                outputRange: [barWidth, height],
              }),
              opacity: bar.interpolate({
                inputRange: [0.15, 1],
                outputRange: [0.3, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    borderRadius: 999,
  },
});
