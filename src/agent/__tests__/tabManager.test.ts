import {
  createTab, closeTab, setActiveTab, getActiveTab, getAllTabs,
  nextTab, previousTab, findTab, switchToTab, duplicateTab,
  clearAllTabs, getTabStats, getTabCount,
} from '../tabManager';

describe('Tab Manager', () => {
  beforeEach(() => {
    clearAllTabs();
  });

  describe('createTab()', () => {
    it('creates a tab with url and title', () => {
      const tab = createTab('https://example.com', 'Example');
      expect(tab.url).toBe('https://example.com');
      expect(tab.title).toBe('Example');
      expect(tab.id).toBeTruthy();
    });

    it('uses url as title when title not provided', () => {
      const tab = createTab('https://example.com');
      expect(tab.title).toBe('https://example.com');
    });

    it('activates tab by default', () => {
      const tab = createTab('https://example.com');
      expect(tab.isActive).toBe(true);
      expect(getActiveTab()?.id).toBe(tab.id);
    });

    it('does not activate tab when activate is false', () => {
      createTab('https://first.com', 'First');
      const second = createTab('https://second.com', 'Second', false);
      expect(second.isActive).toBe(false);
      expect(getActiveTab()?.url).toBe('https://first.com');
    });
  });

  describe('closeTab()', () => {
    it('removes a tab', () => {
      const tab = createTab('https://example.com');
      expect(closeTab(tab.id)).toBe(true);
      expect(getTabCount()).toBe(0);
    });

    it('returns false for non-existent tab', () => {
      expect(closeTab('fake-id')).toBe(false);
    });

    it('activates next tab when active tab is closed', () => {
      const first = createTab('https://first.com');
      const second = createTab('https://second.com');
      closeTab(second.id);
      expect(getActiveTab()?.id).toBe(first.id);
    });
  });

  describe('setActiveTab()', () => {
    it('switches active tab', () => {
      const first = createTab('https://first.com');
      const second = createTab('https://second.com');
      expect(setActiveTab(first.id)).toBe(true);
      expect(getActiveTab()?.id).toBe(first.id);
    });

    it('returns false for non-existent tab', () => {
      expect(setActiveTab('fake-id')).toBe(false);
    });

    it('deactivates other tabs', () => {
      const first = createTab('https://first.com');
      const second = createTab('https://second.com');
      setActiveTab(first.id);
      const tabs = getAllTabs();
      const activeTabs = tabs.filter(t => t.isActive);
      expect(activeTabs.length).toBe(1);
      expect(activeTabs[0].id).toBe(first.id);
    });
  });

  describe('getActiveTab()', () => {
    it('returns null when no tabs exist', () => {
      expect(getActiveTab()).toBeNull();
    });

    it('returns the active tab', () => {
      const tab = createTab('https://example.com', 'Example');
      expect(getActiveTab()?.id).toBe(tab.id);
    });
  });

  describe('getAllTabs()', () => {
    it('returns empty array when no tabs', () => {
      expect(getAllTabs()).toEqual([]);
    });

    it('returns all tabs', () => {
      createTab('https://a.com');
      createTab('https://b.com');
      createTab('https://c.com');
      expect(getAllTabs().length).toBe(3);
    });
  });

  describe('nextTab()', () => {
    it('returns null with single tab', () => {
      createTab('https://only.com');
      expect(nextTab()).toBeNull();
    });

    it('cycles to next tab', () => {
      createTab('https://first.com');
      createTab('https://second.com');
      const next = nextTab();
      expect(next?.url).toBe('https://first.com');
    });
  });

  describe('previousTab()', () => {
    it('returns null with single tab', () => {
      createTab('https://only.com');
      expect(previousTab()).toBeNull();
    });

    it('cycles to previous tab', () => {
      createTab('https://first.com');
      createTab('https://second.com');
      const prev = previousTab();
      expect(prev?.url).toBe('https://first.com');
    });
  });

  describe('findTab()', () => {
    it('finds tab by title', () => {
      createTab('https://example.com', 'Example Site');
      createTab('https://other.com', 'Other');
      const found = findTab('Example');
      expect(found?.url).toBe('https://example.com');
    });

    it('finds tab by URL', () => {
      createTab('https://example.com', 'Example');
      const found = findTab('example.com');
      expect(found?.title).toBe('Example');
    });

    it('finds tab by number', () => {
      createTab('https://first.com', 'First');
      createTab('https://second.com', 'Second');
      const found = findTab('2');
      expect(found?.url).toBe('https://second.com');
    });

    it('returns null when no match', () => {
      createTab('https://example.com', 'Example');
      expect(findTab('nonexistent')).toBeNull();
    });
  });

  describe('switchToTab()', () => {
    it('switches to found tab', () => {
      createTab('https://first.com', 'First');
      createTab('https://second.com', 'Second');
      switchToTab('First');
      expect(getActiveTab()?.url).toBe('https://first.com');
    });

    it('returns null for no match', () => {
      createTab('https://example.com', 'Example');
      expect(switchToTab('nonexistent')).toBeNull();
    });
  });

  describe('duplicateTab()', () => {
    it('duplicates a tab', () => {
      const original = createTab('https://example.com', 'Example');
      const copy = duplicateTab(original.id);
      expect(copy).not.toBeNull();
      expect(copy?.url).toBe('https://example.com');
      expect(copy?.title).toContain('copy');
      expect(copy?.id).not.toBe(original.id);
    });

    it('returns null for non-existent tab', () => {
      expect(duplicateTab('fake-id')).toBeNull();
    });
  });

  describe('clearAllTabs()', () => {
    it('removes all tabs', () => {
      createTab('https://a.com');
      createTab('https://b.com');
      clearAllTabs();
      expect(getAllTabs()).toEqual([]);
      expect(getActiveTab()).toBeNull();
    });
  });

  describe('getTabStats()', () => {
    it('returns empty stats when no tabs', () => {
      const stats = getTabStats();
      expect(stats.totalTabs).toBe(0);
      expect(stats.activeTab).toBeNull();
      expect(stats.oldestTab).toBeNull();
      expect(stats.newestTab).toBeNull();
    });

    it('returns correct stats with tabs', () => {
      createTab('https://first.com', 'First');
      createTab('https://second.com', 'Second');
      const stats = getTabStats();
      expect(stats.totalTabs).toBe(2);
      expect(stats.activeTab?.url).toBe('https://second.com');
      expect(stats.oldestTab?.url).toBe('https://first.com');
      expect(stats.newestTab?.url).toBe('https://second.com');
    });
  });
});
