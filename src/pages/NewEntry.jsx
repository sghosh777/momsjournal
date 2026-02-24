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
  const videoInputRef = useRef(null)
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState(null)
  const [video, setVideo] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [videoThumb, setVideoThumb] = useState(null)
  const [mood, setMood] = useState(null)
  const [visibility, setVisibility] = useState('private')
  const [customDate, setCustomDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(null)
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

  function handleVideoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 100 * 1024 * 1024) {
      setSaveError('Video must be under 100MB')
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setVideo(file)
    setVideoPreview(objectUrl)
    setPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''

    // Generate thumbnail from first frame
    const vid = document.createElement('video')
    vid.preload = 'metadata'
    vid.muted = true
    vid.playsInline = true
    vid.src = objectUrl
    vid.onloadeddata = () => {
      vid.currentTime = 0.5
    }
    vid.onseeked = () => {
      const canvas = document.createElement('canvas')
      const maxSize = 400
      let { videoWidth: w, videoHeight: h } = vid
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = (h / w) * maxSize; w = maxSize }
        else { w = (w / h) * maxSize; h = maxSize }
      }
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(vid, 0, 0, w, h)
      setVideoThumb(canvas.toDataURL('image/jpeg', 0.7))
    }
  }

  function handleRemoveMedia() {
    setPhoto(null)
    setVideo(null)
    setVideoThumb(null)
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setVideoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  async function handleSave() {
    if (!text.trim() && !photo && !video) return

    setSaving(true)
    try {
      await saveEntry(user.uid, { text: text.trim(), photo, video, videoThumb, mood, visibility, customDate: customDate || null })
      setSaved(true)
      setTimeout(() => navigate('/'), 600)
    } catch (err) {
      console.error('Failed to save:', err)
      setSaveError(err.message || 'Failed to save. Please try again.')
      setSaving(false)
    }
  }

  const canSave = text.trim().length > 0 || photo || video

  if (saved) {
    return (
      <div className="new-entry-saved">
        <div className="saved-icon">{visibility === 'shared' ? '💌' : '🌸'}</div>
        <p className="saved-text">
          {visibility === 'shared' ? 'Shared with your circle!' : 'Moment saved!'}
        </p>
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

      {/* Media Upload */}
      <div className="new-entry-photo-section">
        {photo ? (
          <div className="photo-preview">
            <img src={photo} alt="Selected" />
            <button className="photo-remove" onClick={handleRemoveMedia}>
              ✕
            </button>
          </div>
        ) : videoPreview ? (
          <div className="photo-preview">
            <video src={videoPreview} controls playsInline className="video-preview" />
            <button className="photo-remove" onClick={handleRemoveMedia}>
              ✕
            </button>
          </div>
        ) : (
          <div className="media-upload-row">
            <button
              className="photo-upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="photo-upload-icon">📷</span>
              <span className="photo-upload-text">Add a photo</span>
            </button>
            <button
              className="photo-upload-btn"
              onClick={() => videoInputRef.current?.click()}
            >
              <span className="photo-upload-icon">🎬</span>
              <span className="photo-upload-text">Add a video</span>
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="photo-input-hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoSelect}
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

      {/* Visibility Toggle */}
      <div className="visibility-section">
        <p className="visibility-label">Who can see this?</p>
        <div className="visibility-toggle">
          <button
            className={`vis-btn ${visibility === 'private' ? 'vis-active vis-private' : ''}`}
            onClick={() => setVisibility('private')}
          >
            <span>🔒</span>
            <span>Just me</span>
          </button>
          <button
            className={`vis-btn ${visibility === 'shared' ? 'vis-active vis-shared' : ''}`}
            onClick={() => setVisibility('shared')}
          >
            <span>💌</span>
            <span>My Circle</span>
          </button>
        </div>
        {visibility === 'shared' && (
          <p className="visibility-hint">
            Your close friends will receive this moment via text
          </p>
        )}
      </div>

      {/* Date Picker */}
      <div className="date-section">
        <p className="date-label">When was this moment?</p>
        <div className="date-picker-row">
          <button
            className={`date-btn ${!customDate ? 'date-active' : ''}`}
            onClick={() => setCustomDate('')}
          >
            Today
          </button>
          <div className="date-input-wrap">
            <input
              type="date"
              className={`date-input ${customDate ? 'date-input-active' : ''}`}
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            {!customDate && <span className="date-input-placeholder">Pick a date...</span>}
          </div>
        </div>
        {customDate && (
          <p className="date-hint">
            Throwback to {new Date(customDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
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

      {/* Error Message */}
      {saveError && (
        <div className="save-error">
          {saveError}
        </div>
      )}

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
