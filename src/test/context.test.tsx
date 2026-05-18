import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AppProvider, useApp } from '../context/AppContext'

function TestComponent() {
  const { state, dispatch, navigate, search, goHome } = useApp()
  return (
    <div>
      <span data-testid="view">{state.currentView}</span>
      <span data-testid="tabs">{state.tabs.length}</span>
      <span data-testid="bookmarks">{state.bookmarks.length}</span>
      <button onClick={() => navigate('https://example.com', 'Example')}>Navigate</button>
      <button onClick={() => search('test query')}>Search</button>
      <button onClick={() => goHome()}>Home</button>
      <button onClick={() => { dispatch({ type: 'ADD_BOOKMARK', bookmark: { id: '1', title: 'Test', url: 'https://test.com', createdAt: Date.now() } }) }}>Add Bookmark</button>
      <button onClick={() => dispatch({ type: 'CLEAR_HISTORY' })}>Clear History</button>
    </div>
  )
}

describe('AppContext', () => {
  it('provides default state', () => {
    render(<AppProvider><TestComponent /></AppProvider>)
    expect(screen.getByTestId('view')).toHaveTextContent('home')
    expect(screen.getByTestId('tabs')).toHaveTextContent('0')
    expect(screen.getByTestId('bookmarks')).toHaveTextContent('0')
  })

  it('navigates to URL', () => {
    render(<AppProvider><TestComponent /></AppProvider>)
    fireEvent.click(screen.getByText('Navigate'))
    expect(screen.getByTestId('view')).toHaveTextContent('browser')
    expect(screen.getByTestId('tabs')).toHaveTextContent('1')
  })

  it('adds bookmark', () => {
    render(<AppProvider><TestComponent /></AppProvider>)
    fireEvent.click(screen.getByText('Add Bookmark'))
    expect(screen.getByTestId('bookmarks')).toHaveTextContent('1')
  })

  it('goes home', () => {
    render(<AppProvider><TestComponent /></AppProvider>)
    fireEvent.click(screen.getByText('Navigate'))
    expect(screen.getByTestId('view')).toHaveTextContent('browser')
    fireEvent.click(screen.getByText('Home'))
    expect(screen.getByTestId('view')).toHaveTextContent('home')
  })

  it('prevents duplicate bookmarks', () => {
    render(<AppProvider><TestComponent /></AppProvider>)
    fireEvent.click(screen.getByText('Add Bookmark'))
    fireEvent.click(screen.getByText('Add Bookmark'))
    expect(screen.getByTestId('bookmarks')).toHaveTextContent('1')
  })
})
