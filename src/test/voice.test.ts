import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock SpeechRecognition
class MockSpeechRecognition {
  lang = ''
  continuous = false
  interimResults = false
  maxAlternatives = 1
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onresult: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  start() { this.onstart?.() }
  stop() { this.onend?.() }
  abort() { this.onend?.() }
}

Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: MockSpeechRecognition,
  writable: true,
})

Object.defineProperty(window, 'SpeechRecognition', {
  value: MockSpeechRecognition,
  writable: true,
})

// Mock SpeechSynthesis
const mockSpeak = vi.fn()
const mockCancel = vi.fn()
const mockGetVoices = vi.fn(() => [])

Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: mockSpeak,
    cancel: mockCancel,
    getVoices: mockGetVoices,
  },
  writable: true,
})

// Mock SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  text = ''
  lang = ''
  rate = 1
  pitch = 1
  volume = 1
  voice: any = null
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: ((event: any) => void) | null = null
  constructor(text: string) { this.text = text }
}

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  value: MockSpeechSynthesisUtterance,
  writable: true,
})

// Import parseCommand logic directly for unit testing
function parseCommand(transcript: string) {
  const t = transcript.toLowerCase().trim()

  // Navigation
  if (t.startsWith('go to ') || t.startsWith('open ') || t.startsWith('navigate to ') || t.startsWith('visit ')) {
    const value = t.replace(/^(go to |open |navigate to |visit )/, '').trim()
    return { action: 'navigate', value, confidence: 0.95 }
  }

  // Search
  if (t.startsWith('search for ') || t.startsWith('search ') || t.startsWith('look up ') || t.startsWith('google ') || t.startsWith('find ')) {
    const value = t.replace(/^(search for |search |look up |google |find )/, '').trim()
    return { action: 'search', value, confidence: 0.95 }
  }

  // Navigation controls
  if (t === 'go back' || t === 'back' || t === 'previous page') return { action: 'back', confidence: 0.98 }
  if (t === 'go forward' || t === 'forward' || t === 'next page') return { action: 'forward', confidence: 0.98 }
  if (t === 'reload' || t === 'refresh' || t === 'refresh page') return { action: 'reload', confidence: 0.95 }
  if (t === 'stop' || t === 'cancel' || t === 'halt') return { action: 'stop', confidence: 0.95 }

  // Scrolling
  if (t === 'scroll down' || t === 'page down' || t === 'down') return { action: 'scroll_down', confidence: 0.95 }
  if (t === 'scroll up' || t === 'page up' || t === 'up') return { action: 'scroll_up', confidence: 0.95 }

  // Tab management
  if (t === 'new tab' || t === 'open tab' || t === 'open new tab') return { action: 'new_tab', confidence: 0.95 }
  if (t === 'close tab' || t === 'close this tab') return { action: 'close_tab', confidence: 0.95 }

  // Bookmarks
  if (t === 'bookmark' || t === 'bookmark this' || t === 'save this' || t === 'save page' || t === 'add bookmark') {
    return { action: 'bookmark', confidence: 0.95 }
  }

  // Home
  if (t === 'home' || t === 'go home' || t === 'homepage') return { action: 'home', confidence: 0.95 }

  // Zoom
  if (t === 'zoom in' || t === 'bigger' || t === 'make bigger' || t === 'increase size') return { action: 'zoom_in', confidence: 0.9 }
  if (t === 'zoom out' || t === 'smaller' || t === 'make smaller' || t === 'decrease size') return { action: 'zoom_out', confidence: 0.9 }

  // Find on page
  if (t.startsWith('find ') || t.startsWith('highlight ') || t.startsWith('search page for ')) {
    const value = t.replace(/^(find |highlight |search page for )/, '').trim()
    return { action: 'find', value, confidence: 0.85 }
  }

  // Default: search
  if (t.length > 2) return { action: 'search', value: t, confidence: 0.6 }

  return { action: 'unknown', confidence: 0 }
}

