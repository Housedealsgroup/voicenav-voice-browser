import { AppProvider, useApp } from './context/AppContext'
import { Header } from './components/Header'
import { HomeScreen } from './components/HomeScreen'
import { BrowserView } from './components/BrowserView'
import { TabBar } from './components/TabBar'
import { BookmarksView } from './components/BookmarksView'
import { HistoryView } from './components/HistoryView'
import { SettingsView } from './components/SettingsView'
import { VoiceOverlay } from './components/VoiceOverlay'
import './App.css'

function AppContent() {
  const { state } = useApp()

  function renderView() {
    switch (state.currentView) {
      case 'home':
        return <HomeScreen />
      case 'browser':
        return (
          <>
            <TabBar />
            <BrowserView />
          </>
        )
      case 'bookmarks':
        return <BookmarksView />
      case 'history':
        return <HistoryView />
      case 'settings':
        return <SettingsView />
      default:
        return <HomeScreen />
    }
  }

  return (
    <div className={`app ${state.theme}`}>
      <Header />
      <main className="main-content">
        {renderView()}
      </main>
      <VoiceOverlay />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
