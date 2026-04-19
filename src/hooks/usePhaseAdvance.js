import { useEffect, useRef } from 'react'
import { auth } from '../firebase'
import { advanceResultPhase } from '../utils/roomApi'

const REVEAL_DELAY_MS = 2500

export function usePhaseAdvance(room) {
  const scheduledKey = useRef(null)

  useEffect(() => {
    if (!room) return
    if (auth.currentUser?.uid !== room.hostUid) return
    if (!['voteResult', 'missionResult'].includes(room.phase)) {
      scheduledKey.current = null
      return
    }

    const key = `${room.phase}:${room.game.currentQuest}:${JSON.stringify(room.quests[room.game.currentQuest] || {})}`
    if (scheduledKey.current === key) return
    scheduledKey.current = key

    const timer = setTimeout(async () => {
      try {
        await advanceResultPhase(room.id)
      } catch (e) {
        console.warn('phase advance error', e)
      }
    }, REVEAL_DELAY_MS)

    return () => clearTimeout(timer)
  }, [room])
}
