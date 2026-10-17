import { useEffect, useMemo, useState } from 'react'
import { buildNightSteps } from '../constants/nightScript'
import { ROLES } from '../constants/roles'
import { advanceToDiscuss, setNightStep } from '../utils/roomApi'
import { narrate, stopNarration, chime } from '../utils/audio'
import { Shell } from '../components/ui/Layout'
import { useT } from '../i18n'

const STEP_KEYS = ['evil_open', 'evil_close', 'merlin_open', 'merlin_close', 'percival_open', 'percival_close', 'all_open']

function getStepMeta(stepKey, t) {
  const k = STEP_KEYS.includes(stepKey) ? stepKey : 'default'
  return { phase: t(`nightMeta.${k}.phase`), hint: t(`nightMeta.${k}.hint`) }
}

function PlayerBadge({ name, tone = 'gold' }) {
  const t = useT()
  const toneClass = tone === 'evil'
    ? 'border-evilRed/40 bg-evilRed/10 text-evilRed'
    : tone === 'good'
      ? 'border-goodGreen/40 bg-goodGreen/10 text-goodGreen'
      : 'border-gold/30 bg-black/20 text-goldBright'

  return (
    <div className={`rounded-md border px-3 py-3 text-center ${toneClass}`}>
      <div className="text-[10px] tracking-[0.28em] opacity-70">{t('common.player')}</div>
      <div className="mt-2 font-display text-lg tracking-[0.12em]">{name}</div>
    </div>
  )
}

function getNightPrompt(stepKey, secret, visiblePlayers, t) {
  if (!secret) return null

  if (stepKey === 'evil_open' && ['mordred', 'morgana', 'assassin', 'minion'].includes(secret.role)) {
    return {
      title: t('np.evilTitle'),
      detail: visiblePlayers.length ? t('np.evilDetail') : t('np.evilNone'),
      listTitle: t('np.evilList'),
      tone: 'evil',
    }
  }

  if (stepKey === 'evil_close' && ['mordred', 'morgana', 'assassin', 'minion'].includes(secret.role)) {
    return { title: t('np.waitTitle'), detail: t('np.evilDone') }
  }

  if (stepKey === 'merlin_open' && secret.role === 'merlin') {
    return {
      title: t('np.merlinTitle'),
      detail: visiblePlayers.length ? t('np.merlinDetail') : t('np.merlinNone'),
      listTitle: t('np.merlinList'),
      tone: 'evil',
    }
  }

  if (stepKey === 'merlin_close' && secret.role === 'merlin') {
    return { title: t('np.waitTitle'), detail: t('np.merlinDone') }
  }

  if (stepKey === 'percival_open' && secret.role === 'percival') {
    return {
      title: t('np.percivalTitle'),
      detail: visiblePlayers.length ? t('np.percivalDetail') : t('np.percivalNone'),
      listTitle: t('np.percivalList'),
      tone: 'gold',
    }
  }

  if (stepKey === 'percival_close' && secret.role === 'percival') {
    return { title: t('np.waitTitle'), detail: t('np.percivalDone') }
  }

  if (stepKey === 'all_open') {
    return { title: t('np.dawnTitle'), detail: t('np.dawnDetail') }
  }

  return null
}

function NightInfoCard({ role, roleId, prompt, step, visiblePlayers, remaining }) {
  const t = useT()
  const roleName = roleId ? t(`role.${roleId}`) : t('night.unknown')
  return (
    <div className="w-full max-w-sm card-themed !p-0 overflow-hidden text-left">
      <div className="border-b border-gold/20 bg-black/20 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-md border border-gold/25 bg-black/30">
              {role?.image ? (
                <img src={role.image} alt={roleName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-goldBright">⚜</div>
              )}
            </div>
            <div>
              <div className="text-[11px] tracking-[0.3em] text-gold/70">{t('night.yourRole')}</div>
              <div className="mt-2 font-display text-2xl tracking-[0.12em] text-goldBright">
                {roleName}
              </div>
              <div className={`mt-1 text-[11px] tracking-[0.26em] ${role?.side === 'evil' ? 'text-evilRed' : 'text-goodGreen'}`}>
                {role?.side === 'evil' ? t('side.evilTeam') : t('side.goodTeam')}
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
          {prompt?.listTitle || t('night.status')}
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
              {t('night.noVisible')}
            </div>
          )
        ) : (
          <div className="mt-3 rounded-md border border-gold/20 bg-black/15 px-4 py-4 text-sm leading-7 tracking-[0.1em] text-inkMuted">
            {step.key === 'all_open' ? t('night.dawnSoon') : t('night.nothingToView')}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Night({ room, me, secret }) {
  const t = useT()
  const isHost = me?.uid === room.hostUid
  const script = useMemo(
    () => buildNightSteps(room.config.roles, room.config.playMode || 'local', t),
    [room.config.playMode, room.config.roles, t]
  )
  const idx = Math.min(room.game?.nightStepIndex ?? 0, script.length - 1)
  const step = script[idx]
  const visiblePlayers = useMemo(
    () => (secret?.visibleUids || []).map(uid => room.players[uid]).filter(Boolean),
    [room.players, secret]
  )
  const prompt = useMemo(
    () => getNightPrompt(step?.key, secret, visiblePlayers, t),
    [secret, step?.key, visiblePlayers, t]
  )
  const stepMeta = useMemo(() => getStepMeta(step?.key, t), [step?.key, t])
  const role = ROLES[secret?.role]
  const [remaining, setRemaining] = useState(step.countdown)

  useEffect(() => {
    if (!isHost) return
    narrate({ audio: step.audio, text: step.text, lang: t.lang })
    chime(440)
    setRemaining(step.countdown)
    return () => stopNarration()
  }, [idx, isHost, step.audio, step.countdown, step.text, t.lang])

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
              {prompt ? prompt.title : t('night.closeEyes')}
            </div>
            <div className="mt-3 text-[15px] leading-7 tracking-[0.12em] text-inkMuted">
              {prompt ? prompt.detail : <>{t('night.closeEyesDetail1')}<br />{t('night.closeEyesDetail2')}</>}
            </div>
          </div>
          <NightInfoCard role={role} roleId={secret?.role} prompt={prompt} step={step} visiblePlayers={visiblePlayers} remaining={remaining} />
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="flex items-center justify-between text-xs tracking-[0.3em] text-inkMuted">
        <span>{t('night.narrator')}</span>
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
        {prompt && (
          <NightInfoCard role={role} roleId={secret?.role} prompt={prompt} step={step} visiblePlayers={visiblePlayers} remaining={remaining} />
        )}
      </div>
      <button className="btn-primary w-full" onClick={next}>
        {idx >= script.length - 1 ? t('night.dawnBtn') : t('night.nextBtn')}
      </button>
    </Shell>
  )
}
