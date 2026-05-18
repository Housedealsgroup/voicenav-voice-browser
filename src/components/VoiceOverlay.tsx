import { useVoice } from '../hooks/useVoice'
import './VoiceOverlay.css'

export function VoiceOverlay() {
  const { isListening, transcript, showVoiceOverlay } = useVoice()

  if (!showVoiceOverlay) return null

  return (
    <div className="voice-overlay">
      <div className="voice-overlay-content">
        <div className={`voice-mic ${isListening ? 'active' : ''}`}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="voice-status">{isListening ? 'Listening...' : 'Processing...'}</p>
        {transcript && <p className="voice-transcript">&quot;{transcript}&quot;</p>}
        <div className="voice-waves">
          <span className="wave" /><span className="wave" /><span className="wave" />
          <span className="wave" /><span className="wave" />
        </div>
      </div>
    </div>
  )
}
