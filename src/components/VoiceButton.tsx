import { useRef, useEffect, useState } from 'react'

type VoiceButtonProps = {
  isListening: boolean
  isSpeaking?: boolean
  onPress: () => void
  size?: number
  accessibilityLabel?: string
  className?: string
}

export default function VoiceButton({
  isListening,
  isSpeaking = false,
  onPress,
  size = 72,
  accessibilityLabel = 'Voice command',
  className = '',
}: VoiceButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])

  // Pulse ring animation state
  useEffect(() => {
    if (!isListening && !isSpeaking) {
      setRipples([])
    }
  }, [isListening, isSpeaking])

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    // Create ripple at click position
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples(prev => [...prev, { id, x, y }])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 600)
    onPress()
  }

  const micColor = isListening
    ? 'var(--accent)'
    : isSpeaking
      ? '#C084FC'
      : 'var(--text-secondary)'

  return (
    <button
      ref={buttonRef}
      className={`voice-button ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''} ${className}`}
      onClick={handleClick}
      aria-label={accessibilityLabel}
      aria-pressed={isListening}
      style={{ width: size, height: size }}
    >
      {/* Pulse rings */}
      {isListening && (
        <>
          <span className="voice-ring ring-1" />
          <span className="voice-ring ring-2" />
          <span className="voice-ring ring-3" />
        </>
      )}

      {/* Speaker waves */}
      {isSpeaking && (
        <>
          <span className="voice-wave wave-1" />
          <span className="voice-wave wave-2" />
        </>
      )}

      {/* Ripples */}
      {ripples.map(r => (
        <span
          key={r.id}
          className="voice-ripple"
          style={{ left: r.x, top: r.y }}
        />
      ))}

      {/* Microphone icon */}
      <svg
        width={size * 0.45}
        height={size * 0.45}
        viewBox="0 0 24 24"
        fill="none"
        style={{ color: micColor, position: 'relative', zIndex: 2 }}
      >
        <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <style>{`
        .voice-button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--bg-tertiary);
          border: 2px solid var(--border);
          cursor: pointer;
          overflow: hidden;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .voice-button:hover {
          border-color: var(--accent);
          background: rgba(155, 92, 255, 0.08);
          transform: scale(1.05);
        }

        .voice-button:active {
          transform: scale(0.95);
        }

        .voice-button.listening {
          border-color: var(--accent);
          background: rgba(155, 92, 255, 0.15);
          box-shadow: 0 0 30px var(--accent-glow);
        }

        .voice-button.speaking {
          border-color: #C084FC;
          background: rgba(192, 132, 252, 0.12);
          box-shadow: 0 0 30px rgba(192, 132, 252, 0.3);
        }

        /* Pulse rings */
        .voice-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid var(--accent);
          opacity: 0;
          pointer-events: none;
        }

        .ring-1 {
          animation: voicePulse 2s ease-out infinite;
        }

        .ring-2 {
          animation: voicePulse 2s ease-out 0.6s infinite;
        }

        .ring-3 {
          animation: voicePulse 2s ease-out 1.2s infinite;
        }

        @keyframes voicePulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        /* Speaker waves */
        .voice-wave {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid #C084FC;
          opacity: 0;
          pointer-events: none;
        }

        .wave-1 {
          animation: voiceWave 1.5s ease-out infinite;
        }

        .wave-2 {
          animation: voiceWave 1.5s ease-out 0.5s infinite;
        }

        @keyframes voiceWave {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        /* Click ripple */
        .voice-ripple {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent);
          opacity: 0.4;
          transform: translate(-50%, -50%) scale(0);
          animation: rippleExpand 0.6s ease-out forwards;
          pointer-events: none;
        }

        @keyframes rippleExpand {
          to {
            transform: translate(-50%, -50%) scale(12);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  )
}
