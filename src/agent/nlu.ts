// VoiceNav NLU Engine — Natural Language Understanding with confidence scoring
// Multi-layer intent classification, entity extraction, context resolution

import { logger } from '../utils/logger';

export type Intent =
  | 'navigate' | 'search' | 'click' | 'read' | 'scroll' | 'back' | 'forward'
  | 'refresh' | 'stop' | 'help' | 'home' | 'cart' | 'bookmark' | 'form'
  | 'type' | 'select' | 'submit' | 'play' | 'pause' | 'next' | 'previous'
  | 'zoom' | 'share' | 'download' | 'copy' | 'find' | 'filter' | 'sort'
  | 'compare' | 'buy' | 'checkout' | 'login' | 'logout' | 'signup'
  | 'compose' | 'send' | 'delete' | 'open' | 'close' | 'maximize' | 'minimize'
  | 'tab_new' | 'tab_close' | 'tab_next' | 'tab_prev' | 'unknown';

export type Entity = {
  type: 'url' | 'search_query' | 'number' | 'element_text' | 'direction' | 'site_name' | 'form_field' | 'product' | 'date' | 'time' | 'email' | 'phone' | 'color' | 'size';
  value: string;
  raw: string;
  confidence: number;
};

export type NLUResult = {
  intent: Intent;
  confidence: number;
  target?: string;
  entities: Entity[];
  params: Record<string, string>;
  isAmbiguous: boolean;
  alternatives: Array<{ intent: Intent; confidence: number; target?: string }>;
  normalizedText: string;
  originalText: string;
};

// --- Levenshtein Distance for fuzzy matching ---
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

function fuzzyMatch(target: string, candidate: string, threshold = 0.3): number {
  const a = target.toLowerCase().trim();
  const b = candidate.toLowerCase().trim();
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 0.9;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  const similarity = 1 - dist / maxLen;
  return similarity >= threshold ? similarity : 0;
}

// --- Text Normalization ---
const FILLER_WORDS = new Set(['um', 'uh', 'like', 'you know', 'so', 'well', 'actually', 'basically', 'just', 'right', 'okay', 'ok', 'hey']);
const ABBREVIATIONS: Record<string, string> = {
  'pls': 'please', 'plz': 'please', 'thx': 'thanks', 'ty': 'thanks',
  'np': 'no problem', 'imo': 'in my opinion', 'tbh': 'to be honest',
  'rn': 'right now', 'asap': 'as soon as possible', 'btw': 'by the way',
  'idk': 'i do not know', 'nvm': 'never mind', 'smh': 'shaking my head',
  'afk': 'away from keyboard', 'brb': 'be right back', 'gtg': 'got to go',
  'fyi': 'for your information', 'irl': 'in real life', 'dm': 'direct message',
  'fb': 'facebook', 'ig': 'instagram', 'yt': 'youtube', 'tw': 'twitter',
  'gh': 'github', 'gcal': 'google calendar', 'gmaps': 'google maps',
};

function normalizeText(text: string): string {
  let normalized = text.toLowerCase().trim();
  // Remove filler words
  const words = normalized.split(/\s+/);
  const filtered = words.filter(w => !FILLER_WORDS.has(w));
  normalized = filtered.join(' ');
  // Expand abbreviations
  for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
    normalized = normalized.replace(new RegExp(`\\b${abbr}\\b`, 'gi'), full);
  }
  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
}

// --- Intent Patterns with Confidence ---
type IntentPattern = {
  patterns: RegExp[];
  intent: Intent;
  baseConfidence: number;
  extractTarget?: (match: RegExpMatchArray) => string | undefined;
};

