// VoiceNav Crash Reporting — Sentry integration for production error tracking

export function initCrashReporting(_dsn?: string) {
  // Sentry integration point
  // When @sentry/react-native is installed, uncomment:
  // Sentry.init({ dsn, tracesSampleRate: 0.2, environment: __DEV__ ? 'development' : 'production' });
}

export function captureError(error: Error, context?: Record<string, any>) {
  console.error('[VoiceNav] Error:', error.message, context);
  // Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: string = 'info') {
  console.log(`[VoiceNav] [${level}]:`, message);
  // Sentry.captureMessage(message, level);
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
