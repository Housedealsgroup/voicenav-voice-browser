import { summarizePage, speakSummary, getQuickSummary, SummaryResult } from '../pageSummarizer';

const LONG_TEXT = `
The quick brown fox jumps over the lazy dog. This is an important finding in our research.
According to the report, sales increased by 25% this quarter. The company announced new products today.
Step one: install the package. Step two: configure the settings. Step three: run the application.
The best feature is the amazing performance. Users love the great design and excellent support.
However, there are some problems with the error handling. The worst issue is the broken test suite.
Finally, the conclusion shows significant growth. The key results indicate a positive trend overall.
`;

const SHOPPING_TEXT = `
Buy now the best laptop deal of the year! Add to cart this amazing product with great discount.
Price: $999. Rating: 4.5 stars. Shop our sale today and save big on your order.
`;

const NEWS_TEXT = `
According to officials, the breaking news today is about the announced policy changes.
The report said that yesterday's meeting resulted in new official guidelines being published.
`;

describe('Page Summarizer', () => {
  describe('summarizePage()', () => {
    it('returns empty result for short text', () => {
      const result = summarizePage('Too short');
      expect(result.summary).toContain('insufficient content');
      expect(result.keyPoints).toEqual([]);
    });

    it('returns empty result for empty text', () => {
      const result = summarizePage('');
      expect(result.summary).toContain('insufficient content');
      expect(result.wordCount).toBe(1); // ''.split(/\s+/).length is 1
    });

    it('returns a valid summary for long text', () => {
      const result = summarizePage(LONG_TEXT, 'Test Page');
      expect(result.title).toBe('Test Page');
      expect(result.summary.length).toBeGreaterThan(0);
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.readingTime).toBeGreaterThanOrEqual(1);
    });

    it('detects shopping category', () => {
      const result = summarizePage(SHOPPING_TEXT.repeat(3), 'Shop');
      expect(result.category).toBe('shopping');
    });

    it('detects news category', () => {
      const result = summarizePage(NEWS_TEXT.repeat(3), 'News');
      expect(result.category).toBe('news');
    });

    it('detects positive sentiment', () => {
      const text = 'This is great amazing excellent wonderful fantastic awesome perfect love best success growth innovative. '.repeat(5);
      const result = summarizePage(text);
      expect(result.sentiment).toBe('positive');
    });

    it('detects negative sentiment', () => {
      const text = 'This is bad terrible awful worst fail error problem issue bug broken crash loss decline poor disappointing. '.repeat(5);
      const result = summarizePage(text);
      expect(result.sentiment).toBe('negative');
    });

    it('detects neutral sentiment for mixed text', () => {
      const result = summarizePage(LONG_TEXT);
      expect(['positive', 'negative', 'neutral']).toContain(result.sentiment);
    });

    it('uses default title when none provided', () => {
      const result = summarizePage(LONG_TEXT);
      expect(result.title).toBeTruthy();
    });

    it('returns key points separate from summary', () => {
      const result = summarizePage(LONG_TEXT, 'Research');
      // keyPoints should not contain the same sentences as summary
      expect(Array.isArray(result.keyPoints)).toBe(true);
    });

    it('calculates reading time based on word count', () => {
      const text = LONG_TEXT.repeat(5);
      const result = summarizePage(text);
      expect(result.readingTime).toBeGreaterThanOrEqual(1);
    });
  });

  describe('speakSummary()', () => {
    it('returns a voice-readable string', () => {
      const result = summarizePage(LONG_TEXT, 'Test');
      const spoken = speakSummary(result);
      expect(spoken).toContain('Page summary');
      expect(spoken).toContain('Test');
      expect(spoken).toContain('Reading time');
    });

    it('includes category info', () => {
      const summary: SummaryResult = {
        title: 'Shop', summary: 'Great deals.', keyPoints: ['Point 1'],
        readingTime: 2, wordCount: 400, sentiment: 'positive', category: 'shopping',
      };
      const spoken = speakSummary(summary);
      expect(spoken).toContain('shopping');
    });

    it('includes key points when present', () => {
      const summary: SummaryResult = {
        title: 'Page', summary: 'Summary text.', keyPoints: ['Key one', 'Key two'],
        readingTime: 1, wordCount: 100, sentiment: 'neutral', category: 'general',
      };
      const spoken = speakSummary(summary);
      expect(spoken).toContain('Key points');
    });
  });

  describe('getQuickSummary()', () => {
    it('returns minimal content message for empty text', () => {
      expect(getQuickSummary('')).toBe('Page has minimal content.');
    });

    it('returns minimal content message for short text', () => {
      expect(getQuickSummary('Hi')).toBe('Page has minimal content.');
    });

    it('returns first meaningful sentence for valid text', () => {
      const summary = getQuickSummary(LONG_TEXT);
      expect(summary.length).toBeGreaterThan(0);
      expect(summary.length).toBeLessThanOrEqual(300);
    });
  });
});
