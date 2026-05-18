import { useRef, useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import './BrowserView.css'

export function BrowserView() {
  const { state, dispatch } = useApp()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlBar, setShowUrlBar] = useState(false)
  const activeTab = state.tabs.find(t => t.id === state.activeTabId)

  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url)
    }
  }, [activeTab?.url])

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!urlInput.trim()) return
    const t = urlInput.trim()
    const url = t.includes('.') && !t.includes(' ') ? (t.includes('://') ? t : `https://${t}`) : `https://www.google.com/search?igu=1&q=${encodeURIComponent(t)}`
    if (state.activeTabId) {
      dispatch({ type: 'UPDATE_TAB', tabId: state.activeTabId, updates: { url } })
    }
    setShowUrlBar(false)
  }

  function handleIframeLoad() {
    setIsLoading(false)
    try {
      const iframe = iframeRef.current
      if (iframe?.contentDocument?.title) {
        dispatch({
          type: 'UPDATE_TAB',
          tabId: state.activeTabId!,
          updates: { title: iframe.contentDocument.title }
        })
      }
    } catch {
      // cross-origin restriction
    }
  }

  if (!activeTab) {
    return (
      <div className="browser-empty">
        <p>No active tab</p>
      </div>
    )
  }

  return (
    <div className="browser-view">
      {isLoading && <div className="loading-bar" />}
      <div className="browser-toolbar">
        <button className="toolbar-btn" onClick={() => {
          const iframe = iframeRef.current
          iframe?.contentWindow?.history.back()
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="toolbar-btn" onClick={() => {
          const iframe = iframeRef.current
          iframe?.contentWindow?.history.forward()
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="toolbar-btn" onClick={() => {
          if (iframeRef.current) {
            setIsLoading(true)
            iframeRef.current.src = iframeRef.current.src
          }
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <form className="toolbar-url" onSubmit={handleUrlSubmit}>
          <input
            className="toolbar-url-input"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onFocus={() => setShowUrlBar(true)}
            onBlur={() => setTimeout(() => setShowUrlBar(false), 200)}
            placeholder="Search or enter URL"
          />
        </form>
        <button className="toolbar-btn" onClick={() => {
          dispatch({ type: 'ADD_BOOKMARK', bookmark: {
            id: Date.now().toString(36),
            title: activeTab.title,
            url: activeTab.url,
            createdAt: Date.now(),
          }})
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <iframe
        ref={iframeRef}
        className="browser-iframe"
        src={activeTab.url}
        onLoad={handleIframeLoad}
        onLoadStart={() => setIsLoading(true)}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation-by-user-activation"
        title={activeTab.title}
        style={{ fontSize: `${state.fontSize}px` }}
      />
    </div>
  )
}
