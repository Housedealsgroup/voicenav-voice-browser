// VoiceNav Voice Macros — record and replay command sequences
// Built-in macros, user macros, variable substitution

import AsyncStorage from '@react-native-async-storage/async-storage';

export type MacroStep = {
  command: string;
  delayMs?: number; // delay before executing this step
  waitForPageLoad?: boolean;
};

export type VoiceMacro = {
  id: string;
  name: string;
  triggerPhrase: string;
  description: string;
  steps: MacroStep[];
  isBuiltIn: boolean;
  createdAt: number;
  lastUsed?: number;
  useCount: number;
  category: 'shopping' | 'email' | 'news' | 'social' | 'productivity' | 'custom';
  variables?: string[]; // variable names like {item}, {url}
};

const STORAGE_KEY = 'voicenav-macros';

// --- Built-in Macros ---
export { BUILT_IN_MACROS };
const BUILT_IN_MACROS: VoiceMacro[] = [
  {
    id: 'builtin-morning',
    name: 'Morning Routine',
    triggerPhrase: 'morning routine',
    description: 'Check email, news, and weather',
    steps: [
      { command: 'go to gmail', waitForPageLoad: true },
      { command: 'read this page', delayMs: 2000 },
      { command: 'go to news', waitForPageLoad: true },
      { command: 'read this page', delayMs: 2000 },
      { command: 'go to weather', waitForPageLoad: true },
      { command: 'read this page' },
    ],
    isBuiltIn: true,
    createdAt: 0,
    useCount: 0,
    category: 'productivity',
  },
  {
    id: 'builtin-amazon-shop',
    name: 'Quick Amazon Shop',
    triggerPhrase: 'amazon shop for',
    description: 'Search Amazon for an item and read results',
    steps: [
      { command: 'go to amazon', waitForPageLoad: true },
      { command: 'search for {item}', waitForPageLoad: true },
      { command: 'read this page' },
    ],
    isBuiltIn: true,
    createdAt: 0,
    useCount: 0,
    category: 'shopping',
    variables: ['item'],
  },
  {
    id: 'builtin-check-email',
    name: 'Check Email',
    triggerPhrase: 'check my email',
    description: 'Open Gmail and read inbox',
    steps: [
      { command: 'go to gmail', waitForPageLoad: true },
      { command: 'read this page' },
    ],
    isBuiltIn: true,
    createdAt: 0,
    useCount: 0,
    category: 'email',
  },
  {
    id: 'builtin-read-news',
    name: 'Read News',
    triggerPhrase: 'what is the news',
    description: 'Open Google News and read headlines',
    steps: [
      { command: 'go to news', waitForPageLoad: true },
      { command: 'read this page' },
    ],
    isBuiltIn: true,
    createdAt: 0,
    useCount: 0,
    category: 'news',
  },
  {
    id: 'builtin-youtube',
    name: 'Watch YouTube',
    triggerPhrase: 'watch youtube',
    description: 'Open YouTube and read what is trending',
    steps: [
      { command: 'go to youtube', waitForPageLoad: true },
      { command: 'read this page' },
    ],
    isBuiltIn: true,
    createdAt: 0,
    useCount: 0,
    category: 'social',
  },
  {
    id: 'builtin-compare-prices',
    name: 'Compare Prices',
    triggerPhrase: 'compare prices for',
    description: 'Search Google for price comparison',
    steps: [
      { command: 'search for {item} price comparison', waitForPageLoad: true },
      { command: 'read this page' },
      { command: 'click the first result', waitForPageLoad: true },
      { command: 'read this page' },
    ],
    isBuiltIn: true,
    createdAt: 0,
    useCount: 0,
    category: 'shopping',
    variables: ['item'],
  },
];

// --- Macro Storage ---
let userMacros: VoiceMacro[] = [];
let isRecording = false;
let recordingSteps: MacroStep[] = [];
let recordingName = '';
let recordingTrigger = '';

export async function loadMacros(): Promise<VoiceMacro[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    userMacros = stored ? JSON.parse(stored) : [];
  } catch {
    userMacros = [];
  }
  return getAllMacros();
}

async function saveMacros(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userMacros));
  } catch {}
}

export function getAllMacros(): VoiceMacro[] {
  return [...BUILT_IN_MACROS, ...userMacros];
}

export function getUserMacros(): VoiceMacro[] {
  return [...userMacros];
}

export function getBuiltInMacros(): VoiceMacro[] {
  return [...BUILT_IN_MACROS];
}

