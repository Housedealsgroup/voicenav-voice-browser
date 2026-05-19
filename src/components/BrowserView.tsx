import { useRef, useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { useVoice } from '../hooks/useVoice'
import './BrowserView.css'

type LoadState = 'idle' | 'loading' | 'loaded' | 'error'

export function BrowserView() {
  const { state, dispatch } = useApp()
  const { speak } = useVoice()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [urlInput, setUrlInput] = useState('')
  const [showUrlBar, setShowUrlBar] = useState(false)
  const [loadError, setLoadError] = useState('')
  const activeTab = state.tabs.find(t => t.id === state.activeTabId)

  // Sync URL input with active tab
  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url)
      setLoadState('loading')
      setLoadError('')
    }
  }, [activeTab?.url, activeTab?.id])

  // Handle URL submission
  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!urlInput.trim()) return

    const t = urlInput.trim()
    let url: string

    if (isValidUrl(t)) {
      url = t.includes('://') ? t : `https://${t}`
    } else {
      url = `https://www.google.com/search?igu=1&q=${encodeURIComponent(t)}`
    }

    if (state.activeTabId) {
      dispatch({ type: 'UPDATE_TAB', tabId: state.activeTabId, updates: { url } })
    }
    setShowUrlBar(false)
  }

  // Validate URL
  function isValidUrl(str: string): boolean {
    try {
      const url = new URL(str.includes('://') ? str : `https://${str}`)
      return url.hostname.includes('.')
    } catch {
      return false
    }
  }

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setLoadState('loaded')
    setLoadError('')

    try {
      const iframe = iframeRef.current
      if (iframe?.contentDocument?.title) {
        const title = iframe.contentDocument.title
        dispatch({
          type: 'UPDATE_TAB',
          tabId: state.activeTabId!,
          updates: { title }
        })
        speak(`Page loaded: ${title}`)
      } else {
        speak('Page loaded')
      }
    } catch {
      // Cross-origin restriction - expected for most sites
      speak('Page loaded')
    }
  }, [dispatch, state.activeTabId, speak])

  // Handle iframe error
  const handleIframeError = useCallback(() => {
    setLoadState('error')
    setLoadError('Failed to load page. The site may block embedding.')
    speak('Failed to load page. The site may block embedding.')
  }, [speak])

  // Reload iframe
  const handleReload = useCallback(() => {
    if (iframeRef.current && activeTab) {
      setLoadState('loading')
      setLoadError('')
      iframeRef.current.src = activeTab.url
    }
  }, [activeTab])

  // Go back
  const handleBack = useCallback(() => {
    try {
      iframeRef.current?.contentWindow?.history.back()
    } catch {}
  }, [])

  // Go forward
  const handleForward = useCallback(() => {
    try {
      iframeRef.current?.contentWindow?.history.forward()
    } catch {}
  }, [])

  // Add bookmark
  const handleBookmark = useCallback(() => {
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
    }
  }, [activeTab, dispatch])

  // Get security indicator
  function getSecurityInfo(url: string): { icon: string; color: string; label: string } {
    try {
      const parsed = new URL(url)
      if (parsed.protocol === 'https:') {
        return { icon: '🔒', color: 'var(--success)', label: 'Secure' }
      } else if (parsed.protocol === 'http:') {
        return { icon: '⚠️', color: 'var(--warning)', label: 'Not secure' }
      } else if (parsed.protocol === 'data:') {
        return { icon: '📄', color: 'var(--text-muted)', label: 'Data URL' }
      }
    } catch {}
    return { icon: '🌐', color: 'var(--text-muted)', label: '' }
  }

  if (!activeTab) {
    return (
      <div className="browser-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="var(--text-muted)" strokeWidth="1.5" />
          <path d="M2 12h20" stroke="var(--text-muted)" strokeWidth="1.5" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="var(--text-muted)" strokeWidth="1.5" />
        </svg>
        <p>No active tab</p>
        <span>Open a link or say "Go to..." to start browsing</span>
      </div>
    )
  }

  const security = getSecurityInfo(activeTab.url)

  return (
    <div className="browser-view">
      {/* Loading progress bar */}
      {loadState === 'loading' && (
        <div className="loading-bar">
          <div className="loading-progress" />
        </div>
      )}

      {/* Browser toolbar */}
      <div className="browser-toolbar">
        <button className="toolbar-btn" onClick={handleBack} title="Back" aria-label="Go back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button className="toolbar-btn" onClick={handleForward} title="Forward" aria-label="Go forward">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button className="toolbar-btn" onClick={handleReload} title="Reload" aria-label="Reload page">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* URL bar */}
        <form className="toolbar-url" onSubmit={handleUrlSubmit}>
          <span className="url-security" title={security.label} style={{ color: security.color }}>
            {security.icon}
          </span>
          <input
            className="toolbar-url-input"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onFocus={() => setShowUrlBar(true)}
            onBlur={() => setTimeout(() => setShowUrlBar(false), 200)}
            placeholder="Search or enter URL"
            aria-label="URL address bar"
          />
          {loadState === 'loading' && (
            <button type="button" className="toolbar-btn stop-btn" onClick={() => {
              if (iframeRef.current) iframeRef.current.src = 'about:blank'
              setLoadState('idle')
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" />
              </svg>
            </button>
          )}
        </form>

        <button className="toolbar-btn" onClick={handleBookmark} title="Bookmark" aria-label="Add bookmark">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Error state */}
      {loadState === 'error' && (
        <div className="browser-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--error)" strokeWidth="1.5" />
            <line x1="15" y1="9" x2="9" y2="15" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" />
            <line x1="9" y1="9" x2="15" y2="15" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="error-title">Failed to load page</p>
          <p className="error-message">{loadError}</p>
          <div className="error-actions">
            <button className="error-btn" onClick={handleReload}>Try again</button>
            <button className="error-btn secondary" onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}>Go home</button>
          </div>
        </div>
      )}

      {/* Browser iframe */}
      <iframe
        ref={iframeRef}
        className={`browser-iframe ${loadState === 'error' ? 'hidden' : ''}`}
        src={activeTab.url}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation-by-user-activation allow-downloads"
        title={activeTab.title}
        style={{ fontSize: `${state.fontSize}px` }}
        allow="accelerometer; camera; encrypted-media; fullscreen; geolocation; gyroscope; microphone; midi; payment; usb"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
