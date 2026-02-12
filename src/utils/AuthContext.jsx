import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from './firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Please add your Firebase secrets to GitHub.')
      setLoading(false)
      return
    }
    try {
      // Check for redirect result (from signInWithRedirect)
      getRedirectResult(auth).catch(() => {})

      const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u)
        setLoading(false)
      })
      return unsubscribe
    } catch (err) {
      console.error('Auth init failed:', err)
      setError(err.message)
      setLoading(false)
    }
  }, [])

  async function signInWithGoogle() {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      // If popup is blocked or fails, fall back to redirect
      if (err.code === 'auth/popup-blocked' ||
          err.code === 'auth/popup-closed-by-user' ||
          err.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider)
      } else {
        console.error('Sign in failed:', err)
      }
    }
  }

  async function signOut() {
    try {
      await firebaseSignOut(auth)
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
