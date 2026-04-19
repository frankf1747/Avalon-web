export function PlayerPicker({ players, selected, onToggle, max, disabled }) {
  return (
    <div className="flex flex-col gap-2">
      {players.map(p => {
        const chosen = selected.includes(p.uid)
        const atMax = !chosen && selected.length >= max
        return (
          <button key={p.uid}
            disabled={disabled || atMax}
            onClick={() => onToggle(p.uid)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-sm border transition
              ${chosen ? 'border-goldBright bg-goldBright/15' : 'border-gold/30 bg-black/25'}
              ${(disabled || atMax) ? 'opacity-50' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-goldBright text-night flex items-center justify-center font-display text-sm">
              {p.name.slice(0, 1)}
            </div>
            <div className="flex-1 text-left text-sm">{p.name}</div>
            {chosen && <span className="text-[11px] text-goldBright tracking-widest">✓ 出征</span>}
          </button>
        )
      })}
    </div>
  )
}
