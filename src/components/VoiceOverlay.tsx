import { useVoice } from '../hooks/useVoice'
import { useApp } from '../context/AppContext'
import './VoiceOverlay.css'

export function VoiceOverlay() {
  const { state } = useApp()
  const {
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    confidence,
    error,
    audioLevel,
    permissionState,
    isSupported,
  } = useVoice()

  if (!state.showVoiceOverlay) return null

  const displayText = transcript || interimTranscript
  const statusText = isListening
    ? (displayText ? 'Listening...' : 'Speak now')
    : isSpeaking
      ? 'Speaking...'
      : 'Processing...'

  return (
    <div className="voice-overlay" role="dialog" aria-label="Voice command overlay" aria-modal="true">
      <div className="voice-overlay-content">
        {/* Microphone button with audio level ring */}
        <div className="voice-mic-container">
          <div
            className="voice-level-ring"
            style={{
              transform: `scale(${1 + audioLevel * 0.3})`,
              opacity: 0.3 + audioLevel * 0.7,
            }}
          />
          <div className={`voice-mic ${isListening ? 'active' : ''} ${isSpeaking ? 'speaking' : ''}`}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
              <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Status text */}
        <p className="voice-status">{statusText}</p>

        {/* Transcript display */}
        {displayText && (
          <div className="voice-transcript-container">
            <p className="voice-transcript">
              {transcript ? (
                <span className="final">{transcript}</span>
              ) : (
                <span className="interim">{interimTranscript}</span>
              )}
            </p>
            {confidence > 0 && (
              <div className="voice-confidence">
                <div className="confidence-bar">
                  <div className="confidence-fill" style={{ width: `${confidence * 100}%` }} />
                </div>
                <span className="confidence-text">{Math.round(confidence * 100)}% confident</span>
              </div>
            )}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="voice-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Permission prompt */}
        {!isSupported && (
          <div className="voice-unsupported">
            <p>Voice recognition is not supported in this browser.</p>
            <p>Try Chrome, Edge, or Safari.</p>
          </div>
        )}

        {permissionState === 'denied' && (
          <div className="voice-unsupported">
            <p>Microphone access is blocked.</p>
            <p>Enable it in browser settings to use voice commands.</p>
          </div>
        )}

        {/* Audio visualization */}
        {isListening && (
          <div className="voice-waves">
            {Array.from({ length: 7 }, (_, i) => (
              <span
                key={i}
                className="wave"
                style={{
                  animationDelay: `${i * 0.08}s`,
                  height: `${8 + audioLevel * 20 + Math.sin(Date.now() / 200 + i) * 4}px`,
                }}
              />
            ))}
          </div>
        )}

        {/* Hint text */}
        <p className="voice-hint">
          {isListening
            ? 'Say a command like "Go to youtube.com" or "Search for weather"'
            : 'Tap microphone to start'}
        </p>
      </div>
    </div>
  )
}
