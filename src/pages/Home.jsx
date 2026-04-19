import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ensureAuth } from '../firebase'
import { createRoom, joinRoom } from '../utils/roomApi'
import { Shell, Flourish } from '../components/ui/Layout'

export default function Home() {
  const nav = useNavigate()
  const [mode, setMode] = useState(null) // 'create' | 'join' | 'referee'
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  async function handleCreate() {
    if (!name.trim()) return
    setBusy(true); setErr(null)
    try {
      await ensureAuth()
      const roomId = await createRoom(name.trim())
      nav(`/room/${roomId}`)
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  async function handleJoin() {
    if (!name.trim() || code.trim().length !== 6) return
    setBusy(true); setErr(null)
    try {
      await ensureAuth()
      await joinRoom(code.trim().toUpperCase(), name.trim())
      nav(`/room/${code.trim().toUpperCase()}`)
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  async function handleReferee() {
    if (code.trim().length !== 6) return
    setBusy(true); setErr(null)
    try {
      await ensureAuth()
      nav(`/room/${code.trim().toUpperCase()}/referee`)
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <Shell>
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-8 pb-16">
        <div>
          <div className="text-5xl font-display text-goldBright tracking-[0.35em] drop-shadow-[0_0_20px_rgba(245,217,122,0.4)]">
            阿瓦隆
          </div>
          <div className="text-gold/70 tracking-[0.6em] text-xs mt-3">A V A L O N</div>
          <Flourish className="mt-6 w-56" />
          <p className="text-inkMuted text-xs mt-5 tracking-[0.3em]">圆桌之下，真相在火光之中</p>
        </div>

        {!mode && (
          <div className="flex flex-col gap-3 w-full">
            <button className="btn-primary" onClick={() => setMode('create')}>点燃烛火 · 创建房间</button>
            <button className="btn-ghost" onClick={() => setMode('join')}>加入圆桌</button>
            <button className="btn-ghost" onClick={() => setMode('referee')}>以司仪身份加入</button>
          </div>
        )}

        {mode === 'create' && (
          <div className="w-full flex flex-col gap-3">
            <input className="input-themed" placeholder="你的名字" value={name} onChange={e => setName(e.target.value)} maxLength={12} />
            <button className="btn-primary" disabled={busy || !name.trim()} onClick={handleCreate}>· 创建房间 ·</button>
            <button className="btn-ghost" onClick={() => setMode(null)}>返回</button>
          </div>
        )}

        {mode === 'join' && (
          <div className="w-full flex flex-col gap-3">
            <input className="input-themed" placeholder="你的名字" value={name} onChange={e => setName(e.target.value)} maxLength={12} />
            <input className="input-themed uppercase" placeholder="六位房间码" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} />
            <button className="btn-primary" disabled={busy || !name.trim() || code.length !== 6} onClick={handleJoin}>· 加入 ·</button>
            <button className="btn-ghost" onClick={() => setMode(null)}>返回</button>
          </div>
        )}

        {mode === 'referee' && (
          <div className="w-full flex flex-col gap-3">
            <div className="text-inkMuted text-xs tracking-[0.3em]">以司仪大屏身份进入，仅旁观，不参与游戏</div>
            <input className="input-themed uppercase" placeholder="六位房间码" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} />
            <button className="btn-primary" disabled={busy || code.length !== 6} onClick={handleReferee}>· 进入圆桌之眼 ·</button>
            <button className="btn-ghost" onClick={() => setMode(null)}>返回</button>
          </div>
        )}

        {err && <div className="text-evilRed text-sm tracking-widest">{err}</div>}
      </div>
    </Shell>
  )
}
