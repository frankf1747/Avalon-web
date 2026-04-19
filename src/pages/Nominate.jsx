import { useEffect, useMemo, useRef, useState } from 'react'
import { QUEST_PLAYER_COUNT } from '../constants/questConfig'
import { submitNomination } from '../utils/roomApi'
import { PlayerPicker } from '../components/game/PlayerPicker'
import { QuestTracker } from '../components/game/QuestTracker'
import { Shell, Flourish } from '../components/ui/Layout'

function shuffle(arr) {
  const next = arr.slice()
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

export default function Nominate({ room, me }) {
  const players = useMemo(
    () => Object.entries(room.players).map(([uid, p]) => ({ uid, ...p })).sort((a, b) => a.order - b.order),
    [room.players]
  )
  const leader = players[room.game.currentLeaderIndex]
  const isLeader = leader?.uid === me?.uid
  const qi = room.game.currentQuest
  const need = (QUEST_PLAYER_COUNT[players.length] || QUEST_PLAYER_COUNT[5])[qi]
  const [selected, setSelected] = useState(room.game.nominatedTeam || [])
  const botSubmittedRef = useRef(false)

  useEffect(() => {
    setSelected(room.game.nominatedTeam || [])
  }, [room.game.nominatedTeam])

  useEffect(() => {
    botSubmittedRef.current = false
  }, [room.phase, room.game.currentLeaderIndex, room.game.currentQuest])

  function toggle(uid) {
    setSelected(s => s.includes(uid) ? s.filter(x => x !== uid) : [...s, uid])
  }
  async function submit() {
    if (selected.length !== need) return
    await submitNomination(room.id, selected)
  }

  useEffect(() => {
    if (me?.uid !== room.hostUid) return
    if (!leader?.isBot) return
    if (room.phase !== 'nominate') return
    if (botSubmittedRef.current) return

    botSubmittedRef.current = true
    const team = (room.game.nominatedTeam && room.game.nominatedTeam.length === need)
      ? room.game.nominatedTeam
      : [leader.uid, ...shuffle(players.filter(p => p.uid !== leader.uid)).slice(0, need - 1).map(p => p.uid)]

    const timer = setTimeout(() => {
      submitNomination(room.id, team).catch((e) => {
        console.warn('nominate fallback error', e)
        botSubmittedRef.current = false
      })
    }, 700)

    return () => clearTimeout(timer)
  }, [leader, me?.uid, need, players, room.game.currentLeaderIndex, room.game.currentQuest, room.game.nominatedTeam, room.hostUid, room.id, room.phase])

  return (
    <Shell title={`第 ${qi + 1} 局 · 队长提名`}>
      <QuestTracker room={room} />
      <Flourish className="my-4" />
      <div className="text-center mb-3">
        <div className="text-xs text-inkMuted tracking-[0.3em]">本轮队长</div>
        <div className="font-display text-xl text-goldBright tracking-[0.3em] mt-1">👑 {leader?.name}</div>
        <div className="text-xs text-inkMuted tracking-widest mt-1">需 {need} 位出征 · 已选 {selected.length}</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLeader ? (
          <PlayerPicker players={players} selected={selected} onToggle={toggle} max={need} />
        ) : (
          <div className="flex flex-col gap-2">
            {players.map(p => (
              <div key={p.uid} className="flex items-center gap-3 px-3 py-2.5 rounded-sm border border-gold/20 bg-black/20">
                <div className="w-8 h-8 rounded-full bg-gold/40 text-night flex items-center justify-center font-display">{p.name.slice(0, 1)}</div>
                <div className="text-sm">{p.name}</div>
                {p.uid === leader.uid && <span className="ml-auto text-[11px] text-goldBright">👑 队长</span>}
              </div>
            ))}
            <div className="text-center text-inkMuted text-xs tracking-[0.3em] mt-4">等待 {leader?.name} 提名…</div>
          </div>
        )}
      </div>

      {isLeader && (
        <button className="btn-primary w-full mt-4" disabled={selected.length !== need} onClick={submit}>
          · 提交提名 ·
        </button>
      )}

      <div className="mt-3 text-center text-[11px] text-inkMuted tracking-widest">
        连续拒绝 {room.game.rejectedCount || 0} / 5
      </div>
    </Shell>
  )
}
