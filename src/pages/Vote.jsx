import { useMemo, useState } from 'react'
import { castApprovalVote, advanceResultPhaseFromRoom } from '../utils/roomApi'
import { Shell, Flourish } from '../components/ui/Layout'
import VoteCard from '../components/game/VoteCard'
import ResultCardSpread from '../components/game/ResultCardSpread'

export default function Vote({ room, me }) {
  const [advancing, setAdvancing] = useState(false)
  const [advanceError, setAdvanceError] = useState('')
  const [voteError, setVoteError] = useState('')
  const players = useMemo(
    () => Object.entries(room.players).map(([uid, p]) => ({ uid, ...p })).sort((a, b) => a.order - b.order),
    [room.players]
  )
  const qi = room.game.currentQuest
  const team = room.quests[qi]?.team || []
  const votes = room.quests[qi]?.approveVotes || {}
  const myVote = votes[me?.uid]
  const votedCount = Object.keys(votes).length
  const allIn = votedCount >= players.length
  const isResultPhase = room.phase === 'voteResult'
  const approveCount = Object.values(votes).filter(v => v === 'approve').length
  const rejectCount = Object.values(votes).filter(v => v === 'reject').length
  const passed = approveCount > rejectCount
  const isHost = me?.uid === room.hostUid
  const remainingCount = players.length - votedCount

  async function vote(v) {
    if (myVote) return
    setVoteError('')
    try {
      await castApprovalVote(room.id, v)
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

  return (
    <Shell title="全体投票">
      <div className="text-center mb-4">
        <div className="text-xs text-inkMuted tracking-[0.3em]">提名出征</div>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {team.map(uid => (
            <span key={uid} className="chip border-goldBright text-goldBright">{room.players[uid]?.name}</span>
          ))}
        </div>
      </div>
      <Flourish />

      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {!isResultPhase && !myVote ? (
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <VoteCard
              image="/nominate_success.png"
              label="赞成"
              hint="同意本轮提名"
              accentClass="border-goodGreen/70"
              onClick={() => vote('approve')}
            />
            <VoteCard
              image="/nominate_fail.png"
              label="反对"
              hint="否决本轮提名"
              accentClass="border-evilRed/70"
              onClick={() => vote('reject')}
            />
          </div>
        ) : (
          <>
            <div className="text-goldBright font-display text-xl tracking-[0.3em] text-center">
              {isResultPhase
                ? (passed ? '提名通过 · 准备进入任务' : '提名被拒 · 即将轮到下一位队长')
                : `你已投票 · 等待 ${players.length - votedCount} 人…`}
            </div>
            {isResultPhase && (
              <div className="w-full max-w-md space-y-5">
                <ResultCardSpread image="/nominate_success.png" label="赞成牌" count={approveCount} />
                <ResultCardSpread image="/nominate_fail.png" label="反对牌" count={rejectCount} />
              </div>
            )}
          </>
        )}

        {!isResultPhase && (
          <div className="w-full max-w-sm grid grid-cols-2 gap-3">
            <div className="card-themed p-4 text-center">
              <div className="text-xs tracking-[0.3em] text-inkMuted mb-2">已投票</div>
              <div className="font-display text-3xl text-goldBright">{votedCount}</div>
            </div>
            <div className="card-themed p-4 text-center">
              <div className="text-xs tracking-[0.3em] text-inkMuted mb-2">待投票</div>
              <div className="font-display text-3xl text-goldBright">{remainingCount}</div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-[11px] text-inkMuted tracking-widest mt-4">
        连续拒绝 {room.game.rejectedCount || 0} / 5
      </div>
      {!!voteError && <div className="text-center text-sm text-evilRed mt-3">{voteError}</div>}
      {isResultPhase && (
        <>
          {isHost ? (
            <button className="btn-primary w-full mt-4" disabled={advancing} onClick={continueNext}>
              {advancing ? '推进中…' : '· 继续 ·'}
            </button>
          ) : (
            <div className="text-center text-[11px] text-inkMuted tracking-widest mt-4">等待房主继续…</div>
          )}
          {advanceError && <div className="text-center text-sm text-evilRed mt-3">{advanceError}</div>}
        </>
      )}
    </Shell>
  )
}
