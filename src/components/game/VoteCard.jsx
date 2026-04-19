import AlphaFitImage from './AlphaFitImage'

export default function VoteCard({
  image,
  label,
  hint,
  accentClass = '',
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-lg border border-gold/40 bg-black/25 p-2 transition
                  disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-[1px] ${accentClass}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-black/30">
        <AlphaFitImage
          src={image}
          alt={label}
          className="transition duration-300 group-active:scale-[0.985]"
        />
      </div>
      <div className="px-2 pt-3 pb-2 text-center">
        <div className="font-display text-base tracking-[0.28em] text-goldBright">{label}</div>
        {hint && <div className="mt-1 text-[11px] tracking-[0.2em] text-inkMuted">{hint}</div>}
      </div>
    </button>
  )
}
