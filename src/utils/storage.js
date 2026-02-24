import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import {
  ref,
  uploadString,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { db, storage } from './firebase'

const ENTRIES_COL = 'entries'

async function uploadPhoto(userId, photoDataUrl) {
  const photoId = crypto.randomUUID()
  const photoRef = ref(storage, `photos/${userId}/${photoId}.jpg`)
  await uploadString(photoRef, photoDataUrl, 'data_url')
  return getDownloadURL(photoRef)
}

async function uploadVideo(userId, videoFile) {
  const videoId = crypto.randomUUID()
  const ext = videoFile.name?.split('.').pop() || 'mp4'
  const videoRef = ref(storage, `videos/${userId}/${videoId}.${ext}`)
  await uploadBytes(videoRef, videoFile)
  return getDownloadURL(videoRef)
}

async function deletePhoto(photoUrl) {
  try {
    const photoRef = ref(storage, photoUrl)
    await deleteObject(photoRef)
  } catch {
    // Photo may already be deleted
  }
}

export async function getEntries(userId) {
  const q = query(
    collection(db, ENTRIES_COL),
    where('userId', '==', userId)
  )
  const snapshot = await getDocs(q)
  const entries = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  }))
  // Sort client-side to avoid needing a Firestore composite index
  entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return entries
}

export async function saveEntry(userId, entry) {
  let photoUrl = null
  let videoUrl = null

  if (entry.photo) {
    try {
      photoUrl = await uploadPhoto(userId, entry.photo)
    } catch (err) {
      console.error('Photo upload failed, saving without photo:', err)
    }
  }

  if (entry.video) {
    try {
      videoUrl = await uploadVideo(userId, entry.video)
    } catch (err) {
      console.error('Video upload failed, saving without video:', err)
    }
  }

  const docRef = await addDoc(collection(db, ENTRIES_COL), {
    userId,
    text: entry.text || '',
    photo: photoUrl,
    video: videoUrl,
    mood: entry.mood || null,
    visibility: entry.visibility || 'private',
    createdAt: entry.customDate ? new Date(entry.customDate) : serverTimestamp(),
  })

  return {
    id: docRef.id,
    userId,
    text: entry.text || '',
    photo: photoUrl,
    video: videoUrl,
    mood: entry.mood || null,
    visibility: entry.visibility || 'private',
    createdAt: new Date().toISOString(),
  }
}

export async function deleteEntry(entryId) {
  const docRef = doc(db, ENTRIES_COL, entryId)
  const snapshot = await getDoc(docRef)
  if (snapshot.exists()) {
    const data = snapshot.data()
    if (data.photo) await deletePhoto(data.photo)
    if (data.video) await deletePhoto(data.video)
  }
  await deleteDoc(docRef)
}

// --- Friends ---

const FRIENDS_COL = 'friends'

function formatUSPhone(phone) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return `+${digits}`
}

export async function getFriends(userId) {
  const q = query(
    collection(db, FRIENDS_COL),
    where('userId', '==', userId)
  )
  const snapshot = await getDocs(q)
  const friends = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  }))
  friends.sort((a, b) => a.name.localeCompare(b.name))
  return friends
}

export async function addFriend(userId, friend) {
  const docRef = await addDoc(collection(db, FRIENDS_COL), {
    userId,
    name: friend.name.trim(),
    phone: formatUSPhone(friend.phone),
    createdAt: serverTimestamp(),
  })
  return { id: docRef.id, name: friend.name.trim(), phone: formatUSPhone(friend.phone) }
}

export async function removeFriend(friendId) {
  await deleteDoc(doc(db, FRIENDS_COL, friendId))
}

// --- Invites ---

const INVITES_COL = 'invites'
const INVITE_DURATION_DAYS = 7

function generateCode() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function getExpiresAt() {
  const d = new Date()
  d.setDate(d.getDate() + INVITE_DURATION_DAYS)
  return d
}

function isExpired(invite) {
  if (!invite.expiresAt) return false
  const expires = invite.expiresAt.toDate ? invite.expiresAt.toDate() : new Date(invite.expiresAt)
  return expires < new Date()
}

export async function getOrCreateInvite(userId, displayName) {
  // Check if user already has a valid invite
  const q = query(collection(db, INVITES_COL), where('userId', '==', userId))
  const snapshot = await getDocs(q)
  if (!snapshot.empty) {
    const existing = snapshot.docs[0]
    const data = { id: existing.id, ...existing.data() }
    // If not expired, return it
    if (!isExpired(data)) {
      return data
    }
    // If expired, delete it and create a new one
    await deleteDoc(doc(db, INVITES_COL, existing.id))
  }

  // Create a new invite with a short code as the doc ID
  const code = generateCode()
  const expiresAt = getExpiresAt()
  await setDoc(doc(db, INVITES_COL, code), {
    userId,
    mamaName: displayName || null,
    expiresAt,
    createdAt: serverTimestamp(),
  })
  return { id: code, userId, expiresAt: expiresAt.toISOString() }
}

export async function refreshInvite(userId, displayName) {
  // Delete all existing invites for this user
  const q = query(collection(db, INVITES_COL), where('userId', '==', userId))
  const snapshot = await getDocs(q)
  for (const d of snapshot.docs) {
    await deleteDoc(doc(db, INVITES_COL, d.id))
  }

  // Create a fresh one
  const code = generateCode()
  const expiresAt = getExpiresAt()
  await setDoc(doc(db, INVITES_COL, code), {
    userId,
    mamaName: displayName || null,
    expiresAt,
    createdAt: serverTimestamp(),
  })
  return { id: code, userId, expiresAt: expiresAt.toISOString() }
}

export async function getInvite(code) {
  const docRef = doc(db, INVITES_COL, code)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

// --- Family Feed (real-time) ---

export function subscribeToSharedEntries(userId, callback) {
  const q = query(
    collection(db, ENTRIES_COL),
    where('userId', '==', userId),
    where('visibility', '==', 'shared')
  )
  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }))
    entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    callback(entries)
  })
}

// --- Entries ---

export async function getEntryById(entryId) {
  const docRef = doc(db, ENTRIES_COL, entryId)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  return {
    id: snapshot.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  }
}
