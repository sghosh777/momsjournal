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
  if (entry.photo) {
    try {
      photoUrl = await uploadPhoto(userId, entry.photo)
    } catch (err) {
      console.error('Photo upload failed, saving without photo:', err)
    }
  }

  const docRef = await addDoc(collection(db, ENTRIES_COL), {
    userId,
    text: entry.text || '',
    photo: photoUrl,
    mood: entry.mood || null,
    visibility: entry.visibility || 'private',
    createdAt: serverTimestamp(),
  })

  return {
    id: docRef.id,
    userId,
    text: entry.text || '',
    photo: photoUrl,
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
    if (data.photo) {
      await deletePhoto(data.photo)
    }
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

function generateCode() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function getOrCreateInvite(userId, displayName) {
  // Check if user already has an invite
  const q = query(collection(db, INVITES_COL), where('userId', '==', userId))
  const snapshot = await getDocs(q)
  if (!snapshot.empty) {
    const existing = snapshot.docs[0]
    return { id: existing.id, ...existing.data() }
  }

  // Create a new invite with a short code as the doc ID
  const code = generateCode()
  await setDoc(doc(db, INVITES_COL, code), {
    userId,
    mamaName: displayName || null,
    createdAt: serverTimestamp(),
  })
  return { id: code, userId }
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
