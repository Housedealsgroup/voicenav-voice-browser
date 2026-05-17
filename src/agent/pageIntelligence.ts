// VoiceNav Page Intelligence — enhanced page content analysis and extraction
// Extracts structured data: prices, ratings, reviews, article text, navigation, forms
// Content type detection, sentiment analysis, entity extraction, price comparison

import type { PageSnapshot, PageElement } from '../browser/types';
import { logger } from '../utils/logger';

export type ArticleContent = {
  title: string;
  author?: string;
  publishedDate?: string;
  readingTime?: string;
  wordCount: number;
  paragraphs: string[];
  summary: string;
};

export type NavigationMenu = {
  items: Array<{ text: string; href: string; isCurrent: boolean }>;
  breadcrumbs: string[];
};

export type FormAnalysis = {
  fields: Array<{
    name: string;
    type: string;
    label: string;
    placeholder: string;
    required: boolean;
    value?: string;
  }>;
  submitButton?: string;
  validationErrors: string[];
};

export type PriceInfo = {
  price: string;
  currency: string;
  originalPrice?: string;
  discount?: string;
  priceRange?: { min: string; max: string };
};

export type RatingInfo = {
  rating: string;
  maxRating: string;
  reviewCount: string;
  stars?: number;
};

export type MediaInfo = {
  videos: Array<{ title: string; duration?: string; src?: string }>;
  images: Array<{ alt: string; src?: string; isProduct: boolean }>;
  audio: Array<{ title: string; src?: string }>;
};

export type ContentType = 'product' | 'article' | 'form' | 'video' | 'social' | 'data' | 'directory' | 'landing' | 'forum' | 'documentation' | 'general';

export type SentimentResult = {
  overall: 'positive' | 'negative' | 'neutral';
  score: number; // -1.0 to 1.0
  positiveWords: string[];
  negativeWords: string[];
  confidence: number; // 0-1
};

export type ExtractedEntity = {
  text: string;
  type: 'person' | 'place' | 'organization' | 'product' | 'date' | 'money' | 'url' | 'email' | 'phone';
  confidence: number;
};

export type PriceComparison = {
  items: Array<{
    name: string;
    price: number;
    currency: string;
    store?: string;
    url?: string;
  }>;
  lowest: { name: string; price: number } | null;
  highest: { name: string; price: number } | null;
  average: number;
  savings: string; // percentage savings from highest to lowest
};

export type PageIntelligence = {
  article?: ArticleContent;
  navigation?: NavigationMenu;
  form?: FormAnalysis;
  prices: PriceInfo[];
  ratings: RatingInfo[];
  media: MediaInfo;
  links: Array<{ text: string; href: string; section: string }>;
  tables: Array<{ headers: string[]; rowCount: number; summary: string }>;
  lists: Array<{ type: 'ordered' | 'unordered'; items: string[] }>;
  contacts: Array<{ type: 'email' | 'phone' | 'address'; value: string }>;
  socialLinks: Array<{ platform: string; url: string }>;
  metadata: {
    description?: string;
    keywords?: string[];
    author?: string;
    publishDate?: string;
    siteName?: string;
    language?: string;
  };
  // New enhanced fields
  contentType: ContentType;
  sentiment: SentimentResult;
  entities: ExtractedEntity[];
  priceComparison: PriceComparison | null;
};

// Positive/negative word lists for sentiment scoring
const POSITIVE_WORDS = [
  'good', 'great', 'excellent', 'amazing', 'best', 'love', 'perfect', 'awesome',
  'fantastic', 'wonderful', 'success', 'win', 'improve', 'growth', 'innovative',
  'recommend', 'outstanding', 'superb', 'brilliant', 'impressive', 'elegant',
  'reliable', 'efficient', 'powerful', 'intuitive', 'seamless', 'delightful',
  'exceptional', 'remarkable', 'phenomenal', 'magnificent', 'splendid', 'terrific',
];

