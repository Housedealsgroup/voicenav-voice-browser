import { PageSnapshot, AgentAction } from '../browser/types';
import { parseVoiceCommand, getAgentStep, analyzePage } from './brain';
import { speak, stopSpeaking, enqueueSpeech } from '../voice/textToSpeech';
import * as Haptics from 'expo-haptics';

type AgentCallbacks = {
  onAction: (action: AgentAction) => void;
  onStatus: (status: string) => void;
  onComplete: (message: string) => void;
  onError: (error: string) => void;
  onSnapshotRequest: () => void;
};

let isActive = false;
let currentStep = 0;
let currentIntent: ReturnType<typeof parseVoiceCommand> | null = null;
let snapshotBuffer: PageSnapshot | null = null;
let callbacks: AgentCallbacks | null = null;

export function startAgent(
  command: string,
  cbs: AgentCallbacks
): void {
  isActive = true;
  currentStep = 0;
  callbacks = cbs;
  currentIntent = parseVoiceCommand(command);

  cbs.onStatus(`Processing: ${command}`);
  hapticFeedback('light');

  // Request a fresh snapshot
  cbs.onSnapshotRequest();
}

export function handleSnapshot(snapshot: PageSnapshot): void {
  if (!isActive || !currentIntent || !callbacks) return;

  snapshotBuffer = snapshot;

  const { action, isComplete, nextStep } = getAgentStep(currentIntent, snapshot, currentStep);

  callbacks.onAction(action);

  // Speak the action
  if (action.speak) {
    enqueueSpeech(action.speak);
  }

  if (action.action === 'done' || action.action === 'speak') {
    isActive = false;
    callbacks.onComplete(action.speak || 'Done');
    hapticFeedback('success');
    return;
  }

  if (isComplete) {
    // Wait for page to update, then check again
    currentStep = 0;
    setTimeout(() => {
      if (isActive && callbacks) {
        callbacks.onSnapshotRequest();
      }
    }, 1500);
  } else {
    currentStep = nextStep;
    // Execute next step after a delay
    setTimeout(() => {
      if (isActive && callbacks && snapshotBuffer) {
        handleSnapshot(snapshotBuffer);
      }
    }, 800);
  }
}

export function stopAgent(): void {
  isActive = false;
  currentIntent = null;
  currentStep = 0;
  snapshotBuffer = null;
  stopSpeaking();
  if (callbacks) {
    callbacks.onStatus('Stopped');
  }
  hapticFeedback('warning');
}

export function getIsActive(): boolean {
  return isActive;
}

export function getSnapshot(): PageSnapshot | null {
  return snapshotBuffer;
}

function hapticFeedback(type: 'light' | 'success' | 'warning'): void {
  try {
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
    }
  } catch {}
}
