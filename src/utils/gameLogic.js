import { QUEST_PLAYER_COUNT, failsRequired } from '../constants/questConfig'

export function initQuests(playerCount) {
  const sizes = QUEST_PLAYER_COUNT[playerCount] || QUEST_PLAYER_COUNT[5]
  return sizes.map((n, i) => ({
    index: i, requiredPlayers: n,
    team: [], approveVotes: {}, missionVotes: {},
    result: null, rejections: [],
  }))
}

export function nextLeaderIndex(currentIndex, playerCount) {
  return (currentIndex + 1) % playerCount
}

// approveVotes: { uid: 'approve' | 'reject' }
export function tallyApproval(approveVotes) {
  const vals = Object.values(approveVotes)
  const approve = vals.filter(v => v === 'approve').length
  const reject = vals.filter(v => v === 'reject').length
  return { approve, reject, passed: approve > reject }
}

// missionVotes: { uid: 'success' | 'fail' }
export function resolveMission(missionVotes, playerCount, questIndex) {
  const fails = Object.values(missionVotes).filter(v => v === 'fail').length
  const needed = failsRequired(playerCount, questIndex)
  return { fails, success: fails < needed }
}

export function checkWinner(quests, rejectedCount) {
  const successes = quests.filter(q => q.result === 'success').length
  const failures = quests.filter(q => q.result === 'fail').length
  if (failures >= 3) return 'evil'
  if (rejectedCount >= 5) return 'evil'
  if (successes >= 3) return 'good_pending_assassin'
  return null
}
