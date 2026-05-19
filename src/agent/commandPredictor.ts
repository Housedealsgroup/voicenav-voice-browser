// VoiceNav Smart Command Predictor — context-aware command suggestions
// Learns from user behavior, page context, time of day, and command patterns

export type PredictionContext = {
  pageType?: string;
  currentUrl?: string;
  pageTitle?: string;
  hasSearch?: boolean;
  hasLoginForm?: boolean;
  hasCart?: boolean;
  hasVideo?: boolean;
  hasPagination?: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  recentCommands?: string[];
  sessionDuration?: number;
  elementCount?: number;
};

export type CommandPrediction = {
  command: string;
  confidence: number;
  reason: string;
  category: 'contextual' | 'habitual' | 'temporal' | 'sequential';
};

// Command patterns by page type
const PAGE_TYPE_COMMANDS: Record<string, Array<{ cmd: string; weight: number }>> = {
  shopping: [
    { cmd: 'add to cart', weight: 0.9 },
    { cmd: 'compare prices', weight: 0.85 },
    { cmd: 'sort by price', weight: 0.8 },
    { cmd: 'filter results', weight: 0.75 },
    { cmd: 'read reviews', weight: 0.7 },
    { cmd: 'buy', weight: 0.65 },
    { cmd: 'search for', weight: 0.6 },
  ],
  product_listing: [
    { cmd: 'click the first result', weight: 0.9 },
    { cmd: 'sort by price', weight: 0.85 },
    { cmd: 'filter results', weight: 0.8 },
    { cmd: 'read this page', weight: 0.7 },
    { cmd: 'compare prices', weight: 0.65 },
  ],
  search_results: [
    { cmd: 'click the first result', weight: 0.95 },
    { cmd: 'click the second result', weight: 0.7 },
    { cmd: 'read this page', weight: 0.65 },
    { cmd: 'refine search', weight: 0.6 },
    { cmd: 'next page', weight: 0.55 },
  ],
  news: [
    { cmd: 'read this page', weight: 0.9 },
    { cmd: 'scroll down', weight: 0.8 },
    { cmd: 'summarize', weight: 0.75 },
    { cmd: 'click the first article', weight: 0.7 },
    { cmd: 'bookmark this page', weight: 0.5 },
  ],
  email: [
    { cmd: 'read latest email', weight: 0.9 },
    { cmd: 'compose', weight: 0.8 },
    { cmd: 'search for', weight: 0.7 },
    { cmd: 'click the first email', weight: 0.65 },
  ],
  video: [
    { cmd: 'play', weight: 0.9 },
    { cmd: 'pause', weight: 0.7 },
    { cmd: 'read description', weight: 0.5 },
  ],
  social: [
    { cmd: 'scroll down', weight: 0.85 },
    { cmd: 'read this page', weight: 0.7 },
    { cmd: 'compose', weight: 0.6 },
    { cmd: 'search for', weight: 0.5 },
  ],
  auth: [
    { cmd: 'sign in', weight: 0.9 },
    { cmd: 'create account', weight: 0.7 },
    { cmd: 'fill form', weight: 0.6 },
  ],
  reference: [
    { cmd: 'read this page', weight: 0.9 },
    { cmd: 'find on page', weight: 0.8 },
    { cmd: 'bookmark this page', weight: 0.6 },
    { cmd: 'scroll down', weight: 0.5 },
  ],
};

