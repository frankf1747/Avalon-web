import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ROLES } from '../constants/roles'
import { setPlayerReady, advanceToNight } from '../utils/roomApi'
import { Shell, Flourish } from '../components/ui/Layout'

export default function RoleReveal({ room, me, secret }) {
  const [flipped, setFlipped] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const isHost = me?.uid === room.hostUid
  const allReady = Object.values(room.players).every(p => p.isReady)

  if (!secret) return <Shell><div className="flex-1 flex items-center justify-center text-inkMuted tracking-widest">正在发牌……</div></Shell>

  const role = ROLES[secret.role]
  const visiblePlayers = secret.visibleUids.map(uid => room.players[uid]).filter(Boolean)

  async function handleConfirm() {
    setConfirmed(true); setFlipped(false)
    await setPlayerReady(room.id, true)
  }

  return (
    <Shell title="身份揭示">
      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        <div className="[perspective:1200px]">
          <motion.div
            className="relative w-[min(84vw,320px)] h-[min(calc(84vw*1.5),500px)] [transform-style:preserve-3d]"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Card back */}
            <div className="absolute inset-0 [backface-visibility:hidden] rounded-lg border border-gold/60 shadow-card flex items-center justify-center
                            bg-[radial-gradient(ellipse_at_50%_30%,rgba(201,168,76,0.25),transparent_70%),linear-gradient(160deg,#1f1a2e,#07060f)]">
              <div className="flex h-full w-full flex-col items-center justify-center px-8 text-center">
                <div className="text-6xl text-goldBright drop-shadow-[0_0_20px_rgba(245,217,122,0.5)]">⚜</div>
                <div className="mt-6 flex w-full justify-center">
                  <div className="pl-[0.5em] text-goldBright font-display text-2xl tracking-[0.5em]">阿瓦隆</div>
                </div>
                <div className="text-gold/70 text-[10px] tracking-[0.6em] mt-2">A V A L O N</div>
                <Flourish className="mt-6 w-40 mx-auto" />
              </div>
            </div>

            {/* Card front */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-lg border border-gold/60 shadow-card overflow-hidden
                            bg-[linear-gradient(180deg,#1a1530,#07060f)] flex flex-col">
              <div className="flex-1 relative overflow-hidden">
                <img src={role.image} alt={role.name}
                     className="w-full h-full object-contain"
                     onError={(e) => { e.target.style.display = 'none' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-4 border-t border-gold/30">
                <div className="flex items-center gap-2">
                  <div className="text-goldBright font-display text-2xl tracking-[0.3em]">{role.name}</div>
                  <span className={`chip ${role.side === 'evil' ? 'border-evilRed text-evilRed' : 'border-goodGreen text-goodGreen'}`}>
                    {role.side === 'evil' ? '邪恶' : '正义'}
                  </span>
                </div>
                <div className="text-[12px] text-ink/90 leading-relaxed mt-2">{role.description}</div>
                {secret.youCanSee && (
                  <div className="mt-2 text-[11px] text-goldBright/90">
                    你能看到：<span className="text-ink">{secret.youCanSee}</span>
                  </div>
                )}
                {visiblePlayers.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {visiblePlayers.map(p => (
                      <span key={p.name} className="chip border-gold/50 text-goldBright">{p.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {!confirmed ? (
          <div className="flex gap-3">
            {!flipped ? (
              <button className="btn-primary" onClick={() => setFlipped(true)}>· 查看身份 ·</button>
            ) : (
              <button className="btn-primary" onClick={handleConfirm}>✓ 我已记住，确认</button>
            )}
          </div>
        ) : (
          <div className="text-inkMuted text-xs tracking-[0.3em]">
            等待其他玩家… ({Object.values(room.players).filter(p => p.isReady).length}/{Object.keys(room.players).length})
          </div>
        )}
      </div>

      {isHost && allReady && (
        <button className="btn-primary w-full mt-4" onClick={() => advanceToNight(room.id)}>
          · 进入黑夜 ·
        </button>
      )}
    </Shell>
  )
}