// --- Find Macro by Voice ---
export function findMacroByVoice(text: string): { macro: VoiceMacro; variables: Record<string, string> } | null {
  const normalized = text.toLowerCase().trim();

  // Try exact trigger phrase match first
  for (const macro of getAllMacros()) {
    const trigger = macro.triggerPhrase.toLowerCase();
    if (normalized.startsWith(trigger)) {
      const remaining = normalized.slice(trigger.length).trim();
      const variables = extractVariables(remaining, macro.variables);
      return { macro, variables };
    }
    // Fuzzy match
    if (normalized.includes(trigger)) {
      const remaining = normalized.replace(trigger, '').trim();
      const variables = extractVariables(remaining, macro.variables);
      return { macro, variables };
    }
  }

  // Try matching by name
  for (const macro of getAllMacros()) {
    if (normalized.includes(macro.name.toLowerCase())) {
      const remaining = normalized.replace(new RegExp(macro.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
      const variables = extractVariables(remaining, macro.variables);
      return { macro, variables };
    }
  }

  return null;
}

function extractVariables(text: string, varNames?: string[]): Record<string, string> {
  const variables: Record<string, string> = {};
  if (!varNames || varNames.length === 0 || !text) return variables;

  // For single variable, use the entire remaining text
  if (varNames.length === 1) {
    variables[varNames[0]] = text;
    return variables;
  }

  // For multiple variables, try to split by "for" or "and"
  const parts = text.split(/\s+for\s+|\s+and\s+/);
  varNames.forEach((name, i) => {
    if (parts[i]) variables[name] = parts[i].trim();
  });

  return variables;
}

// --- Execute Macro ---
export function expandMacro(macro: VoiceMacro, variables: Record<string, string> = {}): MacroStep[] {
  return macro.steps.map(step => ({
    ...step,
    command: step.command.replace(/\{(\w+)\}/g, (_, key) => variables[key] || `{${key}}`),
  }));
}

export function markMacroUsed(macroId: string): void {
  const macro = userMacros.find(m => m.id === macroId);
  if (macro) {
    macro.lastUsed = Date.now();
    macro.useCount++;
    saveMacros();
  }
}

// --- Recording ---
export function startRecording(name: string, triggerPhrase: string): void {
  isRecording = true;
  recordingSteps = [];
  recordingName = name;
  recordingTrigger = triggerPhrase.toLowerCase();
}

export function recordStep(command: string, waitForPageLoad: boolean = true): void {
  if (!isRecording) return;
  recordingSteps.push({
    command,
    waitForPageLoad,
    delayMs: recordingSteps.length > 0 ? 1000 : 0,
  });
}

export function stopRecording(): VoiceMacro | null {
  if (!isRecording || recordingSteps.length === 0) {
    isRecording = false;
    return null;
  }

  const macro: VoiceMacro = {
    id: `macro-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: recordingName,
    triggerPhrase: recordingTrigger,
    description: `Custom macro: ${recordingName}`,
    steps: [...recordingSteps],
    isBuiltIn: false,
    createdAt: Date.now(),
    useCount: 0,
    category: 'custom',
  };

  userMacros.push(macro);
  saveMacros();

  isRecording = false;
  recordingSteps = [];
  recordingName = '';
  recordingTrigger = '';

  return macro;
}

export function cancelRecording(): void {
  isRecording = false;
  recordingSteps = [];
  recordingName = '';
  recordingTrigger = '';
}

export function getIsRecording(): boolean {
  return isRecording;
}

export function getRecordingStepCount(): number {
  return recordingSteps.length;
}

// --- CRUD ---
export async function addMacro(macro: Omit<VoiceMacro, 'id' | 'createdAt' | 'useCount' | 'isBuiltIn'>): Promise<VoiceMacro> {
  const full: VoiceMacro = {
    ...macro,
    id: `macro-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    isBuiltIn: false,
    createdAt: Date.now(),
    useCount: 0,
  };
  userMacros.push(full);
  await saveMacros();
  return full;
}

export async function removeMacro(id: string): Promise<void> {
  userMacros = userMacros.filter(m => m.id !== id);
  await saveMacros();
}

export async function updateMacro(id: string, updates: Partial<VoiceMacro>): Promise<void> {
  const idx = userMacros.findIndex(m => m.id === id);
  if (idx >= 0) {
    userMacros[idx] = { ...userMacros[idx], ...updates };
    await saveMacros();
  }
}

// --- Export/Import ---
export function exportMacros(): string {
  return JSON.stringify(userMacros, null, 2);
}

export async function importMacros(json: string): Promise<number> {
  try {
    const imported: VoiceMacro[] = JSON.parse(json);
    const valid = imported.filter(m => m.name && m.triggerPhrase && m.steps?.length > 0);
    for (const m of valid) {
      m.id = `macro-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      m.isBuiltIn = false;
      m.createdAt = Date.now();
      m.useCount = 0;
    }
    userMacros.push(...valid);
    await saveMacros();
    return valid.length;
  } catch {
    return 0;
  }
}
