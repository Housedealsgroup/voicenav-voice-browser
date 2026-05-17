import { PageSnapshot, AgentAction, AgentContext } from '../browser/types';
import { parseVoiceCommand, getAgentStep, analyzePage } from './brain';
import { speak, stopSpeaking, enqueueSpeech } from '../voice/textToSpeech';

type AgentCallbacks = {
  onAction: (action: AgentAction) => void;
  onStatus: (status: string) => void;
  onComplete: (message: string) => void;
  onError: (error: string) => void;
  onSnapshotRequest: () => void;
};

let isActive = false;
let context: AgentContext = { stepHistory: [], retryCount: 0 };
let currentIntent: ReturnType<typeof parseVoiceCommand> | null = null;
let snapshotBuffer: PageSnapshot | null = null;
let callbacks: AgentCallbacks | null = null;

export function startAgent(
  command: string,
  cbs: AgentCallbacks
): void {
  isActive = true;
  context = { stepHistory: [], retryCount: 0 };
  callbacks = cbs;
  currentIntent = parseVoiceCommand(command);

  cbs.onStatus(`Processing: ${command}`);

  // Request a fresh snapshot
  cbs.onSnapshotRequest();
}

export function handleSnapshot(snapshot: PageSnapshot): void {
  if (!isActive || !currentIntent || !callbacks) return;

  snapshotBuffer = snapshot;

  const { action, isComplete, nextStep, needsRetry } = getAgentStep(currentIntent, snapshot, context);

  callbacks.onAction(action);

  if (action.speak) {
    enqueueSpeech(action.speak);
  }

  if (action.action === 'done' || action.action === 'speak') {
    isActive = false;
    callbacks.onComplete(action.speak || 'Done');
    return;
  }

  if (needsRetry) {
    context.retryCount++;
    context.stepHistory.push('retry');
    setTimeout(() => {
      if (isActive && callbacks) {
        callbacks.onSnapshotRequest();
      }
    }, 1500);
  } else if (!isComplete) {
    context.stepHistory.push('step');
    setTimeout(() => {
      if (isActive && callbacks && snapshotBuffer) {
        handleSnapshot(snapshotBuffer);
      }
    }, 800);
  } else {
    // Wait for page to update, then check again
    setTimeout(() => {
      if (isActive && callbacks) {
        callbacks.onSnapshotRequest();
      }
    }, 1500);
  }
}

export function stopAgent(): void {
  isActive = false;
  currentIntent = null;
  context = { stepHistory: [], retryCount: 0 };
  snapshotBuffer = null;
  stopSpeaking();
  if (callbacks) {
    callbacks.onStatus('Stopped');
  }
}

export function getIsActive(): boolean {
  return isActive;
}

export function getSnapshot(): PageSnapshot | null {
  return snapshotBuffer;
}
