import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getEntries } from '../utils/storage'
import { useAuth } from '../utils/AuthContext'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import './JournalFeed.css'

const MOOD_LABELS = {
  love: '🥰',
  happy: '😊',
  tired: '😴',
  grateful: '🙏',
  proud: '🌟',
  silly: '🤪',
}

function groupByDate(entries) {
  const groups = {}
  entries.forEach((entry) => {
    const date = parseISO(entry.createdAt)
    let label
    if (isToday(date)) label = 'Today'
    else if (isYesterday(date)) label = 'Yesterday'
    else label = format(date, 'EEEE, MMMM d')
    if (!groups[label]) groups[label] = []
    groups[label].push(entry)
  })
  return Object.entries(groups)
}

export default function JournalFeed() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

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

  const grouped = groupByDate(entries)

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
      ) : (
        <div className="feed-entries">
          {grouped.map(([dateLabel, dateEntries]) => (
            <div key={dateLabel} className="feed-date-group">
              <div className="feed-date-label">{dateLabel}</div>
              {dateEntries.map((entry, idx) => (
                <Link
                  to={`/entry/${entry.id}`}
                  key={entry.id}
                  className="entry-card"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {entry.photo && (
                    <div className="entry-card-photo">
                      <img src={entry.photo} alt="Journal moment" loading="lazy" />
                    </div>
                  )}
                  <div className="entry-card-body">
                    <div className="entry-card-meta">
                      <span className="entry-card-time">
                        {format(parseISO(entry.createdAt), 'h:mm a')}
                      </span>
                      {entry.mood && (
                        <span className="entry-card-mood">
                          {MOOD_LABELS[entry.mood]}
                        </span>
                      )}
                    </div>
                    <p className="entry-card-text">{entry.text}</p>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
