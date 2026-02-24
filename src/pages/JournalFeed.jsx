import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getEntries } from '../utils/storage'
import { useAuth } from '../utils/AuthContext'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import './JournalFeed.css'

const MOOD_LABELS = {
  love: { emoji: '🥰', label: 'Loving' },
  happy: { emoji: '😊', label: 'Happy' },
  tired: { emoji: '😴', label: 'Tired' },
  grateful: { emoji: '🙏', label: 'Grateful' },
  proud: { emoji: '🌟', label: 'Proud' },
  silly: { emoji: '🤪', label: 'Silly' },
}

const MOOD_FILTERS = [
  { key: null, emoji: '✨', label: 'All' },
  { key: 'love', emoji: '🥰', label: 'Loving' },
  { key: 'happy', emoji: '😊', label: 'Happy' },
  { key: 'tired', emoji: '😴', label: 'Tired' },
  { key: 'grateful', emoji: '🙏', label: 'Grateful' },
  { key: 'proud', emoji: '🌟', label: 'Proud' },
  { key: 'silly', emoji: '🤪', label: 'Silly' },
]

function formatDateLabel(date) {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMMM d')
}

function formatFullDate(date) {
  if (isToday(date)) return format(date, "'Today,' MMMM d")
  if (isYesterday(date)) return format(date, "'Yesterday,' MMMM d")
  return format(date, 'MMMM d, yyyy')
}

function groupByDate(entries) {
  const groups = {}
  entries.forEach((entry) => {
    const date = parseISO(entry.createdAt)
    const label = formatDateLabel(date)
    if (!groups[label]) groups[label] = { label, fullDate: formatFullDate(date), entries: [] }
    groups[label].entries.push(entry)
  })
  return Object.values(groups)
}

export default function JournalFeed() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [moodFilter, setMoodFilter] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await getEntries(user.uid)
        if (!cancelled) setEntries(data)
      } catch (err) {
        console.error('Failed to load entries:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user.uid])

  const filtered = useMemo(() => {
    let result = entries

    if (moodFilter) {
      result = result.filter((e) => e.mood === moodFilter)
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim()
      result = result.filter((e) => {
        const text = (e.text || '').toLowerCase()
        const date = format(parseISO(e.createdAt), 'MMMM d yyyy EEEE').toLowerCase()
        const mood = e.mood ? MOOD_LABELS[e.mood]?.label.toLowerCase() : ''
        return text.includes(q) || date.includes(q) || mood.includes(q)
      })
    }

    return result
  }, [entries, searchText, moodFilter])

  const grouped = groupByDate(filtered)
  const hasActiveFilter = searchText.trim() || moodFilter

  return (
    <div className="feed">
      <header className="feed-header">
        <div className="feed-header-top">
          <div>
            <h1 className="feed-title">Mom's Journal</h1>
            <p className="feed-subtitle">Your precious moments</p>
          </div>
          <div className="feed-header-flower">🌸</div>
        </div>
      </header>

      {/* Search Bar */}
      {!loading && entries.length > 0 && (
        <div className="search-section">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search by text, date, or feeling..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button className="search-clear" onClick={() => setSearchText('')}>✕</button>
            )}
          </div>

          <button
            className={`filter-toggle ${showFilters ? 'filter-toggle-active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            {moodFilter ? MOOD_LABELS[moodFilter].emoji : '🎭'}
          </button>

          {showFilters && (
            <div className="mood-filters">
              {MOOD_FILTERS.map((m) => (
                <button
                  key={m.key || 'all'}
                  className={`mood-filter-btn ${moodFilter === m.key ? 'mood-filter-active' : ''}`}
                  onClick={() => {
                    setMoodFilter(m.key)
                    setShowFilters(false)
                  }}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="feed-loading">
          <div className="feed-loading-icon">🌸</div>
          <p>Loading your moments...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="feed-empty">
          <div className="feed-empty-icon">📝</div>
          <h2 className="feed-empty-title">Your journal awaits</h2>
          <p className="feed-empty-text">
            Tap the sparkle button below to capture your first moment with your little one
          </p>
          <Link to="/new" className="feed-empty-cta">
            Write your first entry ✨
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="feed-no-results">
          <div className="feed-no-results-icon">🔍</div>
          <p className="feed-no-results-text">No moments found</p>
          <button className="feed-no-results-clear" onClick={() => { setSearchText(''); setMoodFilter(null) }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="feed-entries">
          {grouped.map((group) => (
            <div key={group.label} className="feed-date-group">
              <div className="feed-date-header">
                <div className="feed-date-line" />
                <div className="feed-date-badge">
                  <span className="feed-date-label">{group.label}</span>
                  <span className="feed-date-full">{group.fullDate}</span>
                  <span className="feed-date-count">
                    {group.entries.length} {group.entries.length === 1 ? 'moment' : 'moments'}
                  </span>
                </div>
                <div className="feed-date-line" />
              </div>

              {group.entries.map((entry, idx) => (
                <Link
                  to={`/entry/${entry.id}`}
                  key={entry.id}
                  className="entry-card"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {entry.video ? (
                    <div className="entry-card-photo">
                      <video src={entry.video} muted preload="metadata" />
                      <span className="entry-card-video-badge">▶</span>
                    </div>
                  ) : entry.photo ? (
                    <div className="entry-card-photo">
                      <img src={entry.photo} alt="Journal moment" loading="lazy" />
                    </div>
                  ) : null}
                  <div className="entry-card-body">
                    <div className="entry-card-meta">
                      <span className="entry-card-time">
                        {format(parseISO(entry.createdAt), 'h:mm a')}
                      </span>
                      {entry.mood && (
                        <span className="entry-card-mood" title={MOOD_LABELS[entry.mood]?.label}>
                          {MOOD_LABELS[entry.mood]?.emoji}
                        </span>
                      )}
                      <span className={`entry-card-vis ${entry.visibility === 'shared' ? 'entry-card-vis-shared' : ''}`}>
                        {entry.visibility === 'shared' ? '💌' : '🔒'}
                      </span>
                    </div>
                    <p className="entry-card-text">{entry.text}</p>
                  </div>
                </Link>
              ))}
            </div>
          ))}

          {hasActiveFilter && (
            <p className="feed-filter-summary">
              Showing {filtered.length} of {entries.length} moments
            </p>
          )}
        </div>
      )}
    </div>
  )
}
