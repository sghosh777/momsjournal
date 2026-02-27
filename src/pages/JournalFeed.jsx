import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getEntries, getFollowing, getFollowingEntries } from '../utils/storage'
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
  const [followingEntries, setFollowingEntries] = useState([])
  const [hasFollowing, setHasFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingFollowing, setLoadingFollowing] = useState(false)
  const [tab, setTab] = useState('mine') // mine | following
  const [searchText, setSearchText] = useState('')
  const [moodFilter, setMoodFilter] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [data, following] = await Promise.all([
          getEntries(user.uid),
          getFollowing(user.uid),
        ])
        if (!cancelled) {
          setEntries(data)
          setHasFollowing(following.length > 0)
        }
      } catch (err) {
        console.error('Failed to load entries:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user.uid])

  // Load following entries when tab switches
  useEffect(() => {
    if (tab !== 'following' || followingEntries.length > 0) return
    let cancelled = false
    setLoadingFollowing(true)
    async function load() {
      try {
        const data = await getFollowingEntries(user.uid)
        if (!cancelled) setFollowingEntries(data)
      } catch (err) {
        console.error('Failed to load following entries:', err)
      } finally {
        if (!cancelled) setLoadingFollowing(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [tab, user.uid, followingEntries.length])

  const activeEntries = tab === 'mine' ? entries : followingEntries

  const filtered = useMemo(() => {
    let result = activeEntries

    if (moodFilter) {
      result = result.filter((e) => e.mood === moodFilter)
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim()
      result = result.filter((e) => {
        const text = (e.text || '').toLowerCase()
        const date = format(parseISO(e.createdAt), 'MMMM d yyyy EEEE').toLowerCase()
        const mood = e.mood ? MOOD_LABELS[e.mood]?.label.toLowerCase() : ''
        const mama = (e.mamaName || '').toLowerCase()
        return text.includes(q) || date.includes(q) || mood.includes(q) || mama.includes(q)
      })
    }

    return result
  }, [activeEntries, searchText, moodFilter])

  const grouped = groupByDate(filtered)
  const hasActiveFilter = searchText.trim() || moodFilter

  return (
    <div className="feed">
      <header className="feed-header">
        <div className="feed-header-top">
          <div>
            <h1 className="feed-title">Mom's Journal</h1>
            <p className="feed-subtitle">
              {tab === 'mine' ? 'Your precious moments' : 'Moments from friends'}
            </p>
          </div>
          <div className="feed-header-flower">🌸</div>
        </div>

        {/* Tabs — only show if user follows someone */}
        {hasFollowing && (
          <div className="feed-tabs">
            <button
              className={`feed-tab ${tab === 'mine' ? 'feed-tab-active' : ''}`}
              onClick={() => { setTab('mine'); setSearchText(''); setMoodFilter(null) }}
            >
              My Journal
            </button>
            <button
              className={`feed-tab ${tab === 'following' ? 'feed-tab-active' : ''}`}
              onClick={() => { setTab('following'); setSearchText(''); setMoodFilter(null) }}
            >
              Following
            </button>
          </div>
        )}
      </header>

      {/* Search Bar */}
      {!loading && activeEntries.length > 0 && (
        <div className="search-section">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder={tab === 'mine' ? 'Search by text, date, or feeling...' : 'Search by name, text, or date...'}
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

      {loading || (tab === 'following' && loadingFollowing) ? (
        <div className="feed-loading">
          <div className="feed-loading-icon">🌸</div>
          <p>{tab === 'following' ? 'Loading moments from friends...' : 'Loading your moments...'}</p>
        </div>
      ) : activeEntries.length === 0 ? (
        tab === 'mine' ? (
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
        ) : (
          <div className="feed-empty">
            <div className="feed-empty-icon">💌</div>
            <h2 className="feed-empty-title">No shared moments yet</h2>
            <p className="feed-empty-text">
              When friends share moments, they'll appear here
            </p>
          </div>
        )
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
                      <video src={entry.video} muted preload="metadata" poster={entry.videoThumb || undefined} />
                      <span className="entry-card-video-badge">▶</span>
                    </div>
                  ) : entry.photo ? (
                    <div className="entry-card-photo">
                      <img src={entry.photo} alt="Journal moment" loading="lazy" />
                    </div>
                  ) : null}
                  <div className="entry-card-body">
                    {tab === 'following' && entry.mamaName && (
                      <span className="entry-card-mama">{entry.mamaName}</span>
                    )}
                    <div className="entry-card-meta">
                      <span className="entry-card-time">
                        {format(parseISO(entry.createdAt), 'h:mm a')}
                      </span>
                      {entry.mood && (
                        <span className="entry-card-mood" title={MOOD_LABELS[entry.mood]?.label}>
                          {MOOD_LABELS[entry.mood]?.emoji}
                        </span>
                      )}
                      {tab === 'mine' && (
                        <span className={`entry-card-vis ${entry.visibility === 'shared' ? 'entry-card-vis-shared' : ''}`}>
                          {entry.visibility === 'shared' ? '💌' : '🔒'}
                        </span>
                      )}
                    </div>
                    <p className="entry-card-text">{entry.text}</p>
                  </div>
                </Link>
              ))}
            </div>
          ))}

          {hasActiveFilter && (
            <p className="feed-filter-summary">
              Showing {filtered.length} of {activeEntries.length} moments
            </p>
          )}
        </div>
      )}
    </div>
  )
}
