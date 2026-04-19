import { useEffect, useMemo, useState } from 'react'
import { buildNightSteps } from '../constants/nightScript'
import { ROLES } from '../constants/roles'
import { advanceToDiscuss, setNightStep } from '../utils/roomApi'
import { narrate, stopNarration, chime } from '../utils/audio'
import { Shell } from '../components/ui/Layout'

function getStepMeta(stepKey) {
  if (stepKey === 'evil_open') return { phase: '坏人回合', hint: '坏人彼此确认身份。' }
  if (stepKey === 'evil_close') return { phase: '坏人结束', hint: '坏人信息确认完毕。' }
  if (stepKey === 'merlin_open') return { phase: '梅林回合', hint: '梅林查看可见的坏人。' }
  if (stepKey === 'merlin_close') return { phase: '梅林结束', hint: '梅林信息确认完毕。' }
  if (stepKey === 'percival_open') return { phase: '派西维尔回合', hint: '派西维尔查看关键目标。' }
  if (stepKey === 'percival_close') return { phase: '派西维尔结束', hint: '派西维尔信息确认完毕。' }
  if (stepKey === 'all_open') return { phase: '黎明', hint: '所有人准备回到讨论。' }
  return { phase: '夜晚', hint: '请跟随当前引导。' }
}

function PlayerBadge({ name, tone = 'gold' }) {
  const toneClass = tone === 'evil'
    ? 'border-evilRed/40 bg-evilRed/10 text-evilRed'
    : tone === 'good'
      ? 'border-goodGreen/40 bg-goodGreen/10 text-goodGreen'
      : 'border-gold/30 bg-black/20 text-goldBright'

  return (
    <div className={`rounded-md border px-3 py-3 text-center ${toneClass}`}>
      <div className="text-[10px] tracking-[0.28em] opacity-70">玩家</div>
      <div className="mt-2 font-display text-lg tracking-[0.12em]">{name}</div>
    </div>
  )
}

function getNightPrompt(stepKey, secret, visiblePlayers) {
  if (!secret) return null

  if (stepKey === 'evil_open' && ['mordred', 'morgana', 'assassin', 'minion'].includes(secret.role)) {
    return {
      title: '你的坏人队友',
      detail: visiblePlayers.length ? '以下玩家与你同阵营。' : '本局你看不到其他坏人。',
      listTitle: '队友',
      tone: 'evil',
    }
  }

  if (stepKey === 'evil_close' && ['mordred', 'morgana', 'assassin', 'minion'].includes(secret.role)) {
    return { title: '等待下一步', detail: '坏人信息已经确认完毕。' }
  }

  if (stepKey === 'merlin_open' && secret.role === 'merlin') {
    return {
      title: '你看到的坏人',
      detail: visiblePlayers.length ? '以下玩家会被你识别到。' : '本局没有可见的坏人目标。',
      listTitle: '坏人',
      tone: 'evil',
    }
  }

  if (stepKey === 'merlin_close' && secret.role === 'merlin') {
    return { title: '等待下一步', detail: '梅林信息已经确认完毕。' }
  }

  if (stepKey === 'percival_open' && secret.role === 'percival') {
    return {
      title: '你看到的目标',
      detail: visiblePlayers.length ? '以下玩家中包含梅林与莫甘娜。' : '本局没有额外可见目标。',
      listTitle: '目标',
      tone: 'gold',
    }
  }

  if (stepKey === 'percival_close' && secret.role === 'percival') {
    return { title: '等待下一步', detail: '派西维尔信息已经确认完毕。' }
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
  const stepMeta = useMemo(() => getStepMeta(step?.key), [step?.key])
  const role = ROLES[secret?.role]
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
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
          <div className="text-7xl animate-flicker">🕯</div>
          <div className="rounded-full border border-gold/20 bg-black/20 px-4 py-1.5 text-[11px] tracking-[0.35em] text-gold/70">
            {stepMeta.phase}
          </div>
          <div className="max-w-[18rem]">
            <div className="font-display text-[1.8rem] leading-[1.52] text-goldBright tracking-[0.12em] drop-shadow-[0_0_20px_rgba(245,217,122,0.35)]">
              {prompt ? prompt.title : '闭眼聆听'}
            </div>
            <div className="mt-3 text-[15px] leading-7 tracking-[0.12em] text-inkMuted">
              {prompt ? prompt.detail : <>请闭上双眼，跟随司仪引导。<br />游戏开始时本页将自动跳转。</>}
            </div>
          </div>
          <div className="w-full max-w-sm card-themed !p-0 overflow-hidden text-left">
            <div className="border-b border-gold/20 bg-black/20 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-md border border-gold/25 bg-black/30">
                    {role?.image ? (
                      <img src={role.image} alt={role.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-goldBright">⚜</div>
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] tracking-[0.3em] text-gold/70">你的身份</div>
                    <div className="mt-2 font-display text-2xl tracking-[0.12em] text-goldBright">
                      {role?.name || '未知'}
                    </div>
                    <div className={`mt-1 text-[11px] tracking-[0.26em] ${role?.side === 'evil' ? 'text-evilRed' : 'text-goodGreen'}`}>
                      {role?.side === 'evil' ? '邪恶阵营' : '正义阵营'}
                    </div>
                  </div>
                </div>
                {step.countdown > 0 && (
                  <div className="rounded-full border border-gold/25 px-3 py-1 font-mono text-xl text-goldBright">
                    {remaining}
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-4">
              <div className="text-[11px] tracking-[0.3em] text-gold/70">
                {prompt?.listTitle || '当前状态'}
              </div>
              {prompt && step.key.endsWith('_open') ? (
                visiblePlayers.length > 0 ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {visiblePlayers.map((player) => (
                      <PlayerBadge key={player.name} name={player.name} tone={prompt.tone} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-md border border-gold/20 bg-black/15 px-4 py-4 text-sm leading-7 tracking-[0.1em] text-inkMuted">
                    当前没有额外可见玩家。
                  </div>
                )
              ) : (
                <div className="mt-3 rounded-md border border-gold/20 bg-black/15 px-4 py-4 text-sm leading-7 tracking-[0.1em] text-inkMuted">
                  {step.key === 'all_open' ? '所有人即将返回讨论阶段。' : '当前阶段无需额外查看信息，请等待下一步。'}
                </div>
              )}
            </div>
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
        <div className="rounded-full border border-gold/20 bg-black/20 px-4 py-1.5 text-[11px] tracking-[0.35em] text-gold/70">
          {stepMeta.phase}
        </div>
        <div className="w-full max-w-sm card-themed !p-6">
          <div
            key={idx}
            className="font-display text-[1.8rem] leading-[1.52] text-goldBright tracking-[0.12em] animate-fadeUp
                       drop-shadow-[0_0_20px_rgba(245,217,122,0.4)]"
          >
            {step.text}
          </div>
          <div className="mt-4 text-[15px] leading-7 tracking-[0.1em] text-inkMuted">
            {stepMeta.hint}
          </div>
          {step.countdown > 0 && (
            <div className="mt-5 flex justify-center">
              <div className="rounded-full border border-gold/25 px-5 py-2 font-mono text-5xl text-gold tracking-widest">
                {remaining}
              </div>
            </div>
          )}
        </div>
      </div>
      <button className="btn-primary w-full" onClick={next}>
        {idx >= script.length - 1 ? '· 迎来黎明 ·' : '· 下一步 ·'}
      </button>
    </Shell>
  )
}
