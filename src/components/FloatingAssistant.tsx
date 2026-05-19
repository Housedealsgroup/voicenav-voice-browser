import { useState, useCallback } from 'react'
import { useVoice } from '../hooks/useVoice'
import './FloatingAssistant.css'

type Message = {
  id: string
  text: string
  type: 'user' | 'assistant' | 'system'
  timestamp: number
}

type FloatingAssistantProps = {
  visible: boolean
  status: string
  isListening: boolean
  isProcessing: boolean
  messages: Message[]
  suggestions: string[]
  onVoiceToggle: () => void
  onSuggestionPress: (suggestion: string) => void
  onExpand?: () => void
  currentTaskName?: string
  taskProgress?: { current: number; total: number } | null
}

export function FloatingAssistant({
  visible, status, isListening, isProcessing, messages, suggestions,
  onVoiceToggle, onSuggestionPress, onExpand, currentTaskName, taskProgress,
}: FloatingAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleBubblePress = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  if (!visible) return null

  const bubbleClass = isListening ? 'listening' : isProcessing ? 'processing' : ''

  return (
    <div className="floating-assistant">
      {/* Expanded Panel */}
      {isExpanded && (
        <div className="assistant-panel">
          {/* Header */}
          <div className="assistant-header">
            <div className="assistant-header-left">
              <div className={`status-dot ${isListening ? 'active' : ''}`} />
              <span className="assistant-title">VoiceNav</span>
            </div>
            <button className="assistant-close" onClick={() => setIsExpanded(false)} aria-label="Close assistant panel">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Status */}
          <p className="assistant-status">{status || 'Ready'}</p>

          {/* Task Progress */}
          {currentTaskName && taskProgress && (
            <div className="assistant-task">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="task-name">{currentTaskName}</span>
              <span className="task-progress">{taskProgress.current}/{taskProgress.total}</span>
            </div>
          )}

          {/* Messages */}
          <div className="assistant-messages">
            {messages.slice(-4).map(msg => (
              <div key={msg.id} className={`assistant-msg ${msg.type}`}>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="assistant-suggestions">
              {suggestions.slice(0, 3).map((s, i) => (
                <button key={i} className="suggestion-chip" onClick={() => onSuggestionPress(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="assistant-actions">
            <button className="assistant-action" onClick={onVoiceToggle} aria-label={isListening ? 'Stop listening' : 'Start listening'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                {isListening ? (
                  <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/>
                ) : (
                  <>
                    <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </>
                )}
              </svg>
            </button>
            {onExpand && (
              <button className="assistant-action" onClick={onExpand} aria-label="Open command palette">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bubble */}
      <button
        className={`assistant-bubble ${bubbleClass}`}
        onClick={handleBubblePress}
        aria-label="VoiceNav assistant"
        title="Tap to expand, long press for voice command"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          {isListening ? (
            <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/>
          ) : isProcessing ? (
            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          ) : (
            <>
              <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </>
          )}
        </svg>
        {taskProgress && (
          <span className="assistant-badge">{taskProgress.current}</span>
        )}
      </button>
    </div>
  )
}