const NEGATIVE_WORDS = [
  'bad', 'worst', 'terrible', 'awful', 'fail', 'error', 'problem', 'issue',
  'bug', 'broken', 'crash', 'loss', 'decline', 'poor', 'disappointing',
  'slow', 'annoying', 'frustrating', 'confusing', 'useless', 'unreliable',
  'clunky', 'laggy', 'glitchy', 'unstable', 'defective', 'malfunction',
  'inadequate', 'subpar', 'mediocre', 'inferior', 'dreadful', 'abysmal',
];

// Entity patterns for extraction
const ENTITY_PATTERNS: Array<{ pattern: RegExp; type: ExtractedEntity['type']; confidence: number }> = [
  // Person names with titles
  { pattern: /\b(?:Mr|Mrs|Ms|Dr|Prof|Sir|Lady|Lord)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g, type: 'person', confidence: 0.85 },
  // Organizations
  { pattern: /\b[A-Z][\w\s]+(?:Inc|Corp|LLC|Ltd|Company|Foundation|Association|Institute|University|College|Bank|Group|Holdings|Partners|Solutions|Technologies|Systems)\b/g, type: 'organization', confidence: 0.8 },
  // Places (capitalized multi-word, common suffixes)
  { pattern: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:City|Town|Village|County|State|Province|Country|Island|Mountain|River|Lake|Ocean|Sea|Bay|Valley|Desert|Forest))\b/g, type: 'place', confidence: 0.7 },
  // Money amounts
  { pattern: /(?:[\$€£¥₹₽₩]\s*\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s*(?:USD|EUR|GBP|CAD|AUD|JPY|CNY|INR))/gi, type: 'money', confidence: 0.9 },
  // Dates
  { pattern: /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s*\d{2,4})\b/gi, type: 'date', confidence: 0.85 },
  // URLs
  { pattern: /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi, type: 'url', confidence: 0.95 },
  // Emails
  { pattern: /[\w.-]+@[\w.-]+\.\w{2,}/g, type: 'email', confidence: 0.95 },
  // Phone numbers
  { pattern: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, type: 'phone', confidence: 0.8 },
];

// Content type detection patterns
const CONTENT_TYPE_PATTERNS: Array<{ type: ContentType; check: (snapshot: PageSnapshot, intel: Partial<PageIntelligence>) => boolean; priority: number }> = [
  {
    type: 'product',
    check: (s, i) => ((i.prices?.length ?? 0) > 0 && (i.ratings?.length ?? 0) > 0) || /add to cart|buy now|add to bag/i.test(s.textContent),
    priority: 10,
  },
  {
    type: 'article',
    check: (s, i) => (i.article?.wordCount ?? 0) > 300 && (s.headings?.length ?? 0) >= 1,
    priority: 8,
  },
  {
    type: 'form',
    check: (_s, i) => (i.form?.fields?.length ?? 0) > 2,
    priority: 7,
  },
  {
    type: 'video',
    check: (s, i) => (i.media?.videos?.length ?? 0) > 0 || /youtube|vimeo|video player/i.test(s.textContent),
    priority: 6,
  },
  {
    type: 'social',
    check: (s) => /feed|timeline|post|tweet|share|like|comment|follow/i.test(s.textContent) && /profile|avatar|username/i.test(s.textContent),
    priority: 5,
  },
  {
    type: 'forum',
    check: (s) => /thread|reply|topic|forum|discussion|upvote|downvote/i.test(s.textContent),
    priority: 5,
  },
  {
    type: 'documentation',
    check: (s) => /api|reference|documentation|guide|tutorial|examples?|parameters?|returns?/i.test(s.textContent) && (s.headings?.length ?? 0) >= 2,
    priority: 4,
  },
  {
    type: 'landing',
    check: (s) => /get started|sign up|try free|learn more|subscribe/i.test(s.textContent) && s.textContent.length < 3000,
    priority: 3,
  },
  {
    type: 'data',
    check: (_s, i) => (i.tables?.length ?? 0) > 0,
    priority: 2,
  },
  {
    type: 'directory',
    check: (_s, i) => (i.navigation?.items?.length ?? 0) > 10,
    priority: 1,
  },
];

