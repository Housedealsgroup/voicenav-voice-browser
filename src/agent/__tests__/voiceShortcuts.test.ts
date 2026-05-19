// VoiceNav Voice Shortcuts Tests
import {
  isShortcutCommand,
  parseShortcutCreation,
  parseShortcutDeletion,
  matchShortcut,
  getBuiltInShortcuts,
  formatShortcutsList,
} from '../voiceShortcuts';

describe('Voice Shortcuts', () => {
  test('detects shortcut creation command', () => {
    expect(isShortcutCommand('when I say "work" then go to slack')).toBe('create');
    expect(isShortcutCommand('create shortcut for "music" to go to spotify')).toBe('create');
    expect(isShortcutCommand('shortcut "test" to google')).toBe('create');
  });

  test('detects shortcut deletion command', () => {
    expect(isShortcutCommand('delete the shortcut for work')).toBe('delete');
    expect(isShortcutCommand('remove shortcut called music')).toBe('delete');
  });

  test('detects list command', () => {
    expect(isShortcutCommand('list my shortcuts')).toBe('list');
    expect(isShortcutCommand('show shortcuts')).toBe('list');
    expect(isShortcutCommand('what are my aliases')).toBe('list');
  });

  test('detects built-in shortcut usage', () => {
    expect(isShortcutCommand('my email')).toBe('use');
    expect(isShortcutCommand('go to my calendar')).toBe('use');
    expect(isShortcutCommand('watch videos')).toBe('use');
  });

  test('parses shortcut creation phrases', () => {
    const result = parseShortcutCreation('when I say "work" then go to slack');
    expect(result).not.toBeNull();
    expect(result!.phrase).toBe('work');
    expect(result!.command).toBe('go to slack');
  });

  test('parses shortcut deletion phrase', () => {
    const result = parseShortcutDeletion('delete the shortcut for work');
    expect(result).toBe('work');
  });

  test('matches built-in shortcuts', async () => {
    const match = await matchShortcut('my email');
    expect(match).not.toBeNull();
    expect(match!.resolvedCommand).toBe('go to gmail');
    expect(match!.confidence).toBeGreaterThan(0.8);
  });

  test('matches shortcuts in longer phrases', async () => {
    const match = await matchShortcut('please open my email');
    expect(match).not.toBeNull();
    expect(match!.resolvedCommand).toBe('go to gmail');
  });

  test('returns null for unmatched text', async () => {
    const match = await matchShortcut('xyzzy foobar baz');
    expect(match).toBeNull();
  });

  test('built-in shortcuts exist', () => {
    const builtins = getBuiltInShortcuts();
    expect(builtins.length).toBeGreaterThan(5);
    expect(builtins.some(s => s.phrase === 'my email')).toBe(true);
  });

  test('format shortcuts list', () => {
    const formatted = formatShortcutsList(getBuiltInShortcuts());
    expect(formatted).toContain('my email');
    expect(formatted).toContain('go to gmail');
  });
});
