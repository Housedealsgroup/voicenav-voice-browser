import { createContext, useContext, useReducer, useEffect, useRef, type ReactNode, type RefObject } from 'react'
import type { AppState, AppAction, Tab } from '../types'

const STORAGE_KEY = 'voicenav-state'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function createTab(url: string, title: string): Tab {
  return { id: generateId(), title, url, isActive: true }
}

const defaultState: AppState = {
  currentView: 'home',
  tabs: [],
  activeTabId: null,
  bookmarks: [],
  history: [],
  isListening: false,
  isSpeaking: false,
  transcript: '',
  showVoiceOverlay: false,
  searchEngine: 'google',
  voiceLang: 'en-US',
  theme: 'dark',
  fontSize: 16,
}

function loadSavedState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...defaultState, ...parsed, isListening: false, isSpeaking: false, transcript: '', showVoiceOverlay: false }
    }
  } catch {
    // ignore
  }
  return defaultState
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.view }
    case 'ADD_TAB': {
      const tabs = state.tabs.map(t => ({ ...t, isActive: false }))
      return { ...state, tabs: [...tabs, { ...action.tab, isActive: true }], activeTabId: action.tab.id, currentView: 'browser' }
    }
    case 'CLOSE_TAB': {
      const tabs = state.tabs.filter(t => t.id !== action.tabId)
      if (tabs.length === 0) return { ...state, tabs: [], activeTabId: null, currentView: 'home' }
      const wasActive = state.activeTabId === action.tabId
      if (wasActive) {
        const last = tabs[tabs.length - 1]
        const updated = tabs.map(t => t.id === last.id ? { ...t, isActive: true } : t)
        return { ...state, tabs: updated, activeTabId: last.id }
      }
      return { ...state, tabs }
    }
    case 'SET_ACTIVE_TAB': {
      const tabs = state.tabs.map(t => ({ ...t, isActive: t.id === action.tabId }))
      return { ...state, tabs, activeTabId: action.tabId, currentView: 'browser' }
    }
    case 'UPDATE_TAB': {
      const tabs = state.tabs.map(t => t.id === action.tabId ? { ...t, ...action.updates } : t)
      return { ...state, tabs }
    }
    case 'ADD_BOOKMARK': {
      if (state.bookmarks.some(b => b.url === action.bookmark.url)) return state
      return { ...state, bookmarks: [action.bookmark, ...state.bookmarks] }
    }
    case 'REMOVE_BOOKMARK':
      return { ...state, bookmarks: state.bookmarks.filter(b => b.id !== action.id) }
    case 'ADD_HISTORY': {
      const history = [action.entry, ...state.history].slice(0, 500)
      return { ...state, history }
    }
    case 'CLEAR_HISTORY':
      return { ...state, history: [] }
    case 'SET_LISTENING':
      return { ...state, isListening: action.isListening }
    case 'SET_SPEAKING':
      return { ...state, isSpeaking: action.isSpeaking }
    case 'SET_TRANSCRIPT':
      return { ...state, transcript: action.transcript }
    case 'SET_VOICE_OVERLAY':
      return { ...state, showVoiceOverlay: action.show }
    case 'SET_SEARCH_ENGINE':
      return { ...state, searchEngine: action.engine }
    case 'SET_VOICE_LANG':
      return { ...state, voiceLang: action.lang }
    case 'SET_THEME':
      return { ...state, theme: action.theme }
    case 'SET_FONT_SIZE':
      return { ...state, fontSize: action.size }
    case 'LOAD_STATE':
      return { ...state, ...action.state }
    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  navigate: (url: string, title?: string) => void
  search: (query: string) => void
  goHome: () => void
  iframeRef: RefObject<HTMLIFrameElement | null>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, loadSavedState)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  // Persist state
  useEffect(() => {
    const toSave = {
      bookmarks: state.bookmarks,
      history: state.history,
      searchEngine: state.searchEngine,
      voiceLang: state.voiceLang,
      theme: state.theme,
      fontSize: state.fontSize,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  }, [state.bookmarks, state.history, state.searchEngine, state.voiceLang, state.theme, state.fontSize])

  const searchUrls: Record<string, string> = {
    google: 'https://www.google.com/search?igu=1&q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    bing: 'https://www.bing.com/search?q=',
  }

  function getSearchUrl(query: string): string {
    return searchUrls[state.searchEngine] + encodeURIComponent(query)
  }

  function isValidUrl(str: string): boolean {
    try {
      const url = new URL(str.includes('://') ? str : `https://${str}`)
      return url.hostname.includes('.')
    } catch {
      return false
    }
  }

  function navigate(url: string, title?: string) {
    const fullUrl = isValidUrl(url) ? (url.includes('://') ? url : `https://${url}`) : getSearchUrl(url)
    const displayTitle = title || url

    if (state.activeTabId) {
      dispatch({ type: 'UPDATE_TAB', tabId: state.activeTabId, updates: { url: fullUrl, title: displayTitle } })
    } else {
      dispatch({ type: 'ADD_TAB', tab: createTab(fullUrl, displayTitle) })
    }
    dispatch({ type: 'ADD_HISTORY', entry: { id: generateId(), title: displayTitle, url: fullUrl, visitedAt: Date.now() } })
    dispatch({ type: 'SET_VIEW', view: 'browser' })
  }

  function search(query: string) {
    navigate(getSearchUrl(query), `Search: ${query}`)
  }

  function goHome() {
    dispatch({ type: 'SET_VIEW', view: 'home' })
  }

  return (
    <AppContext.Provider value={{ state, dispatch, navigate, search, goHome, iframeRef }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
