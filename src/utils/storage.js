import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
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
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  }))
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
    createdAt: serverTimestamp(),
  })

  return {
    id: docRef.id,
    userId,
    text: entry.text || '',
    photo: photoUrl,
    mood: entry.mood || null,
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
