import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEntryById, deleteEntry } from '../utils/storage'
import { format, parseISO } from 'date-fns'
import './EntryDetail.css'

const MOOD_LABELS = {
  love: { emoji: '🥰', label: 'Loving' },
  happy: { emoji: '😊', label: 'Happy' },
  tired: { emoji: '😴', label: 'Tired' },
  grateful: { emoji: '🙏', label: 'Grateful' },
  proud: { emoji: '🌟', label: 'Proud' },
  silly: { emoji: '🤪', label: 'Silly' },
}

export default function EntryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry] = useState(null)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    const found = getEntryById(id)
    if (!found) {
      navigate('/')
      return
    }
    setEntry(found)
  }, [id, navigate])

  function handleDelete() {
    deleteEntry(id)
    navigate('/')
  }

  if (!entry) return null

  const date = parseISO(entry.createdAt)
  const moodInfo = entry.mood ? MOOD_LABELS[entry.mood] : null

  return (
    <div className="detail">
      <header className="detail-header">
        <button className="detail-back" onClick={() => navigate('/')}>
          ← Back
        </button>
        <button
          className="detail-delete-trigger"
          onClick={() => setShowDelete(!showDelete)}
        >
          ···
        </button>
      </header>

      {entry.photo && (
        <div className="detail-photo">
          <img src={entry.photo} alt="Journal moment" />
        </div>
      )}

      <div className="detail-content">
        <div className="detail-date-row">
          <div className="detail-date">
            <span className="detail-day">{format(date, 'EEEE')}</span>
            <span className="detail-full-date">
              {format(date, 'MMMM d, yyyy · h:mm a')}
            </span>
          </div>
          {moodInfo && (
            <div className="detail-mood">
              <span className="detail-mood-emoji">{moodInfo.emoji}</span>
              <span className="detail-mood-label">{moodInfo.label}</span>
            </div>
          )}
        </div>

        <p className="detail-text">{entry.text}</p>
      </div>

      {showDelete && (
        <div className="delete-sheet" onClick={() => setShowDelete(false)}>
          <div className="delete-sheet-content" onClick={(e) => e.stopPropagation()}>
            <p className="delete-sheet-title">Delete this entry?</p>
            <p className="delete-sheet-desc">This can't be undone</p>
            <div className="delete-sheet-actions">
              <button className="delete-cancel" onClick={() => setShowDelete(false)}>
                Keep it
              </button>
              <button className="delete-confirm" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
