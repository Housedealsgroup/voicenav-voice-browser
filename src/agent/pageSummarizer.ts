// VoiceNav Page Summarizer — v10
// On-device page summarization using text extraction and scoring
// No external API — pure algorithmic summarization

import { logger } from '../utils/logger';

export type SummaryResult = {
  title: string;
  summary: string;
  keyPoints: string[];
  readingTime: number; // minutes
  wordCount: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  bulletPoints: string[];
  readingLevel: ReadingLevel;
  relatedTopics: string[];
  actionItems: string[];
};

export type ReadingLevel = {
  level: 'elementary' | 'intermediate' | 'advanced' | 'expert';
  grade: number; // approximate US grade level
  description: string;
  avgSentenceLength: number;
  avgWordLength: number;
};

type Sentence = {
  text: string;
  score: number;
  index: number;
  position: number; // 0=start, 1=middle, 2=end
  isAction?: boolean;
  isBulletWorthy?: boolean;
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  shopping: ['price', 'buy', 'cart', 'add to', 'shop', 'deal', 'discount', 'sale', 'order', 'product'],
  news: ['report', 'according', 'said', 'announced', 'breaking', 'today', 'yesterday', 'official'],
  tutorial: ['step', 'how to', 'guide', 'learn', 'tutorial', 'first', 'next', 'finally', 'tip'],
  technical: ['code', 'api', 'function', 'server', 'database', 'error', 'debug', 'install', 'config'],
  social: ['post', 'comment', 'share', 'like', 'follow', 'profile', 'friend', 'message', 'reply'],
  documentation: ['section', 'chapter', 'reference', 'parameter', 'return', 'example', 'note', 'see also'],
  review: ['rating', 'stars', 'pros', 'cons', 'verdict', 'recommend', 'tested', 'experience', 'opinion'],
  academic: ['research', 'study', 'findings', 'hypothesis', 'conclusion', 'methodology', 'abstract', 'citations'],
  recipe: ['ingredients', 'instructions', 'preheat', 'cook', 'bake', 'serve', 'minutes', 'temperature', 'cup'],
  health: ['symptoms', 'treatment', 'diagnosis', 'medication', 'doctor', 'patient', 'health', 'medical'],
  finance: ['investment', 'stock', 'market', 'portfolio', 'dividend', 'return', 'interest', 'bank', 'loan'],
};

const POSITIVE_WORDS = ['good', 'great', 'excellent', 'amazing', 'best', 'love', 'perfect', 'awesome', 'fantastic', 'wonderful', 'success', 'win', 'improve', 'growth', 'innovative'];
const NEGATIVE_WORDS = ['bad', 'worst', 'terrible', 'awful', 'fail', 'error', 'problem', 'issue', 'bug', 'broken', 'crash', 'loss', 'decline', 'poor', 'disappointing'];