// Extract price information from text
function extractPrices(text: string, _elements: PageElement[]): PriceInfo[] {
  const prices: PriceInfo[] = [];
  const priceRegex = /(?:[\$€£¥₹₽₩]|USD|EUR|GBP|CAD|AUD|JPY|CNY|INR)\s*\d+(?:[.,]\d{1,2})?/gi;
  const matches = text.match(priceRegex) || [];

  for (const match of matches) {
    const currency = match.match(/^[^\d]+/)?.[0]?.trim() || '$';
    prices.push({ price: match.trim(), currency });
  }

  // Look for original/sale price patterns
  const saleRegex = /(?:was|originally|regular)\s*[:.]?\s*([\$\€\£]\d+(?:[.,]\d{2})?)/gi;
  let saleMatch;
  while ((saleMatch = saleRegex.exec(text)) !== null) {
    if (prices.length > 0) {
      prices[0].originalPrice = saleMatch[1];
    }
  }

  // Price range patterns (e.g., "$10 - $20" or "from $10 to $20")
  const rangeRegex = /(?:from\s+)?([\$\€\£]\d+(?:[.,]\d{2})?)\s*(?:to|-)\s*([\$\€\£]\d+(?:[.,]\d{2})?)/gi;
  let rangeMatch;
  while ((rangeMatch = rangeRegex.exec(text)) !== null) {
    if (prices.length > 0) {
      prices[0].priceRange = { min: rangeMatch[1], max: rangeMatch[2] };
    }
  }

  // Discount patterns
  const discountRegex = /(\d+)%\s*(?:off|discount|save)/gi;
  let discountMatch;
  while ((discountMatch = discountRegex.exec(text)) !== null) {
    if (prices.length > 0) {
      prices[0].discount = `${discountMatch[1]}% off`;
    }
  }

  return prices.slice(0, 10);
}

// Extract rating information
function extractRatings(text: string, _elements: PageElement[]): RatingInfo[] {
  const ratings: RatingInfo[] = [];

  // Patterns like "4.5 out of 5", "4.5/5", "4.5 stars"
  const ratingRegex = /(\d+(?:\.\d+)?)\s*(?:out of|\/|stars?\s*(?:out of)?)\s*(\d+)/gi;
  let match;
  while ((match = ratingRegex.exec(text)) !== null) {
    ratings.push({
      rating: match[1],
      maxRating: match[2],
      reviewCount: '',
      stars: parseFloat(match[1]),
    });
  }

  // Review count patterns
  const reviewRegex = /(\d+(?:,\d+)?)\s*(?:reviews?|ratings?|customer\s*reviews?)/gi;
  while ((match = reviewRegex.exec(text)) !== null) {
    if (ratings.length > 0 && !ratings[0].reviewCount) {
      ratings[0].reviewCount = match[1];
    } else {
      ratings.push({ rating: '', maxRating: '5', reviewCount: match[1] });
    }
  }

  return ratings.slice(0, 3);
}

// Extract article content
function extractArticle(text: string, snapshot: PageSnapshot): ArticleContent | null {
  const headings = snapshot.headings || [];
  if (headings.length === 0 && text.length < 200) return null;

  const title = headings[0]?.text || snapshot.title || 'Untitled';
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 50);

  if (paragraphs.length < 2) return null;

  const wordCount = text.split(/\s+/).length;
  const readingTime = `${Math.ceil(wordCount / 200)} min read`;

  // Simple extractive summary — first 2 sentences of first 2 paragraphs
  const summary = paragraphs
    .slice(0, 2)
    .map(p => p.split(/[.!?]+/).slice(0, 2).join('. ').trim())
    .join('. ');

  // Try to extract author
  const authorPatterns = [
    /(?:by|written by|author[:\s]+)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:Posted|Published)\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  ];
  let author: string | undefined;
  for (const pattern of authorPatterns) {
    const authorMatch = text.match(pattern);
    if (authorMatch) {
      author = authorMatch[1];
      break;
    }
  }

  // Try to extract published date
  const datePatterns = [
    /(?:published|posted|updated)[:\s]+(\w+\s+\d{1,2},?\s*\d{4})/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{4}-\d{2}-\d{2})/,
  ];
  let publishedDate: string | undefined;
  for (const pattern of datePatterns) {
    const dateMatch = text.match(pattern);
    if (dateMatch) {
      publishedDate = dateMatch[1];
      break;
    }
  }

  return {
    title,
    author,
    publishedDate,
    readingTime,
    wordCount,
    paragraphs: paragraphs.slice(0, 10),
    summary: summary.substring(0, 300),
  };
}

