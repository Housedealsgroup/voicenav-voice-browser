import { useRef, useCallback, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import type { VoiceCommand } from '../types'

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

function parseCommand(transcript: string): VoiceCommand {
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
  if (t.startsWith('find ') || t.startsWith('highlight ')) {
    return { action: 'find', value: t.replace(/^(find |highlight )/, ''), confidence: 0.8 }
  }

  // Default: treat as search
  if (t.length > 2) return { action: 'search', value: t, confidence: 0.5 }
  return { action: 'unknown', confidence: 0 }
}

export function useVoice() {
  const { state, dispatch, navigate, search, goHome } = useApp()
  const recognitionRef = useRef<any>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = state.voiceLang
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onstart = () => dispatch({ type: 'SET_SPEAKING', isSpeaking: true })
    utterance.onend = () => dispatch({ type: 'SET_SPEAKING', isSpeaking: false })
    utterance.onerror = () => dispatch({ type: 'SET_SPEAKING', isSpeaking: false })
    window.speechSynthesis.speak(utterance)
  }, [state.voiceLang, dispatch])

  const executeCommand = useCallback((command: VoiceCommand) => {
    switch (command.action) {
      case 'navigate':
        if (command.value) navigate(command.value)
        break
      case 'search':
        if (command.value) search(command.value)
        break
      case 'back':
        iframeRef.current?.contentWindow?.history.back()
        speak('Going back')
        break
      case 'forward':
        iframeRef.current?.contentWindow?.history.forward()
        speak('Going forward')
        break
      case 'reload':
        if (iframeRef.current) iframeRef.current.src = iframeRef.current.src
        speak('Reloading page')
        break
      case 'scroll_up':
        iframeRef.current?.contentWindow?.scrollBy({ top: -400, behavior: 'smooth' })
        break
      case 'scroll_down':
        iframeRef.current?.contentWindow?.scrollBy({ top: 400, behavior: 'smooth' })
        break
      case 'bookmark': {
        const activeTab = state.tabs.find(t => t.id === state.activeTabId)
        if (activeTab) {
          dispatch({ type: 'ADD_BOOKMARK', bookmark: {
            id: Date.now().toString(36),
            title: activeTab.title,
            url: activeTab.url,
            createdAt: Date.now(),
          }})
          speak('Bookmark saved')
        }
        break
      }
      case 'home':
        goHome()
        speak('Going home')
        break
      case 'stop':
        window.speechSynthesis.cancel()
        dispatch({ type: 'SET_SPEAKING', isSpeaking: false })
        break
      case 'new_tab':
        navigate('https://www.google.com', 'New Tab')
        speak('New tab opened')
        break
      case 'close_tab':
        if (state.activeTabId) dispatch({ type: 'CLOSE_TAB', tabId: state.activeTabId })
        speak('Tab closed')
        break
      case 'zoom_in':
        dispatch({ type: 'SET_FONT_SIZE', size: Math.min(state.fontSize + 2, 32) })
        speak('Zoomed in')
        break
      case 'zoom_out':
        dispatch({ type: 'SET_FONT_SIZE', size: Math.max(state.fontSize - 2, 10) })
        speak('Zoomed out')
        break
      case 'find':
        speak(`Searching for ${command.value}`)
        break
      case 'unknown':
        speak('Sorry, I didn\'t understand that command')
        break
    }
  }, [state, dispatch, navigate, search, goHome, speak])

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      speak('Voice recognition is not supported in this browser')
      return
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const recognition = new SpeechRecognition()
    recognition.lang = state.voiceLang
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      dispatch({ type: 'SET_LISTENING', isListening: true })
      dispatch({ type: 'SET_VOICE_OVERLAY', show: true })
    }

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }
      dispatch({ type: 'SET_TRANSCRIPT', transcript: final || interim })
      if (final) {
        const command = parseCommand(final)
        executeCommand(command)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      dispatch({ type: 'SET_LISTENING', isListening: false })
      if (event.error === 'not-allowed') {
        speak('Microphone access denied. Please allow microphone permission.')
      }
    }

    recognition.onend = () => {
      dispatch({ type: 'SET_LISTENING', isListening: false })
      setTimeout(() => dispatch({ type: 'SET_VOICE_OVERLAY', show: false }), 1500)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [state.voiceLang, dispatch, speak, executeCommand])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    dispatch({ type: 'SET_LISTENING', isListening: false })
  }, [dispatch])

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [state.isListening, startListening, stopListening])

  // Cleanup
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      window.speechSynthesis?.cancel()
    }
  }, [])

  return {
    isListening: state.isListening,
    isSpeaking: state.isSpeaking,
    transcript: state.transcript,
    showVoiceOverlay: state.showVoiceOverlay,
    startListening,
    stopListening,
    toggleListening,
    speak,
    executeCommand,
    parseCommand,
    isSupported: !!SpeechRecognition,
    iframeRef,
  }
}
