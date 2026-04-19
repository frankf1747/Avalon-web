import { useMemo, useState } from 'react'
import { ROLES } from '../constants/roles'
import { submitAssassin } from '../utils/roomApi'
import { Shell, Flourish } from '../components/ui/Layout'

export default function Assassin({ room, me, secret }) {
  const isAssassin = secret?.role === 'assassin'
  const manualAssassination = (room.quests || []).filter(q => q?.result === 'success').length < 3
  const players = useMemo(
    () => Object.entries(room.players).map(([uid, p]) => ({ uid, ...p })).sort((a, b) => a.order - b.order),
    [room.players]
  )
  const goodCandidates = players.filter(p => {
    const r = room.assignment?.[p.uid]
    return r && ROLES[r].side === 'good'
  })
  const [pick, setPick] = useState(null)

  return (
    <Shell title="刺客之刃">
      <Flourish />
      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        <div className="text-6xl animate-flicker">🗡</div>
        <div className="font-display text-xl text-goldBright tracking-[0.3em] text-center">
          {manualAssassination ? (
            <>
              刺客提前亮刃
              <br />
              决定现在就刺杀梅林
            </>
          ) : (
            <>
              好人已赢得三局任务
              <br />
              刺客之刃悬于梅林之颈
            </>
          )}
        </div>

        {isAssassin ? (
          <>
            <div className="text-xs text-inkMuted tracking-widest">选择你认为是梅林的玩家</div>
            <div className="w-full flex flex-col gap-2">
              {goodCandidates.map(p => (
                <button key={p.uid}
                  onClick={() => setPick(p.uid)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-sm border ${pick === p.uid ? 'border-evilRed bg-evilRed/15' : 'border-gold/30 bg-black/25'}`}>
                  <div className="w-8 h-8 rounded-full bg-gold/40 text-night flex items-center justify-center font-display">{p.name.slice(0, 1)}</div>
                  <div className="flex-1 text-left text-sm">{p.name}</div>
                </button>
              ))}
            </div>
            <button className="btn-primary w-full" disabled={!pick} onClick={() => submitAssassin(room.id, pick)}>
              · 一刀封喉 ·
            </button>
          </>
        ) : (
          <div className="text-inkMuted text-xs tracking-[0.3em]">等待刺客抉择…</div>
        )}
      </div>
    </Shell>
  )
}
