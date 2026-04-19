import { useEffect, useMemo, useState } from 'react'
import { buildNightSteps } from '../constants/nightScript'
import { advanceToDiscuss } from '../utils/roomApi'
import { narrate, stopNarration, chime } from '../utils/audio'
import { Shell } from '../components/ui/Layout'

export default function Night({ room, me }) {
  const isHost = me?.uid === room.hostUid
  const script = useMemo(() => buildNightSteps(room.config.roles), [room.config.roles])
  const [idx, setIdx] = useState(0)
  const step = script[idx]
  const [remaining, setRemaining] = useState(step.countdown)

  useEffect(() => {
    if (!isHost) return
    narrate({ audio: step.audio, text: step.text })
    chime(440)
    setRemaining(step.countdown)
    return () => stopNarration()
  }, [idx, isHost])

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
      setIdx(i => i + 1)
    }
  }

  if (!isHost) {
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          <div className="text-7xl animate-flicker">🕯</div>
          <div className="font-display text-2xl text-goldBright tracking-[0.4em]">闭眼聆听</div>
          <div className="text-inkMuted text-xs tracking-[0.3em] max-w-xs">
            请闭上双眼，跟随司仪引导。<br />游戏开始时本页将自动跳转。
          </div>
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
