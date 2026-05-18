// VoiceNav Command Predictor Tests
import {
  predictCommands,
  recordCommand,
  getTopCommands,
  getCommandStats,
  resetPredictor,
  type PredictionContext,
} from '../commandPredictor';

describe('Command Predictor', () => {
  beforeEach(() => {
    resetPredictor();
  });

  test('predicts commands for shopping page', () => {
    const ctx: PredictionContext = { pageType: 'shopping' };
    const predictions = predictCommands(ctx);
    expect(predictions.length).toBeGreaterThan(0);
    expect(predictions.some(p => p.command.includes('cart'))).toBe(true);
  });

  test('predicts commands for search results', () => {
    const ctx: PredictionContext = { pageType: 'search_results' };
    const predictions = predictCommands(ctx);
    expect(predictions.some(p => p.command.includes('click'))).toBe(true);
  });

  test('predicts based on page features', () => {
    const ctx: PredictionContext = { hasSearch: true, hasCart: true };
    const predictions = predictCommands(ctx);
    expect(predictions.some(p => p.command.includes('search'))).toBe(true);
    expect(predictions.some(p => p.command.includes('cart'))).toBe(true);
  });

  test('predicts sequential commands', () => {
    const ctx: PredictionContext = {
      recentCommands: ['search for headphones'],
    };
    const predictions = predictCommands(ctx);
    expect(predictions.some(p => p.command.includes('click'))).toBe(true);
  });

  test('learns from command frequency', () => {
    recordCommand('go to google');
    recordCommand('go to google');
    recordCommand('go to google');
    const stats = getCommandStats();
    expect(stats.totalCommands).toBe(3);
  });

  test('top commands are sorted by frequency', () => {
    recordCommand('scroll down');
    recordCommand('scroll down');
    recordCommand('go to google');
    const top = getTopCommands(2);
    expect(top[0].command).toBe('scroll down');
    expect(top[0].count).toBe(2);
  });

  test('temporal predictions work', () => {
    const ctx: PredictionContext = { timeOfDay: 'morning' };
    const predictions = predictCommands(ctx);
    expect(predictions.some(p => p.command.includes('email') || p.command.includes('news'))).toBe(true);
  });

  test('empty context returns some predictions', () => {
    const predictions = predictCommands({});
    expect(predictions).toBeDefined();
  });
});
