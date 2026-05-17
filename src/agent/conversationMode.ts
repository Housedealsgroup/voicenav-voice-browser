// VoiceNav Conversation Mode — v10
// Multi-turn AI conversation with context retention
// Enables natural dialogue with the browser assistant

import { logger } from '../utils/logger';

export type ConversationTurn = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  intent?: string;
  action?: string;
};

export type ConversationContext = {
  topic: string | null;
  lastIntent: string | null;
  lastTarget: string | null;
  mentionedEntities: string[];
  userPreferences: Record<string, string>;
  turnCount: number;
};

export type ConversationResponse = {
  text: string;
  action?: string;
  followUp?: string;
  context: ConversationContext;
};

const MAX_TURNS = 50;
const turns: ConversationTurn[] = [];
let turnIdCounter = 0;
let context: ConversationContext = {
  topic: null,
  lastIntent: null,
  lastTarget: null,
  mentionedEntities: [],
  userPreferences: {},
  turnCount: 0,
};

// Pronoun resolution map
const PRONOUN_MAP: Record<string, () => string | null> = {
  'it': () => context.lastTarget,
  'that': () => context.lastTarget,
  'this': () => context.lastTarget,
  'there': () => context.lastTarget,
  'them': () => context.mentionedEntities[context.mentionedEntities.length - 1] || null,
  'the page': () => context.lastTarget,
  'the site': () => context.lastTarget,
  'the same': () => context.lastTarget,
};

function addTurn(role: 'user' | 'assistant', text: string, intent?: string, action?: string): ConversationTurn {
  const turn: ConversationTurn = {
    id: `turn-${++turnIdCounter}`,
    role,
    text,
    timestamp: Date.now(),
    intent,
    action,
  };

  turns.push(turn);
  if (turns.length > MAX_TURNS) turns.shift();

  context.turnCount = turns.length;

  return turn;
}

function resolvePronouns(text: string): string {
  let resolved = text.toLowerCase();
  for (const [pronoun, resolver] of Object.entries(PRONOUN_MAP)) {
    if (resolved.includes(pronoun)) {
      const value = resolver();
      if (value) {
        resolved = resolved.replace(new RegExp(`\\b${pronoun}\\b`, 'i'), value);
      }
    }
  }
  return resolved;
}

function extractEntities(text: string): string[] {
  const entities: string[] = [];

  // URLs
  const urls = text.match(/https?:\/\/[^\s]+/g);
  if (urls) entities.push(...urls);

  // Quoted strings
  const quoted = text.match(/"([^"]+)"|'([^']+)'/g);
  if (quoted) entities.push(...quoted.map(q => q.replace(/['"]/g, '')));

  // Capitalized words (potential proper nouns)
  const caps = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
  if (caps) entities.push(...caps.filter(c => c.length > 2));

  return [...new Set(entities)];
}

function generateResponse(userText: string, resolvedText: string): ConversationResponse {
  const lower = resolvedText;

  // Greeting
  if (/^(hi|hello|hey|good morning|good evening)/i.test(lower)) {
    return {
      text: 'Hello! I\'m VoiceNav, your voice browser assistant. I can help you navigate, search, shop, and more. What would you like to do?',
      context,
    };
  }

  // How are you
  if (/how are you|how's it going/i.test(lower)) {
    return {
      text: 'I\'m ready to help! I can browse the web, search for things, read pages aloud, and much more. Just tell me what you need.',
      context,
    };
  }

  // Thank you
  if (/thank|thanks/i.test(lower)) {
    return {
      text: 'You\'re welcome! Let me know if you need anything else.',
      context,
    };
  }

  // What can you do
  if (/what can you do|help|capabilities/i.test(lower)) {
    return {
      text: 'I can: navigate to websites, search the web, click elements, read pages aloud, fill forms, manage bookmarks, compare prices, and automate multi-step tasks. Just speak naturally!',
      action: 'help',
      context,
    };
  }

  // Follow-up questions
  if (/what about|how about|and then|what else/i.test(lower)) {
    if (context.lastTarget) {
      return {
        text: `Regarding ${context.lastTarget}, would you like me to search for more information, navigate there, or do something else?`,
        followUp: `What would you like to do with ${context.lastTarget}?`,
        context,
      };
    }
    return {
      text: 'Could you be more specific? What are you referring to?',
      context,
    };
  }

  // Confirmation handling
  if (/^(yes|yeah|yep|sure|ok|okay|do it|go ahead)$/i.test(lower)) {
    if (context.lastIntent) {
      return {
        text: `Got it, proceeding with ${context.lastIntent}.`,
        action: context.lastIntent,
        context,
      };
    }
    return {
      text: 'What would you like me to do?',
      context,
    };
  }

  // Negation handling
  if (/^(no|nope|nah|cancel|stop|nevermind|never mind)$/i.test(lower)) {
    context.lastIntent = null;
    context.lastTarget = null;
    return {
      text: 'Okay, cancelled. What would you like to do instead?',
      context,
    };
  }

  // Default: treat as a command to execute
  return {
    text: `I'll ${lower.includes('search') ? 'search' : 'help you with that'}. Let me process your request.`,
    action: 'execute',
    context,
  };
}

export function processConversation(userText: string): ConversationResponse {
  // Add user turn
  addTurn('user', userText);

  // Resolve pronouns
  const resolved = resolvePronouns(userText);

  // Extract entities
  const entities = extractEntities(userText);
  context.mentionedEntities.push(...entities);
  if (context.mentionedEntities.length > 20) {
    context.mentionedEntities = context.mentionedEntities.slice(-20);
  }

  // Generate response
  const response = generateResponse(userText, resolved);

  // Update context
  if (response.action) {
    context.lastIntent = response.action;
  }
  if (entities.length > 0) {
    context.lastTarget = entities[0];
  }

  // Detect topic
  if (userText.toLowerCase().includes('shop') || userText.toLowerCase().includes('buy')) {
    context.topic = 'shopping';
  } else if (userText.toLowerCase().includes('news') || userText.toLowerCase().includes('read')) {
    context.topic = 'reading';
  } else if (userText.toLowerCase().includes('search') || userText.toLowerCase().includes('find')) {
    context.topic = 'searching';
  }

  // Add assistant turn
  addTurn('assistant', response.text, response.action);

  logger.agent('conversation', { userText, resolved, action: response.action, topic: context.topic });

  return response;
}

export function getConversationHistory(): ConversationTurn[] {
  return [...turns];
}

export function getConversationContext(): ConversationContext {
  return { ...context };
}

export function clearConversation(): void {
  turns.length = 0;
  context = {
    topic: null,
    lastIntent: null,
    lastTarget: null,
    mentionedEntities: [],
    userPreferences: {},
    turnCount: 0,
  };
}

export function getConversationSummary(): string {
  if (turns.length === 0) return 'No conversation yet.';

  const userTurns = turns.filter(t => t.role === 'user');
  const topics = [...new Set(userTurns.map(t => t.intent).filter(Boolean))];

  return `${turns.length} turns. Topics: ${topics.join(', ') || 'general conversation'}. Last topic: ${context.topic || 'none'}.`;
}

export function setPreference(key: string, value: string): void {
  context.userPreferences[key] = value;
}

export function getPreference(key: string): string | undefined {
  return context.userPreferences[key];
}
