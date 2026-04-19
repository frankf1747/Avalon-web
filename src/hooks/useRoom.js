import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

function normalizeQuests(quests) {
  if (Array.isArray(quests)) return quests
  if (!quests || typeof quests !== 'object') return []
  return Object.keys(quests)
    .sort((a, b) => Number(a) - Number(b))
    .map((key, index) => ({ index, ...quests[key] }))
}

export function useRoom(roomId) {
  const [room, setRoom] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    if (!roomId) return
    const unsub = onSnapshot(
      doc(db, 'rooms', roomId),
      (snap) => setRoom(snap.exists() ? { id: snap.id, ...snap.data(), quests: normalizeQuests(snap.data().quests) } : null),
      (err) => setError(err)
    )
    return unsub
  }, [roomId])
  return { room, error }
}
