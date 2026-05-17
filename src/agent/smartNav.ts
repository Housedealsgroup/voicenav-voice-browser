// VoiceNav Smart Navigation Engine — v9
// Learns browsing patterns, builds navigation graphs, optimizes paths
// Route prediction, back-stack intelligence, tab-aware navigation

import { logger } from '../utils/logger';

export type NavNode = {
  url: string;
  title: string;
  visitCount: number;
  lastVisited: number;
  avgDwellTime: number;
  transitions: Record<string, number>; // url -> count
  pageType?: string;
};

export type NavPath = {
  from: string;
  to: string;
  steps: string[];
  estimatedTime: number;
  confidence: number;
};

export type NavSuggestion = {
  url: string;
  title: string;
  reason: string;
  confidence: number;
  estimatedTime: number;
};

type NavGraph = Record<string, NavNode>;

const graph: NavGraph = {};
const backStack: string[] = [];
const forwardStack: string[] = [];
let dwellStart = 0;
let currentUrl = '';

export function recordNavigation(url: string, title: string, pageType?: string): void {
  const now = Date.now();

  // Record dwell time on previous page
  if (currentUrl && graph[currentUrl] && dwellStart > 0) {
    const dwell = now - dwellStart;
    const node = graph[currentUrl];
    node.avgDwellTime = (node.avgDwellTime * node.visitCount + dwell) / (node.visitCount + 1);
  }

  // Update transition graph
  if (currentUrl && currentUrl !== url) {
    if (!graph[currentUrl]) {
      graph[currentUrl] = { url: currentUrl, title: '', visitCount: 0, lastVisited: 0, avgDwellTime: 0, transitions: {} };
    }
    graph[currentUrl].transitions[url] = (graph[currentUrl].transitions[url] || 0) + 1;

    // Push to back stack
    backStack.push(currentUrl);
    forwardStack.length = 0; // Clear forward stack on new navigation
  }

  // Create or update node
  if (!graph[url]) {
    graph[url] = { url, title: title || url, visitCount: 0, lastVisited: 0, avgDwellTime: 0, transitions: {}, pageType };
  }
  graph[url].visitCount++;
  graph[url].lastVisited = now;
  if (title) graph[url].title = title;
  if (pageType) graph[url].pageType = pageType;

  currentUrl = url;
  dwellStart = now;

  logger.agent('smartNav', { event: 'navigation', url, title, backStackDepth: backStack.length });
}

export function goBack(): string | null {
  if (backStack.length === 0) return null;
  const prev = backStack.pop()!;
  forwardStack.push(currentUrl);
  currentUrl = prev;
  dwellStart = Date.now();
  return prev;
}

export function goForward(): string | null {
  if (forwardStack.length === 0) return null;
  const next = forwardStack.pop()!;
  backStack.push(currentUrl);
  currentUrl = next;
  dwellStart = Date.now();
  return next;
}

export function getBackStack(): string[] {
  return [...backStack];
}

export function getForwardStack(): string[] {
  return [...forwardStack];
}

export function predictNextUrls(limit = 5): NavSuggestion[] {
  const current = graph[currentUrl];
  if (!current) return [];

  const suggestions: NavSuggestion[] = [];

  // 1. Transition-based predictions (pages commonly visited after current)
  const transitions = Object.entries(current.transitions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  for (const [url, count] of transitions) {
    const node = graph[url];
    if (node) {
      suggestions.push({
        url,
        title: node.title,
        reason: `You usually visit this after ${current.title}`,
        confidence: Math.min(0.95, 0.6 + (count / current.visitCount) * 0.35),
        estimatedTime: node.avgDwellTime,
      });
    }
  }

  // 2. Frequently visited pages
  const frequent = Object.values(graph)
    .filter(n => n.url !== currentUrl && !suggestions.find(s => s.url === n.url))
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, 2);

  for (const node of frequent) {
    suggestions.push({
      url: node.url,
      title: node.title,
      reason: `Visited ${node.visitCount} times`,
      confidence: Math.min(0.85, 0.4 + node.visitCount * 0.05),
      estimatedTime: node.avgDwellTime,
    });
  }

  // 3. Recently visited
  const recent = Object.values(graph)
    .filter(n => n.url !== currentUrl && !suggestions.find(s => s.url === n.url))
    .sort((a, b) => b.lastVisited - a.lastVisited)
    .slice(0, 2);

  for (const node of recent) {
    suggestions.push({
      url: node.url,
      title: node.title,
      reason: 'Recently visited',
      confidence: 0.5,
      estimatedTime: node.avgDwellTime,
    });
  }

  return suggestions.slice(0, limit);
}

export function findPath(from: string, to: string): NavPath | null {
  // BFS to find shortest path in navigation graph
  if (from === to) return { from, to, steps: [from], estimatedTime: 0, confidence: 1 };

  const visited = new Set<string>();
  const queue: Array<{ url: string; path: string[] }> = [{ url: from, path: [from] }];
  visited.add(from);

  while (queue.length > 0) {
    const { url, path } = queue.shift()!;
    const node = graph[url];
    if (!node) continue;

    for (const nextUrl of Object.keys(node.transitions)) {
      if (nextUrl === to) {
        return {
          from,
          to,
          steps: [...path, nextUrl],
          estimatedTime: path.length * 5000, // rough estimate
          confidence: Math.max(0.5, 1 - path.length * 0.15),
        };
      }
      if (!visited.has(nextUrl)) {
        visited.add(nextUrl);
        queue.push({ url: nextUrl, path: [...path, nextUrl] });
      }
    }
  }

  return null;
}

export function getNavigationStats(): {
  totalPages: number;
  totalNavigations: number;
  mostVisited: NavNode | null;
  avgSessionLength: number;
  graphSize: number;
} {
  const nodes = Object.values(graph);
  const mostVisited = nodes.reduce((max, n) => n.visitCount > (max?.visitCount || 0) ? n : max, null as NavNode | null);
  const totalNavigations = nodes.reduce((sum, n) => sum + n.visitCount, 0);

  return {
    totalPages: nodes.length,
    totalNavigations,
    mostVisited,
    avgSessionLength: nodes.length > 0 ? totalNavigations / nodes.length : 0,
    graphSize: Object.values(graph).reduce((sum, n) => sum + Object.keys(n.transitions).length, 0),
  };
}

export function getMostVisited(limit = 10): NavNode[] {
  return Object.values(graph)
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, limit);
}

export function clearNavigationGraph(): void {
  for (const key of Object.keys(graph)) delete graph[key];
  backStack.length = 0;
  forwardStack.length = 0;
  currentUrl = '';
  dwellStart = 0;
}

export function getNavigationGraph(): NavGraph {
  return { ...graph };
}
