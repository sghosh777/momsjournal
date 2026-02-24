import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getInvite, subscribeToSharedEntries } from '../utils/firebase-public'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import './FamilyFeed.css'

const MOOD_LABELS = {
  love: { emoji: '🥰', label: 'Loving' },
  happy: { emoji: '😊', label: 'Happy' },
  tired: { emoji: '😴', label: 'Tired' },
  grateful: { emoji: '🙏', label: 'Grateful' },
  proud: { emoji: '🌟', label: 'Proud' },
  silly: { emoji: '🤪', label: 'Silly' },
}

function formatDateLabel(dateStr) {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMMM d')
}

function groupByDate(entries) {
  const groups = {}
  entries.forEach((entry) => {
    const label = formatDateLabel(entry.createdAt)
    if (!groups[label]) groups[label] = []
    groups[label].push(entry)
  })
  return Object.entries(groups)
}

export default function FamilyFeed() {
  const { code } = useParams()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mamaName, setMamaName] = useState(null)
  const [showInstall, setShowInstall] = useState(true)
  const [expandedPhoto, setExpandedPhoto] = useState(null)

  useEffect(() => {
    let unsubscribe = null

    async function init() {
      try {
        const invite = await getInvite(code)
        if (!invite) {
          setError('not-found')
          setLoading(false)
          return
        }

        if (invite.expired) {
          setMamaName(invite.mamaName || null)
          setError('expired')
          setLoading(false)
          return
        }

        // Get mama's display name
        setMamaName(invite.mamaName || null)

        // Subscribe to real-time shared entries
        unsubscribe = subscribeToSharedEntries(invite.userId, (data) => {
          setEntries(data)
          setLoading(false)
        })
      } catch (err) {
        console.error('Failed to load family feed:', err)
        setError('error')
        setLoading(false)
      }
    }

    init()
    return () => { if (unsubscribe) unsubscribe() }
  }, [code])

  if (loading) {
    return (
      <div className="ff-loading">
        <span className="ff-loading-icon">🌸</span>
        <p>Loading moments...</p>
      </div>
    )
  }

  if (error === 'expired') {
    return (
      <div className="ff-error">
        <div className="ff-error-icon">⏰</div>
        <h2>This link has expired</h2>
        <p>
          {mamaName ? `Ask ${mamaName}` : 'Ask mama'} for a fresh link to see new moments.
        </p>
        <div className="ff-error-brand">Mom's Journal 🌸</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ff-error">
        <div className="ff-error-icon">🔗</div>
        <h2>Link not found</h2>
        <p>This family feed link may be invalid.</p>
        <div className="ff-error-brand">Mom's Journal 🌸</div>
      </div>
    )
  }

  const grouped = groupByDate(entries)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches

  return (
    <div className="ff">
      {/* Install banner */}
      {showInstall && !isStandalone && (
        <div className="ff-install-banner">
          <div className="ff-install-text">
            <span className="ff-install-icon">📲</span>
            <span>Add to Home Screen to install as an app!</span>
          </div>
          <button className="ff-install-dismiss" onClick={() => setShowInstall(false)}>✕</button>
        </div>
      )}

      {/* Header */}
      <header className="ff-header">
        <div className="ff-header-icon">🌸</div>
        <h1 className="ff-header-title">
          {mamaName ? `${mamaName}'s Journal` : "Mom's Journal"}
        </h1>
        <p className="ff-header-subtitle">Shared moments from a new mama</p>
      </header>

      {/* Feed */}
      {entries.length === 0 ? (
        <div className="ff-empty">
          <div className="ff-empty-icon">💌</div>
          <h2>No moments shared yet</h2>
          <p>Check back soon for updates!</p>
        </div>
      ) : (
        <div className="ff-feed">
          {grouped.map(([dateLabel, dateEntries]) => (
            <div key={dateLabel} className="ff-date-group">
              <div className="ff-date-header">
                <span className="ff-date-label">{dateLabel}</span>
              </div>
              {dateEntries.map((entry) => {
                const date = parseISO(entry.createdAt)
                const moodInfo = entry.mood ? MOOD_LABELS[entry.mood] : null
                return (
                  <article key={entry.id} className="ff-card">
                    {entry.photo && (
                      <div
                        className="ff-card-photo"
                        onClick={() => setExpandedPhoto(expandedPhoto === entry.id ? null : entry.id)}
                      >
                        <img
                          src={entry.photo}
                          alt="A shared moment"
                          className={expandedPhoto === entry.id ? 'ff-photo-expanded' : ''}
                        />
                      </div>
                    )}
                    <div className="ff-card-body">
                      <div className="ff-card-meta">
                        <span className="ff-card-time">{format(date, 'h:mm a')}</span>
                        {moodInfo && (
                          <span className="ff-card-mood">
                            {moodInfo.emoji} {moodInfo.label}
                          </span>
                        )}
                      </div>
                      {entry.text && (
                        <p className="ff-card-text">{entry.text}</p>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="ff-footer">
        <div className="ff-footer-brand">Mom's Journal 🌸</div>
        <p className="ff-footer-text">A beautiful journal for new mamas</p>
      </footer>

      {/* Photo lightbox */}
      {expandedPhoto && (
        <div className="ff-lightbox" onClick={() => setExpandedPhoto(null)}>
          <img
            src={entries.find(e => e.id === expandedPhoto)?.photo}
            alt="Expanded moment"
          />
        </div>
      )}
    </div>
  )
}
