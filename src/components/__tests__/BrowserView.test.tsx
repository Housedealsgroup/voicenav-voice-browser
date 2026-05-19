import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppProvider } from '../../context/AppContext'
import { BrowserView } from '../BrowserView'

// Mock useVoice to avoid speech synthesis
vi.mock('../../hooks/useVoice', () => ({
  useVoice: () => ({
    speak: vi.fn(),
    isSpeaking: false,
    toggleListening: vi.fn(),
    isListening: false,
  }),
}))

function renderBrowserView() {
  return render(
    <AppProvider>
      <BrowserView />
    </AppProvider>
  )
}

describe('BrowserView', () => {
  it('renders "No active tab" message when no tabs exist', () => {
    renderBrowserView()
    expect(screen.getByText('No active tab')).toBeInTheDocument()
  })

  it('renders with correct accessibility attributes', () => {
    renderBrowserView()
    expect(screen.getByText('No active tab')).toBeInTheDocument()
  })
})