// Extract navigation menus
function extractNavigation(elements: PageElement[]): NavigationMenu | null {
  const navItems: NavigationMenu['items'] = [];
  const breadcrumbs: string[] = [];

  // Find navigation links
  for (const el of elements) {
    if (el.role === 'link' && el.href) {
      const text = el.text?.trim();
      if (text && text.length < 50) {
        navItems.push({
          text,
          href: el.href,
          isCurrent: el.text?.toLowerCase().includes('current') || false,
        });
      }
    }
  }

  // Look for breadcrumb patterns
  const breadcrumbElements = elements.filter(e =>
    e.text?.includes('>') || e.text?.includes('/') || e.text?.includes('\u203a')
  );
  for (const el of breadcrumbElements) {
    const parts = el.text.split(/[>\/\u203a]+/).map(s => s.trim()).filter(Boolean);
    breadcrumbs.push(...parts);
  }

  return navItems.length > 0 ? { items: navItems.slice(0, 20), breadcrumbs: breadcrumbs.slice(0, 5) } : null;
}

// Extract form information
function extractForm(elements: PageElement[]): FormAnalysis | null {
  const fields: FormAnalysis['fields'] = [];
  let submitButton: string | undefined;

  for (const el of elements) {
    if (el.typeable) {
      fields.push({
        name: el.label || el.placeholder || 'unknown',
        type: el.formFieldType || 'text',
        label: el.label || '',
        placeholder: el.placeholder || '',
        required: false,
      });
    }
    if (el.clickable && el.role === 'button') {
      const text = (el.text || el.label || '').toLowerCase();
      if (text.includes('submit') || text.includes('send') || text.includes('sign in') || text.includes('login')) {
        submitButton = el.text || el.label;
      }
    }
  }

  return fields.length > 0 ? { fields, submitButton, validationErrors: [] } : null;
}

// Extract media information
function extractMedia(elements: PageElement[], _text: string): MediaInfo {
  const videos: MediaInfo['videos'] = [];
  const images: MediaInfo['images'] = [];
  const audio: MediaInfo['audio'] = [];

  for (const el of elements) {
    if (el.tag === 'video') {
      videos.push({ title: el.label || el.text || 'Video' });
    }
    if (el.tag === 'img') {
      images.push({
        alt: el.label || el.text || '',
        isProduct: /product|item|merchandise/i.test(el.label || el.text || ''),
      });
    }
    if (el.tag === 'audio') {
      audio.push({ title: el.label || el.text || 'Audio' });
    }
  }

  return { videos, images: images.slice(0, 10), audio };
}

// Extract social media links
function extractSocialLinks(elements: PageElement[]): Array<{ platform: string; url: string }> {
  const socialPlatforms = [
    'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com',
    'youtube.com', 'tiktok.com', 'pinterest.com', 'reddit.com', 'github.com',
  ];
  const links: Array<{ platform: string; url: string }> = [];

  for (const el of elements) {
    if (el.href) {
      for (const platform of socialPlatforms) {
        if (el.href.includes(platform)) {
          links.push({ platform: platform.split('.')[0], url: el.href });
          break;
        }
      }
    }
  }
  return links;
}

