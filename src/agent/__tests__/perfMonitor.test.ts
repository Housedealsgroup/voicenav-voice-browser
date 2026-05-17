import {
  startTimer, endTimer, recordMetric, recordVoiceLatency,
  recordNavigationTime, recordRenderTime, recordCommandResult,
  getMetricsByName, getMetricsByCategory, generateReport,
  speakPerformanceReport, getVoiceLatencyStats, resetMetrics,
} from '../perfMonitor';

describe('Performance Monitor', () => {
  beforeEach(() => {
    resetMetrics();
  });

  describe('startTimer() and endTimer()', () => {
    it('measures elapsed time', () => {
      startTimer('test-op');
      const duration = endTimer('test-op');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('returns 0 for non-existent timer', () => {
      expect(endTimer('nonexistent')).toBe(0);
    });

    it('records metric when timer ends', () => {
      startTimer('my-timer');
      endTimer('my-timer', 'voice');
      const metrics = getMetricsByName('my-timer');
      expect(metrics.length).toBe(1);
      expect(metrics[0].category).toBe('voice');
    });

    it('removes timer after ending', () => {
      startTimer('one-shot');
      endTimer('one-shot');
      expect(endTimer('one-shot')).toBe(0);
    });
  });

  describe('recordMetric()', () => {
    it('records a metric', () => {
      recordMetric('test', 42, 'ms', 'navigation');
      const metrics = getMetricsByName('test');
      expect(metrics.length).toBe(1);
      expect(metrics[0].value).toBe(42);
      expect(metrics[0].unit).toBe('ms');
    });

    it('respects MAX_METRICS limit', () => {
      for (let i = 0; i < 1100; i++) {
        recordMetric('overflow', i, 'ms', 'render');
      }
      const metrics = getMetricsByName('overflow');
      expect(metrics.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('recordVoiceLatency()', () => {
    it('records voice latency metric', () => {
      recordVoiceLatency(150);
      const metrics = getMetricsByName('voice_recognition');
      expect(metrics.length).toBe(1);
      expect(metrics[0].value).toBe(150);
      expect(metrics[0].category).toBe('voice');
    });
  });

  describe('recordNavigationTime()', () => {
    it('records navigation time metric', () => {
      recordNavigationTime(2000);
      const metrics = getMetricsByName('navigation');
      expect(metrics.length).toBe(1);
      expect(metrics[0].value).toBe(2000);
      expect(metrics[0].category).toBe('navigation');
    });
  });

  describe('recordRenderTime()', () => {
    it('records render time metric', () => {
      recordRenderTime(500);
      const metrics = getMetricsByName('render');
      expect(metrics.length).toBe(1);
      expect(metrics[0].value).toBe(500);
    });
  });

  describe('recordCommandResult()', () => {
    it('records successful command', () => {
      recordCommandResult(true);
      const metrics = getMetricsByName('command_result');
      expect(metrics[0].value).toBe(1);
    });

    it('records failed command', () => {
      recordCommandResult(false);
      const metrics = getMetricsByName('command_result');
      expect(metrics[0].value).toBe(0);
    });
  });

  describe('getMetricsByName()', () => {
    it('filters metrics by name', () => {
      recordVoiceLatency(100);
      recordVoiceLatency(200);
      recordNavigationTime(500);
      const voiceMetrics = getMetricsByName('voice_recognition');
      expect(voiceMetrics.length).toBe(2);
    });

    it('respects limit parameter', () => {
      for (let i = 0; i < 50; i++) recordVoiceLatency(i);
      const metrics = getMetricsByName('voice_recognition', 10);
      expect(metrics.length).toBe(10);
    });
  });

  describe('getMetricsByCategory()', () => {
    it('filters metrics by category', () => {
      recordVoiceLatency(100);
      recordNavigationTime(500);
      recordRenderTime(300);
      const voiceMetrics = getMetricsByCategory('voice');
      expect(voiceMetrics.length).toBe(1);
      const navMetrics = getMetricsByCategory('navigation');
      expect(navMetrics.length).toBe(1);
    });
  });

  describe('generateReport()', () => {
    it('returns a valid report with no data', () => {
      const report = generateReport();
      expect(report.avgVoiceLatency).toBe(0);
      expect(report.avgNavigationTime).toBe(0);
      expect(report.totalCommands).toBe(0);
      expect(report.commandSuccessRate).toBe(100); // default when no commands
      expect(report.bottlenecks).toEqual([]);
    });

    it('calculates averages correctly', () => {
      recordVoiceLatency(100);
      recordVoiceLatency(300);
      const report = generateReport();
      expect(report.avgVoiceLatency).toBe(200);
    });

    it('calculates success rate', () => {
      recordCommandResult(true);
      recordCommandResult(true);
      recordCommandResult(false);
      const report = generateReport();
      expect(report.commandSuccessRate).toBe(67); // 2/3 rounded
    });

    it('includes metrics in report', () => {
      recordVoiceLatency(100);
      const report = generateReport();
      expect(report.metrics.length).toBeGreaterThan(0);
    });

    it('detects slow voice bottleneck', () => {
      for (let i = 0; i < 10; i++) recordVoiceLatency(3000);
      const report = generateReport();
      expect(report.bottlenecks.some(b => b.includes('Voice recognition'))).toBe(true);
    });

    it('detects low success rate bottleneck', () => {
      for (let i = 0; i < 10; i++) recordCommandResult(false);
      recordCommandResult(true);
      const report = generateReport();
      expect(report.bottlenecks.some(b => b.includes('success rate'))).toBe(true);
    });

    it('includes uptime', () => {
      const report = generateReport();
      expect(report.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('speakPerformanceReport()', () => {
    it('returns a voice-readable string', () => {
      const spoken = speakPerformanceReport();
      expect(spoken).toContain('Performance report');
      expect(spoken).toContain('success rate');
      expect(spoken).toContain('Uptime');
    });

    it('includes voice latency when recorded', () => {
      recordVoiceLatency(150);
      const spoken = speakPerformanceReport();
      expect(spoken).toContain('voice recognition time');
    });

    it('includes navigation time when recorded', () => {
      recordNavigationTime(2000);
      const spoken = speakPerformanceReport();
      expect(spoken).toContain('page load time');
    });
  });

  describe('getVoiceLatencyStats()', () => {
    it('returns zeros when no data', () => {
      const stats = getVoiceLatencyStats();
      expect(stats.avg).toBe(0);
      expect(stats.p50).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
    });

    it('calculates correct stats', () => {
      recordVoiceLatency(100);
      recordVoiceLatency(200);
      recordVoiceLatency(300);
      const stats = getVoiceLatencyStats();
      expect(stats.avg).toBe(200);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(300);
      expect(stats.p50).toBeGreaterThan(0);
      expect(stats.p95).toBeGreaterThan(0);
    });
  });

  describe('resetMetrics()', () => {
    it('clears all metrics', () => {
      recordVoiceLatency(100);
      recordNavigationTime(500);
      resetMetrics();
      expect(getMetricsByName('voice_recognition')).toEqual([]);
      expect(getMetricsByName('navigation')).toEqual([]);
    });
  });
});
