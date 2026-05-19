import { useRef, useCallback, useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import type { VoiceCommand } from '../types'

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

export interface VoiceState {
  isListening: boolean
  isSpeaking: boolean
  transcript: string
  interimTranscript: string
  confidence: number
  error: string | null
  isSupported: boolean
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown'
  audioLevel: number
}

function parseCommand(transcript: string): VoiceCommand {
  const t = transcript.toLowerCase().trim()

  // Exact match commands (check before prefix matching)
  if (t === 'go back' || t === 'back' || t === 'previous page') return { action: 'back', confidence: 0.98 }
  if (t === 'go forward' || t === 'forward' || t === 'next page') return { action: 'forward', confidence: 0.98 }
  if (t === 'reload' || t === 'refresh' || t === 'refresh page') return { action: 'reload', confidence: 0.95 }
  if (t === 'stop' || t === 'cancel' || t === 'halt') return { action: 'stop', confidence: 0.95 }
  if (t === 'scroll down' || t === 'page down' || t === 'down') return { action: 'scroll_down', confidence: 0.95 }
  if (t === 'scroll up' || t === 'page up' || t === 'up') return { action: 'scroll_up', confidence: 0.95 }
  if (t === 'scroll to top' || t === 'top of page') return { action: 'scroll_up', confidence: 0.9 }
  if (t === 'scroll to bottom' || t === 'bottom of page') return { action: 'scroll_down', confidence: 0.9 }
  if (t === 'new tab' || t === 'open tab' || t === 'open new tab') return { action: 'new_tab', confidence: 0.95 }
  if (t === 'close tab' || t === 'close this tab') return { action: 'close_tab', confidence: 0.95 }
  if (t === 'bookmark' || t === 'bookmark this' || t === 'save this' || t === 'save page' || t === 'add bookmark') {
    return { action: 'bookmark', confidence: 0.95 }
  }
  if (t === 'home' || t === 'go home' || t === 'homepage') return { action: 'home', confidence: 0.95 }
  if (t === 'zoom in' || t === 'bigger' || t === 'make bigger' || t === 'increase size') return { action: 'zoom_in', confidence: 0.9 }
  if (t === 'zoom out' || t === 'smaller' || t === 'make smaller' || t === 'decrease size') return { action: 'zoom_out', confidence: 0.9 }

  // Prefix-based navigation
  if (t.startsWith('go to ') || t.startsWith('open ') || t.startsWith('navigate to ') || t.startsWith('visit ')) {
    const value = t.replace(/^(go to |open |navigate to |visit )/, '').trim()
    return { action: 'navigate', value, confidence: 0.95 }
  }

  // Prefix-based search
  if (t.startsWith('search for ') || t.startsWith('search ') || t.startsWith('look up ') || t.startsWith('google ') || t.startsWith('find ')) {
    const value = t.replace(/^(search for |search |look up |google |find )/, '').trim()
    return { action: 'search', value, confidence: 0.95 }
  }

  // Find on page
  if (t.startsWith('highlight ') || t.startsWith('search page for ')) {
    const value = t.replace(/^(highlight |search page for )/, '').trim()
    return { action: 'find', value, confidence: 0.85 }
  }

  // Default: treat as search query
  if (t.length > 2) return { action: 'search', value: t, confidence: 0.6 }

  return { action: 'unknown', confidence: 0 }
}

export function useVoice() {
  const { state, dispatch, navigate, search, goHome } = useApp()
  const recognitionRef = useRef<any>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)

  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    transcript: '',
    interimTranscript: '',
    confidence: 0,
    error: null,
    isSupported: !!SpeechRecognition,
    permissionState: 'unknown',
    audioLevel: 0,
  })

  // Check microphone permission on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then(result => {
        setVoiceState(prev => ({ ...prev, permissionState: result.state as any }))
        result.onchange = () => {
          setVoiceState(prev => ({ ...prev, permissionState: result.state as any }))
        }
      }).catch(() => {})
    }
  }, [])

  // Audio level monitoring
  const startAudioMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      const updateLevel = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        const normalized = Math.min(avg / 128, 1)
        setVoiceState(prev => ({ ...prev, audioLevel: normalized }))
        animFrameRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()

      // Store stream for cleanup
      ;(audioContextRef.current as any)._stream = stream
    } catch (err) {
      console.error('Audio monitoring error:', err)
    }
  }, [])

  const stopAudioMonitoring = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (audioContextRef.current) {
      const stream = (audioContextRef.current as any)._stream
      if (stream) stream.getTracks().forEach((t: MediaStreamTrack) => t.stop())
      audioContextRef.current.close()
      audioContextRef.current = null
      analyserRef.current = null
    }
    setVoiceState(prev => ({ ...prev, audioLevel: 0 }))
  }, [])

  // Text-to-speech
  const speak = useCallback((text: string, options?: { rate?: number; pitch?: number; volume?: number; voice?: SpeechSynthesisVoice }) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported')
      return
    }
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = state.voiceLang
    utterance.rate = options?.rate ?? 1
    utterance.pitch = options?.pitch ?? 1
    utterance.volume = options?.volume ?? 1
    if (options?.voice) utterance.voice = options.voice

    utterance.onstart = () => {
      setVoiceState(prev => ({ ...prev, isSpeaking: true }))
      dispatch({ type: 'SET_SPEAKING', isSpeaking: true })
    }
    utterance.onend = () => {
      setVoiceState(prev => ({ ...prev, isSpeaking: false }))
      dispatch({ type: 'SET_SPEAKING', isSpeaking: false })
    }
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e)
      setVoiceState(prev => ({ ...prev, isSpeaking: false }))
      dispatch({ type: 'SET_SPEAKING', isSpeaking: false })
    }

    window.speechSynthesis.speak(utterance)
  }, [state.voiceLang, dispatch])

  // Get available voices
  const getVoices = useCallback((): SpeechSynthesisVoice[] => {
    if (!('speechSynthesis' in window)) return []
    return window.speechSynthesis.getVoices()
  }, [])

  // Execute voice command
  const executeCommand = useCallback((command: VoiceCommand) => {
    console.log('[VoiceNav] Executing command:', command)

    switch (command.action) {
      case 'navigate':
        if (command.value) {
          navigate(command.value)
          speak(`Navigating to ${command.value}`)
        }
        break
      case 'search':
        if (command.value) {
          search(command.value)
          speak(`Searching for ${command.value}`)
        }
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
        if (iframeRef.current) {
          iframeRef.current.src = iframeRef.current.src
        }
        speak('Reloading page')
        break
      case 'scroll_up':
        try {
          iframeRef.current?.contentWindow?.scrollBy({ top: -400, behavior: 'smooth' })
        } catch {}
        speak('Scrolling up')
        break
      case 'scroll_down':
        try {
          iframeRef.current?.contentWindow?.scrollBy({ top: 400, behavior: 'smooth' })
        } catch {}
        speak('Scrolling down')
        break
      case 'bookmark': {
        const activeTab = state.tabs.find(t => t.id === state.activeTabId)
        if (activeTab) {
          dispatch({
            type: 'ADD_BOOKMARK',
            bookmark: {
              id: Date.now().toString(36),
              title: activeTab.title,
              url: activeTab.url,
              createdAt: Date.now(),
            }
          })
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
        setVoiceState(prev => ({ ...prev, isSpeaking: false }))
        dispatch({ type: 'SET_SPEAKING', isSpeaking: false })
        break
      case 'new_tab':
        navigate('https://www.google.com', 'New Tab')
        speak('New tab opened')
        break
      case 'close_tab':
        if (state.activeTabId) {
          dispatch({ type: 'CLOSE_TAB', tabId: state.activeTabId })
          speak('Tab closed')
        }
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
        speak(`Searching page for ${command.value}`)
        break
      case 'unknown':
        speak('Sorry, I didn\'t understand that command')
        break
    }
  }, [state, dispatch, navigate, search, goHome, speak])

  // Start listening
  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setVoiceState(prev => ({ ...prev, error: 'Voice recognition not supported in this browser', isSupported: false }))
      speak('Voice recognition is not supported in this browser')
      return
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }

    const recognition = new SpeechRecognition()
    recognition.lang = state.voiceLang
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      setVoiceState(prev => ({
        ...prev,
        isListening: true,
        error: null,
        transcript: '',
        interimTranscript: '',
        confidence: 0,
      }))
      dispatch({ type: 'SET_LISTENING', isListening: true })
      dispatch({ type: 'SET_VOICE_OVERLAY', show: true })
      startAudioMonitoring()
    }

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      let maxConfidence = 0

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        const confidence = result[0].confidence || 0

        if (result.isFinal) {
          final += transcript
          maxConfidence = Math.max(maxConfidence, confidence)
        } else {
          interim += transcript
        }
      }

      setVoiceState(prev => ({
        ...prev,
        transcript: final || prev.transcript,
        interimTranscript: interim,
        confidence: final ? maxConfidence : prev.confidence,
      }))

      dispatch({ type: 'SET_TRANSCRIPT', transcript: final || interim })

      // Process final result
      if (final) {
        console.log('[VoiceNav] Heard:', final, '(confidence:', maxConfidence.toFixed(2), ')')
        const command = parseCommand(final)
        executeCommand(command)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('[VoiceNav] Recognition error:', event.error)
      let errorMsg = 'Voice recognition error'

      switch (event.error) {
        case 'no-speech':
          errorMsg = 'No speech detected. Try again.'
          break
        case 'audio-capture':
          errorMsg = 'No microphone found. Check your device.'
          break
        case 'not-allowed':
          errorMsg = 'Microphone access denied. Allow permission in browser settings.'
          setVoiceState(prev => ({ ...prev, permissionState: 'denied' }))
          break
        case 'network':
          errorMsg = 'Network error. Check your connection.'
          break
        case 'aborted':
          errorMsg = ''
          break
      }

      setVoiceState(prev => ({ ...prev, error: errorMsg, isListening: false }))
      dispatch({ type: 'SET_LISTENING', isListening: false })
      stopAudioMonitoring()

      if (errorMsg && event.error !== 'aborted') {
        speak(errorMsg)
      }
    }

    recognition.onend = () => {
      setVoiceState(prev => ({ ...prev, isListening: false, interimTranscript: '' }))
      dispatch({ type: 'SET_LISTENING', isListening: false })
      stopAudioMonitoring()
      setTimeout(() => dispatch({ type: 'SET_VOICE_OVERLAY', show: false }), 2000)
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch (err) {
      console.error('[VoiceNav] Failed to start recognition:', err)
      setVoiceState(prev => ({ ...prev, error: 'Failed to start voice recognition' }))
    }
  }, [state.voiceLang, dispatch, speak, executeCommand, startAudioMonitoring, stopAudioMonitoring])

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setVoiceState(prev => ({ ...prev, isListening: false, interimTranscript: '' }))
    dispatch({ type: 'SET_LISTENING', isListening: false })
    stopAudioMonitoring()
  }, [dispatch, stopAudioMonitoring])

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (voiceState.isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [voiceState.isListening, startListening, stopListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      window.speechSynthesis?.cancel()
      stopAudioMonitoring()
    }
  }, [stopAudioMonitoring])

  return {
    // State
    ...voiceState,

    // Actions
    startListening,
    stopListening,
    toggleListening,
    speak,
    getVoices,
    executeCommand,
    parseCommand,

    // Refs
    iframeRef,
  }
}
