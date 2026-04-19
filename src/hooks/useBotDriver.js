// Runs on the HOST client only. Watches room state and acts on behalf of bots.
// Good bots always approve + vote success; evil bots approve 70% of the time and always fail missions.
// Bot leader picks self + fill to required count from remaining players.
// Lady/assassin: random valid target.
//
// NOTE: relies on room.assignment being readable by the host. This also means
// any player's client could read it — acceptable for debug-only bot play; in a
// trust-critical build, move assignment to a host-only collection.

import { useEffect, useRef } from 'react'
import { auth } from '../firebase'
import { ROLES } from '../constants/roles'
import { QUEST_PLAYER_COUNT } from '../constants/questConfig'
import {
  submitNomination, castApprovalVote, castMissionVote, advanceDiscussion,
  submitLady, closeLady, submitAssassin,
} from '../utils/roomApi'

const DELAY_MS = 600 // small pause so UI transitions are visible

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)] }

export function useBotDriver(room) {
  const running = useRef(false)

  useEffect(() => {
    if (!room) return
    if (auth.currentUser?.uid !== room.hostUid) return
    const bots = Object.entries(room.players || {})
      .filter(([, p]) => p.isBot)
      .map(([uid, p]) => ({ uid, ...p }))
    if (bots.length === 0) return
    if (running.current) return

    const players = Object.entries(room.players)
      .map(([uid, p]) => ({ uid, ...p }))
      .sort((a, b) => a.order - b.order)
    const qi = room.game.currentQuest
    const quest = room.quests?.[qi] || {}
    const assignment = room.assignment || {}
    const sideOf = (uid) => ROLES[assignment[uid]]?.side

    async function step() {
      running.current = true
      try {
        if (room.phase === 'discuss') {
          const speaker = players[room.game.currentSpeakerIndex ?? room.game.currentLeaderIndex]
          if (speaker?.isBot) {
            await new Promise(r => setTimeout(r, DELAY_MS))
            await advanceDiscussion(room.id)
          }
        } else if (room.phase === 'nominate') {
          const leader = players[room.game.currentLeaderIndex]
          if (leader?.isBot) {
            const need = (QUEST_PLAYER_COUNT[players.length] || QUEST_PLAYER_COUNT[5])[qi]
            const team = [leader.uid, ...players.filter(p => p.uid !== leader.uid).slice(0, need - 1).map(p => p.uid)]
            await new Promise(r => setTimeout(r, DELAY_MS))
            await submitNomination(room.id, team)
          }
        } else if (room.phase === 'vote') {
          const votes = quest.approveVotes || {}
          const pendingBots = bots.filter(b => !(b.uid in votes))
          for (const b of pendingBots) {
            const side = sideOf(b.uid)
            const vote = side === 'evil' && Math.random() < 0.3 ? 'reject' : 'approve'
            await new Promise(r => setTimeout(r, DELAY_MS))
            await castApprovalVote(room.id, vote, b.uid)
          }
        } else if (room.phase === 'mission') {
          const votes = quest.missionVotes || {}
          const teamBots = bots.filter(b => quest.team?.includes(b.uid) && !(b.uid in votes))
          for (const b of teamBots) {
            const side = sideOf(b.uid)
            const vote = side === 'evil' ? 'fail' : 'success'
            await new Promise(r => setTimeout(r, DELAY_MS))
            await castMissionVote(room.id, vote, b.uid)
          }
        } else if (room.phase === 'lady') {
          const holder = room.game.ladyHolderUid
          const holderIsBot = bots.some(b => b.uid === holder)
          if (holderIsBot && !room.game.ladyTarget) {
            const used = new Set(room.game.usedLadyUids || [])
            const eligible = players.filter(p => p.uid !== holder && !used.has(p.uid))
            if (eligible.length) {
              await new Promise(r => setTimeout(r, DELAY_MS))
              await submitLady(room.id, pickRandom(eligible).uid, holder)
              await new Promise(r => setTimeout(r, DELAY_MS))
              await closeLady(room.id)
            }
          }
        } else if (room.phase === 'assassin') {
          const assassinUid = Object.entries(assignment).find(([, r]) => r === 'assassin')?.[0]
          const assassinIsBot = bots.some(b => b.uid === assassinUid)
          if (assassinIsBot) {
            const goodOnes = players.filter(p => sideOf(p.uid) === 'good')
            if (goodOnes.length) {
              await new Promise(r => setTimeout(r, DELAY_MS))
              await submitAssassin(room.id, pickRandom(goodOnes).uid)
            }
          }
        }
      } catch (e) {
        console.warn('bot driver error', e)
      } finally {
        running.current = false
      }
    }
    step()
  }, [room])
}
