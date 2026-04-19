import { QUEST_PLAYER_COUNT, failsRequired } from '../../constants/questConfig'
import { QuestBadge } from './QuestBadge'

export function QuestTracker({ room }) {
  const playerCount = Object.keys(room.players).length
  const sizes = QUEST_PLAYER_COUNT[playerCount] || QUEST_PLAYER_COUNT[5]
  const current = room.game.currentQuest
  return (
    <div className="flex gap-2 items-end justify-center">
      {sizes.map((n, i) => {
        const q = room.quests[i]
        const state = q?.result || (i === current ? 'current' : 'pending')
        const color =
          state === 'current' ? 'text-goldBright' : 'text-inkMuted'
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <QuestBadge state={state} label={n} />
            <div className={`text-[10px] tracking-widest ${color}`}>
              {failsRequired(playerCount, i) === 2 ? '双失败' : ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}
