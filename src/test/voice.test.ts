import { describe, it, expect, vi } from 'vitest'

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
}

Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: MockSpeechRecognition,
  writable: true,
})

Object.defineProperty(window, 'SpeechRecognition', {
  value: MockSpeechRecognition,
  writable: true,
})

describe('Voice Command Parsing', () => {
  // We test the parseCommand logic directly
  function parseCommand(transcript: string) {
    const t = transcript.toLowerCase().trim()

    if (t.startsWith('go to ') || t.startsWith('open ') || t.startsWith('navigate to ')) {
      const value = t.replace(/^(go to |open |navigate to )/, '').trim()
      return { action: 'navigate', value, confidence: 0.9 }
    }
    if (t.startsWith('search ') || t.startsWith('look up ') || t.startsWith('find ')) {
      const value = t.replace(/^(search |look up |find )/, '').trim()
      return { action: 'search', value, confidence: 0.9 }
    }
    if (t.includes('go back') || t === 'back') return { action: 'back', confidence: 0.95 }
    if (t.includes('go forward') || t === 'forward') return { action: 'forward', confidence: 0.95 }
    if (t.includes('reload') || t.includes('refresh')) return { action: 'reload', confidence: 0.9 }
    if (t.includes('scroll up') || t.includes('page up')) return { action: 'scroll_up', confidence: 0.9 }
    if (t.includes('scroll down') || t.includes('page down')) return { action: 'scroll_down', confidence: 0.9 }
    if (t.includes('bookmark') || t.includes('save this')) return { action: 'bookmark', confidence: 0.85 }
    if (t.includes('home') || t.includes('go home')) return { action: 'home', confidence: 0.9 }
    if (t.includes('stop') || t.includes('cancel')) return { action: 'stop', confidence: 0.9 }
    if (t.includes('new tab') || t.includes('open tab')) return { action: 'new_tab', confidence: 0.85 }
    if (t.includes('close tab')) return { action: 'close_tab', confidence: 0.85 }
    if (t.includes('zoom in') || t.includes('bigger')) return { action: 'zoom_in', confidence: 0.8 }
    if (t.includes('zoom out') || t.includes('smaller')) return { action: 'zoom_out', confidence: 0.8 }

    if (t.length > 2) return { action: 'search', value: t, confidence: 0.5 }
    return { action: 'unknown', confidence: 0 }
  }

  it('parses navigate command', () => {
    const cmd = parseCommand('go to youtube.com')
    expect(cmd.action).toBe('navigate')
    expect(cmd.value).toBe('youtube.com')
  })

  it('parses open command', () => {
    const cmd = parseCommand('open github.com')
    expect(cmd.action).toBe('navigate')
    expect(cmd.value).toBe('github.com')
  })

  it('parses search command', () => {
    const cmd = parseCommand('search for weather today')
    expect(cmd.action).toBe('search')
    expect(cmd.value).toBe('for weather today')
  })

  it('parses back command', () => {
    const cmd = parseCommand('go back')
    expect(cmd.action).toBe('back')
  })

  it('parses reload command', () => {
    const cmd = parseCommand('reload')
    expect(cmd.action).toBe('reload')
  })

  it('parses scroll commands', () => {
    expect(parseCommand('scroll down').action).toBe('scroll_down')
    expect(parseCommand('scroll up').action).toBe('scroll_up')
  })

  it('parses bookmark command', () => {
    const cmd = parseCommand('bookmark this page')
    expect(cmd.action).toBe('bookmark')
  })

  it('parses home command', () => {
    const cmd = parseCommand('go home')
    expect(cmd.action).toBe('home')
  })

  it('parses zoom commands', () => {
    expect(parseCommand('zoom in').action).toBe('zoom_in')
    expect(parseCommand('zoom out').action).toBe('zoom_out')
  })

  it('falls back to search for unknown input', () => {
    const cmd = parseCommand('hello world')
    expect(cmd.action).toBe('search')
    expect(cmd.value).toBe('hello world')
  })

  it('returns unknown for very short input', () => {
    const cmd = parseCommand('hi')
    expect(cmd.action).toBe('unknown')
  })
})
