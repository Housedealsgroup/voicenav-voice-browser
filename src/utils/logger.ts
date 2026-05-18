const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

// Patterns that may contain sensitive data — stripped in production
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /auth/i,
  /credential/i,
  /cookie/i,
  /session/i,
  /email/i,
  /phone/i,
  /credit.?card/i,
  /ssn/i,
];

function sanitizeForProduction(args: any[]): any[] {
  if (__DEV__) return args;
  return args.map(arg => {
    if (typeof arg === 'string') {
      // Truncate long strings in production
      if (arg.length > 200) return arg.substring(0, 200) + '...';
      return arg;
    }
    if (typeof arg === 'object' && arg !== null) {
      try {
        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(arg)) {
          if (SENSITIVE_PATTERNS.some(p => p.test(key))) {
            sanitized[key] = '[REDACTED]';
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      } catch {
        return '[Object]';
      }
    }
    return arg;
  });
}

class Logger {
  private level: LogLevel = __DEV__ ? 'debug' : 'warn';
  private prefix = '[VoiceNav]';

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  debug(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(this.prefix, '[DEBUG]', ...sanitizeForProduction(args));
    }
  }

  info(...args: any[]) {
    if (this.shouldLog('info')) {
      console.log(this.prefix, '[INFO]', ...sanitizeForProduction(args));
    }
  }

  warn(...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(this.prefix, '[WARN]', ...sanitizeForProduction(args));
    }
  }

  error(...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(this.prefix, '[ERROR]', ...sanitizeForProduction(args));
    }
  }

  agent(action: string, details?: any) {
    if (this.shouldLog('info')) {
      console.log(this.prefix, '[AGENT]', action, ...sanitizeForProduction([details || '']));
    }
  }

  voice(event: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.log(this.prefix, '[VOICE]', event, ...sanitizeForProduction([data || '']));
    }
  }

  browser(event: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.log(this.prefix, '[BROWSER]', event, ...sanitizeForProduction([data || '']));
    }
  }
}

export const logger = new Logger();
