import { useT } from '../../i18n'

export function QuestBadge({ state, label, size = 'md' }) {
  const t = useT()
  const dims = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-9 h-9' : 'w-11 h-11'
  const border =
    state === 'success' ? 'border-goodGreen/70 bg-goodGreen/10' :
    state === 'fail' ? 'border-evilRed/70 bg-evilRed/10' :
    state === 'current' ? 'border-goldBright text-goldBright animate-flicker bg-goldBright/10' :
    'border-gold/30 text-inkMuted bg-black/15'

  return (
    <div className={`relative ${dims} rounded-full border flex items-center justify-center overflow-hidden ${border}`}>
      {state === 'success' ? (
        <img src="/pass.png" alt={t('mission.success')} className="w-full h-full object-cover" />
      ) : state === 'fail' ? (
        <img src="/fail.png" alt={t('mission.fail')} className="w-full h-full object-cover" />
      ) : (
        <span className="font-display text-sm tracking-widest">{label}</span>
      )}
    </div>
  )
}
