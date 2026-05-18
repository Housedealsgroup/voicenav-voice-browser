// VoiceNav Voice Onboarding Tests
import {
  startOnboarding,
  getCurrentOnboardingStep,
  getOnboardingPrompt,
  checkOnboardingCommand,
  getOnboardingProgress,
  skipOnboarding,
  getOnboardingState,
} from '../voiceOnboarding';

describe('Voice Onboarding', () => {
  beforeEach(() => {
    startOnboarding();
  });

  test('starts with first step', () => {
    const step = getCurrentOnboardingStep();
    expect(step).not.toBeNull();
    expect(step!.id).toBe('welcome');
  });

  test('first prompt is welcome message', () => {
    const prompt = getOnboardingPrompt();
    expect(prompt).toContain('Welcome to VoiceNav');
  });

  test('correct command advances to next step', () => {
    const result = checkOnboardingCommand('help');
    expect(result.success).toBe(true);
    expect(result.isComplete).toBe(false);
    expect(result.nextPrompt).toBeDefined();
  });

  test('wrong command gives hint', () => {
    const result = checkOnboardingCommand('blah blah');
    expect(result.success).toBe(false);
    expect(result.response).toContain('Not quite');
  });

  test('skip command advances step', () => {
    const result = checkOnboardingCommand('skip');
    expect(result.success).toBe(true);
  });

  test('progress tracks completion', () => {
    checkOnboardingCommand('help');
    const progress = getOnboardingProgress();
    expect(progress.current).toBe(1);
    expect(progress.percent).toBeGreaterThan(0);
  });

  test('completing all steps finishes onboarding', () => {
    // Complete all steps
    checkOnboardingCommand('help');
    checkOnboardingCommand('go to google');
    checkOnboardingCommand('search for weather');
    checkOnboardingCommand('read this page');
    checkOnboardingCommand('scroll down');
    checkOnboardingCommand('click');
    checkOnboardingCommand('go back');
    checkOnboardingCommand('add to cart');
    checkOnboardingCommand('search for headphones then click the first result');
    checkOnboardingCommand('bookmark this page');
    const result = checkOnboardingCommand('');
    expect(result.isComplete).toBe(true);
  });

  test('skip onboarding marks complete', () => {
    skipOnboarding();
    const state = getOnboardingState();
    expect(state!.isComplete).toBe(true);
  });

  test('3 failed attempts auto-advances', () => {
    checkOnboardingCommand('wrong1');
    checkOnboardingCommand('wrong2');
    const result = checkOnboardingCommand('wrong3');
    expect(result.success).toBe(true);
    expect(result.response).toContain('move on');
  });
});
