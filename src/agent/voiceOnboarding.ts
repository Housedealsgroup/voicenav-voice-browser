// VoiceNav Voice Onboarding — interactive guided tutorial for first-time users
// Teaches core commands through spoken prompts and listens for responses

import { logger } from '../utils/logger';
import { isOnboardingDone, markOnboardingComplete } from '../store/persistentState';

export type OnboardingStep = {
  id: string;
  prompt: string;
  expectedCommand: string;
  hints: string[];
  category: 'basic' | 'navigation' | 'search' | 'shopping' | 'advanced';
  timeoutMs: number;
};

export type OnboardingState = {
  currentStepIndex: number;
  completedSteps: string[];
  failedAttempts: Record<string, number>;
  startedAt: number;
  isComplete: boolean;
  skippedSteps: string[];
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    prompt: 'Welcome to VoiceNav! I am your voice-powered browser. Let me teach you the basics. Say "help" at any time to hear what you can do.',
    expectedCommand: 'help',
    hints: ['Try saying "help"', 'Say "what can you do"'],
    category: 'basic',
    timeoutMs: 15000,
  },
  {
    id: 'navigate',
    prompt: 'Great! Now let us try navigating. Say "go to Google" to open a website.',
    expectedCommand: 'go to google',
    hints: ['Say "go to" followed by a website name', 'Try "go to google"'],
    category: 'navigation',
    timeoutMs: 20000,
  },
  {
    id: 'search',
    prompt: 'Perfect! Now try searching. Say "search for weather" to search for something.',
    expectedCommand: 'search for weather',
    hints: ['Say "search for" followed by your query', 'Try "search for weather"'],
    category: 'search',
    timeoutMs: 20000,
  },
  {
    id: 'read',
    prompt: 'Nice! You can have me read any page. Say "read this page" to hear the content.',
    expectedCommand: 'read this page',
    hints: ['Say "read this page"', 'Or try "tell me about this page"'],
    category: 'basic',
    timeoutMs: 15000,
  },
  {
    id: 'scroll',
    prompt: 'Let us try scrolling. Say "scroll down" to move down the page.',
    expectedCommand: 'scroll down',
    hints: ['Say "scroll down" or "scroll up"', 'You can also say "page down"'],
    category: 'navigation',
    timeoutMs: 15000,
  },
  {
    id: 'click',
    prompt: 'To click something, say "click" followed by what you want to press. Try "click the first link".',
    expectedCommand: 'click',
    hints: ['Say "click" followed by element text', 'Try "click sign in" or "click the first result"'],
    category: 'basic',
    timeoutMs: 20000,
  },
  {
    id: 'back',
    prompt: 'To go back, just say "go back". Try it now.',
    expectedCommand: 'go back',
    hints: ['Say "go back"', 'Or just "back"'],
    category: 'navigation',
    timeoutMs: 15000,
  },
  {
    id: 'shopping',
    prompt: 'VoiceNav can help you shop! Say "add to cart" on any shopping page to add items.',
    expectedCommand: 'add to cart',
    hints: ['Say "add to cart"', 'Or "buy" followed by a product name'],
    category: 'shopping',
    timeoutMs: 15000,
  },
  {
    id: 'multistep',
    prompt: 'You can chain commands! Say "search for headphones then click the first result" to do multiple things.',
    expectedCommand: 'search for headphones then click the first result',
    hints: ['Use "then" to chain commands', 'Try "search for headphones then click the first result"'],
    category: 'advanced',
    timeoutMs: 25000,
  },
  {
    id: 'bookmark',
    prompt: 'Save pages with "bookmark this page". Say it now to save the current page.',
    expectedCommand: 'bookmark this page',
    hints: ['Say "bookmark this page"', 'Or "save this page"'],
    category: 'basic',
    timeoutMs: 15000,
  },
  {
    id: 'complete',
    prompt: 'Excellent! You have completed the VoiceNav tutorial. You can say "help" anytime for a refresher. Happy browsing!',
    expectedCommand: '',
    hints: [],
    category: 'basic',
    timeoutMs: 10000,
  },
];

let onboardingState: OnboardingState | null = null;

export async function isOnboardingComplete(): Promise<boolean> {
  try {
    return await isOnboardingDone();
  } catch {
    return false;
  }
}

export function startOnboarding(): OnboardingState {
  onboardingState = {
    currentStepIndex: 0,
    completedSteps: [],
    failedAttempts: {},
    startedAt: Date.now(),
    isComplete: false,
    skippedSteps: [],
  };
  logger.agent('onboardingStart', {});
  return onboardingState;
}

export function getOnboardingState(): OnboardingState | null {
  return onboardingState;
}

export function getCurrentOnboardingStep(): OnboardingStep | null {
  if (!onboardingState || onboardingState.isComplete) return null;
  return ONBOARDING_STEPS[onboardingState.currentStepIndex] || null;
}

