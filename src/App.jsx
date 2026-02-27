import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './utils/AuthContext'
import Layout from './components/Layout'
import JournalFeed from './pages/JournalFeed'
import NewEntry from './pages/NewEntry'
import EntryDetail from './pages/EntryDetail'
import MyCircle from './pages/MyCircle'
import SharedView from './pages/SharedView'
import FamilyFeed from './pages/FamilyFeed'
import Welcome from './pages/Welcome'

function AppRoutes() {
  const { user, loading, error } = useAuth()
  const location = useLocation()

  const isFamilyRoute = location.pathname.startsWith('/family/')
  const isSharedRoute = location.pathname.startsWith('/shared/')

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '36px',
      }}>
        🌸
      </div>
    )
  }

  if (error && !isFamilyRoute && !isSharedRoute) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'Nunito, sans-serif',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔧</div>
        <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#4A3728' }}>Setup needed</h2>
        <p style={{ fontSize: '14px', color: '#8B7B6B', maxWidth: '300px', lineHeight: 1.5 }}>
          {error}
        </p>
      </div>
    )
  }

  // Family and shared routes — require sign-in (handled inside components)
  if (isFamilyRoute) {
    return (
      <Routes>
        <Route path="/family/:code" element={<FamilyFeed />} />
      </Routes>
    )
  }

  if (isSharedRoute) {
    return (
      <Routes>
        <Route path="/shared/:id" element={<SharedView />} />
      </Routes>
    )
  }

  if (!user) {
    return <Welcome />
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<JournalFeed />} />
        <Route path="/new" element={<NewEntry />} />
        <Route path="/entry/:id" element={<EntryDetail />} />
        <Route path="/circle" element={<MyCircle />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
