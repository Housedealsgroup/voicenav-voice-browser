import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../a11y/theme';

export default function OfflineBanner({ visible }: { visible: boolean }) {
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : -60,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]} accessibilityLabel="You are offline. Commands will be queued." accessibilityRole="alert">
      <Text style={styles.text}>You are offline — commands will be queued</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.dark.warning,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    zIndex: 1000,
    elevation: 1000,
  },
  text: {
    color: '#000',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
});
