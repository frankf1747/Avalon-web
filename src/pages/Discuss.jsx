import { useMemo, useState } from 'react'
import { advanceDiscussion, setDraftNomination } from '../utils/roomApi'
import { Shell, Flourish } from '../components/ui/Layout'
import RoundTable from '../components/game/RoundTable'
import { useEvents } from '../hooks/useEvents'
import { QuestTracker } from '../components/game/QuestTracker'
import { QUEST_PLAYER_COUNT } from '../constants/questConfig'
import { useT } from '../i18n'

export default function Discuss({ room, me }) {
  const t = useT()
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
        setErr(t.err(e, 'discuss.draftFailed'))
      }
    }
  }

  async function next() {
    if (!isSpeaker || busy) return
    if (isLeader && nominatedTeam.length !== need) {
      setErr(t('discuss.needDraft', { n: need }))
      return
    }
    setBusy(true)
    setErr('')
    try {
      await advanceDiscussion(room.id)
    } catch (e) {
      setErr(t.err(e, 'discuss.advanceFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell title={t('discuss.title', { n: room.game.currentQuest + 1 })}>
      <QuestTracker room={room} />
      <div className="text-center mb-3">
        <div className="text-xs text-inkMuted tracking-[0.3em] mt-3">{t('discuss.order')}</div>
        <div className="text-xs text-inkMuted tracking-widest mt-1">
          {t('discuss.status', { need, sel: nominatedTeam.length, left: remaining })}
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
            <div className="text-[11px] tracking-[0.3em] text-gold/80">{t('discuss.log')}</div>
            <div className="text-[11px] tracking-[0.24em] text-inkMuted">
              {t('discuss.turn', { i: Math.min(discussionCount + 1, players.length), n: players.length })}
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {events.map((event) => (
              <div key={event.id} className="rounded-sm border border-gold/15 bg-black/15 px-3 py-2.5 text-sm text-ink/85">
                {t.event(event)}
              </div>
            ))}
            {events.length === 0 && (
              <div className="rounded-sm border border-gold/15 bg-black/15 px-3 py-2.5 text-sm text-inkMuted">
                {t('discuss.waitLog')}
              </div>
            )}
          </div>
        </div>
      </div>

      {isSpeaker ? (
        <button className="btn-primary w-full mt-4" disabled={busy} onClick={next}>
          {busy ? t('common.advancing') : (remaining === 0 ? t('discuss.toNominate') : isLeader ? t('discuss.leaderNext') : t('discuss.next'))}
        </button>
      ) : (
        <div className="text-center text-[11px] text-inkMuted tracking-widest mt-4">{t('discuss.waitSpeaker', { name: currentSpeaker?.name })}</div>
      )}
      {!!err && <div className="text-center text-sm text-evilRed mt-3">{err}</div>}
    </Shell>
  )
}
