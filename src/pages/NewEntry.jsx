import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveEntry } from '../utils/storage'
import { useAuth } from '../utils/AuthContext'
import './NewEntry.css'

const MOODS = [
  { key: 'love', emoji: '🥰', label: 'Loving' },
  { key: 'happy', emoji: '😊', label: 'Happy' },
  { key: 'tired', emoji: '😴', label: 'Tired' },
  { key: 'grateful', emoji: '🙏', label: 'Grateful' },
  { key: 'proud', emoji: '🌟', label: 'Proud' },
  { key: 'silly', emoji: '🤪', label: 'Silly' },
]

const PROMPTS = [
  "What made you smile today?",
  "A little moment worth remembering...",
  "How's your little one doing?",
  "Something funny that happened...",
  "A milestone to celebrate!",
  "How are you feeling, mama?",
  "A quiet moment of joy...",
  "What are you grateful for today?",
]

function getRandomPrompt() {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
}

export default function NewEntry() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState(null)
  const [mood, setMood] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [placeholder] = useState(getRandomPrompt)

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 800
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize
            width = maxSize
          } else {
            width = (width / height) * maxSize
            height = maxSize
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        setPhoto(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  function handleRemovePhoto() {
    setPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSave() {
    if (!text.trim() && !photo) return

    setSaving(true)
    try {
      await saveEntry(user.uid, { text: text.trim(), photo, mood })
      setSaved(true)
      setTimeout(() => navigate('/'), 600)
    } catch (err) {
      console.error('Failed to save:', err)
      setSaving(false)
    }
  }

  const canSave = text.trim().length > 0 || photo

  if (saved) {
    return (
      <div className="new-entry-saved">
        <div className="saved-icon">🌸</div>
        <p className="saved-text">Moment saved!</p>
      </div>
    )
  }

  return (
    <div className="new-entry">
      <header className="new-entry-header">
        <button className="new-entry-back" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="new-entry-title">New Moment</h1>
        <div style={{ width: 60 }} />
      </header>

      {/* Photo Upload */}
      <div className="new-entry-photo-section">
        {photo ? (
          <div className="photo-preview">
            <img src={photo} alt="Selected" />
            <button className="photo-remove" onClick={handleRemovePhoto}>
              ✕
            </button>
          </div>
        ) : (
          <button
            className="photo-upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="photo-upload-icon">📷</span>
            <span className="photo-upload-text">Add a photo</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="photo-input-hidden"
        />
      </div>

      {/* Mood Selector */}
      <div className="mood-section">
        <p className="mood-label">How are you feeling?</p>
        <div className="mood-grid">
          {MOODS.map((m) => (
            <button
              key={m.key}
              className={`mood-btn ${mood === m.key ? 'mood-selected' : ''}`}
              onClick={() => setMood(mood === m.key ? null : m.key)}
            >
              <span className="mood-emoji">{m.emoji}</span>
              <span className="mood-name">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Text Input */}
      <div className="text-section">
        <textarea
          className="text-input"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          autoFocus
        />
      </div>

      {/* Save Button */}
      <div className="save-section">
        <button
          className={`save-btn ${canSave ? 'save-ready' : ''} ${saving ? 'save-saving' : ''}`}
          onClick={handleSave}
          disabled={!canSave || saving}
        >
          {saving ? 'Saving...' : 'Save this moment 🌸'}
        </button>
      </div>
    </div>
  )
}