// Action item detection patterns
const ACTION_PATTERNS = [
  /\b(?:you should|you need to|you must|you have to|make sure|remember to|don't forget)\b/gi,
  /\b(?:step \d+|first|second|third|next|then|finally|lastly)\s*[:.]?\s*/gi,
  /\b(?:todo|to-do|action item|task|assign|deadline|due)\b/gi,
  /\b(?:submit|complete|finish|send|call|email|schedule|register|sign up|download|install|update)\b/gi,
];

// Topic extraction keywords
const TOPIC_CATEGORIES: Record<string, string[]> = {
  technology: ['software', 'hardware', 'app', 'device', 'computer', 'digital', 'online', 'internet', 'web', 'mobile', 'cloud', 'ai', 'data', 'programming'],
  business: ['company', 'market', 'revenue', 'profit', 'startup', 'enterprise', 'customer', 'sales', 'marketing', 'strategy'],
  science: ['research', 'study', 'experiment', 'theory', 'analysis', 'scientific', 'discovery', 'laboratory'],
  health: ['health', 'medical', 'disease', 'treatment', 'wellness', 'fitness', 'nutrition', 'mental', 'therapy'],
  politics: ['government', 'election', 'policy', 'law', 'congress', 'senate', 'vote', 'political', 'democrat', 'republican'],
  entertainment: ['movie', 'film', 'music', 'game', 'show', 'celebrity', 'actor', 'singer', 'album', 'release'],
  sports: ['team', 'player', 'game', 'score', 'championship', 'league', 'tournament', 'coach', 'season'],
  education: ['school', 'student', 'teacher', 'university', 'course', 'learn', 'study', 'degree', 'academic'],
  travel: ['travel', 'hotel', 'flight', 'destination', 'vacation', 'tourism', 'airport', 'booking', 'trip'],
  food: ['recipe', 'food', 'restaurant', 'cook', 'meal', 'ingredient', 'dish', 'chef', 'menu', 'cuisine'],
};

function extractSentences(text: string): string[] {
  // Split by sentence boundaries
  const raw = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && s.length < 300);

  // Deduplicate
  const seen = new Set<string>();
  return raw.filter(s => {
    const key = s.toLowerCase().substring(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreSentence(sentence: string, index: number, total: number): Sentence {
  let score = 0;
  const lower = sentence.toLowerCase();
  const words = lower.split(/\s+/);

  // Position scoring (first and last sentences are important)
  const position = index / Math.max(1, total - 1);
  if (position < 0.15) score += 3; // Opening sentences
  if (position > 0.85) score += 2; // Closing sentences

  // Length scoring (prefer medium-length sentences)
  if (words.length >= 8 && words.length <= 25) score += 2;
  if (words.length >= 5 && words.length <= 35) score += 1;

  // Keyword scoring
  const importantWords = ['important', 'key', 'main', 'result', 'conclusion', 'summary', 'findings', 'therefore', 'however', 'significant', 'notable'];
  for (const word of importantWords) {
    if (lower.includes(word)) score += 2;
  }

  // Number/data scoring (sentences with numbers often contain key info)
  if (/\d+/.test(sentence)) score += 1;

  // Quote scoring (quoted text is often important)
  if (/["']/.test(sentence)) score += 1;

  // Capitalized word scoring (proper nouns, emphasis)
  const caps = (sentence.match(/[A-Z][a-z]+/g) || []).length;
  score += Math.min(2, caps * 0.5);

  // Negation reduces score slightly
  if (lower.startsWith('but') || lower.startsWith('however') || lower.startsWith('although')) score += 1; // Contrast is important

  // Action item detection
  const isAction = ACTION_PATTERNS.some(p => {
    p.lastIndex = 0;
    return p.test(sentence);
  });
  if (isAction) score += 2;

  // Bullet point worthiness (sentences that list things, have colons, or contain multiple items)
  const isBulletWorthy = /[:;]|,\s+\w+|and\s+\w+/.test(sentence) && words.length >= 6;

  const positionValue = position < 0.15 ? 0 : position > 0.85 ? 2 : 1;

  return {
    text: sentence,
    score,
    index,
    position: positionValue,
    isAction,
    isBulletWorthy,
  };
}

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  let bestCategory = 'general';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestScore >= 2 ? bestCategory : 'general';
}

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  let positive = 0;
  let negative = 0;

  for (const word of POSITIVE_WORDS) {
    if (lower.includes(word)) positive++;
  }
  for (const word of NEGATIVE_WORDS) {
    if (lower.includes(word)) negative++;
  }

  if (positive > negative + 1) return 'positive';
  if (negative > positive + 1) return 'negative';
  return 'neutral';
}

// Reading level detection using simplified metrics
function detectReadingLevel(text: string, sentences: string[]): ReadingLevel {
  const words = text.split(/\s+/);
  const totalWords = words.length;
  const totalSentences = Math.max(1, sentences.length);

  // Average sentence length
  const avgSentenceLength = Math.round(totalWords / totalSentences);

  // Average word length (syllable proxy)
  const avgWordLength = Math.round(
    words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z]/g, '').length, 0) / Math.max(1, totalWords) * 10
  ) / 10;

  // Complex word ratio (words with 3+ syllables, approximated by 8+ chars)
  const complexWords = words.filter(w => w.replace(/[^a-zA-Z]/g, '').length >= 8).length;
  const complexRatio = complexWords / Math.max(1, totalWords);

  // Simplified Flesch-Kincaid grade level approximation
  const grade = Math.round(0.39 * avgSentenceLength + 11.8 * complexRatio - 15.59);
  const clampedGrade = Math.max(1, Math.min(18, grade));

  let level: ReadingLevel['level'];
  let description: string;

  if (clampedGrade <= 6) {
    level = 'elementary';
    description = 'Easy to read. Suitable for general audiences.';
  } else if (clampedGrade <= 9) {
    level = 'intermediate';
    description = 'Moderate reading level. Standard for most content.';
  } else if (clampedGrade <= 13) {
    level = 'advanced';
    description = 'College-level reading. May require background knowledge.';
  } else {
    level = 'expert';
    description = 'Expert-level content. Technical or academic language.';
  }

  return {
    level,
    grade: clampedGrade,
    description,
    avgSentenceLength,
    avgWordLength,
  };
}

// Extract bullet-pointable content
function extractBulletPoints(scored: Sentence[], summaryTexts: Set<string>): string[] {
  // Prefer sentences that are bullet-worthy and not already in summary
  const candidates = scored
    .filter(s => !summaryTexts.has(s.text))
    .filter(s => s.isBulletWorthy || s.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .sort((a, b) => a.index - b.index)
    .map(s => {
      // Clean up for bullet format — remove leading conjunctions, trim
      let bullet = s.text;
      bullet = bullet.replace(/^(?:and|but|or|so|yet|also|additionally|furthermore|moreover)\s*,?\s*/i, '');
      bullet = bullet.charAt(0).toUpperCase() + bullet.slice(1);
      return bullet;
    });

  return candidates;
}

// Extract related topics from text
function extractRelatedTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const topics: Array<{ topic: string; score: number }> = [];

  for (const [topic, keywords] of Object.entries(TOPIC_CATEGORIES)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) score++;
    }
    if (score >= 2) {
      topics.push({ topic, score });
    }
  }

  topics.sort((a, b) => b.score - a.score);
  return topics.slice(0, 5).map(t => t.topic);
}

