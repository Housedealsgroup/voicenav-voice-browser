import { analyzeAccessibility, generateReport, speakReport } from '../a11yDashboard';
import type { PageSnapshot, PageElement } from '../../browser/types';

const mockSnapshot: PageSnapshot = {
  url: 'https://example.com',
  title: 'Test Page',
  elements: [],
  textContent: 'Some test content',
  scrollY: 0,
  pageHeight: 1000,
  viewportHeight: 800,
  timestamp: Date.now(),
};

function makeSnapshot(overrides: Partial<PageSnapshot> = {}): PageSnapshot {
  return { ...mockSnapshot, ...overrides };
}

const imgNoAlt: PageElement = {
  id: 1, role: 'img', tag: 'img', text: '', label: '',
  placeholder: '', href: '/photo.jpg', clickable: false, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 300, height: 200 },
};

const imgWithAlt: PageElement = {
  id: 2, role: 'img', tag: 'img', text: 'A sunset photo', label: 'Sunset',
  placeholder: '', href: '/sunset.jpg', clickable: false, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 300, height: 200 },
};

const buttonNoLabel: PageElement = {
  id: 3, role: 'button', tag: 'button', text: '', label: '',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 40, height: 40 },
};

const properButton: PageElement = {
  id: 4, role: 'button', tag: 'button', text: 'Submit', label: 'Submit Form',
  placeholder: '', href: '', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 100, left: 0, width: 100, height: 40 },
};

const inputNoLabel: PageElement = {
  id: 5, role: 'textbox', tag: 'input', text: '', label: '',
  placeholder: '', href: '', clickable: true, typeable: true, selectable: false,
  visible: true, rect: { top: 200, left: 0, width: 200, height: 40 },
};

const inputWithLabel: PageElement = {
  id: 6, role: 'textbox', tag: 'input', text: '', label: 'Email Address',
  placeholder: 'you@example.com', href: '', clickable: true, typeable: true, selectable: false,
  visible: true, rect: { top: 200, left: 0, width: 200, height: 40 },
};

const navElement: PageElement = {
  id: 7, role: 'navigation', tag: 'nav', text: 'Main Nav', label: '',
  placeholder: '', href: '', clickable: false, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 800, height: 60 },
};

const mainElement: PageElement = {
  id: 8, role: 'main', tag: 'main', text: 'Main content', label: '',
  placeholder: '', href: '', clickable: false, typeable: false, selectable: false,
  visible: true, rect: { top: 60, left: 0, width: 800, height: 600 },
};

const headingH1: PageElement = {
  id: 9, role: 'heading', tag: 'h1', text: 'Title', label: '',
  placeholder: '', href: '', clickable: false, typeable: false, selectable: false,
  visible: true, rect: { top: 0, left: 0, width: 400, height: 50 },
  ariaLevel: 1,
};

const headingH3Skip: PageElement = {
  id: 10, role: 'heading', tag: 'h3', text: 'Skipped heading', label: '',
  placeholder: '', href: '', clickable: false, typeable: false, selectable: false,
  visible: true, rect: { top: 100, left: 0, width: 300, height: 40 },
  ariaLevel: 3,
};

const linkBadText: PageElement = {
  id: 11, role: 'link', tag: 'a', text: 'click here', label: '',
  placeholder: '', href: '/page', clickable: true, typeable: false, selectable: false,
  visible: true, rect: { top: 300, left: 0, width: 80, height: 30 },
};

