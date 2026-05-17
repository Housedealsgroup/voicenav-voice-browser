// VoiceNav Page Summarizer — v9
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
};

type Sentence = {
  text: string;
  score: number;
  index: number;
  position: number; // 0=start, 1=middle, 2=end
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  shopping: ['price', 'buy', 'cart', 'add to', 'shop', 'deal', 'discount', 'sale', 'order', 'product'],
  news: ['report', 'according', 'said', 'announced', 'breaking', 'today', 'yesterday', 'official'],
  tutorial: ['step', 'how to', 'guide', 'learn', 'tutorial', 'first', 'next', 'finally', 'tip'],
  technical: ['code', 'api', 'function', 'server', 'database', 'error', 'debug', 'install', 'config'],
  social: ['post', 'comment', 'share', 'like', 'follow', 'profile', 'friend', 'message', 'reply'],
  documentation: ['section', 'chapter', 'reference', 'parameter', 'return', 'example', 'note', 'see also'],
};

const POSITIVE_WORDS = ['good', 'great', 'excellent', 'amazing', 'best', 'love', 'perfect', 'awesome', 'fantastic', 'wonderful', 'success', 'win', 'improve', 'growth', 'innovative'];
const NEGATIVE_WORDS = ['bad', 'worst', 'terrible', 'awful', 'fail', 'error', 'problem', 'issue', 'bug', 'broken', 'crash', 'loss', 'decline', 'poor', 'disappointing'];

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

function scoreSentence(sentence: string, index: number, total: number): number {
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

  return score;
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
    };
  }

  const sentences = extractSentences(text);
  const wordCount = text.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  if (sentences.length === 0) {
    return {
      title: title || 'Page',
      summary: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
      keyPoints: [],
      readingTime,
      wordCount,
      sentiment: analyzeSentiment(text),
      category: detectCategory(text),
    };
  }

  // Score all sentences
  const scored: Sentence[] = sentences.map((text, i) => ({
    text,
    score: scoreSentence(text, i, sentences.length),
    index: i,
    position: i / Math.max(1, sentences.length - 1),
  }));

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Select top sentences for summary (max 3, or 10% of total)
  const summaryCount = Math.min(3, Math.max(1, Math.ceil(sentences.length * 0.1)));
  const topSentences = scored.slice(0, summaryCount);

  // Re-order by original position
  topSentences.sort((a, b) => a.index - b.index);

  const summary = topSentences.map(s => s.text).join(' ');

  // Extract key points (top 5 scored sentences that aren't in summary)
  const summaryTexts = new Set(topSentences.map(s => s.text));
  const keyPoints = scored
    .filter(s => !summaryTexts.has(s.text))
    .slice(0, 5)
    .sort((a, b) => a.index - b.index)
    .map(s => s.text);

  const category = detectCategory(text);
  const sentiment = analyzeSentiment(text);

  logger.agent('pageSummarizer', { wordCount, sentenceCount: sentences.length, summaryLength: summary.length, category, sentiment });

  return {
    title: title || 'Page Summary',
    summary,
    keyPoints,
    readingTime,
    wordCount,
    sentiment,
    category,
  };
}

export function speakSummary(result: SummaryResult): string {
  const parts: string[] = [];

  parts.push(`Page summary: ${result.title}.`);
  parts.push(result.summary);

  if (result.keyPoints.length > 0) {
    parts.push(`Key points: ${result.keyPoints.slice(0, 3).join('. ')}.`);
  }

  parts.push(`This is a ${result.category} page. Reading time: about ${result.readingTime} minutes. ${result.wordCount} words total.`);

  return parts.join(' ');
}

export function getQuickSummary(text: string): string {
  if (!text || text.trim().length < 30) return 'Page has minimal content.';

  const sentences = extractSentences(text);
  if (sentences.length === 0) return text.substring(0, 150) + '...';

  // Just return the first meaningful sentence
  return sentences[0];
}
