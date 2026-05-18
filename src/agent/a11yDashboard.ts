// VoiceNav Accessibility Dashboard — v10
// Comprehensive accessibility metrics and recommendations
// WCAG compliance checking and improvement suggestions

import { logger } from '../utils/logger';
import type { PageSnapshot, PageElement } from '../browser/types';

export type A11yIssue = {
  severity: 'critical' | 'warning' | 'info';
  category: 'keyboard' | 'screen-reader' | 'color' | 'structure' | 'forms' | 'media' | 'navigation';
  message: string;
  element?: string;
  fix: string;
};

export type A11yScore = {
  overall: number; // 0-100
  keyboard: number;
  screenReader: number;
  structure: number;
  forms: number;
  media: number;
  issues: A11yIssue[];
  recommendations: string[];
};

export type PageA11yReport = {
  url: string;
  title: string;
  score: A11yScore;
  timestamp: number;
  elementCount: number;
  issuesByCategory: Record<string, number>;
  issuesBySeverity: Record<string, number>;
};

function checkKeyboardAccessibility(elements: PageElement[]): A11yIssue[] {
  const issues: A11yIssue[] = [];

  const interactiveElements = elements.filter(e => e.clickable || e.typeable || e.selectable);
  const focusableElements = elements.filter(e =>
    e.tag === 'a' || e.tag === 'button' || e.tag === 'input' ||
    e.tag === 'select' || e.tag === 'textarea' || e.clickable
  );

  // Check for clickable elements without keyboard access
  for (const el of interactiveElements) {
    if (el.clickable && !['a', 'button', 'input', 'select', 'textarea'].includes(el.tag)) {
      if (!el.role || el.role === 'generic') {
        issues.push({
          severity: 'warning',
          category: 'keyboard',
          message: `Clickable ${el.tag} element may not be keyboard accessible`,
          element: el.text || el.label || el.tag,
          fix: 'Add tabindex="0" and keyboard event handlers, or use a button/link element',
        });
      }
    }
  }

  // Check for missing focus indicators
  if (focusableElements.length > 0) {
    issues.push({
      severity: 'info',
      category: 'keyboard',
      message: `${focusableElements.length} focusable elements found. Ensure visible focus indicators exist.`,
      fix: 'Add :focus styles with visible outlines or borders',
    });
  }

  return issues;
}

function checkScreenReader(elements: PageElement[]): A11yIssue[] {
  const issues: A11yIssue[] = [];

  // Check images for alt text
  const images = elements.filter(e => e.tag === 'img');
  for (const img of images) {
    if (!img.label && !img.text) {
      issues.push({
        severity: 'critical',
        category: 'screen-reader',
        message: 'Image missing alt text',
        element: img.href || 'image',
        fix: 'Add descriptive alt text to the image',
      });
    }
  }

  // Check buttons for accessible names
  const buttons = elements.filter(e => e.tag === 'button' || e.role === 'button');
  for (const btn of buttons) {
    if (!btn.text && !btn.label) {
      issues.push({
        severity: 'critical',
        category: 'screen-reader',
        message: 'Button has no accessible name',
        element: String(btn.id) || 'button',
        fix: 'Add text content or aria-label to the button',
      });
    }
  }

  // Check links for descriptive text
  const links = elements.filter(e => e.tag === 'a');
  for (const link of links) {
    const text = (link.text || '').toLowerCase();
    if (text === 'click here' || text === 'here' || text === 'read more' || text === 'more') {
      issues.push({
        severity: 'warning',
        category: 'screen-reader',
        message: `Link text "${link.text}" is not descriptive`,
        element: link.href || 'link',
        fix: 'Use descriptive link text that explains the destination',
      });
    }
  }

  // Check for form labels
  const inputs = elements.filter(e => e.typeable);
  for (const input of inputs) {
    if (!input.label && !input.placeholder) {
      issues.push({
        severity: 'critical',
        category: 'screen-reader',
        message: 'Form input has no label or placeholder',
        element: String(input.id) || input.tag,
        fix: 'Add a <label> element or aria-label attribute',
      });
    }
  }

  return issues;
}

function checkStructure(elements: PageElement[]): A11yIssue[] {
  const issues: A11yIssue[] = [];

  // Check for heading hierarchy
  const headings = elements.filter(e => e.ariaLevel && e.ariaLevel > 0);
  let lastLevel = 0;
  for (const heading of headings) {
    if (heading.ariaLevel! > lastLevel + 1 && lastLevel > 0) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        message: `Heading level ${heading.ariaLevel} skipped (was at level ${lastLevel})`,
        element: heading.text || 'heading',
        fix: 'Maintain sequential heading hierarchy (h1, h2, h3, etc.)',
      });
    }
    lastLevel = heading.ariaLevel!;
  }

  // Check for landmarks
  const hasNav = elements.some(e => e.tag === 'nav' || e.role === 'navigation');
  const hasMain = elements.some(e => e.tag === 'main' || e.role === 'main');
  const hasHeader = elements.some(e => e.tag === 'header' || e.role === 'banner');

  if (!hasMain) {
    issues.push({
      severity: 'warning',
      category: 'structure',
      message: 'No <main> landmark found',
      fix: 'Wrap main content in a <main> element',
    });
  }

  if (!hasNav) {
    issues.push({
      severity: 'info',
      category: 'structure',
      message: 'No <nav> landmark found',
      fix: 'Wrap navigation in a <nav> element',
    });
  }

  return issues;
}