// Extract contact information
function extractContacts(text: string): Array<{ type: 'email' | 'phone' | 'address'; value: string }> {
  const contacts: Array<{ type: 'email' | 'phone' | 'address'; value: string }> = [];

  // Emails
  const emailRegex = /[\w.-]+@[\w.-]+\.\w{2,}/g;
  const emails = text.match(emailRegex) || [];
  for (const email of emails.slice(0, 3)) {
    contacts.push({ type: 'email', value: email });
  }

  // Phone numbers
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex) || [];
  for (const phone of phones.slice(0, 3)) {
    contacts.push({ type: 'phone', value: phone });
  }

  return contacts;
}

// Extract tables
function extractTables(elements: PageElement[]): Array<{ headers: string[]; rowCount: number; summary: string }> {
  const tables: Array<{ headers: string[]; rowCount: number; summary: string }> = [];

  // Simplified table detection — look for elements with table-related roles
  const tableElements = elements.filter(e => e.tag === 'table' || e.role === 'table');

  for (const table of tableElements) {
    tables.push({
      headers: [],
      rowCount: 0,
      summary: table.text?.substring(0, 100) || 'Data table',
    });
  }

  return tables;
}

// Sentiment analysis with word scoring
function analyzeSentiment(text: string): SentimentResult {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const foundPositive: string[] = [];
  const foundNegative: string[] = [];
  let score = 0;

  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '');
    if (POSITIVE_WORDS.includes(clean)) {
      score += 1;
      foundPositive.push(clean);
    }
    if (NEGATIVE_WORDS.includes(clean)) {
      score -= 1;
      foundNegative.push(clean);
    }
  }

  // Check for negation patterns that flip sentiment
  const negationPattern = /\b(not|no|never|neither|nor|barely|hardly|scarcely|seldom)\s+\w+/gi;
  const negations = text.match(negationPattern) || [];
  for (const neg of negations) {
    const negLower = neg.toLowerCase();
    for (const pw of POSITIVE_WORDS) {
      if (negLower.includes(pw)) {
        score -= 2; // Flip positive to negative
      }
    }
    for (const nw of NEGATIVE_WORDS) {
      if (negLower.includes(nw)) {
        score += 1; // Slightly reduce negative impact
      }
    }
  }

  // Normalize score to -1 to 1
  const totalWords = Math.max(1, words.length);
  const normalizedScore = Math.max(-1, Math.min(1, score / Math.max(1, totalWords * 0.1)));

  // Confidence based on how many sentiment words were found
  const sentimentWordCount = foundPositive.length + foundNegative.length;
  const confidence = Math.min(1, sentimentWordCount / Math.max(1, totalWords * 0.05));

  const overall: SentimentResult['overall'] =
    normalizedScore > 0.1 ? 'positive' :
    normalizedScore < -0.1 ? 'negative' : 'neutral';

  return {
    overall,
    score: Math.round(normalizedScore * 100) / 100,
    positiveWords: [...new Set(foundPositive)],
    negativeWords: [...new Set(foundNegative)],
    confidence: Math.round(confidence * 100) / 100,
  };
}

// Entity extraction
function extractEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();

  for (const { pattern, type, confidence } of ENTITY_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = match[0].trim();
      const key = `${type}:${value.toLowerCase()}`;
      if (!seen.has(key) && value.length > 1) {
        seen.add(key);
        entities.push({ text: value, type, confidence });
      }
    }
  }

  // Also detect capitalized multi-word phrases as potential products
  const productPattern = /\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+\b/g;
  let productMatch;
  while ((productMatch = productPattern.exec(text)) !== null) {
    const value = productMatch[0].trim();
    const key = `product:${value.toLowerCase()}`;
    if (!seen.has(key) && value.length > 4 && value.length < 50) {
      seen.add(key);
      entities.push({ text: value, type: 'product', confidence: 0.5 });
    }
  }

  // Sort by confidence
  entities.sort((a, b) => b.confidence - a.confidence);
  return entities.slice(0, 20);
}