describe('A11y Dashboard', () => {
  describe('analyzeAccessibility()', () => {
    it('returns a score for an empty page', () => {
      const score = analyzeAccessibility(mockSnapshot);
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });

    it('detects images without alt text', () => {
      const snapshot = makeSnapshot({ elements: [imgNoAlt] });
      const score = analyzeAccessibility(snapshot);
      const criticalIssues = score.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues.some(i => i.message.includes('alt text'))).toBe(true);
    });

    it('does not flag images with alt text', () => {
      const snapshot = makeSnapshot({ elements: [imgWithAlt] });
      const score = analyzeAccessibility(snapshot);
      expect(score.issues.filter(i => i.message.includes('alt text')).length).toBe(0);
    });

    it('detects buttons without accessible names', () => {
      const snapshot = makeSnapshot({ elements: [buttonNoLabel] });
      const score = analyzeAccessibility(snapshot);
      const criticalIssues = score.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues.some(i => i.message.includes('accessible name'))).toBe(true);
    });

    it('detects inputs without labels', () => {
      const snapshot = makeSnapshot({ elements: [inputNoLabel] });
      const score = analyzeAccessibility(snapshot);
      expect(score.issues.some(i => i.message.includes('no label'))).toBe(true);
    });

    it('detects missing main landmark', () => {
      const snapshot = makeSnapshot({ elements: [navElement] });
      const score = analyzeAccessibility(snapshot);
      expect(score.issues.some(i => i.message.includes('main'))).toBe(true);
    });

    it('does not flag when main landmark exists', () => {
      const snapshot = makeSnapshot({ elements: [mainElement, navElement] });
      const score = analyzeAccessibility(snapshot);
      expect(score.issues.filter(i => i.message.includes('No <main>')).length).toBe(0);
    });

    it('detects heading hierarchy skips', () => {
      const snapshot = makeSnapshot({ elements: [headingH1, headingH3Skip] });
      const score = analyzeAccessibility(snapshot);
      expect(score.issues.some(i => i.message.includes('Heading level'))).toBe(true);
    });

    it('detects non-descriptive link text', () => {
      const snapshot = makeSnapshot({ elements: [linkBadText] });
      const score = analyzeAccessibility(snapshot);
      expect(score.issues.some(i => i.message.includes('not descriptive'))).toBe(true);
    });

    it('generates recommendations', () => {
      const snapshot = makeSnapshot({ elements: [imgNoAlt, inputNoLabel] });
      const score = analyzeAccessibility(snapshot);
      expect(score.recommendations.length).toBeGreaterThan(0);
    });

    it('gives high score for accessible page', () => {
      const snapshot = makeSnapshot({ elements: [imgWithAlt, properButton, inputWithLabel, navElement, mainElement] });
      const score = analyzeAccessibility(snapshot);
      expect(score.overall).toBeGreaterThan(70);
    });

    it('includes all score categories', () => {
      const score = analyzeAccessibility(mockSnapshot);
      expect(typeof score.keyboard).toBe('number');
      expect(typeof score.screenReader).toBe('number');
      expect(typeof score.structure).toBe('number');
      expect(typeof score.forms).toBe('number');
      expect(typeof score.media).toBe('number');
    });
  });

  describe('generateReport()', () => {
    it('generates a report with correct structure', () => {
      const report = generateReport(mockSnapshot);
      expect(report.url).toBe('https://example.com');
      expect(report.title).toBe('Test Page');
      expect(report.score).toBeDefined();
      expect(report.timestamp).toBeGreaterThan(0);
      expect(typeof report.elementCount).toBe('number');
    });

    it('groups issues by category', () => {
      const snapshot = makeSnapshot({ elements: [imgNoAlt, inputNoLabel] });
      const report = generateReport(snapshot);
      expect(report.issuesByCategory).toBeDefined();
    });

    it('groups issues by severity', () => {
      const snapshot = makeSnapshot({ elements: [imgNoAlt] });
      const report = generateReport(snapshot);
      expect(report.issuesBySeverity).toBeDefined();
      expect(report.issuesBySeverity['critical']).toBeGreaterThan(0);
    });

    it('counts elements correctly', () => {
      const snapshot = makeSnapshot({ elements: [imgWithAlt, properButton] });
      const report = generateReport(snapshot);
      expect(report.elementCount).toBe(2);
    });
  });

  describe('speakReport()', () => {
    it('returns a voice-readable report', () => {
      const report = generateReport(mockSnapshot);
      const spoken = speakReport(report);
      expect(spoken).toContain('Accessibility report');
      expect(spoken).toContain('score');
      expect(spoken).toContain('out of 100');
    });

    it('includes critical issue count when present', () => {
      const snapshot = makeSnapshot({ elements: [imgNoAlt] });
      const report = generateReport(snapshot);
      const spoken = speakReport(report);
      expect(spoken).toContain('critical');
    });

    it('includes top recommendation', () => {
      const snapshot = makeSnapshot({ elements: [imgNoAlt, inputNoLabel] });
      const report = generateReport(snapshot);
      const spoken = speakReport(report);
      expect(spoken).toContain('recommendation');
    });

    it('says excellent for high scores', () => {
      const snapshot = makeSnapshot({ elements: [imgWithAlt, properButton, inputWithLabel, navElement, mainElement] });
      const report = generateReport(snapshot);
      const spoken = speakReport(report);
      if (report.score.overall >= 90) {
        expect(spoken).toContain('Excellent');
      }
    });
  });
});
