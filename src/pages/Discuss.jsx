import { useMemo, useState } from 'react'
import { advanceDiscussion, setDraftNomination } from '../utils/roomApi'
import { Shell, Flourish } from '../components/ui/Layout'
import RoundTable from '../components/game/RoundTable'
import { useEvents } from '../hooks/useEvents'
import { QuestTracker } from '../components/game/QuestTracker'
import { QUEST_PLAYER_COUNT } from '../constants/questConfig'

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
  const isLeader = room.game.currentLeaderIndex === speakerIndex && currentSpeaker?.uid === me?.uid
  const discussionCount = room.game.discussionCount || 0
  const remaining = Math.max(players.length - discussionCount - 1, 0)
  const qi = room.game.currentQuest
  const need = (QUEST_PLAYER_COUNT[players.length] || QUEST_PLAYER_COUNT[5])[qi]
  const nominatedTeam = room.game.nominatedTeam || []
  const canDraftTeam = isLeader

  async function toggleDraft(uid) {
    if (!canDraftTeam || busy) return
    const next = nominatedTeam.includes(uid)
      ? nominatedTeam.filter((member) => member !== uid)
      : nominatedTeam.length < need
        ? [...nominatedTeam, uid]
        : nominatedTeam
    if (next !== nominatedTeam) {
      try {
        await setDraftNomination(room.id, next)
      } catch (e) {
        setErr(e.message || '预选出征失败')
      }
    }
  }

  async function next() {
    if (!isSpeaker || busy) return
    if (isLeader && nominatedTeam.length !== need) {
      setErr(`队长需要先预选 ${need} 位出征成员`)
      return
    }
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
      <QuestTracker room={room} />
      <div className="text-center mb-3">
        <div className="text-xs text-inkMuted tracking-[0.3em] mt-3">从队长开始依次发言</div>
        <div className="text-xs text-inkMuted tracking-widest mt-1">
          本轮需 {need} 人出征 · 已预选 {nominatedTeam.length} · 还剩 {remaining} 人发言
        </div>
      </div>
      <Flourish className="my-4" />

      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <RoundTable
          players={players}
          leaderIdx={room.game.currentLeaderIndex}
          currentSpeakerIdx={speakerIndex}
          nominatedUids={nominatedTeam}
          phase={room.phase}
          size={320}
          centerTitle={currentSpeaker?.name || '...'}
          centerSubtitle=""
          showLeaderLabel={false}
          onSeatClick={canDraftTeam ? toggleDraft : undefined}
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
          {busy ? '推进中…' : (remaining === 0 ? '· 发言结束，进入提名 ·' : isLeader ? '· 预选完成，下一位 ·' : '· 我已发言，下一位 ·')}
        </button>
      ) : (
        <div className="text-center text-[11px] text-inkMuted tracking-widest mt-4">等待 {currentSpeaker?.name} 发言…</div>
      )}
      {!!err && <div className="text-center text-sm text-evilRed mt-3">{err}</div>}
    </Shell>
  )
}
