import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../utils/firebase'
import { format, parseISO } from 'date-fns'
import './SharedView.css'

const MOOD_LABELS = {
  love: { emoji: '🥰', label: 'Loving' },
  happy: { emoji: '😊', label: 'Happy' },
  tired: { emoji: '😴', label: 'Tired' },
  grateful: { emoji: '🙏', label: 'Grateful' },
  proud: { emoji: '🌟', label: 'Proud' },
  silly: { emoji: '🤪', label: 'Silly' },
}

export default function SharedView() {
  const { id } = useParams()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      if (!isFirebaseConfigured) {
        setError('App not configured')
        setLoading(false)
        return
      }
      try {
        const docRef = doc(db, 'entries', id)
        const snapshot = await getDoc(docRef)
        if (!snapshot.exists()) {
          setError('not-found')
        } else {
          const data = snapshot.data()
          if (data.visibility !== 'shared') {
            setError('not-found')
          } else {
            setEntry({
              id: snapshot.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            })
          }
        }
      } catch (err) {
        console.error('Failed to load shared entry:', err)
        setError('not-found')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="shared-loading">
        <span className="shared-loading-icon">🌸</span>
        <p>Loading moment...</p>
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="shared-error">
        <div className="shared-error-icon">🔒</div>
        <h2>This moment is private</h2>
        <p>It may have been removed or is no longer shared.</p>
        <div className="shared-branding">Mom's Journal 🌸</div>
      </div>
    )
  }

  const date = parseISO(entry.createdAt)
  const moodInfo = entry.mood ? MOOD_LABELS[entry.mood] : null

  return (
    <div className="shared">
      <header className="shared-header">
        <span className="shared-header-icon">💌</span>
        <span className="shared-header-text">A shared moment</span>
      </header>

      {entry.video ? (
        <div className="shared-photo">
          <video src={entry.video} controls playsInline style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />
        </div>
      ) : entry.photo ? (
        <div className="shared-photo">
          <img src={entry.photo} alt="A shared moment" />
        </div>
      ) : null}

      <div className="shared-content">
        <div className="shared-date-row">
          <div className="shared-date">
            <span className="shared-day">{format(date, 'EEEE')}</span>
            <span className="shared-full-date">
              {format(date, 'MMMM d, yyyy · h:mm a')}
            </span>
          </div>
          {moodInfo && (
            <div className="shared-mood">
              <span>{moodInfo.emoji}</span>
              <span>{moodInfo.label}</span>
            </div>
          )}
        </div>

        {entry.text && (
          <p className="shared-text">{entry.text}</p>
        )}
      </div>

      <footer className="shared-footer">
        <div className="shared-branding">Mom's Journal 🌸</div>
        <p className="shared-footer-text">A beautiful journal for new mamas</p>
      </footer>
    </div>
  )
}
