import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getInvite, subscribeToSharedEntries, subscribeToNotifications } from '../utils/firebase-public'
import { useAuth } from '../utils/AuthContext'
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
  const { user, signInWithGoogle } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mamaName, setMamaName] = useState(null)
  const [mamaUserId, setMamaUserId] = useState(null)
  const [showInstall, setShowInstall] = useState(true)
  const [expandedPhoto, setExpandedPhoto] = useState(null)
  const [notifState, setNotifState] = useState('idle')
  const [signingIn, setSigningIn] = useState(false)

  // Step 1: Load invite info (invites are still public-readable)
  useEffect(() => {
    async function loadInvite() {
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

        setMamaName(invite.mamaName || null)
        setMamaUserId(invite.userId)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load invite:', err)
        setError('error')
        setLoading(false)
      }
    }
    loadInvite()
  }, [code])

  // Step 2: Once user is signed in and we have the mama's userId, subscribe to entries
  useEffect(() => {
    if (!user || !mamaUserId) return

    const unsubscribe = subscribeToSharedEntries(mamaUserId, (data) => {
      setEntries(data)
    }, (err) => {
      console.error('Failed to load entries:', err)
    })

    return () => { if (unsubscribe) unsubscribe() }
  }, [user, mamaUserId])

  // Check notification state
  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setNotifState('unsupported')
    } else if (Notification.permission === 'granted') {
      const key = `notif-subscribed-${code}`
      if (localStorage.getItem(key)) {
        setNotifState('subscribed')
      }
    } else if (Notification.permission === 'denied') {
      setNotifState('denied')
    }
  }, [code])

  async function handleNotifyMe() {
    if (!mamaUserId) return
    setNotifState('subscribing')
    try {
      const granted = await subscribeToNotifications(mamaUserId)
      if (granted) {
        setNotifState('subscribed')
        localStorage.setItem(`notif-subscribed-${code}`, 'true')
      } else {
        setNotifState('denied')
      }
    } catch (err) {
      console.error('Notification subscription failed:', err)
      setNotifState('denied')
    }
  }

  async function handleSignIn() {
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch {
      // handled by AuthContext
    } finally {
      setSigningIn(false)
    }
  }

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

  // Not signed in — show sign-in prompt
  if (!user) {
    return (
      <div className="ff">
        <div className="ff-signin">
          <div className="ff-signin-icon">🌸</div>
          <h1 className="ff-signin-title">
            {mamaName ? `${mamaName}'s Journal` : "Mom's Journal"}
          </h1>
          <p className="ff-signin-text">
            {mamaName ? `${mamaName} invited you` : 'You\'ve been invited'} to see precious moments.
            Sign in to view them securely.
          </p>
          <button
            className="ff-signin-btn"
            onClick={handleSignIn}
            disabled={signingIn}
          >
            {signingIn ? 'Signing in...' : 'Sign in with Google'}
          </button>
          <p className="ff-signin-note">
            Your baby photos are kept safe — only invited family and friends can see them.
          </p>
          <div className="ff-error-brand">Mom's Journal 🌸</div>
        </div>
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

        {/* Notification bell */}
        {notifState === 'idle' && (
          <button className="ff-notify-btn" onClick={handleNotifyMe}>
            🔔 Notify me of new moments
          </button>
        )}
        {notifState === 'subscribing' && (
          <div className="ff-notify-status">Setting up notifications...</div>
        )}
        {notifState === 'subscribed' && (
          <div className="ff-notify-status ff-notify-success">
            🔔 Notifications on! You'll be notified of new moments.
          </div>
        )}
        {notifState === 'denied' && (
          <div className="ff-notify-status ff-notify-denied">
            Notifications blocked. Check your browser settings to enable.
          </div>
        )}
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
                    {entry.video ? (
                      <div className="ff-card-photo">
                        <video src={entry.video} controls playsInline poster={entry.videoThumb || undefined} style={{ width: '100%' }} />
                      </div>
                    ) : entry.photo ? (
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
                    ) : null}
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
