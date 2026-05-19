interface VoiceNavLogoProps {
  size?: number
  className?: string
}

export default function VoiceNavLogo({ size = 120, className = '' }: VoiceNavLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      className={className}
      role="img"
      aria-label="VoiceNav logo"
    >
      <defs>
        <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a0a12" />
          <stop offset="100%" stopColor="#12122A" />
        </linearGradient>
        <linearGradient id="logoAccent" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#9B5CFF" />
        </linearGradient>
        <radialGradient id="logoGlow" cx="50%" cy="35%" r="50%">
          <stop offset="0%" stopColor="#9B5CFF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0a0a12" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="logoRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9B5CFF" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#C084FC" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#9B5CFF" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="1024" height="1024" rx="224" fill="url(#logoBg)" />
      <rect width="1024" height="1024" rx="224" fill="url(#logoGlow)" />

      {/* Outer ring */}
      <circle cx="512" cy="512" r="440" stroke="url(#logoRing)" strokeWidth="4" opacity="0.4" />
      <circle cx="512" cy="512" r="380" stroke="#9B5CFF" strokeWidth="2" opacity="0.15" />

      {/* Microphone body */}
      <rect x="442" y="240" width="140" height="280" rx="70" fill="url(#logoAccent)" />

      {/* Microphone arc */}
      <path
        d="M342 420a170 170 0 00340 0"
        stroke="url(#logoAccent)"
        strokeWidth="36"
        strokeLinecap="round"
        fill="none"
      />

      {/* Stand */}
      <line x1="512" y1="600" x2="512" y2="740" stroke="#9B5CFF" strokeWidth="36" strokeLinecap="round" />
      <line x1="402" y1="740" x2="622" y2="740" stroke="#9B5CFF" strokeWidth="36" strokeLinecap="round" />

      {/* Sound waves left */}
      <path
        d="M310 340c-30 30-30 120 0 150"
        stroke="#C084FC"
        strokeWidth="24"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M260 300c-50 50-50 200 0 230"
        stroke="#C084FC"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />

      {/* Sound waves right */}
      <path
        d="M714 340c30 30 30 120 0 150"
        stroke="#C084FC"
        strokeWidth="24"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M764 300c50 50 50 200 0 230"
        stroke="#C084FC"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />

      {/* Top dot accent */}
      <circle cx="512" cy="190" r="20" fill="#9B5CFF" opacity="0.6" />
    </svg>
  )
}
