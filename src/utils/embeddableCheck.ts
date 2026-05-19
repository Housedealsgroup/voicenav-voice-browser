const KNOWN_BLOCKED_DOMAINS = new Set([
  'google.com',
  'mail.google.com',
  'accounts.google.com',
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'reddit.com',
  'www.reddit.com',
  'twitter.com',
  'www.twitter.com',
  'x.com',
  'www.x.com',
  'facebook.com',
  'www.facebook.com',
  'instagram.com',
  'www.instagram.com',
  'linkedin.com',
  'www.linkedin.com',
  'tiktok.com',
  'www.tiktok.com',
  'twitch.tv',
  'www.twitch.tv',
  'github.com',
  'www.github.com',
  'apple.com',
  'www.apple.com',
  'microsoft.com',
  'www.microsoft.com',
  'amazon.com',
  'www.amazon.com',
  'netflix.com',
  'www.netflix.com',
  'spotify.com',
  'www.spotify.com',
])

export function isLikelyBlocked(url: string): boolean {
  try {
    const hostname = new URL(url.includes('://') ? url : `https://${url}`).hostname.toLowerCase()
    if (KNOWN_BLOCKED_DOMAINS.has(hostname)) return true
    // Check parent domain (e.g., sub.example.com -> example.com)
    const parts = hostname.split('.')
    if (parts.length > 2) {
      const parent = parts.slice(-2).join('.')
      return KNOWN_BLOCKED_DOMAINS.has(parent)
    }
    return false
  } catch {
    return false
  }
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.includes('://') ? url : `https://${url}`)
    const hostname = parsed.hostname.toLowerCase()

    // youtu.be/VIDEO_ID
    if (hostname === 'youtu.be') {
      const id = parsed.pathname.slice(1)
      return id.length >= 10 ? id : null
    }

    // youtube.com/watch?v=VIDEO_ID
    if (hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v')
      if (v && v.length >= 10) return v
    }

    return null
  } catch {
    return null
  }
}

export function rewriteForEmbed(url: string): string | null {
  const videoId = extractYouTubeVideoId(url)
  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}`
  }
  return null
}
