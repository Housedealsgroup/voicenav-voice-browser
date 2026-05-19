import { useVoice } from '../hooks/useVoice'
import './OfflineBanner.css'

export function OfflineBanner({ visible }: { visible: boolean }) {
  const { speak } = useVoice()

  if (!visible) return null

  return (
    <div
      className="offline-banner"
      role="alert"
      aria-live="assertive"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M5 12.55a10.94 10.94 0 015.17-2.39" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10.71 5.05A16 16 0 0122.56 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M1.42 9a15.91 15.91 0 014.7-2.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M8.53 16.11a6 6 0 016.95 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="20" x2="12.01" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <span>You are offline — commands will be queued</span>
    </div>
  )
}
