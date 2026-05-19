// VoiceNav Crash Reporting — Sentry integration for production error tracking
// v2: PII scrubbing, error categorization, breadcrumbs, consent management

import * as Sentry from '@sentry/react-native';

// --- Consent State ---
let consentGranted = false;

/** Set whether the user has granted crash reporting consent */
export function setCrashReportingConsent(granted: boolean): void {
  consentGranted = granted;
  if (!granted) {
    // Clear any pending events if consent is revoked
    Sentry.getCurrentScope().clearBreadcrumbs();
  }
}

/** Check if crash reporting consent is granted */
export function isCrashReportingConsentGranted(): boolean {
  return consentGranted;
}

// --- PII Scrubbing ---

/** Patterns that could contain PII — URLs with credentials, emails, phone numbers, SSNs, API keys */
const PII_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  // URLs with embedded credentials: http://user:pass@host
  { pattern: /https?:\/\/[^@/\s]+:[^@/\s]+@/gi, replacement: 'https://***:***@' },
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL_REDACTED]' },
  // US phone numbers
  { pattern: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: '[PHONE_REDACTED]' },
  // SSN patterns
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' },
  // Common API key patterns
  { pattern: /\b(sk|pk|api|key|token|secret|bearer)[_-]?[a-zA-Z0-9]{20,}\b/gi, replacement: '[CREDENTIAL_REDACTED]' },
  // Credit card numbers
  { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '[CARD_REDACTED]' },
  // JWT tokens
  { pattern: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, replacement: '[JWT_REDACTED]' },
  // IP addresses (private ranges only — public IPs may be useful for debugging)
  { pattern: /\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g, replacement: '[IP_REDACTED]' },
];

/** Strip PII from a string */
export function scrubPII(input: string): string {
  let result = input;
  for (const { pattern, replacement } of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/** Recursively scrub PII from an object */
function scrubObject(obj: any, depth: number = 0): any {
  if (depth > 10) return '[MAX_DEPTH]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return scrubPII(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean') return obj;
  if (Array.isArray(obj)) return obj.map(item => scrubObject(item, depth + 1));
  if (typeof obj === 'object') {
    const scrubbed: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip keys that are themselves PII
      const lowerKey = key.toLowerCase();
      if (['password', 'secret', 'token', 'authorization', 'cookie', 'ssn', 'creditcard'].some(k => lowerKey.includes(k))) {
        scrubbed[key] = '[REDACTED]';
      } else {
        scrubbed[key] = scrubObject(value, depth + 1);
      }
    }
    return scrubbed;
  }
  return obj;
}

// --- Error Categorization ---

export type ErrorCategory =
  | 'network'
  | 'permission'
  | 'voice'
  | 'browser'
  | 'state'
  | 'memory'
  | 'crash'
  | 'security'
  | 'unknown';

function categorizeError(error: Error): ErrorCategory {
  const msg = (error.message || '').toLowerCase();
  const stack = (error.stack || '').toLowerCase();
  const combined = msg + ' ' + stack;

  if (/network|fetch|timeout|offline|connection|socket|dns|ssl|tls|cors/i.test(combined)) return 'network';
  if (/permission|denied|unauthorized|forbidden|401|403/i.test(combined)) return 'permission';
  if (/voice|speech|microphone|audio|recognition|tts/i.test(combined)) return 'voice';
  if (/webview|browser|dom|navigate|inject|script/i.test(combined)) return 'browser';
  if (/state|store|redux|context|provider/i.test(combined)) return 'state';
  if (/memory|heap|allocation|out.of.memory/i.test(combined)) return 'memory';
  if (/security|csp|xss|injection|sanitiz/i.test(combined)) return 'security';
  return 'unknown';
}

// --- Breadcrumb Trail ---

export type BreadcrumbLevel = 'debug' | 'info' | 'warning' | 'error';

/** Add a breadcrumb for debugging context */
export function addBreadcrumb(
  category: string,
  message: string,
  level: BreadcrumbLevel = 'info',
  data?: Record<string, any>
): void {
  if (!consentGranted) return;

  Sentry.addBreadcrumb({
    category,
    message: scrubPII(message),
    level: level as any,
    data: data ? scrubObject(data) : undefined,
    timestamp: Date.now() / 1000,
  });
}

/** Add a navigation breadcrumb */
export function addNavigationBreadcrumb(from: string, to: string): void {
  addBreadcrumb('navigation', `${from} -> ${to}`, 'info', { from, to });
}

/** Add a voice command breadcrumb */
export function addVoiceBreadcrumb(command: string, success: boolean): void {
  addBreadcrumb('voice', `Command: ${command.substring(0, 50)}`, success ? 'info' : 'warning', {
    commandLength: command.length,
    success,
  });
}

/** Add an action breadcrumb */
export function addActionBreadcrumb(action: string, target?: string): void {
  addBreadcrumb('action', action, 'info', { target });
}

// --- Crash Reporting Core ---

export function initCrashReporting(dsn?: string) {
  if (!dsn) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    environment: __DEV__ ? 'development' : 'production',
    // Strip PII from all events
    beforeSend(event) {
      if (!consentGranted) return null; // Drop event if no consent
      // Scrub all string fields
      if (event.message) event.message = scrubPII(event.message);
      if (event.exception?.values) {
        for (const ex of event.exception.values) {
          if (ex.value) ex.value = scrubPII(ex.value);
          if (ex.stacktrace?.frames) {
            for (const frame of ex.stacktrace.frames) {
              if (frame.filename) frame.filename = scrubPII(frame.filename);
            }
          }
        }
      }
      if (event.contexts) event.contexts = scrubObject(event.contexts);
      if (event.extra) event.extra = scrubObject(event.extra);
      if (event.tags) event.tags = scrubObject(event.tags);
      // Remove user info entirely
      delete event.user;
      return event;
    },
    // Limit breadcrumbs to avoid leaking sensitive data
    maxBreadcrumbs: 30,
    // Don't send default PII
    sendDefaultPii: false,
  });
}

export function captureError(error: Error, context?: Record<string, any>) {
  const category = categorizeError(error);
  console.error(`[VoiceNav] [${category}] Error:`, error.message, context);

  if (!consentGranted) return;

  Sentry.captureException(error, {
    extra: context ? scrubObject(context) : undefined,
    tags: { category },
  });
}

export function captureMessage(message: string, level: string = 'info') {
  const scrubbed = scrubPII(message);
  console.log(`[VoiceNav] [${level}]:`, scrubbed);

  if (!consentGranted) return;

  Sentry.captureMessage(scrubbed, level as any);
}

// Global error handlers
export function setupGlobalErrorHandlers() {
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    captureError(error, { isFatal, phase: 'global' });
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });

  if (typeof globalThis !== 'undefined') {
    globalThis.addEventListener?.('unhandledrejection', (event: any) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      captureError(error, { phase: 'unhandledRejection' });
    });
  }
}