const INTENT_PATTERNS: IntentPattern[] = [
  // Navigation
  { patterns: [/(?:go to|open|visit|navigate to|take me to|bring me to|load|launch)\s+(.+)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:go to|open)\s+(.+\.(?:com|org|net|io|dev|app|edu|gov|co\.uk|co\.in))/i], intent: 'navigate', baseConfidence: 0.98, extractTarget: m => m[1]?.trim() },

  // Search
  { patterns: [/(?:search for|search|find|look up|look for|google|bing|yahoo)\s+(.+)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:what is|what's|who is|who's|where is|where's|when is|when's|how to|how do i)\s+(.+)/i], intent: 'search', baseConfidence: 0.85, extractTarget: m => m[1]?.trim() },

  // Click / Tap
  { patterns: [/(?:click|tap|press|select|hit|choose)\s+(?:on\s+)?(?:the\s+)?(.+)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:click|tap|press)\s+(?:the\s+)?(\d+)(?:st|nd|rd|th)?\s+(.+)/i], intent: 'click', baseConfidence: 0.94, extractTarget: m => m[2]?.trim() },
  { patterns: [/(?:click|tap)\s+(?:on\s+)?(?:that|it|this|them)/i], intent: 'click', baseConfidence: 0.80 },

  // Read / Describe
  { patterns: [/(?:read|speak|tell me|what'?s on|what is on|describe|show me|what'?s here|summarize|summarise)\s*(?:the\s*)?(?:page|screen|content|this|article|text)?\s*(.*)/i], intent: 'read', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },

  // Scroll
  { patterns: [/(?:scroll|go)\s*(down|up|top|bottom|left|right)/i], intent: 'scroll', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:page\s*(down|up))/i], intent: 'scroll', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:scroll)\s+(?:to\s+)?(?:the\s+)?(?:end|bottom|top|beginning)/i], intent: 'scroll', baseConfidence: 0.93 },

  // Shopping / Cart
  { patterns: [/(?:add|put)\s+(?:the\s+)?(.+?)\s+(?:to|in|into)\s+(?:my\s+)?(?:cart|basket|bag)/i], intent: 'cart', baseConfidence: 0.94, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:add to cart|add to basket|put in cart|buy now|add to bag|add to trolley)/i], intent: 'cart', baseConfidence: 0.96 },
  { patterns: [/(?:buy|purchase|order|get)\s+(.+)/i], intent: 'buy', baseConfidence: 0.88, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:checkout|check out|proceed to checkout|place order)/i], intent: 'checkout', baseConfidence: 0.95 },
  { patterns: [/(?:compare|compare prices|price compare)\s*(.*)/i], intent: 'compare', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:sort|sort by|order by)\s+(.+)/i], intent: 'sort', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:filter|refine|narrow)\s*(?:by|results)?\s*(.*)/i], intent: 'filter', baseConfidence: 0.88, extractTarget: m => m[1]?.trim() },

  // Bookmark
  { patterns: [/(?:bookmark|save)\s+(?:this\s+)?(?:page|site|website|url|it)/i], intent: 'bookmark', baseConfidence: 0.95 },
  { patterns: [/(?:add\s+(?:to\s+)?bookmarks?|remove\s+(?:the\s+)?bookmark|unbookmark)/i], intent: 'bookmark', baseConfidence: 0.93 },

  // Form
  { patterns: [/(?:fill|type|enter|input)\s+(.+?)\s+(?:in|into|on)\s+(?:the\s+)?(.+)/i], intent: 'form', baseConfidence: 0.91, extractTarget: m => m[2]?.trim() },
  { patterns: [/(?:submit|send)\s+(?:the\s+)?(?:form|search|query|application)/i], intent: 'submit', baseConfidence: 0.94 },
  { patterns: [/(?:sign|log)\s*(?:in|out|up)/i], intent: 'login', baseConfidence: 0.92 },
  { patterns: [/(?:register|create\s+(?:an?\s+)?account|sign\s*up)/i], intent: 'signup', baseConfidence: 0.90 },

  // Navigation commands
  { patterns: [/^(?:go\s*back|back|previous\s*page)$/i], intent: 'back', baseConfidence: 0.97 },
  { patterns: [/^(?:go\s*forward|forward|next\s*page|go\s*next)$/i], intent: 'forward', baseConfidence: 0.97 },
  { patterns: [/^(?:refresh|reload|refresh\s*page)$/i], intent: 'refresh', baseConfidence: 0.97 },
  { patterns: [/^(?:stop|cancel|halt|never\s*mind|forget\s*it|abort)$/i], intent: 'stop', baseConfidence: 0.95 },
  { patterns: [/^(?:help|what can you do|commands|what can i say|what do you do)$/i], intent: 'help', baseConfidence: 0.97 },
  { patterns: [/^(?:close|exit|quit)$/i], intent: 'close', baseConfidence: 0.90 },
  { patterns: [/^(?:go\s*home|home|main\s*page|start)$/i], intent: 'home', baseConfidence: 0.95 },

  // Media
  { patterns: [/(?:play|start|resume)\s*(?:the\s+)?(?:video|music|audio|song|track|podcast)?\s*(.*)/i], intent: 'play', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:pause|stop|halt)\s*(?:the\s+)?(?:video|music|audio|playback)?/i], intent: 'pause', baseConfidence: 0.92 },
  { patterns: [/(?:next|skip)\s*(?:song|track|video|episode|page|result)?/i], intent: 'next', baseConfidence: 0.88 },
  { patterns: [/(?:previous|last)\s*(?:song|track|video|episode|page|result)?/i], intent: 'previous', baseConfidence: 0.88 },

  // Tab management
  { patterns: [/(?:new\s+tab|open\s+(?:a\s+)?new\s+tab|open\s+tab)/i], intent: 'tab_new', baseConfidence: 0.90 },
  { patterns: [/(?:close\s+tab|close\s+(?:the\s+)?tab)/i], intent: 'tab_close', baseConfidence: 0.90 },

  // Copy / Share / Download
  { patterns: [/(?:copy|copy\s+(?:this|the|that))\s*(.*)/i], intent: 'copy', baseConfidence: 0.85, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:share|send)\s+(?:this|the|that)\s*(?:page|link|url)?/i], intent: 'share', baseConfidence: 0.88 },
  { patterns: [/(?:download|save)\s+(?:this|the|that)?\s*(.*)/i], intent: 'download', baseConfidence: 0.87, extractTarget: m => m[1]?.trim() },

  // Zoom
  { patterns: [/(?:zoom)\s*(in|out|reset)/i], intent: 'zoom', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },

  // Find on page
  { patterns: [/(?:find|search)\s+(?:on\s+)?(?:this\s+)?(?:page|site)\s+(?:for\s+)?(.+)/i], intent: 'find', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },

  // Compose / Send
  { patterns: [/(?:compose|write|draft)\s+(?:a\s+)?(?:new\s+)?(?:email|message|mail)/i], intent: 'compose', baseConfidence: 0.88 },
  { patterns: [/(?:send|dispatch|fire\s+off)\s+(?:the\s+)?(?:email|message|mail)/i], intent: 'send', baseConfidence: 0.90 },

  // Delete
  { patterns: [/(?:delete|remove|erase)\s+(?:this|the|that)?\s*(.*)/i], intent: 'delete', baseConfidence: 0.85, extractTarget: m => m[1]?.trim() },
];

