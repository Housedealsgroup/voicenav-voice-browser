export interface Bookmark {
  id: string
  title: string
  url: string
  favicon?: string
  createdAt: number
}

export interface HistoryEntry {
  id: string
  title: string
  url: string
  visitedAt: number
}

export interface VoiceCommand {
  action: 'navigate' | 'search' | 'back' | 'forward' | 'reload' | 'scroll_up' | 'scroll_down' | 'bookmark' | 'home' | 'stop' | 'new_tab' | 'close_tab' | 'zoom_in' | 'zoom_out' | 'find' | 'read_page' | 'help' | 'unknown'
  value?: string
  confidence: number
}

export interface Tab {
  id: string
  title: string
  url: string
  isActive: boolean
}

export type View = 'home' | 'browser' | 'bookmarks' | 'history' | 'settings'

export interface AppState {
  currentView: View
  tabs: Tab[]
  activeTabId: string | null
  bookmarks: Bookmark[]
  history: HistoryEntry[]
  isListening: boolean
  isSpeaking: boolean
  transcript: string
  showVoiceOverlay: boolean
  searchEngine: 'google' | 'duckduckgo' | 'bing'
  voiceLang: string
  theme: 'dark' | 'light'
  fontSize: number
}

export type AppAction =
  | { type: 'SET_VIEW'; view: View }
  | { type: 'ADD_TAB'; tab: Tab }
  | { type: 'CLOSE_TAB'; tabId: string }
  | { type: 'SET_ACTIVE_TAB'; tabId: string }
  | { type: 'UPDATE_TAB'; tabId: string; updates: Partial<Tab> }
  | { type: 'ADD_BOOKMARK'; bookmark: Bookmark }
  | { type: 'REMOVE_BOOKMARK'; id: string }
  | { type: 'ADD_HISTORY'; entry: HistoryEntry }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_LISTENING'; isListening: boolean }
  | { type: 'SET_SPEAKING'; isSpeaking: boolean }
  | { type: 'SET_TRANSCRIPT'; transcript: string }
  | { type: 'SET_VOICE_OVERLAY'; show: boolean }
  | { type: 'SET_SEARCH_ENGINE'; engine: 'google' | 'duckduckgo' | 'bing' }
  | { type: 'SET_VOICE_LANG'; lang: string }
  | { type: 'SET_THEME'; theme: 'dark' | 'light' }
  | { type: 'SET_FONT_SIZE'; size: number }
  | { type: 'LOAD_STATE'; state: Partial<AppState> }
