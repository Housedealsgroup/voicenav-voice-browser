// VoiceNav Page Intelligence — enhanced page content analysis and extraction
// Extracts structured data: prices, ratings, reviews, article text, navigation, forms

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
};

// Extract price information from text
function extractPrices(text: string, elements: PageElement[]): PriceInfo[] {
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

  return prices.slice(0, 5);
}

// Extract rating information
function extractRatings(text: string, elements: PageElement[]): RatingInfo[] {
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

  return {
    title,
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
    e.text?.includes('>') || e.text?.includes('/') || e.text?.includes('›')
  );
  for (const el of breadcrumbElements) {
    const parts = el.text.split(/[>\/›]+/).map(s => s.trim()).filter(Boolean);
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
function extractMedia(elements: PageElement[], text: string): MediaInfo {
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

// Main intelligence extraction function
export function analyzePageIntelligence(snapshot: PageSnapshot): PageIntelligence {
  const { elements, textContent, headings } = snapshot;

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

  // Lists
  const lists: PageIntelligence['lists'] = [];
  const listItems = elements.filter(e => e.tag === 'li' || e.role === 'listitem');
  if (listItems.length > 0) {
    lists.push({
      type: 'unordered',
      items: listItems.map(e => e.text || '').filter(Boolean).slice(0, 10),
    });
  }

  logger.agent('pageIntelligence', {
    prices: prices.length,
    ratings: ratings.length,
    hasArticle: !!article,
    hasNav: !!navigation,
    hasForm: !!form,
    links: links.length,
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

  if (parts.length === 0) {
    parts.push('No structured content detected on this page.');
  }

  return parts.join('. ') + '.';
}

// Quick content type detection
export function detectContentType(intel: PageIntelligence): string {
  if (intel.prices.length > 0 && intel.ratings.length > 0) return 'product';
  if (intel.article && intel.article.wordCount > 300) return 'article';
  if (intel.form && intel.form.fields.length > 2) return 'form';
  if (intel.media.videos.length > 0) return 'video';
  if (intel.tables.length > 0) return 'data';
  if (intel.navigation && intel.navigation.items.length > 10) return 'directory';
  return 'general';
}
