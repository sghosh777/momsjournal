import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './utils/AuthContext'
import Layout from './components/Layout'
import JournalFeed from './pages/JournalFeed'
import NewEntry from './pages/NewEntry'
import EntryDetail from './pages/EntryDetail'
import Welcome from './pages/Welcome'

function AppRoutes() {
  const { user, loading } = useAuth()

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

  if (!user) {
    return <Welcome />
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<JournalFeed />} />
        <Route path="/new" element={<NewEntry />} />
        <Route path="/entry/:id" element={<EntryDetail />} />
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
