import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useVoice } from '../hooks/useVoice'
import './HomeScreen.css'

export function HomeScreen() {
  const { state, dispatch, navigate, search } = useApp()
  const { toggleListening, isListening } = useVoice()
  const [query, setQuery] = useState('')

  const quickLinks = [
    { name: 'Google', url: 'https://www.google.com', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> },
    { name: 'YouTube', url: 'https://www.youtube.com', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="4" stroke="#FF0000" strokeWidth="2"/><path d="M10 9l5 3-5 3V9z" fill="#FF0000"/></svg> },
    { name: 'Wikipedia', url: 'https://www.wikipedia.org', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#636466" strokeWidth="2"/><text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="700" fill="#636466">W</text></svg> },
    { name: 'Reddit', url: 'https://www.reddit.com', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#FF4500" strokeWidth="2"/><circle cx="9" cy="10" r="1.5" fill="#FF4500"/><circle cx="15" cy="10" r="1.5" fill="#FF4500"/><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#FF4500" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { name: 'GitHub', url: 'https://github.com', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill="currentColor"/></svg> },
    { name: 'X', url: 'https://x.com', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/></svg> },
  ]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    const t = query.trim()
    if (t.includes('.') && !t.includes(' ')) {
      navigate(t)
    } else {
      search(t)
    }
    setQuery('')
  }

  return (
    <div className="home-screen">
      <div className="home-hero">
        <div className="home-logo">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
            {/* Outer glow ring */}
            <circle cx="12" cy="12" r="11" stroke="var(--accent)" strokeWidth="1" opacity="0.25"/>
            <circle cx="12" cy="12" r="9" stroke="var(--accent)" strokeWidth="0.5" opacity="0.15"/>
            {/* Microphone body */}
            <rect x="9" y="2" width="6" height="12" rx="3" stroke="var(--accent)" strokeWidth="1.8"/>
            {/* Mic arc */}
            <path d="M5 10a7 7 0 0014 0" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/>
            {/* Stand */}
            <line x1="12" y1="17" x2="12" y2="22" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="8" y1="22" x2="16" y2="22" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/>
            {/* Sound waves */}
            <path d="M19 7c1.5 1.5 1.5 8.5 0 10" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
            <path d="M21 5c2.5 2.5 2.5 14 0 14" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
          </svg>
        </div>
        <h1 className="home-title">VoiceNav</h1>
        <p className="home-subtitle">Speak to browse the web</p>
      </div>

      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-container">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search or type a URL..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button type="button" className="search-voice-btn" onClick={toggleListening}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </form>

      <div className="voice-prompt">
        <button className="voice-large-btn" onClick={toggleListening}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>{isListening ? 'Listening...' : 'Tap to speak'}</span>
        </button>
        <p className="voice-hint">Say &quot;Go to youtube.com&quot; or &quot;Search for weather&quot;</p>
      </div>

      <div className="quick-links">
        {quickLinks.map(link => (
          <button
            key={link.name}
            className="quick-link"
            onClick={() => navigate(link.url, link.name)}
          >
            <div className="quick-link-icon">{link.svg}</div>
            <span className="quick-link-name">{link.name}</span>
          </button>
        ))}
      </div>

      {state.bookmarks.length > 0 && (
        <div className="home-section">
          <h2 className="section-title">Bookmarks</h2>
          <div className="bookmark-list">
            {state.bookmarks.slice(0, 6).map(b => (
              <button key={b.id} className="bookmark-item" onClick={() => navigate(b.url, b.title)}>
                <span className="bookmark-title">{b.title}</span>
                <span className="bookmark-url">{new URL(b.url).hostname}</span>
              </button>
            ))}
          </div>
          <button className="see-all-btn" onClick={() => dispatch({ type: 'SET_VIEW', view: 'bookmarks' })}>
            See all bookmarks
          </button>
        </div>
      )}

      {state.history.length > 0 && (
        <div className="home-section">
          <h2 className="section-title">Recent</h2>
          <div className="history-list">
            {state.history.slice(0, 5).map(h => (
              <button key={h.id} className="history-item" onClick={() => navigate(h.url, h.title)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="history-title">{h.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="home-nav">
        <button className="nav-btn" onClick={() => dispatch({ type: 'SET_VIEW', view: 'bookmarks' })}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Bookmarks</span>
        </button>
        <button className="nav-btn" onClick={() => dispatch({ type: 'SET_VIEW', view: 'history' })}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>History</span>
        </button>
        <button className="nav-btn" onClick={() => dispatch({ type: 'SET_VIEW', view: 'settings' })}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>Settings</span>
        </button>
      </nav>
    </div>
  )
}