// --- Site Alias Map ---
const SITE_MAP: Record<string, string> = {
  'google': 'https://www.google.com', 'gmail': 'https://mail.google.com',
  'amazon': 'https://www.amazon.com', 'youtube': 'https://www.youtube.com',
  'facebook': 'https://www.facebook.com', 'twitter': 'https://www.twitter.com',
  'x': 'https://www.x.com', 'wikipedia': 'https://www.wikipedia.org',
  'wiki': 'https://www.wikipedia.org', 'reddit': 'https://www.reddit.com',
  'ebay': 'https://www.ebay.com', 'walmart': 'https://www.walmart.com',
  'target': 'https://www.target.com', 'best buy': 'https://www.bestbuy.com',
  'bestbuy': 'https://www.bestbuy.com', 'netflix': 'https://www.netflix.com',
  'github': 'https://www.github.com', 'linkedin': 'https://www.linkedin.com',
  'instagram': 'https://www.instagram.com', 'tiktok': 'https://www.tiktok.com',
  'spotify': 'https://www.spotify.com', 'news': 'https://news.google.com',
  'maps': 'https://maps.google.com', 'weather': 'https://weather.com',
  'cnn': 'https://www.cnn.com', 'bbc': 'https://www.bbc.com',
  'espn': 'https://www.espn.com', 'apple': 'https://www.apple.com',
  'microsoft': 'https://www.microsoft.com', 'chatgpt': 'https://chat.openai.com',
  'openai': 'https://www.openai.com', 'pinterest': 'https://www.pinterest.com',
  'twitch': 'https://www.twitch.tv', 'discord': 'https://discord.com',
  'slack': 'https://slack.com', 'zoom': 'https://zoom.us',
  'paypal': 'https://www.paypal.com', 'venmo': 'https://venmo.com',
  'uber': 'https://www.uber.com', 'lyft': 'https://www.lyft.com',
  'doordash': 'https://www.doordash.com', 'instacart': 'https://www.instacart.com',
  'airbnb': 'https://www.airbnb.com', 'booking': 'https://www.booking.com',
  'expedia': 'https://www.expedia.com', 'whatsapp': 'https://web.whatsapp.com',
  'telegram': 'https://web.telegram.org', 'signal': 'https://signal.org',
  'dropbox': 'https://www.dropbox.com', 'drive': 'https://drive.google.com',
  'calendar': 'https://calendar.google.com', 'docs': 'https://docs.google.com',
  'sheets': 'https://sheets.google.com', 'slides': 'https://slides.google.com',
  'notion': 'https://www.notion.so', 'figma': 'https://www.figma.com',
  'stackoverflow': 'https://stackoverflow.com', 'stack overflow': 'https://stackoverflow.com',
  'npm': 'https://www.npmjs.com', 'crates': 'https://crates.io',
  'docker': 'https://hub.docker.com', 'aws': 'https://aws.amazon.com',
  'azure': 'https://portal.azure.com', 'gcp': 'https://console.cloud.google.com',
};

