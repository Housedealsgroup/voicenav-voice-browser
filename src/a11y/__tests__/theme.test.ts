import {
  COLORS,
  MIN_TOUCH_TARGET,
  ACCESSIBILITY_SCALE,
  SPACING,
  FONT_SIZE,
  RADIUS,
  type ThemeName,
  type ThemeColors,
} from '../theme';

// Helper: check if a hex color is valid
function isValidHex(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

// Helper: parse hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

// Helper: calculate relative luminance (WCAG 2.1)
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Helper: calculate contrast ratio between two colors
function contrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const themeNames: ThemeName[] = ['dark', 'light', 'highContrast', 'amoled'];

const requiredColorKeys: Array<keyof ThemeColors> = [
  'background', 'surface', 'surfaceLight', 'primary', 'primaryLight',
  'accent', 'success', 'warning', 'error', 'text', 'textSecondary',
  'textMuted', 'border', 'card', 'overlay', 'gradient', 'mic',
  'micGlow', 'waveform', 'taskActive', 'taskComplete', 'taskPending',
];

describe('Theme', () => {
  describe('COLORS — Theme Structure', () => {
    it('has 4 themes', () => {
      expect(Object.keys(COLORS)).toHaveLength(4);
    });

    it('has dark theme', () => {
      expect(COLORS.dark).toBeDefined();
    });

    it('has light theme', () => {
      expect(COLORS.light).toBeDefined();
    });

    it('has highContrast theme', () => {
      expect(COLORS.highContrast).toBeDefined();
    });

    it('has amoled theme', () => {
      expect(COLORS.amoled).toBeDefined();
    });

    it('all themes have required color properties', () => {
      themeNames.forEach(name => {
        const theme = COLORS[name];
        requiredColorKeys.forEach(key => {
          expect(theme[key]).toBeDefined();
        });
      });
    });

    it('all themes have valid hex colors', () => {
      themeNames.forEach(name => {
        const theme = COLORS[name];
        const hexKeys = requiredColorKeys.filter(k => k !== 'gradient' && k !== 'overlay' && k !== 'micGlow');
        hexKeys.forEach(key => {
          const value = theme[key] as string;
          expect(isValidHex(value)).toBe(true);
        });
      });
    });

    it('all themes have gradient as array of 2 colors', () => {
      themeNames.forEach(name => {
        const theme = COLORS[name];
        expect(Array.isArray(theme.gradient)).toBe(true);
        expect(theme.gradient).toHaveLength(2);
        theme.gradient.forEach(color => {
          expect(isValidHex(color)).toBe(true);
        });
      });
    });
  });

  describe('Dark Theme', () => {
    it('has dark background', () => {
      expect(COLORS.dark.background).toBe('#0B0B1E');
    });

    it('has white text', () => {
      expect(COLORS.dark.text).toBe('#FFFFFF');
    });

    it('has purple primary', () => {
      expect(COLORS.dark.primary).toBe('#7C5CFC');
    });

    it('has cyan accent', () => {
      expect(COLORS.dark.accent).toBe('#00E5FF');
    });

    it('text has sufficient contrast on background', () => {
      const ratio = contrastRatio(COLORS.dark.text, COLORS.dark.background);
      expect(ratio).toBeGreaterThan(4.5);
    });
  });

  describe('Light Theme', () => {
    it('has light background', () => {
      expect(COLORS.light.background).toBe('#F8F8FF');
    });

    it('has dark text', () => {
      expect(COLORS.light.text).toBe('#1A1A2E');
    });

    it('text has sufficient contrast on background', () => {
      const ratio = contrastRatio(COLORS.light.text, COLORS.light.background);
      expect(ratio).toBeGreaterThan(4.5);
    });
  });

  describe('High Contrast Theme', () => {
    it('has black background', () => {
      expect(COLORS.highContrast.background).toBe('#000000');
    });

    it('has white text', () => {
      expect(COLORS.highContrast.text).toBe('#FFFFFF');
    });

    it('has yellow primary', () => {
      expect(COLORS.highContrast.primary).toBe('#FFFF00');
    });

    it('has cyan accent', () => {
      expect(COLORS.highContrast.accent).toBe('#00FFFF');
    });

    it('has white border for visibility', () => {
      expect(COLORS.highContrast.border).toBe('#FFFFFF');
    });

    it('has red mic button for visibility', () => {
      expect(COLORS.highContrast.mic).toBe('#FF0000');
    });

    it('text has maximum contrast on background', () => {
      const ratio = contrastRatio(COLORS.highContrast.text, COLORS.highContrast.background);
      expect(ratio).toBe(21); // White on black = maximum
    });

    it('primary has sufficient contrast on background', () => {
      const ratio = contrastRatio(COLORS.highContrast.primary, COLORS.highContrast.background);
      expect(ratio).toBeGreaterThan(4.5);
    });

    it('accent has sufficient contrast on background', () => {
      const ratio = contrastRatio(COLORS.highContrast.accent, COLORS.highContrast.background);
      expect(ratio).toBeGreaterThan(4.5);
    });

    it('error color has sufficient contrast on background', () => {
      const ratio = contrastRatio(COLORS.highContrast.error, COLORS.highContrast.background);
      expect(ratio).toBeGreaterThan(4.5);
    });

    it('success color has sufficient contrast on background', () => {
      const ratio = contrastRatio(COLORS.highContrast.success, COLORS.highContrast.background);
      expect(ratio).toBeGreaterThan(4.5);
    });
  });

  describe('AMOLED Theme', () => {
    it('has pure black background', () => {
      expect(COLORS.amoled.background).toBe('#000000');
    });

    it('has pure black surface', () => {
      expect(COLORS.amoled.surface).toBe('#000000');
    });

    it('has white text', () => {
      expect(COLORS.amoled.text).toBe('#FFFFFF');
    });

    it('text has maximum contrast on background', () => {
      const ratio = contrastRatio(COLORS.amoled.text, COLORS.amoled.background);
      expect(ratio).toBe(21);
    });
  });

  describe('MIN_TOUCH_TARGET', () => {
    it('is defined', () => {
      expect(MIN_TOUCH_TARGET).toBeDefined();
    });

    it('is a number', () => {
      expect(typeof MIN_TOUCH_TARGET).toBe('number');
    });

    it('is at least 44 points (Apple HIG)', () => {
      expect(MIN_TOUCH_TARGET).toBeGreaterThanOrEqual(44);
    });

    it('equals 44', () => {
      expect(MIN_TOUCH_TARGET).toBe(44);
    });
  });

  describe('ACCESSIBILITY_SCALE', () => {
    it('is defined', () => {
      expect(ACCESSIBILITY_SCALE).toBeDefined();
    });

    it('has normal scale', () => {
      expect(ACCESSIBILITY_SCALE.normal).toBe(1);
    });

    it('has large scale', () => {
      expect(ACCESSIBILITY_SCALE.large).toBe(1.15);
    });

    it('has extraLarge scale', () => {
      expect(ACCESSIBILITY_SCALE.extraLarge).toBe(1.3);
    });

    it('has maximum scale', () => {
      expect(ACCESSIBILITY_SCALE.maximum).toBe(1.5);
    });

    it('scales are in ascending order', () => {
      expect(ACCESSIBILITY_SCALE.normal).toBeLessThan(ACCESSIBILITY_SCALE.large);
      expect(ACCESSIBILITY_SCALE.large).toBeLessThan(ACCESSIBILITY_SCALE.extraLarge);
      expect(ACCESSIBILITY_SCALE.extraLarge).toBeLessThan(ACCESSIBILITY_SCALE.maximum);
    });

    it('normal scale is 1.0', () => {
      expect(ACCESSIBILITY_SCALE.normal).toBe(1);
    });

    it('maximum scale is 1.5', () => {
      expect(ACCESSIBILITY_SCALE.maximum).toBe(1.5);
    });
  });

  describe('SPACING', () => {
    it('is defined', () => {
      expect(SPACING).toBeDefined();
    });

    it('has xs spacing', () => {
      expect(SPACING.xs).toBe(4);
    });

    it('has sm spacing', () => {
      expect(SPACING.sm).toBe(8);
    });

    it('has md spacing', () => {
      expect(SPACING.md).toBe(16);
    });

    it('has lg spacing', () => {
      expect(SPACING.lg).toBe(24);
    });

    it('has xl spacing', () => {
      expect(SPACING.xl).toBe(32);
    });

    it('has xxl spacing', () => {
      expect(SPACING.xxl).toBe(48);
    });

    it('spacing values are in ascending order', () => {
      expect(SPACING.xs).toBeLessThan(SPACING.sm);
      expect(SPACING.sm).toBeLessThan(SPACING.md);
      expect(SPACING.md).toBeLessThan(SPACING.lg);
      expect(SPACING.lg).toBeLessThan(SPACING.xl);
      expect(SPACING.xl).toBeLessThan(SPACING.xxl);
    });
  });

  describe('FONT_SIZE', () => {
    it('is defined', () => {
      expect(FONT_SIZE).toBeDefined();
    });

    it('has xs font size', () => {
      expect(FONT_SIZE.xs).toBe(12);
    });

    it('has sm font size', () => {
      expect(FONT_SIZE.sm).toBe(14);
    });

    it('has md font size', () => {
      expect(FONT_SIZE.md).toBe(16);
    });

    it('has lg font size', () => {
      expect(FONT_SIZE.lg).toBe(20);
    });

    it('has xl font size', () => {
      expect(FONT_SIZE.xl).toBe(26);
    });

    it('has xxl font size', () => {
      expect(FONT_SIZE.xxl).toBe(34);
    });

    it('has hero font size', () => {
      expect(FONT_SIZE.hero).toBe(42);
    });

    it('font sizes are in ascending order', () => {
      expect(FONT_SIZE.xs).toBeLessThan(FONT_SIZE.sm);
      expect(FONT_SIZE.sm).toBeLessThan(FONT_SIZE.md);
      expect(FONT_SIZE.md).toBeLessThan(FONT_SIZE.lg);
      expect(FONT_SIZE.lg).toBeLessThan(FONT_SIZE.xl);
      expect(FONT_SIZE.xl).toBeLessThan(FONT_SIZE.xxl);
      expect(FONT_SIZE.xxl).toBeLessThan(FONT_SIZE.hero);
    });

    it('base font size is 16', () => {
      expect(FONT_SIZE.md).toBe(16);
    });
  });

  describe('RADIUS', () => {
    it('is defined', () => {
      expect(RADIUS).toBeDefined();
    });

    it('has sm radius', () => {
      expect(RADIUS.sm).toBe(8);
    });

    it('has md radius', () => {
      expect(RADIUS.md).toBe(12);
    });

    it('has lg radius', () => {
      expect(RADIUS.lg).toBe(16);
    });

    it('has xl radius', () => {
      expect(RADIUS.xl).toBe(24);
    });

    it('has full radius', () => {
      expect(RADIUS.full).toBe(9999);
    });

    it('radius values are in ascending order', () => {
      expect(RADIUS.sm).toBeLessThan(RADIUS.md);
      expect(RADIUS.md).toBeLessThan(RADIUS.lg);
      expect(RADIUS.lg).toBeLessThan(RADIUS.xl);
      expect(RADIUS.xl).toBeLessThan(RADIUS.full);
    });
  });

  describe('Cross-theme consistency', () => {
    it('all themes have same number of color keys', () => {
      const counts = themeNames.map(name => Object.keys(COLORS[name]).length);
      const unique = new Set(counts);
      expect(unique.size).toBe(1);
    });

    it('all themes have overlay as rgba string', () => {
      themeNames.forEach(name => {
        expect(COLORS[name].overlay).toMatch(/^rgba\(/);
      });
    });

    it('all themes have micGlow as rgba string', () => {
      themeNames.forEach(name => {
        expect(COLORS[name].micGlow).toMatch(/^rgba\(/);
      });
    });

    it('all themes have non-empty text color', () => {
      themeNames.forEach(name => {
        expect(COLORS[name].text.length).toBeGreaterThan(0);
      });
    });

    it('all themes have non-empty background color', () => {
      themeNames.forEach(name => {
        expect(COLORS[name].background.length).toBeGreaterThan(0);
      });
    });
  });
});
