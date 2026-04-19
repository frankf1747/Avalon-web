export const QUEST_PLAYER_COUNT = {
  5:  [2, 3, 2, 3, 3],
  6:  [2, 3, 4, 3, 4],
  7:  [2, 3, 3, 4, 4],
  8:  [3, 4, 4, 5, 5],
  9:  [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
}

// For 7+ players, quest #4 (index 3) requires two failures to fail.
export const DOUBLE_FAIL_COUNTS = new Set([7, 8, 9, 10])

export function failsRequired(playerCount, questIndex) {
  return DOUBLE_FAIL_COUNTS.has(playerCount) && questIndex === 3 ? 2 : 1
}
