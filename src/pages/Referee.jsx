import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useRoom } from '../hooks/useRoom'
import { useEvents } from '../hooks/useEvents'
import { ROLES } from '../constants/roles'
import { QUEST_PLAYER_COUNT, failsRequired } from '../constants/questConfig'
import { QuestBadge } from '../components/game/QuestBadge'
import ResultCardSpread from '../components/game/ResultCardSpread'
import { useT } from '../i18n'

function RoundTableDiagram({ players, leaderIdx, nominated, room }) {
  const t = useT()
  const radius = 112
  const center = 132

  return (
    <div className="mt-6">
      <div className="text-xs tracking-[0.3em] text-gold/80 mb-3 text-center">{t('ref.seats')}</div>
      <div className="relative mx-auto w-[264px] h-[264px]">
        <div className="absolute inset-[44px] rounded-full border border-gold/25 bg-[radial-gradient(circle,rgba(201,168,76,0.08),transparent_70%)]" />
        <div className="absolute inset-[88px] rounded-full border border-gold/20 flex items-center justify-center">
          <div className="text-center">
            <div className="font-display text-goldBright text-lg tracking-[0.3em]">{t('table.title')}</div>
            <div className="text-[10px] text-inkMuted tracking-[0.3em] mt-1">{t('ref.tableHint')}</div>
          </div>
        </div>

        {players.map((p, i) => {
          const angle = (-Math.PI / 2) + (i / players.length) * Math.PI * 2
          const x = center + Math.cos(angle) * radius
          const y = center + Math.sin(angle) * radius
          const isLeader = i === leaderIdx && ['discuss', 'nominate', 'vote', 'voteResult'].includes(room.phase)
          const isNominated = nominated.has(p.uid)
          const isSpeaker = i === (room.game.currentSpeakerIndex ?? -1) && room.phase === 'discuss'

          return (
            <div
              key={p.uid}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: x, top: y }}
            >
              <div className={`w-14 h-14 rounded-full border flex items-center justify-center font-display text-sm relative
                ${isSpeaker ? 'border-sky-300 bg-sky-300/15' :
                  isLeader ? 'border-goldBright bg-goldBright/20 shadow-gold' :
                  isNominated ? 'border-goodGreen bg-goodGreen/15' :
                  'border-gold/25 bg-black/30'}`}>
                {p.name.slice(0, 1)}
                {isLeader && <span className="absolute -top-4 text-[11px] text-goldBright tracking-widest">{t('common.leader')}</span>}
                {isNominated && <span className="absolute -bottom-4 text-[11px] text-goodGreen tracking-widest">{t('common.onQuest')}</span>}
                {isSpeaker && <span className="absolute -bottom-4 text-[11px] text-sky-300 tracking-widest">{t('common.speaking')}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Referee() {
  const { roomId } = useParams()
  const { room } = useRoom(roomId)
  const events = useEvents(roomId, 40)
  const t = useT()

  if (!room) return <div className="min-h-screen flex items-center justify-center text-gold tracking-widest">{t('ref.connecting', { id: roomId })}</div>

  const players = Object.entries(room.players).map(([uid, p]) => ({ uid, ...p })).sort((a, b) => a.order - b.order)
  const qi = room.game.currentQuest
  const sizes = QUEST_PLAYER_COUNT[players.length] || QUEST_PLAYER_COUNT[5]
  const leaderIdx = room.game.currentLeaderIndex
  const nominated = new Set(room.game.nominatedTeam || [])
  const currentQuest = room.quests[qi] || {}
  const approveVotes = currentQuest.approveVotes || {}
  const missionVotes = currentQuest.missionVotes || {}
  const rejCount = room.game.rejectedCount || 0
  const approveCount = Object.values(approveVotes).filter(v => v === 'approve').length
  const rejectCount = Object.values(approveVotes).filter(v => v === 'reject').length
  const approvalSubmitted = Object.keys(approveVotes).length
  const missionSubmitted = Object.keys(missionVotes).length
  const missionFails = Object.values(missionVotes).filter(v => v === 'fail').length

  return (
    <div className="min-h-screen w-full text-ink p-5 pt-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gold/30 pb-3">
        <div className="flex items-center gap-4">
          <span className="font-display text-2xl text-goldBright tracking-[0.4em]">⚜ {t('app.name')}</span>
          <span className="text-inkMuted text-xs tracking-[0.3em]">{t('ref.room')} <span className="font-mono text-goldBright">{room.id}</span></span>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl text-goldBright tracking-[0.4em]">{t(`phase.${room.phase}`)}</div>
          <div className="text-xs text-inkMuted tracking-[0.3em]">{t('ref.questN', { n: qi + 1 })}</div>
        </div>
      </div>

      {/* Body: 3 columns */}
      <div className="grid grid-cols-3 gap-4 mt-4" style={{ gridTemplateRows: 'auto auto' }}>
        {/* Players */}
        <section className="card-themed">
          <div className="text-xs tracking-[0.3em] text-gold/80 mb-3">{t('ref.players')}</div>
          <div className="flex flex-col gap-1.5">
            {players.map((p, i) => {
              const isLeader = i === leaderIdx && ['discuss', 'nominate', 'vote'].includes(room.phase)
              const isNominated = nominated.has(p.uid)
              const isSpeaker = i === (room.game.currentSpeakerIndex ?? -1) && room.phase === 'discuss'
              return (
                <div key={p.uid} className={`flex items-center gap-2 px-2 py-1.5 rounded-sm border
                  ${isSpeaker ? 'border-sky-300 bg-sky-300/15' :
                    isLeader ? 'border-goldBright bg-goldBright/15' :
                    isNominated ? 'border-gold/60 bg-gold/10' : 'border-gold/20 bg-black/20'}`}>
                  <span className="text-inkMuted w-5 text-right text-xs">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold to-goldBright text-night flex items-center justify-center font-display text-xs">
                    {p.name.slice(0, 1)}
                  </div>
                  <span className="flex-1 text-sm truncate">{p.name}</span>
                  {isLeader && <span className="text-xs text-goldBright">👑</span>}
                  {isSpeaker && <span className="text-xs text-sky-300">🎙</span>}
                  {isNominated && <span className="text-xs text-goldBright">⚔</span>}
                  {p.isReady && room.phase === 'roleReveal' && <span className="text-xs text-goodGreen">✓</span>}
                  {p.uid === room.game.ladyHolderUid && <span className="text-xs">🜄</span>}
                </div>
              )
            })}
          </div>
        </section>

        {/* Quest board + rejection */}
        <section className="card-themed">
          <div className="text-xs tracking-[0.3em] text-gold/80 mb-3">{t('ref.quests')}</div>
          <div className="flex gap-2 items-end justify-center">
            {sizes.map((n, i) => {
              const q = room.quests[i]
              const state = q?.result || (i === qi ? 'current' : 'pending')
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <QuestBadge state={state} label={n} size="lg" />
                  <div className="text-[10px] text-inkMuted tracking-widest min-h-[14px]">
                    {failsRequired(players.length, i) === 2 ? t('ref.protected') : ''}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-6">
            <div className="text-xs tracking-[0.3em] text-gold/80 mb-2">{t('ref.rejects')}</div>
            <div className="flex gap-1">
              {[0,1,2,3,4].map(i => (
                <div key={i} className={`flex-1 h-3 rounded-sm border ${i < rejCount ? (rejCount >= 4 ? 'bg-evilRed border-evilRed animate-flicker' : 'bg-gold border-gold') : 'border-gold/30'}`} />
              ))}
            </div>
            <div className="text-center text-xs text-inkMuted mt-1 tracking-widest">{rejCount} / 5</div>
          </div>
          <RoundTableDiagram players={players} leaderIdx={leaderIdx} nominated={nominated} room={room} />
        </section>

        {/* Vote status */}
        <section className="card-themed">
          <div className="text-xs tracking-[0.3em] text-gold/80 mb-3">{t('ref.voteStatus')}</div>
          {room.phase === 'discuss' ? (
            <div className="text-center">
              <div className="text-xs tracking-[0.3em] text-inkMuted mb-2">{t('ref.speaker')}</div>
              <div className="font-display text-2xl text-sky-300">
                {players[room.game.currentSpeakerIndex ?? room.game.currentLeaderIndex]?.name || '...'}
              </div>
              <div className="text-[11px] text-inkMuted tracking-widest mt-2">
                {t('ref.spoken', { i: (room.game.discussionCount || 0) + 1, n: players.length })}
              </div>
            </div>
          ) : room.phase === 'vote' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-sm border border-gold/30 bg-black/20 p-3 text-center">
                <div className="text-xs tracking-[0.3em] text-inkMuted mb-2">{t('vote.voted')}</div>
                <div className="font-display text-2xl text-goldBright">{approvalSubmitted}</div>
              </div>
              <div className="rounded-sm border border-gold/30 bg-black/20 p-3 text-center">
                <div className="text-xs tracking-[0.3em] text-inkMuted mb-2">{t('vote.pending')}</div>
                <div className="font-display text-2xl text-goldBright">{players.length - approvalSubmitted}</div>
              </div>
            </div>
          ) : room.phase === 'voteResult' ? (
            <div className="space-y-4">
              <ResultCardSpread image="/nominate_success.png" label={t('vote.approveCards')} count={approveCount} compact />
              <ResultCardSpread image="/nominate_fail.png" label={t('vote.rejectCards')} count={rejectCount} compact />
            </div>
          ) : room.phase === 'mission' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-sm border border-gold/30 bg-black/20 p-3 text-center">
                <div className="text-xs tracking-[0.3em] text-inkMuted mb-2">{t('ref.sealed')}</div>
                <div className="font-display text-2xl text-goldBright">{missionSubmitted}</div>
              </div>
              <div className="rounded-sm border border-gold/30 bg-black/20 p-3 text-center">
                <div className="text-xs tracking-[0.3em] text-inkMuted mb-2">{t('ref.unsealed')}</div>
                <div className="font-display text-2xl text-goldBright">{(currentQuest.team || []).length - missionSubmitted}</div>
              </div>
            </div>
          ) : room.phase === 'missionResult' ? (
            <div className="space-y-4">
              <ResultCardSpread image="/mission_success.png" label={t('mission.successCards')} count={missionSubmitted - missionFails} compact />
              <ResultCardSpread image="/mission_fail.png" label={t('mission.failCards')} count={missionFails} compact />
            </div>
          ) : (
            <div className="text-inkMuted text-xs tracking-[0.3em]">{t('ref.noVote')}</div>
          )}
        </section>

        {/* Event log — spans full width */}
        <section className="card-themed col-span-3 max-h-48 overflow-y-auto">
          <div className="text-xs tracking-[0.3em] text-gold/80 mb-2">{t('ref.log')}</div>
          <ul className="text-sm space-y-1 font-mono">
            {events.map(e => (
              <li key={e.id} className="text-ink/80">
                <span className="text-inkMuted">[{e.timestamp?.toDate?.().toLocaleTimeString?.(t.lang === 'zh' ? 'zh-CN' : 'en-US') || '…'}]</span>{' '}
                {t.event(e)}
              </li>
            ))}
            {events.length === 0 && <li className="text-inkMuted">{t('ref.waitEvents')}</li>}
          </ul>
        </section>
      </div>

      <div className="text-center text-[10px] text-inkMuted tracking-[0.4em] mt-4">{t('ref.footer')}</div>
    </div>
  )
}
