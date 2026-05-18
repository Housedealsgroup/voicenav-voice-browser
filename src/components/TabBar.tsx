import { useApp } from '../context/AppContext'
import './TabBar.css'

export function TabBar() {
  const { state, dispatch, navigate } = useApp()

  if (state.tabs.length === 0) return null

  return (
    <div className="tab-bar">
      <div className="tab-list">
        {state.tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${tab.isActive ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', tabId: tab.id })}
          >
            <span className="tab-title">{tab.title || 'New Tab'}</span>
            <button
              className="tab-close"
              onClick={e => {
                e.stopPropagation()
                dispatch({ type: 'CLOSE_TAB', tabId: tab.id })
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button className="new-tab-btn" onClick={() => navigate('https://www.google.com', 'New Tab')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
