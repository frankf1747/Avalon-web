import { useMemo, useState } from 'react'
import { advanceDiscussion } from '../utils/roomApi'
import { Shell, Flourish } from '../components/ui/Layout'
import RoundTable from '../components/game/RoundTable'
import { useEvents } from '../hooks/useEvents'

export default function Discuss({ room, me }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const events = useEvents(room.id, 6)
  const players = useMemo(
    () => Object.entries(room.players).map(([uid, p]) => ({ uid, ...p })).sort((a, b) => a.order - b.order),
    [room.players]
  )

  const speakerIndex = room.game.currentSpeakerIndex ?? room.game.currentLeaderIndex
  const currentSpeaker = players[speakerIndex]
  const isSpeaker = currentSpeaker?.uid === me?.uid
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
        <div className="text-xs text-inkMuted tracking-widest mt-1">
          还剩 {remaining} 人发言
        </div>
      </div>
      <Flourish className="my-4" />

      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <RoundTable
          players={players}
          leaderIdx={room.game.currentLeaderIndex}
          currentSpeakerIdx={speakerIndex}
          nominatedUids={[]}
          phase={room.phase}
          size={320}
          centerTitle={currentSpeaker?.name || '...'}
          centerSubtitle=""
          showLeaderLabel={false}
        />

        <div className="w-full card-themed !p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] tracking-[0.3em] text-gold/80">Game Log</div>
            <div className="text-[11px] tracking-[0.24em] text-inkMuted">
              发言 {Math.min(discussionCount + 1, players.length)} / {players.length}
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {events.map((event) => (
              <div key={event.id} className="rounded-sm border border-gold/15 bg-black/15 px-3 py-2.5 text-sm text-ink/85">
                {event.message}
              </div>
            ))}
            {events.length === 0 && (
              <div className="rounded-sm border border-gold/15 bg-black/15 px-3 py-2.5 text-sm text-inkMuted">
                等待日志更新…
              </div>
            )}
          </div>
        </div>
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
