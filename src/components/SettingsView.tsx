import { useApp } from '../context/AppContext'
import './SettingsView.css'

export function SettingsView() {
  const { state, dispatch } = useApp()

  const engines = [
    { value: 'google', label: 'Google' },
    { value: 'duckduckgo', label: 'DuckDuckGo' },
    { value: 'bing', label: 'Bing' },
  ] as const

  const languages = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'es-ES', label: 'Spanish' },
    { value: 'fr-FR', label: 'French' },
    { value: 'de-DE', label: 'German' },
    { value: 'it-IT', label: 'Italian' },
    { value: 'pt-BR', label: 'Portuguese (BR)' },
    { value: 'zh-CN', label: 'Chinese' },
    { value: 'ja-JP', label: 'Japanese' },
    { value: 'ko-KR', label: 'Korean' },
    { value: 'ar-SA', label: 'Arabic' },
    { value: 'hi-IN', label: 'Hindi' },
    { value: 'ru-RU', label: 'Russian' },
  ]

  return (
    <div className="settings-view">
      <div className="view-header">
        <button className="back-btn" onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="view-title">Settings</h1>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Search Engine</h2>
        <div className="settings-options">
          {engines.map(e => (
            <button
              key={e.value}
              className={`settings-option ${state.searchEngine === e.value ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_SEARCH_ENGINE', engine: e.value })}
            >
              <span>{e.label}</span>
              {state.searchEngine === e.value && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Voice Language</h2>
        <select
          className="settings-select"
          value={state.voiceLang}
          onChange={e => dispatch({ type: 'SET_VOICE_LANG', lang: e.target.value })}
        >
          {languages.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Font Size</h2>
        <div className="font-size-control">
          <button
            className="size-btn"
            onClick={() => dispatch({ type: 'SET_FONT_SIZE', size: Math.max(state.fontSize - 2, 10) })}
          >
            A-
          </button>
          <span className="size-value">{state.fontSize}px</span>
          <button
            className="size-btn"
            onClick={() => dispatch({ type: 'SET_FONT_SIZE', size: Math.min(state.fontSize + 2, 32) })}
          >
            A+
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Voice Commands</h2>
        <div className="commands-help">
          <div className="command-item">
            <code>&quot;Go to youtube.com&quot;</code>
            <span>Navigate to a website</span>
          </div>
          <div className="command-item">
            <code>&quot;Search for weather&quot;</code>
            <span>Search the web</span>
          </div>
          <div className="command-item">
            <code>&quot;Go back&quot;</code>
            <span>Go to previous page</span>
          </div>
          <div className="command-item">
            <code>&quot;Reload&quot;</code>
            <span>Refresh the page</span>
          </div>
          <div className="command-item">
            <code>&quot;Scroll down&quot;</code>
            <span>Scroll the page down</span>
          </div>
          <div className="command-item">
            <code>&quot;Bookmark&quot;</code>
            <span>Save current page</span>
          </div>
          <div className="command-item">
            <code>&quot;Home&quot;</code>
            <span>Go to home screen</span>
          </div>
          <div className="command-item">
            <code>&quot;New tab&quot;</code>
            <span>Open a new tab</span>
          </div>
          <div className="command-item">
            <code>&quot;Zoom in&quot; / &quot;Zoom out&quot;</code>
            <span>Adjust text size</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">About</h2>
        <div className="about-info">
          <p><strong>VoiceNav Voice Browser</strong> v1.0.0</p>
          <p>AI-powered voice-controlled browser</p>
          <p className="about-muted">Built with React + TypeScript + Vite</p>
          <p className="about-muted">Progressive Web App &middot; Works offline</p>
        </div>
      </div>
    </div>
  )
}
