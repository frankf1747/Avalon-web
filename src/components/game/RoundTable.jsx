export default function RoundTable({
  players,
  leaderIdx,
  currentSpeakerIdx = null,
  nominatedUids = [],
  phase,
  centerTitle = '圆桌',
  centerSubtitle = '',
  size = 300,
  showLeaderLabel = true,
  showSpeakerLabel = true,
  showNominatedLabel = true,
  onSeatClick,
}) {
  const radius = size * 0.38
  const center = size / 2
  const nominated = new Set(nominatedUids)
  const activePhases = ['discuss', 'nominate', 'vote', 'voteResult']

  return (
    <div className="relative mx-auto w-fit" style={{ width: size, height: size }}>
      <div
        className="absolute rounded-full border border-gold/25 bg-[radial-gradient(circle,rgba(201,168,76,0.1),transparent_70%)]"
        style={{ inset: size * 0.16 }}
      />
      <div
        className="absolute rounded-full border border-gold/20 flex items-center justify-center"
        style={{ inset: size * 0.29 }}
      >
        <div className="px-4 text-center">
          <div className="font-display text-goldBright tracking-[0.28em]" style={{ fontSize: size * 0.065 }}>
            {centerTitle}
          </div>
          {!!centerSubtitle && (
            <div className="mt-2 text-[10px] text-inkMuted tracking-[0.25em] leading-relaxed">{centerSubtitle}</div>
          )}
        </div>
      </div>

      {players.map((p, i) => {
        const angle = (-Math.PI / 2) + (i / players.length) * Math.PI * 2
        const x = center + Math.cos(angle) * radius
        const y = center + Math.sin(angle) * radius
        const isLeader = i === leaderIdx && activePhases.includes(phase)
        const isSpeaker = phase === 'discuss' && i === currentSpeakerIdx
        const isNominated = nominated.has(p.uid)

        return (
          <div
            key={p.uid}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: x, top: y, width: 92 }}
          >
            <div
              role={onSeatClick ? 'button' : undefined}
              tabIndex={onSeatClick ? 0 : undefined}
              onClick={onSeatClick ? () => onSeatClick(p.uid) : undefined}
              onKeyDown={onSeatClick ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSeatClick(p.uid)
                }
              } : undefined}
              className={`relative flex h-16 w-16 items-center justify-center rounded-full border text-sm font-display shadow-card transition
                ${onSeatClick ? 'cursor-pointer active:scale-[0.98]' : ''}
                ${isSpeaker ? 'border-sky-300 bg-sky-300/15 text-sky-100' :
                  isLeader ? 'border-goldBright bg-goldBright/20 text-goldBright' :
                  isNominated ? 'border-goodGreen bg-goodGreen/15 text-ink' :
                  'border-gold/25 bg-black/35 text-ink'}`}
            >
              <div className="absolute inset-1 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_70%)]" />
              <span className="relative z-10 text-lg">{p.name.slice(0, 1)}</span>
              {isLeader && showLeaderLabel && <span className="absolute -top-5 text-[11px] tracking-widest text-goldBright">队长</span>}
              {isSpeaker && showSpeakerLabel && <span className="absolute -bottom-5 text-[11px] tracking-widest text-sky-300">发言</span>}
              {!isSpeaker && isNominated && showNominatedLabel && <span className="absolute -bottom-5 text-[11px] tracking-widest text-goodGreen">出征</span>}
            </div>
            <div className="mt-5 w-full text-center text-[11px] tracking-[0.08em] text-inkMuted leading-4">
              {p.name}
            </div>
          </div>
        )
      })}
    </div>
  )
}
