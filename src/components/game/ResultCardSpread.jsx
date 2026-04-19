import { motion } from 'framer-motion'
import AlphaFitImage from './AlphaFitImage'

function RevealedCard({ image, label, rotation, index, cardWidth }) {
  return (
    <motion.div
      className="relative [perspective:1200px]"
      style={{ width: cardWidth }}
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.16, duration: 0.3, ease: 'easeOut' }}
    >
      <motion.div
        className="relative aspect-[3/4] w-full [transform-style:preserve-3d]"
        initial={{ rotateY: 0, rotateZ: 0 }}
        animate={{ rotateY: 180, rotateZ: rotation }}
        transition={{
          rotateY: { delay: index * 0.16 + 0.18, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          rotateZ: { delay: index * 0.16 + 0.18, duration: 0.45, ease: 'easeOut' },
        }}
      >
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-lg border border-gold/45 shadow-card overflow-hidden
                        bg-[radial-gradient(ellipse_at_50%_30%,rgba(201,168,76,0.22),transparent_70%),linear-gradient(160deg,#1f1a2e,#07060f)]">
          <div className="flex h-full flex-col items-center justify-center">
            <div className="text-3xl text-goldBright drop-shadow-[0_0_14px_rgba(245,217,122,0.45)]">⚜</div>
            <div className="mt-3 text-[10px] tracking-[0.45em] text-gold/80">A V A L O N</div>
          </div>
        </div>

        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]
                        rounded-lg border border-gold/35 bg-black/20 p-1.5 shadow-card">
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-md bg-black/30">
            <AlphaFitImage src={image} alt={label} className="w-full h-full" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ResultCardSpread({ image, label, count, compact = false }) {
  if (!count) return null

  const cardWidth = compact ? 64 : 96

  return (
    <div className="w-full">
      <div className="mb-3 text-center text-xs tracking-[0.3em] text-inkMuted">{label} × {count}</div>
      <div className={`flex flex-wrap justify-center ${compact ? 'gap-2' : 'gap-3'}`}>
        {Array.from({ length: count }, (_, i) => (
          <RevealedCard
            key={`${label}-${i}`}
            image={image}
            label={label}
            index={i}
            rotation={(i - (count - 1) / 2) * 3}
            cardWidth={cardWidth}
          />
        ))}
      </div>
    </div>
  )
}
