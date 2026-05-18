import { useApp } from '../context/AppContext'
import './BookmarksView.css'

export function HistoryView() {
  const { state, dispatch, navigate } = useApp()

  function formatTime(ts: number): string {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - ts
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="history-view">
      <div className="view-header">
        <button className="back-btn" onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="view-title">History</h1>
        {state.history.length > 0 && (
          <button className="clear-btn" onClick={() => dispatch({ type: 'CLEAR_HISTORY' })}>
            Clear
          </button>
        )}
      </div>
      {state.history.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--text-muted)" strokeWidth="1.5"/>
            <path d="M12 6v6l4 2" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p>No history yet</p>
          <span>Pages you visit will appear here</span>
        </div>
      ) : (
        <div className="items-list">
          {state.history.map(h => (
            <div key={h.id} className="list-item">
              <button className="item-content" onClick={() => navigate(h.url, h.title)}>
                <div className="item-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="var(--text-muted)" strokeWidth="2"/>
                    <path d="M12 6v6l4 2" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="item-info">
                  <span className="item-title">{h.title}</span>
                  <span className="item-url">{new URL(h.url).hostname} &middot; {formatTime(h.visitedAt)}</span>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
