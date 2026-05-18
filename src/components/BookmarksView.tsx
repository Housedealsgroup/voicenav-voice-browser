import { useApp } from '../context/AppContext'
import './BookmarksView.css'

export function BookmarksView() {
  const { state, dispatch, navigate } = useApp()

  return (
    <div className="bookmarks-view">
      <div className="view-header">
        <button className="back-btn" onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="view-title">Bookmarks</h1>
      </div>
      {state.bookmarks.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke="var(--text-muted)" strokeWidth="1.5"/>
          </svg>
          <p>No bookmarks yet</p>
          <span>Tap the bookmark icon while browsing to save a page</span>
        </div>
      ) : (
        <div className="items-list">
          {state.bookmarks.map(b => (
            <div key={b.id} className="list-item">
              <button className="item-content" onClick={() => navigate(b.url, b.title)}>
                <div className="item-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" fill="var(--accent)" opacity="0.3" stroke="var(--accent)" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="item-info">
                  <span className="item-title">{b.title}</span>
                  <span className="item-url">{new URL(b.url).hostname}</span>
                </div>
              </button>
              <button className="delete-btn" onClick={() => dispatch({ type: 'REMOVE_BOOKMARK', id: b.id })}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
