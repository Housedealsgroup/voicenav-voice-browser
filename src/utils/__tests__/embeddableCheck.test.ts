import { describe, it, expect } from 'vitest'
import { isLikelyBlocked, rewriteForEmbed, extractYouTubeVideoId } from '../embeddableCheck'

describe('embeddableCheck', () => {
  describe('isLikelyBlocked', () => {
    it('blocks google.com', () => {
      expect(isLikelyBlocked('https://www.google.com')).toBe(true)
    })

    it('blocks youtube.com', () => {
      expect(isLikelyBlocked('https://youtube.com')).toBe(true)
    })

    it('blocks reddit.com', () => {
      expect(isLikelyBlocked('https://www.reddit.com/r/programming')).toBe(true)
    })

    it('blocks twitter.com', () => {
      expect(isLikelyBlocked('https://twitter.com/home')).toBe(true)
    })

    it('blocks x.com', () => {
      expect(isLikelyBlocked('https://x.com')).toBe(true)
    })

    it('blocks facebook.com', () => {
      expect(isLikelyBlocked('https://facebook.com')).toBe(true)
    })

    it('blocks github.com', () => {
      expect(isLikelyBlocked('https://github.com')).toBe(true)
    })

    it('does NOT block example.com', () => {
      expect(isLikelyBlocked('https://example.com')).toBe(false)
    })

    it('does NOT block wikipedia.org', () => {
      expect(isLikelyBlocked('https://wikipedia.org')).toBe(false)
    })

    it('does NOT block a random site', () => {
      expect(isLikelyBlocked('https://my-cool-site.dev')).toBe(false)
    })

    it('handles invalid URLs gracefully', () => {
      expect(isLikelyBlocked('not-a-url')).toBe(false)
    })
  })

  describe('extractYouTubeVideoId', () => {
    it('extracts from youtube.com/watch?v=', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('extracts from youtu.be/', () => {
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('extracts from m.youtube.com', () => {
      expect(extractYouTubeVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('returns null for non-YouTube URLs', () => {
      expect(extractYouTubeVideoId('https://example.com')).toBeNull()
    })

    it('returns null for YouTube homepage', () => {
      expect(extractYouTubeVideoId('https://youtube.com')).toBeNull()
    })
  })

  describe('rewriteForEmbed', () => {
    it('rewrites youtube.com/watch to youtube-nocookie embed', () => {
      expect(rewriteForEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
        .toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    })

    it('rewrites youtu.be to youtube-nocookie embed', () => {
      expect(rewriteForEmbed('https://youtu.be/dQw4w9WgXcQ'))
        .toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    })

    it('returns null for non-YouTube URLs', () => {
      expect(rewriteForEmbed('https://example.com')).toBeNull()
    })

    it('returns null for invalid URLs', () => {
      expect(rewriteForEmbed('not-a-url')).toBeNull()
    })
  })
})
