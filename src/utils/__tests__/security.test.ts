import { isValidCommand, isRateLimited } from '../../agent/nlu';
import { logger } from '../logger';

// Helper: check if a hex color is valid
function isValidHex(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

describe('Security', () => {
  describe('isValidCommand — XSS Prevention', () => {
    it('rejects script tag injection', () => {
      expect(isValidCommand('<script>alert("xss")</script>')).toBe(false);
    });

    it('rejects script tag with attributes', () => {
      expect(isValidCommand('<script type="text/javascript">alert(1)</script>')).toBe(false);
    });

    it('rejects javascript: protocol', () => {
      expect(isValidCommand('javascript:void(0)')).toBe(false);
    });

    it('rejects javascript: with alert', () => {
      expect(isValidCommand('javascript:alert(document.cookie)')).toBe(false);
    });

    it('rejects data: protocol', () => {
      expect(isValidCommand('data:text/html,<h1>hi</h1>')).toBe(false);
    });

    it('rejects data: with base64', () => {
      expect(isValidCommand('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe(false);
    });

    it('rejects vbscript: protocol', () => {
      expect(isValidCommand('vbscript:msgbox("xss")')).toBe(false);
    });

    it('rejects onload event handler', () => {
      expect(isValidCommand('onload=alert(1)')).toBe(false);
    });

    it('rejects onclick event handler', () => {
      expect(isValidCommand('onclick=doEvil()')).toBe(false);
    });

    it('rejects onerror event handler', () => {
      expect(isValidCommand('onerror=alert(document.cookie)')).toBe(false);
    });

    it('rejects onmouseover event handler', () => {
      expect(isValidCommand('onmouseover=alert(1)')).toBe(false);
    });

    it('rejects onfocus event handler', () => {
      expect(isValidCommand('onfocus=alert(1)')).toBe(false);
    });

    it('rejects img tag with onerror', () => {
      expect(isValidCommand('<img src=x onerror=alert(1)>')).toBe(false);
    });

    it('rejects div with onclick', () => {
      expect(isValidCommand('<div onclick="alert(1)">click me</div>')).toBe(false);
    });
  });

  describe('isValidCommand — Command Injection Prevention', () => {
    it('rejects empty string', () => {
      expect(isValidCommand('')).toBe(false);
    });

    it('rejects null input', () => {
      expect(isValidCommand(null as any)).toBe(false);
    });

    it('rejects undefined input', () => {
      expect(isValidCommand(undefined as any)).toBe(false);
    });

    it('rejects numeric input', () => {
      expect(isValidCommand(123 as any)).toBe(false);
    });

    it('rejects boolean input', () => {
      expect(isValidCommand(true as any)).toBe(false);
    });

    it('rejects object input', () => {
      expect(isValidCommand({} as any)).toBe(false);
    });

    it('rejects array input', () => {
      expect(isValidCommand([] as any)).toBe(false);
    });

    it('rejects whitespace-only input', () => {
      expect(isValidCommand('   ')).toBe(false);
    });

    it('rejects tab-only input', () => {
      expect(isValidCommand('\t\t\t')).toBe(false);
    });

    it('rejects newline-only input', () => {
      expect(isValidCommand('\n\n\n')).toBe(false);
    });
  });

  describe('isValidCommand — Input Length Limits', () => {
    it('rejects input over 500 characters', () => {
      const longInput = 'a'.repeat(501);
      expect(isValidCommand(longInput)).toBe(false);
    });

    it('accepts input at exactly 500 characters', () => {
      const input = 'a'.repeat(500);
      expect(isValidCommand(input)).toBe(true);
    });

    it('accepts input at 499 characters', () => {
      const input = 'a'.repeat(499);
      expect(isValidCommand(input)).toBe(true);
    });

    it('rejects very long input', () => {
      const longInput = 'search for ' + 'x'.repeat(1000);
      expect(isValidCommand(longInput)).toBe(false);
    });

    it('accepts single character input', () => {
      expect(isValidCommand('a')).toBe(true);
    });
  });

  describe('isValidCommand — Filler Word Handling', () => {
    it('rejects filler-only input: um', () => {
      expect(isValidCommand('um')).toBe(false);
    });

    it('rejects filler-only input: uh', () => {
      expect(isValidCommand('uh')).toBe(false);
    });

    it('rejects filler-only input: um uh', () => {
      expect(isValidCommand('um uh')).toBe(false);
    });

    it('rejects filler-only input: ok so', () => {
      expect(isValidCommand('ok so')).toBe(false);
    });

    it('rejects filler-only input: like', () => {
      expect(isValidCommand('like')).toBe(false);
    });

    it('rejects filler-only input: hey', () => {
      expect(isValidCommand('hey')).toBe(false);
    });

    it('accepts mixed filler and command', () => {
      expect(isValidCommand('um search for headphones')).toBe(true);
    });

    it('accepts command with filler words', () => {
      expect(isValidCommand('so go to google')).toBe(true);
    });
  });

  describe('isValidCommand — Valid Inputs', () => {
    it('accepts normal voice command', () => {
      expect(isValidCommand('search for headphones')).toBe(true);
    });

    it('accepts navigation command', () => {
      expect(isValidCommand('go to amazon.com')).toBe(true);
    });

    it('accepts click command', () => {
      expect(isValidCommand('click the sign in button')).toBe(true);
    });

    it('accepts command with numbers', () => {
      expect(isValidCommand('click the 3rd result')).toBe(true);
    });

    it('accepts command with URL', () => {
      expect(isValidCommand('go to https://example.com')).toBe(true);
    });

    it('accepts command with special characters', () => {
      expect(isValidCommand("what's the price?")).toBe(true);
    });

    it('accepts command with unicode', () => {
      expect(isValidCommand('搜索耳机')).toBe(true);
    });

    it('accepts command with accented characters', () => {
      expect(isValidCommand('café résumé')).toBe(true);
    });
  });

  describe('isRateLimited — Rate Limiting', () => {
    it('returns a boolean', () => {
      const result = isRateLimited();
      expect(typeof result).toBe('boolean');
    });

    it('returns false under rate limit', () => {
      const result = isRateLimited();
      expect(result).toBe(false);
    });

    it('eventually returns true after exceeding limit', () => {
      // Call enough times to exceed the 30/minute limit
      for (let i = 0; i < 30; i++) {
        isRateLimited();
      }
      expect(isRateLimited()).toBe(true);
    });
  });

  describe('Logger', () => {
    it('logger is defined', () => {
      expect(logger).toBeDefined();
    });

    it('logger has debug method', () => {
      expect(typeof logger.debug).toBe('function');
    });

    it('logger has info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('logger has warn method', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('logger has error method', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('logger has agent method', () => {
      expect(typeof logger.agent).toBe('function');
    });

    it('logger has voice method', () => {
      expect(typeof logger.voice).toBe('function');
    });

    it('logger has browser method', () => {
      expect(typeof logger.browser).toBe('function');
    });

    it('logger has setLevel method', () => {
      expect(typeof logger.setLevel).toBe('function');
    });

    it('debug does not throw', () => {
      expect(() => logger.debug('test message')).not.toThrow();
    });

    it('info does not throw', () => {
      expect(() => logger.info('test message')).not.toThrow();
    });

    it('warn does not throw', () => {
      expect(() => logger.warn('test message')).not.toThrow();
    });

    it('error does not throw', () => {
      expect(() => logger.error('test message')).not.toThrow();
    });

    it('agent does not throw', () => {
      expect(() => logger.agent('testAction', { key: 'value' })).not.toThrow();
    });

    it('voice does not throw', () => {
      expect(() => logger.voice('testEvent', { data: 'test' })).not.toThrow();
    });

    it('browser does not throw', () => {
      expect(() => logger.browser('testEvent', { data: 'test' })).not.toThrow();
    });

    it('setLevel does not throw', () => {
      expect(() => logger.setLevel('warn')).not.toThrow();
    });

    it('handles object arguments', () => {
      expect(() => logger.info({ key: 'value', nested: { a: 1 } })).not.toThrow();
    });

    it('handles multiple arguments', () => {
      expect(() => logger.debug('arg1', 'arg2', { key: 'value' })).not.toThrow();
    });

    it('handles null arguments', () => {
      expect(() => logger.info(null)).not.toThrow();
    });

    it('handles undefined arguments', () => {
      expect(() => logger.info(undefined)).not.toThrow();
    });
  });
});
