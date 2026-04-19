import { useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useRoom } from '../hooks/useRoom'
import { useSecret } from '../hooks/useSecret'
import { reapIfStale, triggerAssassination } from '../utils/roomApi'
import { useBotDriver } from '../hooks/useBotDriver'
import Lobby from './Lobby'
import RoleReveal from './RoleReveal'
import Night from './Night'
import Discuss from './Discuss'
import Nominate from './Nominate'
import Vote from './Vote'
import Mission from './Mission'
import Lady from './Lady'
import Assassin from './Assassin'
import End from './End'

export default function Room() {
  const { roomId } = useParams()
  const nav = useNavigate()
  const user = useAuth()
  const { room, error } = useRoom(roomId)
  const secret = useSecret(roomId, user?.uid)
  useBotDriver(room)

  useEffect(() => { if (error) console.error(error) }, [error])

  // Any connected client reaps a stale lobby (no start within 30 min) on load + every minute.
  useEffect(() => {
    if (!room) return
    reapIfStale(roomId, room)
    const t = setInterval(() => reapIfStale(roomId, room), 60_000)
    return () => clearInterval(t)
  }, [room, roomId])

  if (!user || !room) {
    return <div className="min-h-screen flex items-center justify-center text-gold tracking-widest">
      {error ? '房间不存在' : '进入圆桌…'}
    </div>
  }

  const me = { uid: user.uid, ...(room.players[user.uid] || {}) }
  const inRoom = !!room.players[user.uid]
  if (!inRoom) {
    return <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6">
      <div className="text-gold tracking-widest">你不在此房间中</div>
      <button className="btn-primary" onClick={() => nav('/')}>返回首页</button>
    </div>
  }

  const onLeave = () => nav('/')
  const phaseKey = `${room.game.roundId || 0}-${room.phase}-${room.game.currentQuest}-${room.game.currentLeaderIndex}`
  const canTriggerAssassination = secret?.role === 'assassin' && ['night', 'discuss', 'nominate', 'vote', 'voteResult', 'mission', 'missionResult', 'lady'].includes(room.phase)

  async function handleTriggerAssassination() {
    try {
      await triggerAssassination(room.id)
    } catch (e) {
      alert(e.message)
    }
  }

  let page
  switch (room.phase) {
    case 'lobby':        page = <Lobby key={phaseKey} room={room} me={me} onLeave={onLeave} />; break
    case 'roleReveal':   page = <RoleReveal key={phaseKey} room={room} me={me} secret={secret} />; break
    case 'night':        page = <Night key={phaseKey} room={room} me={me} secret={secret} />; break
    case 'discuss':      page = <Discuss key={phaseKey} room={room} me={me} />; break
    case 'nominate':     page = <Nominate key={phaseKey} room={room} me={me} />; break
    case 'vote':
    case 'voteResult':   page = <Vote key={phaseKey} room={room} me={me} />; break
    case 'mission':
    case 'missionResult': page = <Mission key={phaseKey} room={room} me={me} secret={secret} />; break
    case 'lady':         page = <Lady key={phaseKey} room={room} me={me} />; break
    case 'assassin':     page = <Assassin key={phaseKey} room={room} me={me} secret={secret} />; break
    case 'end':          page = <End key={phaseKey} room={room} me={me} onLeave={onLeave} />; break
    default:             page = <div className="p-6 text-inkMuted">未知阶段：{room.phase}</div>
  }

  return (
    <>
      {page}
      {canTriggerAssassination && (
        <button
          className="fixed right-5 bottom-5 z-20 rounded-full border border-evilRed bg-evilRed/20 px-5 py-3 text-sm tracking-[0.25em] text-evilRed shadow-card"
          onClick={handleTriggerAssassination}
        >
          · 发动刺杀 ·
        </button>
      )}
    </>
  )
}
