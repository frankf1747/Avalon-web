import { useEffect, useState } from 'react'
import { auth, ensureAuth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'

export function useAuth() {
  const [user, setUser] = useState(auth.currentUser)
  useEffect(() => {
    ensureAuth().catch(console.error)
    return onAuthStateChanged(auth, setUser)
  }, [])
  return user
}