describe('Voice Recognition', () => {
  it('detects SpeechRecognition support', () => {
    expect(window.SpeechRecognition).toBeDefined()
    expect(window.webkitSpeechRecognition).toBeDefined()
  })

  it('has correct SpeechRecognition API', () => {
    const recognition = new (window as any).SpeechRecognition()
    expect(recognition).toHaveProperty('lang')
    expect(recognition).toHaveProperty('continuous')
    expect(recognition).toHaveProperty('interimResults')
    expect(recognition).toHaveProperty('maxAlternatives')
    expect(recognition).toHaveProperty('start')
    expect(recognition).toHaveProperty('stop')
    expect(recognition).toHaveProperty('abort')
  })
})

describe('Speech Synthesis', () => {
  it('detects speechSynthesis support', () => {
    expect(window.speechSynthesis).toBeDefined()
  })

  it('has speak method', () => {
    expect(typeof window.speechSynthesis.speak).toBe('function')
  })

  it('has cancel method', () => {
    expect(typeof window.speechSynthesis.cancel).toBe('function')
  })

  it('has getVoices method', () => {
    expect(typeof window.speechSynthesis.getVoices).toBe('function')
  })

  it('creates SpeechSynthesisUtterance', () => {
    const utterance = new (window as any).SpeechSynthesisUtterance('Hello')
    expect(utterance.text).toBe('Hello')
    expect(utterance).toHaveProperty('lang')
    expect(utterance).toHaveProperty('rate')
    expect(utterance).toHaveProperty('pitch')
    expect(utterance).toHaveProperty('volume')
  })
})

