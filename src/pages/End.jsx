import { useMemo } from 'react'
import { ROLES } from '../constants/roles'
import { resetToLobby, leaveRoom } from '../utils/roomApi'
import { Shell, Flourish } from '../components/ui/Layout'
import { QuestBadge } from '../components/game/QuestBadge'

export default function End({ room, me, onLeave }) {
  const isHost = me?.uid === room.hostUid
  const winner = room.game.winner
  const players = useMemo(
    () => Object.entries(room.players).map(([uid, p]) => ({ uid, ...p })).sort((a, b) => a.order - b.order),
    [room.players]
  )
  const title = winner === 'good' ? '正义胜利' : '邪恶胜利'
  const color = winner === 'good' ? 'text-goodGreen' : 'text-evilRed'

  async function handleLeave() { await leaveRoom(room.id); onLeave() }

  return (
    <Shell title="终局" back={handleLeave}>
      <div className="text-center my-6">
        <div className={`font-display text-4xl tracking-[0.4em] ${color}`}>{title}</div>
      </div>
      <Flourish />

      <div className="mt-5 mb-2 text-xs tracking-[0.3em] text-gold/80">身份揭示</div>
      <div className="grid grid-cols-2 gap-2">
        {players.map(p => {
          const rid = room.assignment?.[p.uid]
          const role = rid ? ROLES[rid] : null
          return (
            <div key={p.uid} className="card-themed flex items-center gap-2 !p-2.5">
              <div className="w-8 h-8 rounded-full bg-gold/40 text-night flex items-center justify-center font-display text-sm">{p.name.slice(0, 1)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{p.name}</div>
                {role && (
                  <div className={`text-[11px] ${role.side === 'evil' ? 'text-evilRed' : 'text-goodGreen'}`}>
                    {role.name}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 text-xs tracking-[0.3em] text-gold/80">任务回顾</div>
      <div className="flex gap-2 mt-2 items-center justify-center">
        {room.quests.map((q, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <QuestBadge state={q.result || 'pending'} label={i + 1} size="sm" />
          </div>
        ))}
      </div>

      {isHost && (
        <button className="btn-primary w-full mt-8" onClick={() => resetToLobby(room.id)}>· 再来一局 ·</button>
      )}
    </Shell>
  )
}