// Extract action items from sentences
function extractActionItems(scored: Sentence[]): string[] {
  const actionItems: string[] = [];

  // Find sentences that contain action patterns
  for (const sentence of scored) {
    if (sentence.isAction) {
      let item = sentence.text;
      // Clean up for action item format
      item = item.replace(/^(?:step\s*\d+\s*[:.]?\s*|first\s*,?\s*|second\s*,?\s*|third\s*,?\s*|next\s*,?\s*|then\s*,?\s*|finally\s*,?\s*)/i, '');
      item = item.charAt(0).toUpperCase() + item.slice(1);
      if (item.length > 10 && item.length < 200) {
        actionItems.push(item);
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return actionItems.filter(item => {
    const key = item.toLowerCase().substring(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}

export function summarizePage(text: string, title?: string): SummaryResult {
  if (!text || text.trim().length < 50) {
    return {
      title: title || 'Empty Page',
      summary: 'This page has insufficient content to summarize.',
      keyPoints: [],
      readingTime: 0,
      wordCount: text?.split(/\s+/).length || 0,
      sentiment: 'neutral',
      category: 'general',
      bulletPoints: [],
      readingLevel: { level: 'elementary', grade: 1, description: 'Insufficient content.', avgSentenceLength: 0, avgWordLength: 0 },
      relatedTopics: [],
      actionItems: [],
    };
  }

  const sentences = extractSentences(text);
  const wordCount = text.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const readingLevel = detectReadingLevel(text, sentences);

  if (sentences.length === 0) {
    return {
      title: title || 'Page',
      summary: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
      keyPoints: [],
      readingTime,
      wordCount,
      sentiment: analyzeSentiment(text),
      category: detectCategory(text),
      bulletPoints: [],
      readingLevel,
      relatedTopics: extractRelatedTopics(text),
      actionItems: [],
    };
  }

  // Score all sentences
  const scored: Sentence[] = sentences.map((s, i) => scoreSentence(s, i, sentences.length));

  // Sort by score
  const sortedByScore = [...scored].sort((a, b) => b.score - a.score);

  // Select top sentences for summary (max 3, or 10% of total)
  const summaryCount = Math.min(3, Math.max(1, Math.ceil(sentences.length * 0.1)));
  const topSentences = sortedByScore.slice(0, summaryCount);

  // Re-order by original position
  topSentences.sort((a, b) => a.index - b.index);

  const summary = topSentences.map(s => s.text).join(' ');

  // Extract key points (top 5 scored sentences that aren't in summary)
  const summaryTexts = new Set(topSentences.map(s => s.text));
  const keyPoints = sortedByScore
    .filter(s => !summaryTexts.has(s.text))
    .slice(0, 5)
    .sort((a, b) => a.index - b.index)
    .map(s => s.text);

  // Extract bullet points
  const bulletPoints = extractBulletPoints(scored, summaryTexts);

  // Extract action items
  const actionItems = extractActionItems(scored);

  // Extract related topics
  const relatedTopics = extractRelatedTopics(text);

  const category = detectCategory(text);
  const sentiment = analyzeSentiment(text);

  logger.agent('pageSummarizer', {
    wordCount,
    sentenceCount: sentences.length,
    summaryLength: summary.length,
    category,
    sentiment,
    readingLevel: readingLevel.level,
    bulletPoints: bulletPoints.length,
    actionItems: actionItems.length,
    relatedTopics: relatedTopics.length,
  });

  return {
    title: title || 'Page Summary',
    summary,
    keyPoints,
    readingTime,
    wordCount,
    sentiment,
    category,
    bulletPoints,
    readingLevel,
    relatedTopics,
    actionItems,
  };
}

export function speakSummary(result: SummaryResult): string {
  const parts: string[] = [];

  parts.push(`Page summary: ${result.title}.`);
  parts.push(result.summary);

  if (result.bulletPoints.length > 0) {
    parts.push(`Key details: ${result.bulletPoints.slice(0, 3).join('. ')}.`);
  }

  if (result.keyPoints.length > 0) {
    parts.push(`Additional points: ${result.keyPoints.slice(0, 3).join('. ')}.`);
  }

  if (result.actionItems.length > 0) {
    parts.push(`Action items: ${result.actionItems.slice(0, 3).join('. ')}.`);
  }

  parts.push(`This is a ${result.category} page. Reading time: about ${result.readingTime} minutes. ${result.wordCount} words total.`);

  parts.push(`Reading level: ${result.readingLevel.level}, approximately grade ${result.readingLevel.grade}. ${result.readingLevel.description}`);

  if (result.relatedTopics.length > 0) {
    parts.push(`Related topics: ${result.relatedTopics.join(', ')}.`);
  }

  return parts.join(' ');
}

export function getQuickSummary(text: string): string {
  if (!text || text.trim().length < 30) return 'Page has minimal content.';

  const sentences = extractSentences(text);
  if (sentences.length === 0) return text.substring(0, 150) + '...';

  // Just return the first meaningful sentence
  return sentences[0];
}

// Speak just the bullet points
export function speakBulletPoints(result: SummaryResult): string {
  if (result.bulletPoints.length === 0) {
    return 'No bullet points extracted from this page.';
  }

  const parts = result.bulletPoints.map((bp, i) => `Point ${i + 1}: ${bp}`);
  return parts.join(' ');
}

// Speak action items
export function speakActionItems(result: SummaryResult): string {
  if (result.actionItems.length === 0) {
    return 'No action items found on this page.';
  }

  const parts = result.actionItems.map((ai, i) => `Action ${i + 1}: ${ai}`);
  return parts.join(' ');
}

// Speak reading level
export function speakReadingLevel(result: SummaryResult): string {
  return `This content is at a ${result.readingLevel.level} reading level, approximately grade ${result.readingLevel.grade}. ${result.readingLevel.description} Average sentence length: ${result.readingLevel.avgSentenceLength} words.`;
}

// Speak related topics
export function speakRelatedTopics(result: SummaryResult): string {
  if (result.relatedTopics.length === 0) {
    return 'No related topics identified.';
  }
  return `Related topics: ${result.relatedTopics.join(', ')}.`;
}
