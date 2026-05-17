import { useAppStore } from '../index';
import { useThemeStore } from '../theme';

describe('App Store', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentUrl: '',
      isLoading: false,
      pageTitle: '',
      pageSnapshot: null,
      error: null,
      isAgentActive: false,
      agentStatus: '',
      browsingHistory: [],
      commandHistory: [],
      assistantMessages: [],
    });
  });

  it('sets current URL', () => {
    useAppStore.getState().setCurrentUrl('https://amazon.com');
    expect(useAppStore.getState().currentUrl).toBe('https://amazon.com');
  });

  it('adds browsing history with deduplication', () => {
    const { addBrowsingHistory } = useAppStore.getState();
    addBrowsingHistory('https://a.com');
    addBrowsingHistory('https://a.com');
    addBrowsingHistory('https://b.com');
    expect(useAppStore.getState().browsingHistory.length).toBe(2);
  });

  it('adds command history', () => {
    const { addCommandHistory } = useAppStore.getState();
    addCommandHistory('go to amazon');
    addCommandHistory('search headphones');
    expect(useAppStore.getState().commandHistory.length).toBe(2);
    expect(useAppStore.getState().commandHistory[0]).toBe('search headphones');
  });

  it('sets agent active state', () => {
    useAppStore.getState().setIsAgentActive(true);
    expect(useAppStore.getState().isAgentActive).toBe(true);
  });
});

describe('Theme Store', () => {
  it('toggles theme', () => {
    const initial = useThemeStore.getState().isDark;
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().isDark).toBe(!initial);
  });

  it('sets dark theme', () => {
    useThemeStore.getState().setDark(true);
    expect(useThemeStore.getState().isDark).toBe(true);
    expect(useThemeStore.getState().colors.background).toBe('#0B0B1E');
  });

  it('sets light theme', () => {
    useThemeStore.getState().setDark(false);
    expect(useThemeStore.getState().isDark).toBe(false);
    expect(useThemeStore.getState().colors.background).toBe('#F8F8FF');
  });
});
