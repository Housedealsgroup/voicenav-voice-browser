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
  topic?: string;
  entities?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
};

export type ConversationContext = {
  topic: string | null;
  topicHistory: string[];
  lastIntent: string | null;
  lastTarget: string | null;
  mentionedEntities: string[];
  userPreferences: Record<string, string>;
  turnCount: number;
  contextWindow: ConversationTurn[];
  sentimentTrend: 'positive' | 'negative' | 'neutral';
  activeEntities: Map<string, string>; // entity type -> last value
};

export type ConversationResponse = {
  text: string;
  action?: string;
  followUp?: string;
  context: ConversationContext;
};

const MAX_TURNS = 50;
const CONTEXT_WINDOW_SIZE = 10;
const turns: ConversationTurn[] = [];
let turnIdCounter = 0;
let context: ConversationContext = {
  topic: null,
  topicHistory: [],
  lastIntent: null,
  lastTarget: null,
  mentionedEntities: [],
  userPreferences: {},
  turnCount: 0,
  contextWindow: [],
  sentimentTrend: 'neutral',
  activeEntities: new Map(),
};

// Extended pronoun resolution with entity type tracking
const PRONOUN_MAP: Record<string, (ctx: ConversationContext) => string | null> = {
  'it': (ctx) => ctx.lastTarget,
  'that': (ctx) => ctx.lastTarget,
  'this': (ctx) => ctx.lastTarget,
  'there': (ctx) => ctx.lastTarget,
  'them': (ctx) => {
    const entities = ctx.mentionedEntities;
    return entities.length > 0 ? entities[entities.length - 1] : null;
  },
  'those': (ctx) => {
    const entities = ctx.mentionedEntities;
    return entities.length > 1 ? entities.slice(-2).join(' and ') : ctx.lastTarget;
  },
  'these': (ctx) => {
    const entities = ctx.mentionedEntities;
    return entities.length > 1 ? entities.slice(-2).join(' and ') : ctx.lastTarget;
  },
  'he': (ctx) => ctx.activeEntities.get('person') || null,
  'she': (ctx) => ctx.activeEntities.get('person') || null,
  'they': (ctx) => ctx.activeEntities.get('organization') || ctx.lastTarget,
  'the page': (ctx) => ctx.lastTarget,
  'the site': (ctx) => ctx.lastTarget,
  'the same': (ctx) => ctx.lastTarget,
  'the product': (ctx) => ctx.activeEntities.get('product') || ctx.lastTarget,
  'the article': (ctx) => ctx.activeEntities.get('article') || ctx.lastTarget,
};

// Topic detection keywords with weights
const TOPIC_KEYWORDS: Record<string, { keywords: string[]; weight: number }[]> = {
  shopping: [
    { keywords: ['shop', 'buy', 'purchase', 'cart', 'checkout', 'order'], weight: 3 },
    { keywords: ['price', 'cost', 'deal', 'discount', 'sale', 'coupon'], weight: 2 },
    { keywords: ['product', 'item', 'brand', 'store'], weight: 1 },
  ],
  reading: [
    { keywords: ['news', 'article', 'read', 'blog', 'story'], weight: 3 },
    { keywords: ['report', 'journal', 'publication', 'magazine'], weight: 2 },
  ],
  searching: [
    { keywords: ['search', 'find', 'look up', 'google', 'query'], weight: 3 },
    { keywords: ['locate', 'discover', 'browse'], weight: 1 },
  ],
  navigation: [
    { keywords: ['go to', 'navigate', 'open', 'visit', 'url'], weight: 3 },
    { keywords: ['back', 'forward', 'home', 'page'], weight: 1 },
  ],
  media: [
    { keywords: ['play', 'pause', 'video', 'watch', 'listen', 'audio'], weight: 3 },
    { keywords: ['music', 'song', 'podcast', 'stream'], weight: 2 },
  ],
  form: [
    { keywords: ['fill', 'submit', 'form', 'sign up', 'register', 'login'], weight: 3 },
    { keywords: ['email', 'password', 'username', 'name', 'address'], weight: 1 },
  ],
  social: [
    { keywords: ['post', 'share', 'like', 'comment', 'follow', 'tweet'], weight: 3 },
    { keywords: ['message', 'chat', 'friend', 'profile'], weight: 2 },
  ],
  comparison: [
    { keywords: ['compare', 'difference', 'vs', 'versus', 'better', 'best'], weight: 3 },
    { keywords: ['alternative', 'option', 'choice', 'recommend'], weight: 2 },
  ],
};