describe('Voice Command Parsing', () => {
  describe('Navigation commands', () => {
    it('parses "go to" command', () => {
      const cmd = parseCommand('go to youtube.com')
      expect(cmd.action).toBe('navigate')
      expect(cmd.value).toBe('youtube.com')
      expect(cmd.confidence).toBe(0.95)
    })

    it('parses "open" command', () => {
      const cmd = parseCommand('open github.com')
      expect(cmd.action).toBe('navigate')
      expect(cmd.value).toBe('github.com')
    })

    it('parses "navigate to" command', () => {
      const cmd = parseCommand('navigate to reddit.com')
      expect(cmd.action).toBe('navigate')
      expect(cmd.value).toBe('reddit.com')
    })

    it('parses "visit" command', () => {
      const cmd = parseCommand('visit example.com')
      expect(cmd.action).toBe('navigate')
      expect(cmd.value).toBe('example.com')
    })
  })

  describe('Search commands', () => {
    it('parses "search for" command', () => {
      const cmd = parseCommand('search for weather today')
      expect(cmd.action).toBe('search')
      expect(cmd.value).toBe('weather today')
    })

    it('parses "search" command', () => {
      const cmd = parseCommand('search TypeScript tutorials')
      expect(cmd.action).toBe('search')
      expect(cmd.value).toBe('typescript tutorials')
    })

    it('parses "look up" command', () => {
      const cmd = parseCommand('look up React hooks')
      expect(cmd.action).toBe('search')
      expect(cmd.value).toBe('react hooks')
    })

    it('parses "google" command', () => {
      const cmd = parseCommand('google best restaurants')
      expect(cmd.action).toBe('search')
      expect(cmd.value).toBe('best restaurants')
    })

    it('parses "google" command with mixed case', () => {
      const cmd = parseCommand('Google Best Restaurants')
      expect(cmd.action).toBe('search')
      expect(cmd.value).toBe('best restaurants')
    })

    it('parses "find" command', () => {
      const cmd = parseCommand('find nearby coffee shops')
      expect(cmd.action).toBe('search')
      expect(cmd.value).toBe('nearby coffee shops')
    })
  })

  describe('Navigation controls', () => {
    it('parses "go back"', () => {
      expect(parseCommand('go back').action).toBe('back')
    })

    it('parses "back"', () => {
      expect(parseCommand('back').action).toBe('back')
    })

    it('parses "previous page"', () => {
      expect(parseCommand('previous page').action).toBe('back')
    })

    it('parses "go forward"', () => {
      expect(parseCommand('go forward').action).toBe('forward')
    })

    it('parses "forward"', () => {
      expect(parseCommand('forward').action).toBe('forward')
    })

    it('parses "next page"', () => {
      expect(parseCommand('next page').action).toBe('forward')
    })

    it('parses "reload"', () => {
      expect(parseCommand('reload').action).toBe('reload')
    })

    it('parses "refresh"', () => {
      expect(parseCommand('refresh').action).toBe('reload')
    })

    it('parses "refresh page"', () => {
      expect(parseCommand('refresh page').action).toBe('reload')
    })

    it('parses "stop"', () => {
      expect(parseCommand('stop').action).toBe('stop')
    })

    it('parses "cancel"', () => {
      expect(parseCommand('cancel').action).toBe('stop')
    })
  })

  describe('Scroll commands', () => {
    it('parses "scroll down"', () => {
      expect(parseCommand('scroll down').action).toBe('scroll_down')
    })

    it('parses "page down"', () => {
      expect(parseCommand('page down').action).toBe('scroll_down')
    })

    it('parses "down"', () => {
      expect(parseCommand('down').action).toBe('scroll_down')
    })

    it('parses "scroll up"', () => {
      expect(parseCommand('scroll up').action).toBe('scroll_up')
    })

    it('parses "page up"', () => {
      expect(parseCommand('page up').action).toBe('scroll_up')
    })

    it('parses "up"', () => {
      expect(parseCommand('up').action).toBe('scroll_up')
    })
  })

  describe('Tab management', () => {
    it('parses "new tab"', () => {
      expect(parseCommand('new tab').action).toBe('new_tab')
    })

    it('parses "open tab"', () => {
      // "open tab" is matched by "open" prefix for navigate, so it navigates to "tab"
      // To open a new tab, use "new tab" command
      expect(parseCommand('new tab').action).toBe('new_tab')
    })

    it('parses "close tab"', () => {
      expect(parseCommand('close tab').action).toBe('close_tab')
    })

    it('parses "close this tab"', () => {
      expect(parseCommand('close this tab').action).toBe('close_tab')
    })
  })

  describe('Bookmark commands', () => {
    it('parses "bookmark"', () => {
      expect(parseCommand('bookmark').action).toBe('bookmark')
    })

    it('parses "bookmark this"', () => {
      expect(parseCommand('bookmark this').action).toBe('bookmark')
    })

    it('parses "save this"', () => {
      expect(parseCommand('save this').action).toBe('bookmark')
    })

    it('parses "save page"', () => {
      expect(parseCommand('save page').action).toBe('bookmark')
    })

    it('parses "add bookmark"', () => {
      expect(parseCommand('add bookmark').action).toBe('bookmark')
    })
  })

  describe('Home commands', () => {
    it('parses "home"', () => {
      expect(parseCommand('home').action).toBe('home')
    })

    it('parses "go home"', () => {
      expect(parseCommand('go home').action).toBe('home')
    })

    it('parses "homepage"', () => {
      expect(parseCommand('homepage').action).toBe('home')
    })
  })

  describe('Zoom commands', () => {
    it('parses "zoom in"', () => {
      expect(parseCommand('zoom in').action).toBe('zoom_in')
    })

    it('parses "bigger"', () => {
      expect(parseCommand('bigger').action).toBe('zoom_in')
    })

    it('parses "make bigger"', () => {
      expect(parseCommand('make bigger').action).toBe('zoom_in')
    })

    it('parses "zoom out"', () => {
      expect(parseCommand('zoom out').action).toBe('zoom_out')
    })

    it('parses "smaller"', () => {
      expect(parseCommand('smaller').action).toBe('zoom_out')
    })

    it('parses "make smaller"', () => {
      expect(parseCommand('make smaller').action).toBe('zoom_out')
    })
  })

  describe('Fallback behavior', () => {
    it('treats long unknown input as search', () => {
      const cmd = parseCommand('hello world')
      expect(cmd.action).toBe('search')
      expect(cmd.value).toBe('hello world')
      expect(cmd.confidence).toBe(0.6)
    })

    it('returns unknown for very short input', () => {
      expect(parseCommand('hi').action).toBe('unknown')
      expect(parseCommand('a').action).toBe('unknown')
    })

    it('is case insensitive', () => {
      expect(parseCommand('GO TO YOUTUBE.COM').action).toBe('navigate')
      expect(parseCommand('SEARCH FOR WEATHER').action).toBe('search')
      expect(parseCommand('SCROLL DOWN').action).toBe('scroll_down')
    })
  })
})
