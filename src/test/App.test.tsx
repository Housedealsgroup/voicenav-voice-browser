import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renders the VoiceNav title', () => {
    render(<App />)
    const elements = screen.getAllByText('VoiceNav')
    expect(elements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders search input', () => {
    render(<App />)
    expect(screen.getByPlaceholderText('Search or type a URL...')).toBeInTheDocument()
  })

  it('renders voice button', () => {
    render(<App />)
    expect(screen.getByText('Tap to speak')).toBeInTheDocument()
  })

  it('renders quick links', () => {
    render(<App />)
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('YouTube')).toBeInTheDocument()
    expect(screen.getByText('Wikipedia')).toBeInTheDocument()
  })

  it('renders navigation buttons', () => {
    render(<App />)
    expect(screen.getByText('Bookmarks')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })
})