// Sentiment word lists for conversation tracking
const POSITIVE_WORDS = ['good', 'great', 'thanks', 'perfect', 'awesome', 'love', 'excellent', 'wonderful', 'fantastic', 'helpful', 'nice', 'amazing', 'appreciate', 'brilliant'];
const NEGATIVE_WORDS = ['bad', 'wrong', 'broken', 'annoying', 'frustrating', 'hate', 'terrible', 'awful', 'useless', 'slow', 'confusing', 'disappointing', 'error', 'fail'];

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  let positive = 0;
  let negative = 0;

  for (const word of words) {
    if (POSITIVE_WORDS.includes(word)) positive++;
    if (NEGATIVE_WORDS.includes(word)) negative++;
  }

  // Also check for negation patterns
  const negationPatterns = /\b(not|don't|doesn't|didn't|won't|can't|isn't|aren't)\s+\w+/gi;
  const negations = lower.match(negationPatterns) || [];
  // Negation before a positive word flips it
  for (const neg of negations) {
    for (const pw of POSITIVE_WORDS) {
      if (neg.includes(pw)) {
        positive--;
        negative++;
      }
    }
  }

  if (positive > negative + 1) return 'positive';
  if (negative > positive + 1) return 'negative';
  return 'neutral';
}

function detectTopic(text: string): string | null {
  const lower = text.toLowerCase();
  let bestTopic: string | null = null;
  let bestScore = 0;

  for (const [topic, patterns] of Object.entries(TOPIC_KEYWORDS)) {
    let score = 0;
    for (const { keywords, weight } of patterns) {
      for (const keyword of keywords) {
        if (lower.includes(keyword)) score += weight;
      }
    }
    if (score > bestScore && score >= 2) {
      bestScore = score;
      bestTopic = topic;
    }
  }

  return bestTopic;
}

function updateContextWindow(turn: ConversationTurn): void {
  context.contextWindow.push(turn);
  if (context.contextWindow.length > CONTEXT_WINDOW_SIZE) {
    context.contextWindow.shift();
  }
}

function addTurn(role: 'user' | 'assistant', text: string, intent?: string, action?: string): ConversationTurn {
  const sentiment = role === 'user' ? analyzeSentiment(text) : undefined;
  const topic = role === 'user' ? detectTopic(text) : undefined;

  const turn: ConversationTurn = {
    id: `turn-${++turnIdCounter}`,
    role,
    text,
    timestamp: Date.now(),
    intent,
    action,
    topic: topic || undefined,
    entities: role === 'user' ? extractEntities(text) : undefined,
    sentiment,
  };

  turns.push(turn);
  if (turns.length > MAX_TURNS) turns.shift();

  context.turnCount = turns.length;
  updateContextWindow(turn);

  // Update sentiment trend from recent user turns
  if (role === 'user') {
    const recentUserTurns = context.contextWindow
      .filter(t => t.role === 'user' && t.sentiment)
      .slice(-3);
    if (recentUserTurns.length > 0) {
      const sentiments = recentUserTurns.map(t => t.sentiment!);
      const pos = sentiments.filter(s => s === 'positive').length;
      const neg = sentiments.filter(s => s === 'negative').length;
      context.sentimentTrend = pos > neg ? 'positive' : neg > pos ? 'negative' : 'neutral';
    }
  }

  return turn;
}

