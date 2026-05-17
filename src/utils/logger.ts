const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

class Logger {
  private level: LogLevel = 'info';
  private prefix = '[VoiceNav]';

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  debug(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(this.prefix, '[DEBUG]', ...args);
    }
  }

  info(...args: any[]) {
    if (this.shouldLog('info')) {
      console.log(this.prefix, '[INFO]', ...args);
    }
  }

  warn(...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(this.prefix, '[WARN]', ...args);
    }
  }

  error(...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(this.prefix, '[ERROR]', ...args);
    }
  }

  agent(action: string, details?: any) {
    if (this.shouldLog('info')) {
      console.log(this.prefix, '[AGENT]', action, details || '');
    }
  }

  voice(event: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.log(this.prefix, '[VOICE]', event, data || '');
    }
  }

  browser(event: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.log(this.prefix, '[BROWSER]', event, data || '');
    }
  }
}

export const logger = new Logger();
