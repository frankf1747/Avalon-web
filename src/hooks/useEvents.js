import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore'
import { db } from '../firebase'

export function useEvents(roomId, n = 30) {
  const [events, setEvents] = useState([])
  useEffect(() => {
    if (!roomId) return
    const q = query(collection(db, 'rooms', roomId, 'events'), orderBy('timestamp', 'desc'), limit(n))
    return onSnapshot(q, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [roomId, n])
  return events
}