function resolvePronouns(text: string): string {
  let resolved = text;

  // Sort pronouns by length descending to match longer phrases first (e.g., "the product" before "the")
  const sortedPronouns = Object.entries(PRONOUN_MAP).sort((a, b) => b[0].length - a[0].length);

  for (const [pronoun, resolver] of sortedPronouns) {
    const regex = new RegExp(`\\b${pronoun}\\b`, 'gi');
    if (regex.test(resolved)) {
      const value = resolver(context);
      if (value) {
        resolved = resolved.replace(regex, value);
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

  // Email addresses
  const emails = text.match(/[\w.-]+@[\w.-]+\.\w{2,}/g);
  if (emails) entities.push(...emails);

  // Phone numbers
  const phones = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g);
  if (phones) entities.push(...phones);

  return [...new Set(entities)];
}

function classifyEntities(text: string): void {
  const lower = text.toLowerCase();

  // Person names (capitalized words not at sentence start, common name patterns)
  const namePattern = /\b(?:mr|mrs|ms|dr|prof)\.?\s+[A-Z][a-z]+/gi;
  const names = text.match(namePattern);
  if (names) {
    context.activeEntities.set('person', names[0]);
  }

  // Organizations (Inc, Corp, LLC, Ltd, Company, Foundation)
  const orgPattern = /\b[A-Z][\w\s]+(?:Inc|Corp|LLC|Ltd|Company|Foundation|Association|Institute|University)\b/g;
  const orgs = text.match(orgPattern);
  if (orgs) {
    context.activeEntities.set('organization', orgs[0]);
  }

  // Products (look for capitalized words near buy/shop/product keywords)
  if (/buy|shop|product|item|purchase/i.test(lower)) {
    const productMatch = text.match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\b/);
    if (productMatch && productMatch[0].length > 3) {
      context.activeEntities.set('product', productMatch[0]);
    }
  }

  // Dates
  const datePattern = /\b(?:\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s*\d{2,4})\b/gi;
  const dates = text.match(datePattern);
  if (dates) {
    context.activeEntities.set('date', dates[0]);
  }

  // Numbers (quantities, amounts)
  const numPattern = /\b\d+(?:,\d{3})*(?:\.\d+)?\b/g;
  const numbers = text.match(numPattern);
  if (numbers && numbers.length > 0) {
    context.activeEntities.set('number', numbers[0]);
  }
}

function generateResponse(userText: string, resolvedText: string): ConversationResponse {
  const lower = resolvedText.toLowerCase();

  // Greeting
  if (/^(hi|hello|hey|good morning|good evening|good afternoon)\b/i.test(lower)) {
    const timeOfDay = new Date().getHours();
    const greeting = timeOfDay < 12 ? 'Good morning' : timeOfDay < 18 ? 'Good afternoon' : 'Good evening';
    return {
      text: `${greeting}! I'm VoiceNav, your voice browser assistant. I can help you navigate, search, shop, and more. What would you like to do?`,
      context,
    };
  }

  // How are you
  if (/how are you|how's it going|what's up/i.test(lower)) {
    const sentimentNote = context.sentimentTrend === 'negative'
      ? " I notice things might be frustrating — I'll do my best to help."
      : '';
    return {
      text: `I'm ready to help!${sentimentNote} I can browse the web, search for things, read pages aloud, and much more. Just tell me what you need.`,
      context,
    };
  }

  // Thank you
  if (/thank|thanks|thx|ty/i.test(lower)) {
    return {
      text: "You're welcome! Let me know if you need anything else.",
      context,
    };
  }

  // What can you do
  if (/what can you do|help|capabilities|what do you do/i.test(lower)) {
    return {
      text: "I can: navigate to websites, search the web, click elements, read pages aloud, fill forms, manage bookmarks, compare prices, track topics across our conversation, and automate multi-step tasks. Just speak naturally!",
      action: 'help',
      context,
    };
  }

  // Follow-up questions with context awareness
  if (/what about|how about|and then|what else|anything else/i.test(lower)) {
    if (context.lastTarget) {
      // Look at recent context to provide better follow-up
      const recentTopics = context.contextWindow
        .filter(t => t.topic)
        .map(t => t.topic)
        .filter(Boolean) as string[];
      const topicHint = recentTopics.length > 0 ? ` We've been discussing ${recentTopics[recentTopics.length - 1]}.` : '';

      return {
        text: `Regarding ${context.lastTarget},${topicHint} Would you like me to search for more information, navigate there, or do something else?`,
        followUp: `What would you like to do with ${context.lastTarget}?`,
        context,
      };
    }
    return {
      text: 'Could you be more specific? What are you referring to?',
      context,
    };
  }

  // Confirmation handling with context-aware execution
  if (/^(yes|yeah|yep|sure|ok|okay|do it|go ahead|absolutely|definitely)$/i.test(lower)) {
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
  if (/^(no|nope|nah|cancel|stop|nevermind|never mind|forget it|not now)$/i.test(lower)) {
    context.lastIntent = null;
    context.lastTarget = null;
    return {
      text: 'Okay, cancelled. What would you like to do instead?',
      context,
    };
  }

  // Preference detection from conversation
  if (/i (?:prefer|like|want|need)\s+(.+)/i.test(lower)) {
    const match = lower.match(/i (?:prefer|like|want|need)\s+(.+)/i);
    if (match) {
      const preference = match[1].trim();
      const prefKey = context.topic || 'general';
      context.userPreferences[prefKey] = preference;
      return {
        text: `Noted! I'll remember that you ${match[0].includes('prefer') ? 'prefer' : 'want'} ${preference}.`,
        context,
      };
    }
  }

  // History-aware responses
  if (/what did (?:i|we) (?:say|talk about|discuss|do)/i.test(lower)) {
    const recentUserTurns = context.contextWindow
      .filter(t => t.role === 'user')
      .slice(-3)
      .map(t => t.text.substring(0, 50));
    if (recentUserTurns.length > 0) {
      return {
        text: `In our recent conversation, you mentioned: ${recentUserTurns.join('; ')}. Would you like to continue with any of that?`,
        context,
      };
    }
    return {
      text: 'We just started talking. What would you like to do?',
      context,
    };
  }

  // Default: treat as a command to execute
  const hasSearch = lower.includes('search') || lower.includes('find') || lower.includes('look up');
  const hasNavigate = lower.includes('go to') || lower.includes('open') || lower.includes('navigate');
  const actionType = hasSearch ? 'search' : hasNavigate ? 'navigate' : 'execute';

  return {
    text: `I'll ${actionType === 'search' ? 'search for that' : actionType === 'navigate' ? 'navigate there' : 'help you with that'}. Let me process your request.`,
    action: actionType,
    context,
  };
}

export function processConversation(userText: string): ConversationResponse {
  // Add user turn
  addTurn('user', userText);

  // Resolve pronouns
  const resolved = resolvePronouns(userText);

  // Extract and track entities
  const entities = extractEntities(userText);
  context.mentionedEntities.push(...entities);
  if (context.mentionedEntities.length > 20) {
    context.mentionedEntities = context.mentionedEntities.slice(-20);
  }

  // Classify entities into types
  classifyEntities(userText);

  // Generate response
  const response = generateResponse(userText, resolved);

  // Update context
  if (response.action) {
    context.lastIntent = response.action;
  }
  if (entities.length > 0) {
    context.lastTarget = entities[0];
  }

  // Detect and track topic
  const detectedTopic = detectTopic(userText);
  if (detectedTopic) {
    if (context.topic !== detectedTopic) {
      if (context.topic) {
        context.topicHistory.push(context.topic);
        if (context.topicHistory.length > 10) context.topicHistory.shift();
      }
      context.topic = detectedTopic;
    }
  }

  // Add assistant turn
  addTurn('assistant', response.text, response.action);

  logger.agent('conversation', {
    userText,
    resolved: resolved !== userText ? resolved : undefined,
    action: response.action,
    topic: context.topic,
    sentiment: context.sentimentTrend,
    entities: entities.length > 0 ? entities : undefined,
  });

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
    topicHistory: [],
    lastIntent: null,
    lastTarget: null,
    mentionedEntities: [],
    userPreferences: {},
    turnCount: 0,
    contextWindow: [],
    sentimentTrend: 'neutral',
    activeEntities: new Map(),
  };
}

export function getConversationSummary(): string {
  if (turns.length === 0) return 'No conversation yet.';

  const userTurns = turns.filter(t => t.role === 'user');
  const topics = [...new Set(userTurns.map(t => t.intent).filter(Boolean))];
  const recentTopics = context.topicHistory.slice(-3);

  let summary = `${turns.length} turns.`;
  if (context.topic) summary += ` Current topic: ${context.topic}.`;
  if (recentTopics.length > 0) summary += ` Recent topics: ${recentTopics.join(', ')}.`;
  if (topics.length > 0) summary += ` Intent topics: ${topics.join(', ')}.`;
  summary += ` Sentiment trend: ${context.sentimentTrend}.`;

  return summary;
}

export function setPreference(key: string, value: string): void {
  context.userPreferences[key] = value;
}

export function getPreference(key: string): string | undefined {
  return context.userPreferences[key];
}

export function getPreferences(): Record<string, string> {
  return { ...context.userPreferences };
}

export function getTopicHistory(): string[] {
  return [...context.topicHistory];
}

export function getSentimentTrend(): 'positive' | 'negative' | 'neutral' {
  return context.sentimentTrend;
}

export function getContextWindow(): ConversationTurn[] {
  return [...context.contextWindow];
}

export function getActiveEntities(): Map<string, string> {
  return new Map(context.activeEntities);
}
