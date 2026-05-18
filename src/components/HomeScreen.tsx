import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useVoice } from '../hooks/useVoice'
import './HomeScreen.css'

export function HomeScreen() {
  const { state, dispatch, navigate, search } = useApp()
  const { toggleListening, isListening } = useVoice()
  const [query, setQuery] = useState('')

  const quickLinks = [
    { name: 'Google', url: 'https://www.google.com', icon: 'G' },
    { name: 'YouTube', url: 'https://www.youtube.com', icon: 'Y' },
    { name: 'Wikipedia', url: 'https://www.wikipedia.org', icon: 'W' },
    { name: 'Reddit', url: 'https://www.reddit.com', icon: 'R' },
    { name: 'GitHub', url: 'https://github.com', icon: 'GH' },
    { name: 'Twitter', url: 'https://x.com', icon: 'X' },
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
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="1.5"/>
            <path d="M12 6v6l4 2" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="3" fill="var(--accent)" opacity="0.3"/>
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
            <div className="quick-link-icon">{link.icon}</div>
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