// Price comparison logic
function buildPriceComparison(prices: PriceInfo[], text: string): PriceComparison | null {
  if (prices.length < 1) return null;

  const items: PriceComparison['items'] = [];

  for (const priceInfo of prices) {
    const numericPrice = parseFloat(priceInfo.price.replace(/[^0-9.]/g, ''));
    if (!isNaN(numericPrice)) {
      items.push({
        name: `Item ${items.length + 1}`,
        price: numericPrice,
        currency: priceInfo.currency,
      });
    }
  }

  // Try to find store/brand names near prices
  const storePattern = /(?:at|from|on)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/gi;
  let storeMatch;
  let storeIdx = 0;
  while ((storeMatch = storePattern.exec(text)) !== null) {
    if (storeIdx < items.length) {
      items[storeIdx].store = storeMatch[1];
      storeIdx++;
    }
  }

  if (items.length === 0) return null;

  const sortedByPrice = [...items].sort((a, b) => a.price - b.price);
  const lowest = { name: sortedByPrice[0].name, price: sortedByPrice[0].price };
  const highest = { name: sortedByPrice[sortedByPrice.length - 1].name, price: sortedByPrice[sortedByPrice.length - 1].price };
  const average = Math.round(items.reduce((sum, i) => sum + i.price, 0) / items.length * 100) / 100;
  const savings = highest.price > 0
    ? `${Math.round((1 - lowest.price / highest.price) * 100)}%`
    : '0%';

  return { items, lowest, highest, average, savings };
}

// Detect content type
function detectContentTypeInternal(snapshot: PageSnapshot, intel: Partial<PageIntelligence>): ContentType {
  const candidates = CONTENT_TYPE_PATTERNS
    .filter(({ check }) => check(snapshot, intel))
    .sort((a, b) => b.priority - a.priority);

  return candidates.length > 0 ? candidates[0].type : 'general';
}

// Main intelligence extraction function
export function analyzePageIntelligence(snapshot: PageSnapshot): PageIntelligence {
  const { elements, textContent, headings: _headings } = snapshot;

  const prices = extractPrices(textContent, elements);
  const ratings = extractRatings(textContent, elements);
  const article = extractArticle(textContent, snapshot);
  const navigation = extractNavigation(elements);
  const form = extractForm(elements);
  const media = extractMedia(elements, textContent);
  const links = elements
    .filter(e => e.role === 'link' && e.href && e.text)
    .map(e => ({ text: e.text!, href: e.href!, section: 'body' }))
    .slice(0, 30);
  const tables = extractTables(elements);
  const contacts = extractContacts(textContent);
  const socialLinks = extractSocialLinks(elements);
  const sentiment = analyzeSentiment(textContent);
  const entities = extractEntities(textContent);
  const priceComparison = buildPriceComparison(prices, textContent);

  // Lists
  const lists: PageIntelligence['lists'] = [];
  const listItems = elements.filter(e => e.tag === 'li' || e.role === 'listitem');
  if (listItems.length > 0) {
    lists.push({
      type: 'unordered',
      items: listItems.map(e => e.text || '').filter(Boolean).slice(0, 10),
    });
  }

  // Build partial intel for content type detection
  const partialIntel: Partial<PageIntelligence> = {
    prices, ratings, media, tables,
    article: article ?? undefined,
    form: form ?? undefined,
    navigation: navigation ?? undefined,
  };
  const contentType = detectContentTypeInternal(snapshot, partialIntel);

  logger.agent('pageIntelligence', {
    prices: prices.length,
    ratings: ratings.length,
    hasArticle: !!article,
    hasNav: !!navigation,
    hasForm: !!form,
    links: links.length,
    contentType,
    sentiment: sentiment.overall,
    entities: entities.length,
  });

  return {
    article: article ?? undefined,
    navigation: navigation ?? undefined,
    form: form ?? undefined,
    prices,
    ratings,
    media,
    links,
    tables,
    lists,
    contacts,
    socialLinks,
    metadata: {
      description: snapshot.title,
      siteName: new URL(snapshot.url || 'https://example.com').hostname,
    },
    contentType,
    sentiment,
    entities,
    priceComparison,
  };
}

