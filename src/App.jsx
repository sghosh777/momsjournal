import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import JournalFeed from './pages/JournalFeed'
import NewEntry from './pages/NewEntry'
import EntryDetail from './pages/EntryDetail'

function App() {
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

export default App
