// VoiceNav Performance Monitor — v10
// Tracks app performance, response times, and resource usage
// Provides voice-readable performance reports

import { logger } from '../utils/logger';

export type PerfMetric = {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'voice' | 'navigation' | 'render' | 'memory' | 'network';
};

export type PerfReport = {
  avgVoiceLatency: number;
  avgNavigationTime: number;
  avgRenderTime: number;
  commandSuccessRate: number;
  totalCommands: number;
  uptime: number;
  metrics: PerfMetric[];
  bottlenecks: string[];
  recommendations: string[];
};

const metrics: PerfMetric[] = [];
const MAX_METRICS = 1000;
let startTime = Date.now();

// Timers for measuring operations
const timers: Map<string, number> = new Map();

export function startTimer(name: string): void {
  timers.set(name, Date.now());
}

export function endTimer(name: string, category: PerfMetric['category'] = 'navigation'): number {
  const start = timers.get(name);
  if (!start) return 0;

  const duration = Date.now() - start;
  timers.delete(name);

  recordMetric(name, duration, 'ms', category);
  return duration;
}

export function recordMetric(
  name: string,
  value: number,
  unit: string,
  category: PerfMetric['category']
): void {
  metrics.push({
    name,
    value,
    unit,
    timestamp: Date.now(),
    category,
  });

  if (metrics.length > MAX_METRICS) {
    metrics.splice(0, metrics.length - MAX_METRICS);
  }
}

export function recordVoiceLatency(latencyMs: number): void {
  recordMetric('voice_recognition', latencyMs, 'ms', 'voice');
}

export function recordNavigationTime(timeMs: number): void {
  recordMetric('navigation', timeMs, 'ms', 'navigation');
}

export function recordRenderTime(timeMs: number): void {
  recordMetric('render', timeMs, 'ms', 'render');
}

export function recordCommandResult(success: boolean): void {
  recordMetric('command_result', success ? 1 : 0, 'bool', 'voice');
}

export function getMetricsByName(name: string, limit = 100): PerfMetric[] {
  return metrics
    .filter(m => m.name === name)
    .slice(-limit);
}

export function getMetricsByCategory(category: PerfMetric['category'], limit = 100): PerfMetric[] {
  return metrics
    .filter(m => m.category === category)
    .slice(-limit);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function generateReport(): PerfReport {
  const voiceMetrics = metrics.filter(m => m.category === 'voice');
  const navMetrics = metrics.filter(m => m.category === 'navigation');
  const renderMetrics = metrics.filter(m => m.category === 'render');
  const commandResults = metrics.filter(m => m.name === 'command_result');

  const voiceLatencies = voiceMetrics
    .filter(m => m.name === 'voice_recognition')
    .map(m => m.value);

  const navTimes = navMetrics.map(m => m.value);
  const renderTimes = renderMetrics.map(m => m.value);

  const successfulCommands = commandResults.filter(m => m.value === 1).length;
  const totalCommands = commandResults.length;
  const successRate = totalCommands > 0 ? successfulCommands / totalCommands : 1;

  // Identify bottlenecks
  const bottlenecks: string[] = [];
  if (average(voiceLatencies) > 2000) bottlenecks.push('Voice recognition is slow (>2s average)');
  if (average(navTimes) > 3000) bottlenecks.push('Page navigation is slow (>3s average)');
  if (average(renderTimes) > 1000) bottlenecks.push('Rendering is slow (>1s average)');
  if (percentile(voiceLatencies, 95) > 5000) bottlenecks.push('Voice recognition has high tail latency (p95 >5s)');
  if (successRate < 0.8) bottlenecks.push('Command success rate is below 80%');

  // Recommendations
  const recommendations: string[] = [];
  if (bottlenecks.length === 0) {
    recommendations.push('Performance is good! No major issues detected.');
  } else {
    if (average(voiceLatencies) > 2000) recommendations.push('Consider reducing audio processing quality for faster recognition');
    if (average(navTimes) > 3000) recommendations.push('Check network conditions or enable offline caching');
    if (successRate < 0.8) recommendations.push('Review failed commands to improve NLU accuracy');
  }

  return {
    avgVoiceLatency: Math.round(average(voiceLatencies)),
    avgNavigationTime: Math.round(average(navTimes)),
    avgRenderTime: Math.round(average(renderTimes)),
    commandSuccessRate: Math.round(successRate * 100),
    totalCommands,
    uptime: Date.now() - startTime,
    metrics: metrics.slice(-50),
    bottlenecks,
    recommendations,
  };
}

export function speakPerformanceReport(): string {
  const report = generateReport();
  const parts: string[] = [];

  parts.push('Performance report.');

  if (report.avgVoiceLatency > 0) {
    parts.push(`Average voice recognition time: ${report.avgVoiceLatency} milliseconds.`);
  }

  if (report.avgNavigationTime > 0) {
    parts.push(`Average page load time: ${report.avgNavigationTime} milliseconds.`);
  }

  parts.push(`Command success rate: ${report.commandSuccessRate} percent.`);
  parts.push(`Total commands processed: ${report.totalCommands}.`);

  const uptimeMinutes = Math.floor(report.uptime / 60000);
  parts.push(`Uptime: ${uptimeMinutes} minutes.`);

  if (report.bottlenecks.length > 0) {
    parts.push(`Issues detected: ${report.bottlenecks[0]}.`);
  } else {
    parts.push('No performance issues detected.');
  }

  return parts.join(' ');
}

export function getVoiceLatencyStats(): {
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
} {
  const latencies = metrics
    .filter(m => m.name === 'voice_recognition')
    .map(m => m.value);

  if (latencies.length === 0) {
    return { avg: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0 };
  }

  return {
    avg: Math.round(average(latencies)),
    p50: Math.round(percentile(latencies, 50)),
    p95: Math.round(percentile(latencies, 95)),
    p99: Math.round(percentile(latencies, 99)),
    min: Math.round(Math.min(...latencies)),
    max: Math.round(Math.max(...latencies)),
  };
}

export function resetMetrics(): void {
  metrics.length = 0;
  startTime = Date.now();
}