export function getOnboardingPrompt(): string | null {
  const step = getCurrentOnboardingStep();
  return step?.prompt || null;
}

export function checkOnboardingCommand(transcript: string): {
  success: boolean;
  response: string;
  nextPrompt?: string;
  isComplete: boolean;
} {
  if (!onboardingState || onboardingState.isComplete) {
    return { success: false, response: 'Onboarding is not active.', isComplete: false };
  }

  const step = ONBOARDING_STEPS[onboardingState.currentStepIndex];
  if (!step) {
    return { success: false, response: 'No more steps.', isComplete: false };
  }

  const normalized = transcript.toLowerCase().trim();

  // Skip command
  if (normalized.includes('skip') || normalized.includes('next')) {
    onboardingState.skippedSteps.push(step.id);
    return advanceOnboarding('Skipped!');
  }

  // Check if command matches
  const expected = step.expectedCommand.toLowerCase();
  const isMatch = expected === '' ||
    normalized.includes(expected) ||
    normalized === expected ||
    fuzzyCommandMatch(normalized, expected);

  if (isMatch) {
    onboardingState.completedSteps.push(step.id);
    return advanceOnboarding(getSuccessResponse(step.id));
  }

  // Track failed attempts
  const attempts = (onboardingState.failedAttempts[step.id] || 0) + 1;
  onboardingState.failedAttempts[step.id] = attempts;

  if (attempts >= 3) {
    // Auto-advance after 3 failures
    onboardingState.skippedSteps.push(step.id);
    return advanceOnboarding(`No worries! Let us move on.`);
  }

  // Give a hint
  const hint = step.hints[Math.min(attempts - 1, step.hints.length - 1)];
  return {
    success: false,
    response: `Not quite. ${hint}`,
    isComplete: false,
  };
}

function advanceOnboarding(feedback: string): {
  success: boolean;
  response: string;
  nextPrompt?: string;
  isComplete: boolean;
} {
  if (!onboardingState) {
    return { success: false, response: 'No active onboarding.', isComplete: false };
  }

  onboardingState.currentStepIndex++;

  if (onboardingState.currentStepIndex >= ONBOARDING_STEPS.length) {
    onboardingState.isComplete = true;
    markOnboardingComplete();
    logger.agent('onboardingComplete', {
      completed: onboardingState.completedSteps.length,
      skipped: onboardingState.skippedSteps.length,
      duration: Date.now() - onboardingState.startedAt,
    });
    return {
      success: true,
      response: feedback,
      isComplete: true,
    };
  }

  const nextStep = ONBOARDING_STEPS[onboardingState.currentStepIndex];
  return {
    success: true,
    response: feedback,
    nextPrompt: nextStep.prompt,
    isComplete: false,
  };
}

function fuzzyCommandMatch(input: string, expected: string): boolean {
  const inputWords = input.split(/\s+/);
  const expectedWords = expected.split(/\s+/);
  let matches = 0;
  for (const word of expectedWords) {
    if (inputWords.some(w => w.includes(word) || word.includes(w))) {
      matches++;
    }
  }
  return matches / expectedWords.length >= 0.6;
}

function getSuccessResponse(stepId: string): string {
  const responses: Record<string, string[]> = {
    welcome: ['Great job!', 'You got it!', 'Perfect!'],
    navigate: ['You are a natural!', 'Excellent navigation!', 'That is how it is done!'],
    search: ['Searching like a pro!', 'Perfect search!', 'You are getting the hang of this!'],
    read: ['Wonderful!', 'That is how you listen to a page!', 'Great!'],
    scroll: ['Smooth scrolling!', 'You have got it!', 'Perfect!'],
    click: ['Nice click!', 'That is how you interact!', 'Well done!'],
    back: ['Going back!', 'Perfect!', 'You are a quick learner!'],
    shopping: ['Ready to shop!', 'Shopping made easy!', 'Great!'],
    multistep: ['Advanced user!', 'You are a pro now!', 'Impressive!'],
    bookmark: ['Page saved!', 'Bookmarked!', 'Smart move!'],
  };
  const options = responses[stepId] || ['Great!'];
  return options[Math.floor(Math.random() * options.length)];
}

export function getOnboardingProgress(): { current: number; total: number; percent: number } {
  if (!onboardingState) return { current: 0, total: ONBOARDING_STEPS.length, percent: 0 };
  return {
    current: onboardingState.currentStepIndex,
    total: ONBOARDING_STEPS.length,
    percent: Math.round((onboardingState.currentStepIndex / ONBOARDING_STEPS.length) * 100),
  };
}

export function skipOnboarding(): void {
  if (onboardingState) {
    onboardingState.isComplete = true;
    logger.agent('onboardingSkipped', { step: onboardingState.currentStepIndex });
  }
}

export function getOnboardingSteps(): OnboardingStep[] {
  return [...ONBOARDING_STEPS];
}
