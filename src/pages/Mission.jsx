import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { castMissionVote, advanceResultPhaseFromRoom } from '../utils/roomApi'
import { Shell, Flourish } from '../components/ui/Layout'
import { ROLES } from '../constants/roles'
import { failsRequired } from '../constants/questConfig'
import VoteCard from '../components/game/VoteCard'
import ResultCardSpread from '../components/game/ResultCardSpread'

export default function Mission({ room, me, secret }) {
  const [advancing, setAdvancing] = useState(false)
  const [advanceError, setAdvanceError] = useState('')
  const [voteError, setVoteError] = useState('')
  const [autoSeconds, setAutoSeconds] = useState(4)
  const qi = room.game.currentQuest
  const quest = room.quests[qi]
  const team = quest.team
  const onTeam = team.includes(me?.uid)
  const votes = quest.missionVotes || {}
  const myVote = votes[me?.uid]
  const submitted = Object.keys(votes).length
  const isEvil = secret && ROLES[secret.role]?.side === 'evil'
  const isResultPhase = room.phase === 'missionResult'
  const failCount = Object.values(votes).filter(v => v === 'fail').length
  const successCount = Object.values(votes).filter(v => v === 'success').length
  const failThreshold = failsRequired(Object.keys(room.players).length, qi)
  const missionPassed = failCount < failThreshold
  const isHost = me?.uid === room.hostUid
  const isOnlineMode = room.config.playMode === 'online'
  const autoAdvanceStarted = useRef(false)

  const players = useMemo(
    () => Object.entries(room.players).map(([uid, p]) => ({ uid, ...p })).sort((a, b) => a.order - b.order),
    [room.players]
  )

  async function vote(v) {
    if (!onTeam || myVote) return
    if (v === 'fail' && !isEvil) return
    setVoteError('')
    try {
      await castMissionVote(room.id, v)
    } catch (e) {
      setVoteError(e.message || '投票失败')
    }
  }

  async function continueNext() {
    if (!isHost || !isResultPhase || advancing) return
    setAdvancing(true)
    setAdvanceError('')
    try {
      await advanceResultPhaseFromRoom(room)
    } catch (e) {
      setAdvanceError(e.message || '继续失败')
    } finally {
      setAdvancing(false)
    }
  }

  useEffect(() => {
    autoAdvanceStarted.current = false
    setAutoSeconds(4)
  }, [room.phase, room.game.currentQuest])

  useEffect(() => {
    if (!isOnlineMode || !isResultPhase || !isHost || advancing || autoAdvanceStarted.current) return
    autoAdvanceStarted.current = true
    const timeout = setTimeout(() => {
      continueNext()
    }, 4000)
    return () => clearTimeout(timeout)
  }, [advancing, isHost, isOnlineMode, isResultPhase])

  useEffect(() => {
    if (!isOnlineMode || !isResultPhase || autoSeconds <= 0) return
    const timer = setTimeout(() => setAutoSeconds(v => v - 1), 1000)
    return () => clearTimeout(timer)
  }, [autoSeconds, isOnlineMode, isResultPhase])

  return (
    <Shell title={`第 ${qi + 1} 局 · 任务执行`}>
      <div className="text-center mb-3">
        <div className="text-xs text-inkMuted tracking-[0.3em]">出征骑士</div>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {team.map(uid => (
            <span key={uid} className="chip border-goldBright text-goldBright">{room.players[uid]?.name}</span>
          ))}
        </div>
      </div>
      <Flourish />

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {isOnlineMode && (
          <div className="grid w-full max-w-md grid-cols-3 gap-3">
            <div className="card-themed !p-3 text-center">
              <div className="text-[10px] tracking-[0.3em] text-inkMuted">任务</div>
              <div className="mt-2 font-display text-xl text-goldBright">{qi + 1}</div>
            </div>
            <div className="card-themed !p-3 text-center">
              <div className="text-[10px] tracking-[0.3em] text-inkMuted">已提交</div>
              <div className="mt-2 font-display text-xl text-goldBright">{submitted} / {team.length}</div>
            </div>
            <div className="card-themed !p-3 text-center">
              <div className="text-[10px] tracking-[0.3em] text-inkMuted">失败阈值</div>
              <div className="mt-2 font-display text-xl text-goldBright">{failThreshold}</div>
            </div>
          </div>
        )}

        {isResultPhase ? (
          <>
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <div className={`font-display text-3xl tracking-[0.35em] ${missionPassed ? 'text-goodGreen' : 'text-evilRed'}`}>
                {missionPassed ? '任务成功' : '任务失败'}
              </div>
              <div className="text-[11px] text-inkMuted tracking-widest mt-2">
                {failThreshold === 2 ? '本局为双失败任务，需要 2 张失败牌才会失败' : '本局为普通任务，1 张失败牌即可失败'}
              </div>
            </motion.div>
            <div className="w-full max-w-md space-y-5">
              <ResultCardSpread image="/mission_success.png" label="成功牌" count={successCount} />
              <ResultCardSpread image="/mission_fail.png" label="失败牌" count={failCount} />
            </div>
            {isOnlineMode && (
              <motion.div
                className="w-full max-w-md rounded-lg border border-gold/25 bg-black/25 px-4 py-3 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.35 }}
              >
                <div className="text-[11px] tracking-[0.3em] text-gold/75">线上揭示</div>
                <div className="mt-2 text-sm tracking-[0.2em] text-inkMuted">
                  {isHost
                    ? `结果展示后将自动继续${autoSeconds > 0 ? ` · ${autoSeconds}s` : ''}`
                    : '等待房主在结果展示后自动继续'}
                </div>
              </motion.div>
            )}
          </>
        ) : onTeam ? (
          !myVote ? (
            <>
              <div className="text-inkMuted text-xs tracking-[0.3em]">请投出你的密封</div>
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <VoteCard
                  image="/mission_success.png"
                  label="成功"
                  hint="推动任务完成"
                  accentClass="border-goodGreen/70"
                  onClick={() => vote('success')}
                />
                <VoteCard
                  image="/mission_fail.png"
                  label="失败"
                  hint={isEvil ? '暗中破坏任务' : '仅坏人可投'}
                  accentClass="border-evilRed/70"
                  disabled={!isEvil}
                  onClick={() => vote('fail')}
                />
              </div>
              {!isEvil && <div className="text-[11px] text-inkMuted tracking-widest">好人只能投成功</div>}
              {failThreshold === 2 && (
                <div className="text-[11px] text-goldBright tracking-widest text-center">
                  本局需要 2 张失败牌才会判定任务失败
                </div>
              )}
            </>
          ) : (
            <div className="text-goldBright font-display text-xl tracking-[0.3em]">
              你已投票 · 等待 {team.length - submitted} 人
            </div>
          )
        ) : (
          <div className="text-center">
            <div className="font-display text-xl text-gold tracking-[0.3em] mb-2">骑士出征中</div>
            <div className="text-inkMuted text-xs tracking-widest">请勿交流 · 等待结果</div>
            <div className="text-goldBright mt-4">{submitted} / {team.length}</div>
          </div>
        )}
      </div>
      {isResultPhase && (
        <>
          {!isOnlineMode && (isHost ? (
            <button className="btn-primary w-full mt-4" disabled={advancing} onClick={continueNext}>
              {advancing ? '推进中…' : '· 继续 ·'}
            </button>
          ) : (
            <div className="text-center text-[11px] text-inkMuted tracking-widest mt-4">等待房主继续…</div>
          ))}
          {advanceError && <div className="text-center text-sm text-evilRed mt-3">{advanceError}</div>}
        </>
      )}
      {!!voteError && <div className="text-center text-sm text-evilRed mt-3">{voteError}</div>}
    </Shell>
  )
}
