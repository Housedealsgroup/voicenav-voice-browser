// VoiceNav Task Engine — multi-step task automation with state machine
// Supports task templates, conditional logic, error recovery, and task queuing

import type { PageSnapshot, AgentAction } from '../browser/types';
import type { NLUResult, Intent } from './nlu';
import { logger } from '../utils/logger';

export type TaskStatus = 'pending' | 'running' | 'waiting' | 'paused' | 'completed' | 'failed' | 'cancelled';

export type TaskStep = {
  id: string;
  name: string;
  status: TaskStatus;
  command?: string;
  action?: AgentAction;
  result?: 'success' | 'failure' | 'skipped';
  error?: string;
  startedAt?: number;
  completedAt?: number;
  retryCount: number;
  maxRetries: number;
};

export type TaskDefinition = {
  id: string;
  name: string;
  description: string;
  category: 'shopping' | 'search' | 'navigation' | 'reading' | 'form' | 'custom';
  steps: TaskStep[];
  status: TaskStatus;
  currentStepIndex: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  goal?: string;
  variables: Record<string, string>;
  onProgress?: (step: TaskStep, index: number, total: number) => void;
  onComplete?: (task: TaskDefinition) => void;
  onError?: (task: TaskDefinition, error: string) => void;
};

export type TaskTemplate = {
  name: string;
  description: string;
  category: TaskDefinition['category'];
  steps: Array<{ name: string; commandTemplate: string }>;
  triggerPhrases: string[];
};

// --- Built-in Task Templates ---
export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    name: 'Shop for item',
    description: 'Search for a product, compare options, and add to cart',
    category: 'shopping',
    steps: [
      { name: 'Navigate to store', commandTemplate: 'go to {store}' },
      { name: 'Search for item', commandTemplate: 'search for {item}' },
      { name: 'Review results', commandTemplate: 'read this page' },
      { name: 'Select product', commandTemplate: 'click the first result' },
      { name: 'Check details', commandTemplate: 'read this page' },
      { name: 'Add to cart', commandTemplate: 'add to cart' },
    ],
    triggerPhrases: ['shop for', 'buy', 'find me', 'order', 'purchase'],
  },
  {
    name: 'Compare prices',
    description: 'Search across multiple stores for the best price',
    category: 'shopping',
    steps: [
      { name: 'Search Google', commandTemplate: 'search for {item} price' },
      { name: 'Review results', commandTemplate: 'read this page' },
      { name: 'Open first store', commandTemplate: 'click the first result' },
      { name: 'Check price', commandTemplate: 'read this page' },
      { name: 'Go back', commandTemplate: 'go back' },
      { name: 'Open second store', commandTemplate: 'click the second result' },
      { name: 'Check price', commandTemplate: 'read this page' },
    ],
    triggerPhrases: ['compare prices', 'price compare', 'best price', 'cheapest'],
  },
  {
    name: 'Read and summarize',
    description: 'Read the current page and provide a summary',
    category: 'reading',
    steps: [
      { name: 'Read page content', commandTemplate: 'read this page' },
      { name: 'Scroll down', commandTemplate: 'scroll down' },
      { name: 'Read more', commandTemplate: 'read this page' },
    ],
    triggerPhrases: ['read and summarize', 'summarize this', 'read article', 'tell me about this'],
  },
  {
    name: 'Fill and submit form',
    description: 'Fill in form fields and submit',
    category: 'form',
    steps: [
      { name: 'Find form', commandTemplate: 'read this page' },
      { name: 'Fill fields', commandTemplate: 'fill {field} in {value}' },
      { name: 'Submit form', commandTemplate: 'submit the form' },
    ],
    triggerPhrases: ['fill form', 'submit form', 'fill out', 'complete form'],
  },
  {
    name: 'Check email',
    description: 'Open email and read latest messages',
    category: 'navigation',
    steps: [
      { name: 'Open email', commandTemplate: 'go to gmail' },
      { name: 'Read inbox', commandTemplate: 'read this page' },
    ],
    triggerPhrases: ['check email', 'check my email', 'read email', 'open inbox', 'check inbox', 'check my inbox'],
  },
  {
    name: 'Browse news',
    description: 'Open news site and read headlines',
    category: 'reading',
    steps: [
      { name: 'Open news', commandTemplate: 'go to news' },
      { name: 'Read headlines', commandTemplate: 'read this page' },
    ],
    triggerPhrases: ['read news', 'check news', 'what is happening', 'latest news'],
  },
];

// --- Task Manager ---
let taskQueue: TaskDefinition[] = [];
let activeTask: TaskDefinition | null = null;
let taskCounter = 0;

