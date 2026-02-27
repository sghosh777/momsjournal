/**
 * Public Firestore access for shared/family views (no auth required).
 */
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export async function getInvite(code) {
  const docRef = doc(db, 'invites', code)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null

  const data = snapshot.data()
  const invite = { id: snapshot.id, ...data }

  // Check expiration
  if (data.expiresAt) {
    const expires = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt)
    if (expires < new Date()) {
      return { ...invite, expired: true }
    }
  }

  return invite
}

export function subscribeToSharedEntries(userId, callback, onError) {
  const q = query(
    collection(db, 'entries'),
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
  }, onError)
}

/**
 * Subscribe to push notifications for new shared moments.
 * Uses the FCM token as the document ID for idempotent upserts (no read needed).
 * Returns true if successful, false if permission denied.
 */
export async function subscribeToNotifications(userId) {
  // Check browser support
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    throw new Error('Push notifications are not supported in this browser')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  // Dynamically import messaging to avoid loading it on every page
  const { getMessaging, getToken } = await import('firebase/messaging')
  const { getApp } = await import('firebase/app')

  const messaging = getMessaging(getApp())
  const swReg = await navigator.serviceWorker.ready

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: swReg,
  })

  if (!token) throw new Error('Could not get notification token')

  // Use token as doc ID — idempotent, no duplicate check needed
  await setDoc(doc(db, 'pushSubscribers', token), {
    userId,
    token,
    createdAt: serverTimestamp(),
  })

  return true
}
