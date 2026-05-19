import { useApp } from '../context/AppContext'
import { useVoice } from '../hooks/useVoice'
import './Header.css'

export function Header() {
  const { state, dispatch, goHome, iframeRef } = useApp()
  const { toggleListening, isListening, isSpeaking } = useVoice()
  const activeTab = state.tabs.find(t => t.id === state.activeTabId)

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-btn logo-btn" onClick={goHome} title="Home" aria-label="Go to home screen">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        {state.currentView === 'browser' && (
          <>
            <button className="header-btn" onClick={() => {
              try { iframeRef.current?.contentWindow?.history.back() } catch { /* ignore */ }
            }} title="Back" aria-label="Go back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="header-btn" onClick={() => {
              try { iframeRef.current?.contentWindow?.history.forward() } catch { /* ignore */ }
            }} title="Forward" aria-label="Go forward">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
      </div>

      <div className="header-center">
        {state.currentView === 'browser' && activeTab ? (
          <div className="url-bar">
            <svg className="url-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span className="url-text">{activeTab.title || activeTab.url}</span>
          </div>
        ) : (
          <div className="brand">
            <span className="brand-name">VoiceNav</span>
          </div>
        )}
      </div>

      <div className="header-right">
        <button
          className={`voice-btn ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
          onClick={toggleListening}
          title={isListening ? 'Stop listening' : 'Start voice command'}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        {state.currentView === 'browser' && (
          <button className="header-btn" onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })} title="Tabs">
            <span className="tab-count">{state.tabs.length}</span>
          </button>
        )}
      </div>
    </header>
  )
}
