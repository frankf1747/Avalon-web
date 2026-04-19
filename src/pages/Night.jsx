import { useEffect, useMemo, useState } from 'react'
import { buildNightSteps } from '../constants/nightScript'
import { ROLES } from '../constants/roles'
import { advanceToDiscuss, setNightStep } from '../utils/roomApi'
import { narrate, stopNarration, chime } from '../utils/audio'
import { Shell } from '../components/ui/Layout'

function getNightPrompt(stepKey, secret, visiblePlayers) {
  if (!secret) return null

  if (stepKey === 'evil_open' && ['mordred', 'morgana', 'assassin', 'minion'].includes(secret.role)) {
    return {
      title: '现在轮到你睁眼',
      detail: visiblePlayers.length ? `你会看到：${visiblePlayers.map(p => p.name).join('、')}` : '你现在不会看到奥伯伦。',
    }
  }

  if (stepKey === 'evil_close' && ['mordred', 'morgana', 'assassin', 'minion'].includes(secret.role)) {
    return { title: '请闭眼', detail: '坏人互认已经结束，保持安静等待下一段引导。' }
  }

  if (stepKey === 'merlin_open' && secret.role === 'merlin') {
    return {
      title: '现在轮到梅林睁眼',
      detail: visiblePlayers.length ? `你能识别：${visiblePlayers.map(p => p.name).join('、')}` : '本局没有可见的坏人目标。',
    }
  }

  if (stepKey === 'merlin_close' && secret.role === 'merlin') {
    return { title: '请闭眼', detail: '梅林视野已经结束。' }
  }

  if (stepKey === 'percival_open' && secret.role === 'percival') {
    return {
      title: '现在轮到派西维尔睁眼',
      detail: visiblePlayers.length ? `你会看到：${visiblePlayers.map(p => p.name).join('、')}` : '本局没有额外可见目标。',
    }
  }

  if (stepKey === 'percival_close' && secret.role === 'percival') {
    return { title: '请闭眼', detail: '派西维尔视野已经结束。' }
  }

  if (stepKey === 'all_open') {
    return { title: '天亮了', detail: '所有人请睁眼，准备进入讨论。' }
  }

  return null
}

export default function Night({ room, me, secret }) {
  const isHost = me?.uid === room.hostUid
  const script = useMemo(
    () => buildNightSteps(room.config.roles, room.config.playMode || 'local'),
    [room.config.playMode, room.config.roles]
  )
  const idx = Math.min(room.game?.nightStepIndex ?? 0, script.length - 1)
  const step = script[idx]
  const visiblePlayers = useMemo(
    () => (secret?.visibleUids || []).map(uid => room.players[uid]).filter(Boolean),
    [room.players, secret]
  )
  const prompt = useMemo(
    () => getNightPrompt(step?.key, secret, visiblePlayers),
    [secret, step?.key, visiblePlayers]
  )
  const [remaining, setRemaining] = useState(step.countdown)

  useEffect(() => {
    if (!isHost) return
    narrate({ audio: step.audio, text: step.text })
    chime(440)
    setRemaining(step.countdown)
    return () => stopNarration()
  }, [idx, isHost, step.audio, step.countdown, step.text])

  useEffect(() => {
    setRemaining(step.countdown)
  }, [step.countdown])

  useEffect(() => {
    if (!isHost || remaining <= 0) return
    const t = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining, isHost])

  function next() {
    if (idx >= script.length - 1) {
      stopNarration()
      advanceToDiscuss(room.id)
    } else {
      setNightStep(room.id, idx + 1)
    }
  }

  if (!isHost) {
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          <div className="text-7xl animate-flicker">🕯</div>
          <div className="font-display text-2xl text-goldBright tracking-[0.4em]">
            {prompt ? prompt.title : '闭眼聆听'}
          </div>
          <div className="text-inkMuted text-xs tracking-[0.3em] max-w-xs leading-relaxed">
            {prompt ? prompt.detail : <>请闭上双眼，跟随司仪引导。<br />游戏开始时本页将自动跳转。</>}
          </div>
          {prompt && secret && step.key !== 'all_open' && (
            <div className="w-full card-themed !p-4 text-left max-w-sm">
              <div className="text-[11px] tracking-[0.3em] text-gold/70">你的身份</div>
              <div className="mt-2 font-display text-xl text-goldBright tracking-[0.2em]">
                {ROLES[secret.role]?.name || secret.role}
              </div>
              {visiblePlayers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {visiblePlayers.map((player) => (
                    <span key={player.name} className="chip border-gold/50 text-goldBright">{player.name}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="flex items-center justify-between text-xs tracking-[0.3em] text-inkMuted">
        <span>司仪引导</span>
        <span>{idx + 1} / {script.length}</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <div className="text-6xl animate-flicker">🕯</div>
        <div key={idx} className="font-display text-2xl text-goldBright tracking-[0.2em] leading-relaxed animate-fadeUp
                                   drop-shadow-[0_0_20px_rgba(245,217,122,0.4)] px-4">
          {step.text}
        </div>
        {step.countdown > 0 && (
          <div className="font-mono text-5xl text-gold tracking-widest">{remaining}</div>
        )}
      </div>
      <button className="btn-primary w-full" onClick={next}>
        {idx >= script.length - 1 ? '· 迎来黎明 ·' : '· 下一步 ·'}
      </button>
    </Shell>
  )
}
