/**
 * Public Firestore access for shared/family views (no auth required).
 */
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'

export async function getInvite(code) {
  const docRef = doc(db, 'invites', code)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

export function subscribeToSharedEntries(userId, callback) {
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
  })
}
