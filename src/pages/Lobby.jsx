import { useMemo } from 'react'
import { ROLES, ROLE_ORDER, STANDARD_SETUPS } from '../constants/roles'
import { updateRoomConfig, leaveRoom, startGame, addDebugBot, removePlayer } from '../utils/roomApi'
import { Shell, Flourish } from '../components/ui/Layout'

const STACKABLE = new Set(['loyal', 'minion'])

export default function Lobby({ room, me, onLeave }) {
  const isHost = me?.uid === room.hostUid
  const players = useMemo(
    () => Object.entries(room.players).map(([uid, p]) => ({ uid, ...p })).sort((a, b) => a.order - b.order),
    [room.players]
  )
  const count = players.length
  const setup = STANDARD_SETUPS[count]
  const selected = room.config.roles
  const goodN = selected.filter(r => ROLES[r].side === 'good').length
  const evilN = selected.filter(r => ROLES[r].side === 'evil').length
  const totalMatch = setup && selected.length === count
  const sideMatch = setup && goodN === setup.good && evilN === setup.evil
  const canStart = setup && totalMatch && sideMatch

  function setRoles(roles) { updateRoomConfig(room.id, { 'config.roles': roles }) }
  function setCount(rid, n) {
    if (!isHost) return
    const others = selected.filter(r => r !== rid)
    setRoles([...others, ...Array(Math.max(0, n)).fill(rid)])
  }
  function toggle(rid) {
    if (!isHost) return
    const has = selected.includes(rid)
    setRoles(has ? selected.filter(r => r !== rid) : [...selected, rid])
  }
  function useSuggested() { if (isHost && setup) setRoles(setup.suggested.slice()) }
  function toggleLady(v) { if (isHost) updateRoomConfig(room.id, { 'config.useLadyOfLake': v }) }
  function setPlayMode(playMode) { if (isHost) updateRoomConfig(room.id, { 'config.playMode': playMode }) }

  async function handleLeave() { await leaveRoom(room.id); onLeave() }
  async function handleStart() { try { await startGame(room.id) } catch (e) { alert(e.message) } }

  return (
    <Shell title="圆桌大厅" back={handleLeave}>
      <div className="text-center mb-5">
        <div className="text-inkMuted text-xs tracking-[0.4em]">房间号</div>
        <div className="text-goldBright font-mono text-4xl tracking-[0.4em] mt-1 font-semibold">{room.id}</div>
      </div>

      <Flourish />
      <div className="mt-4 mb-2 flex items-center justify-between">
        <span className="text-xs tracking-[0.3em] text-gold/80">玩家 ({count}/10)</span>
        {isHost && (
          <button className="text-xs text-goldBright tracking-widest underline decoration-gold/40 disabled:opacity-30"
                  disabled={count >= 10} onClick={() => addDebugBot(room.id)}>+ 添加 bot（调试）</button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {players.map(p => (
          <div key={p.uid} className="card-themed !p-2.5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-goldBright text-night flex items-center justify-center font-display text-sm shrink-0">
              {p.name.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate flex items-center gap-1">
                {p.name}
                {p.isBot && <span className="text-[9px] text-inkMuted tracking-widest">BOT</span>}
              </div>
              {p.isHost && <div className="text-[10px] text-goldBright tracking-widest">主持</div>}
            </div>
            {isHost && p.uid !== me.uid && (
              <button onClick={() => removePlayer(room.id, p.uid)}
                      className="text-evilRed/70 text-lg leading-none px-1">×</button>
            )}
          </div>
        ))}
      </div>

      <Flourish className="mt-6" />
      <div className="mt-4 mb-2 flex items-center justify-between">
        <span className="text-xs tracking-[0.3em] text-gold/80">角色配置</span>
        {isHost && setup && (
          <button className="text-xs text-goldBright tracking-widest underline decoration-gold/40" onClick={useSuggested}>使用推荐</button>
        )}
      </div>
      <div className="text-[11px] tracking-widest mb-3">
        {setup ? (
          <span className={sideMatch && totalMatch ? 'text-goodGreen' : 'text-evilRed'}>
            建议 好{setup.good} / 坏{setup.evil} · 当前 好{goodN} / 坏{evilN} · {selected.length}/{count}
          </span>
        ) : (
          <span className="text-evilRed">人数不足（需 5–10）</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {ROLE_ORDER.map(rid => {
          const role = ROLES[rid]
          const n = selected.filter(r => r === rid).length
          const evil = role.side === 'evil'
          const stackable = STACKABLE.has(rid)
          return (
            <div key={rid} className={`flex items-center gap-3 px-3 py-2 rounded-sm border
              ${n > 0 ? (evil ? 'border-evilRed/70 bg-evilRed/10' : 'border-goodGreen/70 bg-goodGreen/10') : 'border-gold/20 bg-black/20'}`}>
              <div className={`w-1.5 h-8 rounded ${evil ? 'bg-evilRed' : 'bg-goodGreen'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm">{role.name}</div>
                <div className="text-[10px] text-inkMuted truncate">{role.description}</div>
              </div>
              {stackable ? (
                <div className="flex items-center gap-2">
                  <button disabled={!isHost || n <= 0}
                          onClick={() => setCount(rid, n - 1)}
                          className="w-9 h-9 rounded-sm border border-gold/40 text-goldBright text-lg disabled:opacity-30 active:bg-gold/20">−</button>
                  <div className="w-7 text-center font-display text-lg text-goldBright">{n}</div>
                  <button disabled={!isHost}
                          onClick={() => setCount(rid, n + 1)}
                          className="w-9 h-9 rounded-sm border border-gold/40 text-goldBright text-lg disabled:opacity-30 active:bg-gold/20">+</button>
                </div>
              ) : (
                <button disabled={!isHost} onClick={() => toggle(rid)}
                        className={`w-12 h-7 rounded-full border border-gold/50 relative transition disabled:opacity-30
                          ${n > 0 ? 'bg-gold/30' : 'bg-black/30'}`}>
                  <div className={`w-5 h-5 bg-goldBright rounded-full absolute top-0.5 transition ${n > 0 ? 'left-6' : 'left-0.5'}`} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-5 card-themed flex items-center justify-between">
        <div>
          <div className="text-sm">湖中女神</div>
          <div className="text-[11px] text-inkMuted">建议 7+ 人启用</div>
        </div>
        <button
          onClick={() => toggleLady(!room.config.useLadyOfLake)}
          disabled={!isHost}
          className={`w-12 h-7 rounded-full border border-gold/50 relative transition disabled:opacity-30 ${room.config.useLadyOfLake ? 'bg-gold/30' : 'bg-black/30'}`}>
          <div className={`w-5 h-5 bg-goldBright rounded-full absolute top-0.5 transition ${room.config.useLadyOfLake ? 'left-6' : 'left-0.5'}`} />
        </button>
      </div>

      <div className="mt-4 card-themed">
        <div className="text-sm">游玩方式</div>
        <div className="text-[11px] text-inkMuted mt-1">线上模式会提供更多个人提示，并自动播放任务结果揭示</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            disabled={!isHost}
            onClick={() => setPlayMode('local')}
            className={`rounded-sm border px-3 py-3 text-sm tracking-[0.2em] transition disabled:opacity-30 ${
              (room.config.playMode || 'local') === 'local'
                ? 'border-goldBright bg-goldBright/15 text-goldBright'
                : 'border-gold/25 bg-black/20 text-inkMuted'
            }`}
          >
            线下同屏
          </button>
          <button
            disabled={!isHost}
            onClick={() => setPlayMode('online')}
            className={`rounded-sm border px-3 py-3 text-sm tracking-[0.2em] transition disabled:opacity-30 ${
              room.config.playMode === 'online'
                ? 'border-sky-300 bg-sky-300/12 text-sky-200'
                : 'border-gold/25 bg-black/20 text-inkMuted'
            }`}
          >
            线上游玩
          </button>
        </div>
      </div>

      <div className="mt-auto pt-6">
        {isHost ? (
          <button className="btn-primary w-full" onClick={handleStart} disabled={!canStart}>· 开始游戏 ·</button>
        ) : (
          <div className="text-center text-inkMuted text-xs tracking-[0.3em]">等待房主开始…</div>
        )}
      </div>
    </Shell>
  )
}