// Sequential command patterns — what users typically say after X
const SEQUENTIAL_PATTERNS: Record<string, Array<{ next: string; weight: number }>> = {
  'search for': [
    { next: 'click the first result', weight: 0.85 },
    { next: 'read this page', weight: 0.5 },
  ],
  'go to': [
    { next: 'read this page', weight: 0.6 },
    { next: 'search for', weight: 0.5 },
    { next: 'sign in', weight: 0.4 },
  ],
  'read this page': [
    { next: 'scroll down', weight: 0.7 },
    { next: 'bookmark this page', weight: 0.4 },
    { next: 'go back', weight: 0.35 },
  ],
  'scroll down': [
    { next: 'scroll down', weight: 0.6 },
    { next: 'read this page', weight: 0.4 },
    { next: 'click', weight: 0.3 },
  ],
  'add to cart': [
    { next: 'checkout', weight: 0.8 },
    { next: 'go back', weight: 0.4 },
    { next: 'search for', weight: 0.3 },
  ],
  'click': [
    { next: 'read this page', weight: 0.6 },
    { next: 'go back', weight: 0.4 },
    { next: 'scroll down', weight: 0.3 },
  ],
  'go back': [
    { next: 'click', weight: 0.5 },
    { next: 'search for', weight: 0.4 },
    { next: 'read this page', weight: 0.3 },
  ],
  'sign in': [
    { next: 'read this page', weight: 0.7 },
    { next: 'compose', weight: 0.5 },
    { next: 'search for', weight: 0.4 },
  ],
};

// Time-of-day command patterns
const TEMPORAL_PATTERNS: Record<string, Array<{ cmd: string; weight: number }>> = {
  morning: [
    { cmd: 'go to gmail', weight: 0.7 },
    { cmd: 'go to news', weight: 0.65 },
    { cmd: 'go to calendar', weight: 0.6 },
    { cmd: 'check email', weight: 0.55 },
    { cmd: 'read news', weight: 0.5 },
  ],
  afternoon: [
    { cmd: 'search for', weight: 0.6 },
    { cmd: 'go to slack', weight: 0.55 },
    { cmd: 'go to drive', weight: 0.5 },
  ],
  evening: [
    { cmd: 'go to youtube', weight: 0.6 },
    { cmd: 'go to netflix', weight: 0.55 },
    { cmd: 'go to reddit', weight: 0.5 },
    { cmd: 'play', weight: 0.45 },
  ],
  night: [
    { cmd: 'go to youtube', weight: 0.5 },
    { cmd: 'go to reddit', weight: 0.45 },
    { cmd: 'go to twitter', weight: 0.4 },
  ],
};

// Habit tracking — stores command frequency
const commandFrequency: Record<string, number> = {};
const commandSequences: Array<{ from: string; to: string }> = [];
const MAX_SEQUENCE_HISTORY = 100;

export function recordCommand(command: string): void {
  const normalized = command.toLowerCase().trim();
  const intent = normalized.split(/\s+/).slice(0, 2).join(' ');
  commandFrequency[intent] = (commandFrequency[intent] || 0) + 1;

  if (commandSequences.length > 0) {
    const last = commandSequences[commandSequences.length - 1];
    commandSequences.push({ from: last.to, to: intent });
  } else {
    commandSequences.push({ from: '', to: intent });
  }

  if (commandSequences.length > MAX_SEQUENCE_HISTORY) {
    commandSequences.splice(0, commandSequences.length - MAX_SEQUENCE_HISTORY);
  }
}

