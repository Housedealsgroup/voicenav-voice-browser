// VoiceNav Page Intelligence Tests
import {
  analyzePageIntelligence,
  speakPageIntelligence,
  detectContentType,
  type PageIntelligence,
} from '../pageIntelligence';
import type { PageSnapshot, PageElement } from '../../browser/types';

function makeSnapshot(overrides: Partial<PageSnapshot> = {}): PageSnapshot {
  return {
    url: 'https://example.com',
    title: 'Test Page',
    textContent: 'This is test content with some text.',
    elements: [],
    headings: [],
    pageType: 'general',
    ...overrides,
  };
}

function makeElement(overrides: Partial<PageElement> = {}): PageElement {
  return {
    id: 1,
    tag: 'div',
    role: 'generic',
    text: '',
    label: '',
    href: '',
    placeholder: '',
    type: '',
    clickable: false,
    typeable: false,
    selectable: false,
    formFieldType: undefined as any,
    ...overrides,
  };
}

describe('Page Intelligence', () => {
  test('extracts prices from text', () => {
    const snapshot = makeSnapshot({
      textContent: 'This product costs $29.99 and was originally $49.99',
    });
    const intel = analyzePageIntelligence(snapshot);
    expect(intel.prices.length).toBeGreaterThan(0);
    expect(intel.prices[0].price).toContain('29.99');
  });

  test('extracts ratings from text', () => {
    const snapshot = makeSnapshot({
      textContent: 'Rated 4.5 out of 5 based on 1,234 reviews',
    });
    const intel = analyzePageIntelligence(snapshot);
    expect(intel.ratings.length).toBeGreaterThan(0);
    expect(intel.ratings[0].rating).toBe('4.5');
  });

  test('detects article content', () => {
    const longText = Array(20).fill('This is a paragraph with enough words to qualify as article content for testing purposes.').join('\n\n');
    const snapshot = makeSnapshot({
      textContent: longText,
      headings: [{ text: 'Test Article', level: 1 }],
    });
    const intel = analyzePageIntelligence(snapshot);
    expect(intel.article).toBeDefined();
    expect(intel.article!.title).toBe('Test Article');
    expect(intel.article!.wordCount).toBeGreaterThan(50);
  });

  test('extracts contact information', () => {
    const snapshot = makeSnapshot({
      textContent: 'Contact us at info@example.com or call 555-123-4567',
    });
    const intel = analyzePageIntelligence(snapshot);
    expect(intel.contacts.length).toBeGreaterThan(0);
    expect(intel.contacts.some(c => c.type === 'email')).toBe(true);
  });

  test('detects social links', () => {
    const elements = [
      makeElement({ href: 'https://facebook.com/example', text: 'Facebook' }),
      makeElement({ href: 'https://twitter.com/example', text: 'Twitter' }),
    ];
    const snapshot = makeSnapshot({ elements });
    const intel = analyzePageIntelligence(snapshot);
    expect(intel.socialLinks.length).toBe(2);
  });

  test('generates spoken summary', () => {
    const intel: PageIntelligence = {
      prices: [{ price: '$29.99', currency: '$' }],
      ratings: [{ rating: '4.5', maxRating: '5', reviewCount: '100' }],
      media: { videos: [], images: [], audio: [] },
      links: [],
      tables: [],
      lists: [],
      contacts: [],
      socialLinks: [],
      metadata: {},
    };
    const summary = speakPageIntelligence(intel);
    expect(summary).toContain('$29.99');
    expect(summary).toContain('4.5');
  });

  test('detects product content type', () => {
    const intel: PageIntelligence = {
      prices: [{ price: '$10', currency: '$' }],
      ratings: [{ rating: '5', maxRating: '5', reviewCount: '10' }],
      media: { videos: [], images: [], audio: [] },
      links: [],
      tables: [],
      lists: [],
      contacts: [],
      socialLinks: [],
      metadata: {},
    };
    expect(detectContentType(intel)).toBe('product');
  });

  test('detects article content type', () => {
    const intel: PageIntelligence = {
      article: { title: 'Test', paragraphs: [], summary: '', wordCount: 500, readingTime: '3 min' },
      prices: [],
      ratings: [],
      media: { videos: [], images: [], audio: [] },
      links: [],
      tables: [],
      lists: [],
      contacts: [],
      socialLinks: [],
      metadata: {},
    };
    expect(detectContentType(intel)).toBe('article');
  });
});
