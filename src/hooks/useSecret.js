import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useSecret(roomId, uid) {
  const [secret, setSecret] = useState(null)
  useEffect(() => {
    if (!roomId || !uid) return
    const ref = doc(db, 'secrets', `${roomId}_${uid}`)
    return onSnapshot(ref, (s) => setSecret(s.exists() ? s.data() : null))
  }, [roomId, uid])
  return secret
}