export function predictCommands(context: PredictionContext): CommandPrediction[] {
  const predictions: CommandPrediction[] = [];
  const seen = new Set<string>();

  // 1. Contextual predictions based on page type
  if (context.pageType) {
    const pageCommands = PAGE_TYPE_COMMANDS[context.pageType] || [];
    for (const { cmd, weight } of pageCommands) {
      if (!seen.has(cmd)) {
        seen.add(cmd);
        predictions.push({
          command: cmd,
          confidence: weight * 0.9,
          reason: `Common on ${context.pageType.replace(/_/g, ' ')} pages`,
          category: 'contextual',
        });
      }
    }
  }

  // 2. Feature-based predictions
  if (context.hasSearch && !seen.has('search for')) {
    seen.add('search for');
    predictions.push({
      command: 'search for',
      confidence: 0.75,
      reason: 'This page has a search bar',
      category: 'contextual',
    });
  }
  if (context.hasCart && !seen.has('add to cart')) {
    seen.add('add to cart');
    predictions.push({
      command: 'add to cart',
      confidence: 0.8,
      reason: 'This page has a cart button',
      category: 'contextual',
    });
  }
  if (context.hasLoginForm && !seen.has('sign in')) {
    seen.add('sign in');
    predictions.push({
      command: 'sign in',
      confidence: 0.7,
      reason: 'Login form detected',
      category: 'contextual',
    });
  }
  if (context.hasVideo && !seen.has('play')) {
    seen.add('play');
    predictions.push({
      command: 'play',
      confidence: 0.75,
      reason: 'Video detected on page',
      category: 'contextual',
    });
  }

  // 3. Sequential predictions based on last command
  if (context.recentCommands && context.recentCommands.length > 0) {
    const lastCmd = context.recentCommands[context.recentCommands.length - 1].toLowerCase();
    const lastIntent = lastCmd.split(/\s+/).slice(0, 2).join(' ');

    // Check predefined patterns
    const seqPatterns = SEQUENTIAL_PATTERNS[lastIntent] || [];
    for (const { next, weight } of seqPatterns) {
      if (!seen.has(next)) {
        seen.add(next);
        predictions.push({
          command: next,
          confidence: weight * 0.85,
          reason: `Often follows "${lastIntent}"`,
          category: 'sequential',
        });
      }
    }

    // Check learned patterns
    const learnedNext = getLearnedSequences(lastIntent);
    for (const { cmd, weight } of learnedNext) {
      if (!seen.has(cmd)) {
        seen.add(cmd);
        predictions.push({
          command: cmd,
          confidence: weight * 0.7,
          reason: 'Based on your patterns',
          category: 'habitual',
        });
      }
    }
  }

  // 4. Temporal predictions
  if (context.timeOfDay) {
    const temporal = TEMPORAL_PATTERNS[context.timeOfDay] || [];
    for (const { cmd, weight } of temporal) {
      if (!seen.has(cmd)) {
        seen.add(cmd);
        predictions.push({
          command: cmd,
          confidence: weight * 0.5,
          reason: `Common ${context.timeOfDay} command`,
          category: 'temporal',
        });
      }
    }
  }

  // 5. Habitual predictions based on frequency
  const sortedHabits = Object.entries(commandFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxFreq = sortedHabits[0]?.[1] || 1;
  for (const [cmd, freq] of sortedHabits) {
    if (!seen.has(cmd)) {
      seen.add(cmd);
      predictions.push({
        command: cmd,
        confidence: (freq / maxFreq) * 0.4,
        reason: 'Your most used command',
        category: 'habitual',
      });
    }
  }

  // Sort by confidence and return top predictions
  predictions.sort((a, b) => b.confidence - a.confidence);
  return predictions.slice(0, 8);
}

function getLearnedSequences(fromIntent: string): Array<{ cmd: string; weight: number }> {
  const nextCounts: Record<string, number> = {};
  for (const seq of commandSequences) {
    if (seq.from === fromIntent) {
      nextCounts[seq.to] = (nextCounts[seq.to] || 0) + 1;
    }
  }

  const total = Object.values(nextCounts).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  return Object.entries(nextCounts)
    .map(([cmd, count]) => ({ cmd, weight: count / total }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);
}

export function getTopCommands(limit: number = 5): Array<{ command: string; count: number }> {
  return Object.entries(commandFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([command, count]) => ({ command, count }));
}

export function getCommandStats(): {
  totalCommands: number;
  uniqueCommands: number;
  topCommand: string | null;
  averagePerSession: number;
} {
  const entries = Object.entries(commandFrequency);
  const totalCommands = entries.reduce((a, [, b]) => a + b, 0);
  const topEntry = entries.sort((a, b) => b[1] - a[1])[0];
  return {
    totalCommands,
    uniqueCommands: entries.length,
    topCommand: topEntry?.[0] || null,
    averagePerSession: totalCommands,
  };
}

export function resetPredictor(): void {
  for (const key of Object.keys(commandFrequency)) {
    delete commandFrequency[key];
  }
  commandSequences.length = 0;
}