export function createTask(name: string, steps: Array<{ name: string; command?: string }>, goal?: string): TaskDefinition {
  const task: TaskDefinition = {
    id: `task-${++taskCounter}`,
    name,
    description: goal || name,
    category: 'custom',
    steps: steps.map((s, i) => ({
      id: `step-${taskCounter}-${i}`,
      name: s.name,
      status: 'pending' as TaskStatus,
      command: s.command,
      retryCount: 0,
      maxRetries: 2,
    })),
    status: 'pending',
    currentStepIndex: 0,
    createdAt: Date.now(),
    goal,
    variables: {},
  };
  return task;
}

export function createTaskFromTemplate(template: TaskTemplate, variables: Record<string, string>): TaskDefinition {
  const steps = template.steps.map(s => ({
    name: s.name,
    command: interpolateTemplate(s.commandTemplate, variables),
  }));
  const task = createTask(template.name, steps, template.description);
  task.category = template.category;
  task.variables = variables;
  return task;
}

function interpolateTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => variables[key] || `{${key}}`);
}

export function matchTaskTemplate(text: string): TaskTemplate | null {
  const normalized = text.toLowerCase().trim();
  for (const template of TASK_TEMPLATES) {
    for (const phrase of template.triggerPhrases) {
      if (normalized.includes(phrase)) return template;
    }
  }
  return null;
}

export function submitTask(task: TaskDefinition): void {
  logger.agent('taskSubmit', { name: task.name, steps: task.steps.length, category: task.category });
  taskQueue.push(task);
  if (!activeTask) {
    startNextTask();
  }
}

export function startNextTask(): TaskDefinition | null {
  if (activeTask) return activeTask;
  if (taskQueue.length === 0) return null;

  activeTask = taskQueue.shift()!;
  activeTask.status = 'running';
  activeTask.startedAt = Date.now();
  return activeTask;
}

export function getActiveTask(): TaskDefinition | null {
  return activeTask;
}

export function getTaskQueue(): TaskDefinition[] {
  return [...taskQueue];
}

export function getCurrentStep(): TaskStep | null {
  if (!activeTask) return null;
  return activeTask.steps[activeTask.currentStepIndex] || null;
}

export function advanceStep(): TaskStep | null {
  if (!activeTask) return null;

  const current = activeTask.steps[activeTask.currentStepIndex];
  if (current) {
    current.status = 'completed';
    current.result = 'success';
    current.completedAt = Date.now();
  }

  activeTask.currentStepIndex++;

  if (activeTask.currentStepIndex >= activeTask.steps.length) {
    completeActiveTask();
    return null;
  }

  const next = activeTask.steps[activeTask.currentStepIndex];
  next.status = 'running';
  next.startedAt = Date.now();

  activeTask.onProgress?.(next, activeTask.currentStepIndex, activeTask.steps.length);
  return next;
}

export function failCurrentStep(error: string): boolean {
  if (!activeTask) return false;

  const current = activeTask.steps[activeTask.currentStepIndex];
  if (!current) return false;

  current.retryCount++;
  if (current.retryCount < current.maxRetries) {
    current.status = 'pending';
    current.error = error;
    return true; // Will retry
  }

  current.status = 'failed';
  current.result = 'failure';
  current.error = error;
  current.completedAt = Date.now();

  // Try to continue with next step
  activeTask.currentStepIndex++;
  if (activeTask.currentStepIndex >= activeTask.steps.length) {
    completeActiveTask();
  }
  return false;
}

export function completeActiveTask(): void {
  if (!activeTask) return;

  const allFailed = activeTask.steps.every(s => s.status === 'failed');
  activeTask.status = allFailed ? 'failed' : 'completed';
  activeTask.completedAt = Date.now();

  activeTask.onComplete?.(activeTask);
  activeTask = null;

  // Start next task in queue
  startNextTask();
}

export function cancelActiveTask(): void {
  if (!activeTask) return;
  activeTask.status = 'cancelled';
  activeTask.completedAt = Date.now();
  activeTask = null;
  startNextTask();
}

export function pauseActiveTask(): void {
  if (!activeTask) return;
  activeTask.status = 'paused';
}

export function resumeActiveTask(): void {
  if (!activeTask || activeTask.status !== 'paused') return;
  activeTask.status = 'running';
}

export function cancelAllTasks(): void {
  cancelActiveTask();
  taskQueue = [];
}

export function getTaskProgress(): { current: number; total: number; percent: number; stepName?: string } | null {
  if (!activeTask) return null;
  const total = activeTask.steps.length;
  const current = activeTask.currentStepIndex;
  const step = activeTask.steps[current];
  return {
    current,
    total,
    percent: total > 0 ? Math.round((current / total) * 100) : 0,
    stepName: step?.name,
  };
}

// --- Multi-step Command Parser ---
export function parseMultiStepCommand(text: string): string[] {
  // Split on "then", "and then", "and", semicolons
  const separators = /\s+then\s+|\s+and\s+(?:then\s+)?|;\s*/;
  return text.split(separators).map(s => s.trim()).filter(Boolean);
}

export function hasMultipleSteps(text: string): boolean {
  return parseMultiStepCommand(text).length > 1;
}
