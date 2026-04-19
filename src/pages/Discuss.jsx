import { useMemo, useState } from 'react'
import { advanceDiscussion } from '../utils/roomApi'
import { Shell, Flourish } from '../components/ui/Layout'

export default function Discuss({ room, me }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const players = useMemo(
    () => Object.entries(room.players).map(([uid, p]) => ({ uid, ...p })).sort((a, b) => a.order - b.order),
    [room.players]
  )

  const speakerIndex = room.game.currentSpeakerIndex ?? room.game.currentLeaderIndex
  const currentSpeaker = players[speakerIndex]
  const isSpeaker = currentSpeaker?.uid === me?.uid
  const leader = players[room.game.currentLeaderIndex]
  const discussionCount = room.game.discussionCount || 0
  const remaining = Math.max(players.length - discussionCount - 1, 0)

  async function next() {
    if (!isSpeaker || busy) return
    setBusy(true)
    setErr('')
    try {
      await advanceDiscussion(room.id)
    } catch (e) {
      setErr(e.message || '发言推进失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell title={`第 ${room.game.currentQuest + 1} 局 · 发言环节`}>
      <div className="text-center mb-3">
        <div className="text-xs text-inkMuted tracking-[0.3em]">从队长开始依次发言</div>
        <div className="font-display text-xl text-goldBright tracking-[0.3em] mt-1">{currentSpeaker?.name || '...'}</div>
        <div className="text-xs text-inkMuted tracking-widest mt-1">
          队长：{leader?.name} · 还剩 {remaining} 人
        </div>
      </div>
      <Flourish className="my-4" />

      <div className="flex-1 flex flex-col gap-3">
        {players.map((p, i) => {
          const isCurrent = i === speakerIndex
          const isLeader = i === room.game.currentLeaderIndex
          const hasSpoken = i !== speakerIndex && ((i - room.game.currentLeaderIndex + players.length) % players.length) < discussionCount
          return (
            <div
              key={p.uid}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm border
                ${isCurrent ? 'border-goldBright bg-goldBright/15' :
                  hasSpoken ? 'border-goodGreen/40 bg-goodGreen/10' :
                  'border-gold/20 bg-black/20'}`}
            >
              <div className="w-8 h-8 rounded-full bg-gold/40 text-night flex items-center justify-center font-display">{p.name.slice(0, 1)}</div>
              <div className="flex-1 text-sm">{p.name}</div>
              {isLeader && <span className="text-[11px] text-goldBright">👑 队长</span>}
              {isCurrent && <span className="text-[11px] text-goldBright">正在发言</span>}
              {!isCurrent && hasSpoken && <span className="text-[11px] text-goodGreen">已发言</span>}
            </div>
          )
        })}
      </div>

      {isSpeaker ? (
        <button className="btn-primary w-full mt-4" disabled={busy} onClick={next}>
          {busy ? '推进中…' : (remaining === 0 ? '· 发言结束，队长提名 ·' : '· 我已发言，下一位 ·')}
        </button>
      ) : (
        <div className="text-center text-[11px] text-inkMuted tracking-widest mt-4">等待 {currentSpeaker?.name} 发言…</div>
      )}
      {!!err && <div className="text-center text-sm text-evilRed mt-3">{err}</div>}
    </Shell>
  )
}
