import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFriends, addFriend, removeFriend } from '../utils/storage'
import { useAuth } from '../utils/AuthContext'
import './MyCircle.css'

export default function MyCircle() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await getFriends(user.uid)
        if (!cancelled) setFriends(data)
      } catch (err) {
        console.error('Failed to load friends:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user.uid])

  function formatPhoneDisplay(value) {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  function handlePhoneChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    setPhone(digits)
  }

  async function handleAdd() {
    if (!name.trim() || phone.length < 10) return
    setSaving(true)
    try {
      const newFriend = await addFriend(user.uid, { name: name.trim(), phone })
      setFriends((prev) => [...prev, newFriend].sort((a, b) => a.name.localeCompare(b.name)))
      setName('')
      setPhone('')
      setShowAdd(false)
    } catch (err) {
      console.error('Failed to add friend:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(id) {
    try {
      await removeFriend(id)
      setFriends((prev) => prev.filter((f) => f.id !== id))
      setDeleteId(null)
    } catch (err) {
      console.error('Failed to remove friend:', err)
    }
  }

  return (
    <div className="circle">
      <header className="circle-header">
        <button className="circle-back" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1 className="circle-title">My Circle</h1>
        <div style={{ width: 60 }} />
      </header>

      <p className="circle-desc">
        Your close friends who receive your shared journal moments via text message.
      </p>

      {loading ? (
        <div className="circle-loading">
          <span>🌸</span>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          {friends.length === 0 && !showAdd ? (
            <div className="circle-empty">
              <div className="circle-empty-icon">👯‍♀️</div>
              <h2 className="circle-empty-title">No friends yet</h2>
              <p className="circle-empty-text">
                Add close friends to share your special moments with them
              </p>
            </div>
          ) : (
            <div className="circle-list">
              {friends.map((friend) => (
                <div key={friend.id} className="friend-card">
                  <div className="friend-avatar">
                    {friend.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="friend-info">
                    <p className="friend-name">{friend.name}</p>
                    <p className="friend-phone">{formatPhoneDisplay(friend.phone.replace('+1', ''))}</p>
                  </div>
                  <button
                    className="friend-remove"
                    onClick={() => setDeleteId(friend.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="circle-count">
            {friends.length}/10 friends
          </div>

          {friends.length < 10 && (
            showAdd ? (
              <div className="add-friend-form">
                <input
                  type="text"
                  className="add-input"
                  placeholder="Friend's name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                <input
                  type="tel"
                  className="add-input"
                  placeholder="(555) 123-4567"
                  value={formatPhoneDisplay(phone)}
                  onChange={handlePhoneChange}
                  inputMode="numeric"
                />
                <div className="add-actions">
                  <button className="add-cancel" onClick={() => { setShowAdd(false); setName(''); setPhone('') }}>
                    Cancel
                  </button>
                  <button
                    className={`add-save ${name.trim() && phone.length === 10 ? 'add-save-ready' : ''}`}
                    onClick={handleAdd}
                    disabled={!name.trim() || phone.length < 10 || saving}
                  >
                    {saving ? 'Adding...' : 'Add friend'}
                  </button>
                </div>
              </div>
            ) : (
              <button className="add-friend-btn" onClick={() => setShowAdd(true)}>
                + Add a friend
              </button>
            )
          )}
        </>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="delete-overlay" onClick={() => setDeleteId(null)}>
          <div className="delete-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="delete-title">Remove this friend?</p>
            <p className="delete-desc">They won't receive your shared moments anymore</p>
            <div className="delete-actions">
              <button className="delete-cancel" onClick={() => setDeleteId(null)}>Keep</button>
              <button className="delete-confirm" onClick={() => handleRemove(deleteId)}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
