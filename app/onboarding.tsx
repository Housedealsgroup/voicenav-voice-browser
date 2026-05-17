import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/a11y/theme';
import { speak } from '../src/voice/textToSpeech';
import { useAppStore } from '../src/store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'mic' as const,
    title: 'Voice Control',
    description: 'Browse the web entirely by voice. Say commands like "go to Amazon" or "search for headphones".',
    color: COLORS.dark.primary,
  },
  {
    icon: 'eye' as const,
    title: 'Smart Reading',
    description: 'VoiceNav reads pages aloud and describes what\'s on screen so you never miss anything.',
    color: COLORS.dark.accent,
  },
  {
    icon: 'finger-print' as const,
    title: 'One-Tap Actions',
    description: 'Add to cart, fill forms, click buttons — all with simple voice commands.',
    color: COLORS.dark.success,
  },
  {
    icon: 'shield-checkmark' as const,
    title: '100% Private',
    description: 'All AI processing happens on your device. No data leaves your phone.',
    color: COLORS.dark.warning,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const slideAnim = useState(new Animated.Value(0))[0];

  const animateTransition = useCallback(
    (nextStep: number) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: nextStep > currentStep ? -50 : 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(nextStep);
        slideAnim.setValue(nextStep > currentStep ? 50 : -50);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [currentStep, fadeAnim, slideAnim]
  );

  const handleNext = useCallback(() => {
    if (currentStep < FEATURES.length - 1) {
      animateTransition(currentStep + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, animateTransition]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem('voicenav-onboarded', 'true');
    speak('Welcome to VoiceNav. Tap the microphone and say a command to get started.');
    router.replace('/');
  }, [router]);

  const feature = FEATURES[currentStep];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark.background} />

      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Feature display */}
      <Animated.View
        style={[
          styles.featureContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={[styles.iconCircle, { borderColor: feature.color }]}>
          <Ionicons name={feature.icon} size={56} color={feature.color} />
        </View>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDescription}>{feature.description}</Text>
      </Animated.View>

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {FEATURES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentStep && styles.dotActive,
              i === currentStep && { backgroundColor: feature.color },
            ]}
          />
        ))}
      </View>

      {/* Next button */}
      <TouchableOpacity style={[styles.nextButton, { backgroundColor: feature.color }]} onPress={handleNext}>
        <Text style={styles.nextText}>
          {currentStep === FEATURES.length - 1 ? 'Get Started' : 'Next'}
        </Text>
        <Ionicons
          name={currentStep === FEATURES.length - 1 ? 'rocket' : 'arrow-forward'}
          size={20}
          color={COLORS.dark.text}
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: SPACING.xxl,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: SPACING.sm,
  },
  skipText: {
    color: COLORS.dark.textMuted,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  featureContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: SPACING.xl,
  },
  featureTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.dark.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.dark.textMuted,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.lg,
  },
  nextText: {
    color: COLORS.dark.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});
