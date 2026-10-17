import { useMemo } from 'react'
import { submitLady, closeLady } from '../utils/roomApi'
import { Shell, Flourish } from '../components/ui/Layout'
import { useT } from '../i18n'

export default function Lady({ room, me }) {
  const t = useT()
  const holder = room.game.ladyHolderUid
  const isHolder = holder === me?.uid
  const used = room.game.usedLadyUids || []
  const players = useMemo(
    () => Object.entries(room.players).map(([uid, p]) => ({ uid, ...p })).sort((a, b) => a.order - b.order),
    [room.players]
  )
  const eligible = players.filter(p => p.uid !== holder && !used.includes(p.uid))

  const target = room.game.ladyTarget
  const result = room.game.ladyResult

  return (
    <Shell title={t('lady.title')}>
      <Flourish />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🜄</div>
        <div className="font-display text-xl text-goldBright tracking-[0.3em]">{room.players[holder]?.name}</div>
        <div className="text-xs text-inkMuted tracking-[0.3em]">{t('lady.holds')}</div>

        {!target ? (
          isHolder ? (
            <div className="w-full flex flex-col gap-2 mt-4">
              <div className="text-xs text-inkMuted tracking-widest text-center">{t('lady.choose')}</div>
              {eligible.map(p => (
                <button key={p.uid} className="btn-ghost" onClick={() => submitLady(room.id, p.uid)}>{p.name}</button>
              ))}
            </div>
          ) : (
            <div className="text-inkMuted text-xs tracking-widest">{t('lady.waiting')}</div>
          )
        ) : (
          <>
            {isHolder ? (
              <div className="card-themed text-center w-64">
                <div className="text-xs text-inkMuted tracking-[0.3em]">{t('lady.result')}</div>
                <div className="mt-2 text-lg text-goldBright">{room.players[target]?.name}</div>
                <div className={`mt-1 font-display text-2xl tracking-[0.3em] ${result === 'evil' ? 'text-evilRed' : 'text-goodGreen'}`}>
                  {result === 'evil' ? t('side.evil') : t('side.good')}
                </div>
              </div>
            ) : (
              <div className="text-inkMuted text-xs tracking-widest">{t('lady.done')}</div>
            )}
            {isHolder && (
              <button className="btn-primary mt-4" onClick={() => closeLady(room.id)}>{t('lady.pass')}</button>
            )}
          </>
        )}
      </div>
    </Shell>
  )
}