// Generate a rich spoken summary from intelligence
export function speakPageIntelligence(intel: PageIntelligence): string {
  const parts: string[] = [];

  if (intel.article) {
    parts.push(`Article: ${intel.article.title}. ${intel.article.readingTime}. ${intel.article.summary}`);
  }

  if (intel.prices.length > 0) {
    const priceStrs = intel.prices.map(p => {
      let s = p.price;
      if (p.originalPrice) s += ` (was ${p.originalPrice})`;
      if (p.discount) s += ` (${p.discount})`;
      return s;
    });
    parts.push(`Prices found: ${priceStrs.join(', ')}`);
  }

  if (intel.ratings.length > 0) {
    const rating = intel.ratings[0];
    if (rating.rating) parts.push(`Rating: ${rating.rating} out of ${rating.maxRating}`);
    if (rating.reviewCount) parts.push(`${rating.reviewCount} reviews`);
  }

  if (intel.form) {
    const fieldNames = intel.form.fields.map(f => f.label || f.placeholder).filter(Boolean);
    parts.push(`Form with ${fieldNames.length} fields: ${fieldNames.slice(0, 4).join(', ')}`);
  }

  if (intel.navigation) {
    const navTexts = intel.navigation.items.slice(0, 5).map(n => n.text);
    parts.push(`Navigation: ${navTexts.join(', ')}`);
  }

  if (intel.media.videos.length > 0) {
    parts.push(`${intel.media.videos.length} video(s) on page`);
  }

  if (intel.contacts.length > 0) {
    parts.push(`Contact: ${intel.contacts[0].value}`);
  }

  if (intel.socialLinks.length > 0) {
    const platforms = intel.socialLinks.map(s => s.platform);
    parts.push(`Social: ${[...new Set(platforms)].join(', ')}`);
  }

  // Content type
  parts.push(`This appears to be a ${intel.contentType} page.`);

  // Sentiment
  if (intel.sentiment.overall !== 'neutral') {
    parts.push(`Overall tone: ${intel.sentiment.overall}.`);
  }

  // Price comparison
  if (intel.priceComparison && intel.priceComparison.items.length > 1) {
    const pc = intel.priceComparison;
    parts.push(`Price comparison: lowest ${pc.lowest?.price}, highest ${pc.highest?.price}. Potential savings: ${pc.savings}.`);
  }

  // Key entities
  const people = intel.entities.filter(e => e.type === 'person');
  const orgs = intel.entities.filter(e => e.type === 'organization');
  if (people.length > 0) parts.push(`People mentioned: ${people.slice(0, 3).map(e => e.text).join(', ')}.`);
  if (orgs.length > 0) parts.push(`Organizations: ${orgs.slice(0, 3).map(e => e.text).join(', ')}.`);

  if (parts.length === 0) {
    parts.push('No structured content detected on this page.');
  }

  return parts.join('. ') + '.';
}

// Quick content type detection (legacy export, now uses enhanced logic)
export function detectContentType(intel: PageIntelligence): ContentType {
  return intel.contentType;
}

// Generate sentiment summary for speech
export function speakSentiment(sentiment: SentimentResult): string {
  if (sentiment.overall === 'neutral') return 'The page has a neutral tone.';

  const strength = sentiment.confidence > 0.7 ? 'strongly' : 'somewhat';
  const wordList = sentiment.overall === 'positive' ? sentiment.positiveWords : sentiment.negativeWords;
  const examples = wordList.slice(0, 3).join(', ');

  return `The page is ${strength} ${sentiment.overall}. Key words: ${examples}.`;
}

// Generate entity summary for speech
export function speakEntities(entities: ExtractedEntity[]): string {
  if (entities.length === 0) return 'No notable entities found on this page.';

  const byType = new Map<string, string[]>();
  for (const entity of entities) {
    const existing = byType.get(entity.type) || [];
    existing.push(entity.text);
    byType.set(entity.type, existing);
  }

  const parts: string[] = [];
  for (const [type, values] of byType) {
    const unique = [...new Set(values)].slice(0, 3);
    parts.push(`${type}s: ${unique.join(', ')}`);
  }

  return parts.join('. ') + '.';
}