function checkForms(elements: PageElement[]): A11yIssue[] {
  const issues: A11yIssue[] = [];
  const inputs = elements.filter(e => e.typeable);

  for (const input of inputs) {
    // Check for autocomplete attributes
    if (!input.placeholder && !input.label) {
      issues.push({
        severity: 'warning',
        category: 'forms',
        message: 'Input field has no visible label',
        element: String(input.id) || 'input',
        fix: 'Add a visible <label> element',
      });
    }
  }

  return issues;
}

export function analyzeAccessibility(snapshot: PageSnapshot): A11yScore {
  const elements = snapshot.elements || [];

  const keyboardIssues = checkKeyboardAccessibility(elements);
  const screenReaderIssues = checkScreenReader(elements);
  const structureIssues = checkStructure(elements);
  const formIssues = checkForms(elements);

  const allIssues = [...keyboardIssues, ...screenReaderIssues, ...structureIssues, ...formIssues];

  // Calculate scores
  const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
  const warningCount = allIssues.filter(i => i.severity === 'warning').length;

  const keyboardScore = Math.max(0, 100 - keyboardIssues.length * 15);
  const screenReaderScore = Math.max(0, 100 - screenReaderIssues.length * 12);
  const structureScore = Math.max(0, 100 - structureIssues.length * 10);
  const formsScore = Math.max(0, 100 - formIssues.length * 15);
  const mediaScore = 80; // Default since we can't fully check media

  const overall = Math.round(
    keyboardScore * 0.25 +
    screenReaderScore * 0.3 +
    structureScore * 0.2 +
    formsScore * 0.15 +
    mediaScore * 0.1
  );

  // Generate recommendations
  const recommendations: string[] = [];
  if (criticalCount > 0) recommendations.push(`Fix ${criticalCount} critical accessibility issues first`);
  if (warningCount > 0) recommendations.push(`Address ${warningCount} warnings to improve accessibility`);
  if (elements.filter(e => e.tag === 'img' && !e.label && !e.text).length > 0) recommendations.push('Add alt text to all images');
  if (!elements.some(e => e.tag === 'main' || e.role === 'main')) recommendations.push('Add a main landmark');
  if (recommendations.length === 0) recommendations.push('Page has good accessibility! Consider manual testing with screen readers.');

  logger.agent('a11yDashboard', { overall, criticalCount, warningCount, issueCount: allIssues.length });

  return {
    overall,
    keyboard: keyboardScore,
    screenReader: screenReaderScore,
    structure: structureScore,
    forms: formsScore,
    media: mediaScore,
    issues: allIssues,
    recommendations,
  };
}

export function generateReport(snapshot: PageSnapshot): PageA11yReport {
  const score = analyzeAccessibility(snapshot);

  const issuesByCategory: Record<string, number> = {};
  const issuesBySeverity: Record<string, number> = {};

  for (const issue of score.issues) {
    issuesByCategory[issue.category] = (issuesByCategory[issue.category] || 0) + 1;
    issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;
  }

  return {
    url: snapshot.url,
    title: snapshot.title,
    score,
    timestamp: Date.now(),
    elementCount: snapshot.elements?.length || 0,
    issuesByCategory,
    issuesBySeverity,
  };
}

export function speakReport(report: PageA11yReport): string {
  const parts: string[] = [];

  parts.push(`Accessibility report for ${report.title}.`);
  parts.push(`Overall score: ${report.score.overall} out of 100.`);

  if (report.score.overall >= 90) {
    parts.push('Excellent accessibility.');
  } else if (report.score.overall >= 70) {
    parts.push('Good accessibility with room for improvement.');
  } else if (report.score.overall >= 50) {
    parts.push('Moderate accessibility. Several issues need attention.');
  } else {
    parts.push('Poor accessibility. Significant improvements needed.');
  }

  const criticalCount = report.issuesBySeverity.critical || 0;
  if (criticalCount > 0) {
    parts.push(`${criticalCount} critical issues found.`);
  }

  if (report.score.recommendations.length > 0) {
    parts.push(`Top recommendation: ${report.score.recommendations[0]}`);
  }

  return parts.join(' ');
}