// --- Entity Extraction ---
function extractEntities(text: string): Entity[] {
  const entities: Entity[] = [];
  const normalized = text.toLowerCase();

  // URLs
  const urlRegex = /https?:\/\/[^\s]+/gi;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    entities.push({ type: 'url', value: match[0], raw: match[0], confidence: 0.99 });
  }

  // Numbers
  const numRegex = /\b(\d+(?:\.\d+)?)\b/g;
  while ((match = numRegex.exec(text)) !== null) {
    entities.push({ type: 'number', value: match[1], raw: match[0], confidence: 0.95 });
  }

  // Emails
  const emailRegex = /[\w.-]+@[\w.-]+\.\w{2,}/g;
  while ((match = emailRegex.exec(text)) !== null) {
    entities.push({ type: 'email', value: match[0], raw: match[0], confidence: 0.98 });
  }

  // Phone numbers
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    entities.push({ type: 'phone', value: match[0], raw: match[0], confidence: 0.85 });
  }

  // Dates
  const dateRegex = /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,?\s+\d{4})?|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|(?:today|tomorrow|yesterday|next\s+\w+day|this\s+\w+day)/gi;
  while ((match = dateRegex.exec(text)) !== null) {
    entities.push({ type: 'date', value: match[0], raw: match[0], confidence: 0.88 });
  }

  // Directions
  const dirRegex = /\b(up|down|top|bottom|left|right|forward|back)\b/gi;
  while ((match = dirRegex.exec(text)) !== null) {
    entities.push({ type: 'direction', value: match[1].toLowerCase(), raw: match[0], confidence: 0.95 });
  }

  // Site names from alias map
  for (const siteName of Object.keys(SITE_MAP)) {
    const siteRegex = new RegExp(`\\b${siteName.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    while ((match = siteRegex.exec(text)) !== null) {
      entities.push({ type: 'site_name', value: SITE_MAP[siteName], raw: match[0], confidence: 0.92 });
    }
  }

  // Form fields
  const fieldRegex = /\b(?:name|email|password|username|phone|address|city|state|zip|country|card|cvv|expiry|message|subject|comment|search|query|keyword)\b/gi;
  while ((match = fieldRegex.exec(text)) !== null) {
    entities.push({ type: 'form_field', value: match[1]?.toLowerCase() || match[0].toLowerCase(), raw: match[0], confidence: 0.80 });
  }

  return entities;
}

// --- Site Alias Resolution ---
export function resolveSiteAlias(target: string): string {
  const normalized = target.toLowerCase().replace(/https?:\/\/(www\.)?/, '').replace(/\.(com|org|net|io|dev|edu|gov|co\.uk|co\.in)$/, '').trim();
  return SITE_MAP[normalized] || target;
}

// --- Main NLU Pipeline ---
export function understand(text: string, context?: { lastCommand?: string; lastTarget?: string; pageType?: string }): NLUResult {
  const originalText = text;
  const normalizedText = normalizeText(text);

  // Extract entities
  const entities = extractEntities(normalizedText);

  // Score all intents
  const candidates: Array<{ intent: Intent; confidence: number; target?: string }> = [];

  for (const { patterns, intent, baseConfidence, extractTarget } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const target = extractTarget?.(match);
        candidates.push({ intent, confidence: baseConfidence, target });
        break; // Take first match per intent group
      }
    }
  }

  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);

  // Context resolution — "click it", "that one", "go back there"
  if (context?.lastTarget) {
    const pronounPatterns = [
      /\b(it|that|this|them|those|these|that one|this one)\b/i,
      /\b(click|tap|press|select)\s+(it|that|this|them)\b/i,
    ];
    for (const p of pronounPatterns) {
      if (p.test(normalizedText)) {
        // Boost click intent with context target
        const clickCandidate = candidates.find(c => c.intent === 'click');
        if (clickCandidate) {
          clickCandidate.target = context.lastTarget;
          clickCandidate.confidence = 0.85;
        } else {
          candidates.push({ intent: 'click', confidence: 0.85, target: context.lastTarget });
        }
        break;
      }
    }
  }

  // If no intent matched, try fuzzy site matching or default to search
  if (candidates.length === 0) {
    // Check if it's a site name (fuzzy)
    for (const [siteName, url] of Object.entries(SITE_MAP)) {
      const score = fuzzyMatch(normalizedText, siteName, 0.6);
      if (score > 0.6) {
        candidates.push({ intent: 'navigate', confidence: score * 0.9, target: url });
      }
    }

    if (candidates.length === 0) {
      // Default to search
      candidates.push({ intent: 'search', confidence: 0.5, target: normalizedText });
    }
  }

  // Sort again after context resolution
  candidates.sort((a, b) => b.confidence - a.confidence);

  const best = candidates[0];
  const isAmbiguous = candidates.length > 1 && candidates[1].confidence > best.confidence - 0.15;

  // Resolve target
  let target = best.target;
  if (best.intent === 'navigate' && target && !target.startsWith('http')) {
    target = resolveSiteAlias(target);
    if (!target.startsWith('http')) target = 'https://' + target;
  }

  // Build params
  const params: Record<string, string> = {};
  const numberEntities = entities.filter(e => e.type === 'number');
  if (numberEntities.length > 0) params.index = numberEntities[0].value;
  const directionEntities = entities.filter(e => e.type === 'direction');
  if (directionEntities.length > 0) params.direction = directionEntities[0].value;

  return {
    intent: best.intent,
    confidence: best.confidence,
    target,
    entities,
    params,
    isAmbiguous,
    alternatives: candidates.slice(1, 4),
    normalizedText,
    originalText,
  };
}

// --- Command Validation ---
export function isValidCommand(text: string): boolean {
  const normalized = normalizeText(text);
  return normalized.length > 0 && normalized.length < 500;
}

// --- Intent Display Names ---
export const INTENT_LABELS: Record<Intent, string> = {
  navigate: 'Navigate', search: 'Search', click: 'Click', read: 'Read',
  scroll: 'Scroll', back: 'Go Back', forward: 'Go Forward', refresh: 'Refresh',
  stop: 'Stop', help: 'Help', home: 'Home', cart: 'Add to Cart',
  bookmark: 'Bookmark', form: 'Fill Form', type: 'Type', select: 'Select',
  submit: 'Submit', play: 'Play', pause: 'Pause', next: 'Next',
  previous: 'Previous', zoom: 'Zoom', share: 'Share', download: 'Download',
  copy: 'Copy', find: 'Find on Page', filter: 'Filter', sort: 'Sort',
  compare: 'Compare', buy: 'Buy', checkout: 'Checkout', login: 'Log In',
  logout: 'Log Out', signup: 'Sign Up', compose: 'Compose', send: 'Send',
  delete: 'Delete', open: 'Open', close: 'Close', maximize: 'Maximize',
  minimize: 'Minimize', tab_new: 'New Tab', tab_close: 'Close Tab',
  tab_next: 'Next Tab', tab_prev: 'Previous Tab', unknown: 'Unknown',
};
