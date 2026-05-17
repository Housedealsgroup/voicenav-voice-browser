// VoiceNav Tab Manager — v10
// Multi-tab voice navigation with tab-aware commands
// Manage multiple browser tabs through voice

import { logger } from '../utils/logger';

export type Tab = {
  id: string;
  url: string;
  title: string;
  isActive: boolean;
  createdAt: number;
  lastAccessed: number;
  snapshot?: {
    textContent: string;
    scrollY: number;
  };
};

type TabListener = (tabs: Tab[], activeTab: Tab | null) => void;

const tabs: Tab[] = [];
let activeTabId: string | null = null;
let tabIdCounter = 0;
const listeners: TabListener[] = [];

function notifyListeners(): void {
  const active = tabs.find(t => t.id === activeTabId) || null;
  for (const listener of listeners) {
    listener([...tabs], active);
  }
}

export function createTab(url: string, title?: string, activate = true): Tab {
  const tab: Tab = {
    id: `tab-${++tabIdCounter}`,
    url,
    title: title || url,
    isActive: activate,
    createdAt: Date.now(),
    lastAccessed: Date.now(),
  };

  tabs.push(tab);

  if (activate) {
    setActiveTab(tab.id);
  }

  logger.agent('tabManager', { event: 'create', tabId: tab.id, url, title });
  notifyListeners();

  return tab;
}

export function closeTab(id: string): boolean {
  const idx = tabs.findIndex(t => t.id === id);
  if (idx === -1) return false;

  const wasActive = tabs[idx].isActive;
  tabs.splice(idx, 1);

  // If closed tab was active, activate the next one
  if (wasActive && tabs.length > 0) {
    const nextIdx = Math.min(idx, tabs.length - 1);
    setActiveTab(tabs[nextIdx].id);
  }

  if (tabs.length === 0) {
    activeTabId = null;
  }

  logger.agent('tabManager', { event: 'close', tabId: id, remainingTabs: tabs.length });
  notifyListeners();

  return true;
}

export function setActiveTab(id: string): boolean {
  const tab = tabs.find(t => t.id === id);
  if (!tab) return false;

  for (const t of tabs) {
    t.isActive = false;
  }

  tab.isActive = true;
  tab.lastAccessed = Date.now();
  activeTabId = id;

  logger.agent('tabManager', { event: 'activate', tabId: id, url: tab.url });
  notifyListeners();

  return true;
}

export function getActiveTab(): Tab | null {
  return tabs.find(t => t.id === activeTabId) || null;
}

export function getAllTabs(): Tab[] {
  return [...tabs];
}

export function getTabCount(): number {
  return tabs.length;
}

export function nextTab(): Tab | null {
  if (tabs.length <= 1) return null;
  const currentIdx = tabs.findIndex(t => t.id === activeTabId);
  const nextIdx = (currentIdx + 1) % tabs.length;
  setActiveTab(tabs[nextIdx].id);
  return tabs[nextIdx];
}

export function previousTab(): Tab | null {
  if (tabs.length <= 1) return null;
  const currentIdx = tabs.findIndex(t => t.id === activeTabId);
  const prevIdx = (currentIdx - 1 + tabs.length) % tabs.length;
  setActiveTab(tabs[prevIdx].id);
  return tabs[prevIdx];
}

export function findTab(query: string): Tab | null {
  const q = query.toLowerCase().trim();

  // Match by number
  const num = parseInt(q.replace(/\D/g, ''), 10);
  if (!isNaN(num) && num >= 1 && num <= tabs.length) {
    return tabs[num - 1];
  }

  // Match by title or URL
  return tabs.find(t =>
    t.title.toLowerCase().includes(q) ||
    t.url.toLowerCase().includes(q)
  ) || null;
}

export function switchToTab(query: string): Tab | null {
  const tab = findTab(query);
  if (tab) {
    setActiveTab(tab.id);
  }
  return tab;
}

export function updateTabUrl(id: string, url: string, title?: string): void {
  const tab = tabs.find(t => t.id === id);
  if (!tab) return;

  tab.url = url;
  if (title) tab.title = title;
  tab.lastAccessed = Date.now();

  notifyListeners();
}

export function updateTabSnapshot(id: string, textContent: string, scrollY: number): void {
  const tab = tabs.find(t => t.id === id);
  if (!tab) return;

  tab.snapshot = { textContent, scrollY };
}

export function moveTab(fromIdx: number, toIdx: number): boolean {
  if (fromIdx < 0 || fromIdx >= tabs.length || toIdx < 0 || toIdx >= tabs.length) return false;

  const [tab] = tabs.splice(fromIdx, 1);
  tabs.splice(toIdx, 0, tab);

  notifyListeners();
  return true;
}

export function duplicateTab(id: string): Tab | null {
  const source = tabs.find(t => t.id === id);
  if (!source) return null;

  return createTab(source.url, `${source.title} (copy)`);
}

export function pinTab(id: string): boolean {
  const tab = tabs.find(t => t.id === id);
  if (!tab) return false;

  // Move to beginning
  const idx = tabs.indexOf(tab);
  tabs.splice(idx, 1);
  tabs.unshift(tab);

  notifyListeners();
  return true;
}

export function getTabByVoiceCommand(command: string): Tab | null {
  const q = command.toLowerCase().trim();

  // "switch to tab 2" / "go to tab 2"
  const tabNum = q.match(/tab\s+(\d+)/);
  if (tabNum) {
    const num = parseInt(tabNum[1], 10);
    if (num >= 1 && num <= tabs.length) {
      setActiveTab(tabs[num - 1].id);
      return tabs[num - 1];
    }
  }

  // "switch to [title]" / "go to [site]"
  const switchMatch = q.match(/(?:switch to|go to|open|show)\s+(.+)/);
  if (switchMatch) {
    return switchToTab(switchMatch[1]);
  }

  return null;
}

export function onTabChange(listener: TabListener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export function clearAllTabs(): void {
  tabs.length = 0;
  activeTabId = null;
  notifyListeners();
}

export function getTabStats(): {
  totalTabs: number;
  activeTab: Tab | null;
  oldestTab: Tab | null;
  newestTab: Tab | null;
} {
  const sorted = [...tabs].sort((a, b) => a.createdAt - b.createdAt);
  return {
    totalTabs: tabs.length,
    activeTab: getActiveTab(),
    oldestTab: sorted[0] || null,
    newestTab: sorted[sorted.length - 1] || null,
  };
}
