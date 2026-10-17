// A 7-player game, mid-way through quest 3, from Frank's (Merlin's) seat.
const NAMES = ['Frank', 'Mia', 'Leo', 'Ava', 'Sam', 'Zoe', 'Kai']
const ROLES = ['merlin', 'percival', 'loyal', 'morgana', 'assassin', 'loyal', 'mordred']
const uids = NAMES.map((_, i) => `p${i + 1}`)

const at = (min) => ({ toDate: () => new Date(2026, 9, 16, 20, min, 12) })
const ev = (id, min, i18n, data = {}) => ({ id: `e${id}`, type: 'demo', message: '', data: { i18n, ...data }, timestamp: at(min) })

export function buildScenario(screen) {
  const players = Object.fromEntries(uids.map((uid, i) => [uid, {
    name: NAMES[i], isHost: i === 0, isReady: screen === 'lobby' ? false : i !== 3, order: i, joinedAt: i,
  }]))
  const assignment = Object.fromEntries(uids.map((uid, i) => [uid, ROLES[i]]))

  const room = {
    id: 'K7M2QX',
    hostUid: 'p1',
    phase: screen === 'referee' ? 'vote' : screen === 'mission' ? 'missionResult' : screen === 'reveal' ? 'roleReveal' : screen,
    players,
    assignment,
    config: { roles: ['merlin', 'percival', 'loyal', 'loyal', 'mordred', 'morgana', 'assassin'], useLadyOfLake: true, playMode: 'local' },
    game: {
      currentQuest: 2, currentLeaderIndex: 2, rejectedCount: 1, roundId: 1,
      ladyHolderUid: 'p6', usedLadyUids: [], nominatedTeam: ['p1', 'p3', 'p5'],
      winner: 'good', assassinTarget: 'p2', ladyTarget: null, ladyResult: null,
      currentSpeakerIndex: 4, discussionCount: 2, nightStepIndex: 3, endRevealOpen: true,
    },
    quests: [
      { team: ['p2', 'p3'], approveVotes: {}, missionVotes: {}, result: 'success' },
      { team: ['p1', 'p4', 'p6'], approveVotes: {}, missionVotes: {}, result: 'fail' },
      {
        team: ['p1', 'p3', 'p5'],
        approveVotes: screen === 'referee' || screen === 'vote' ? { p2: 'approve', p4: 'reject', p5: 'approve', p7: 'approve' } : {},
        missionVotes: { p1: 'success', p3: 'success', p5: 'fail' },
        result: null,
      },
      { team: [], approveVotes: {}, missionVotes: {} },
      { team: [], approveVotes: {}, missionVotes: {} },
    ],
  }

  if (screen === 'mission') {
    // Quest 4 with 7 players needs two fail cards: one saboteur isn't enough.
    room.game.currentQuest = 3
    room.quests[2].result = 'success'
    room.quests[3] = { team: ['p1', 'p2', 'p3', 'p5'], approveVotes: {}, missionVotes: { p1: 'success', p2: 'success', p3: 'success', p5: 'fail' }, result: 'success' }
  }

  if (screen === 'end') {
    room.game.currentQuest = 4
    room.quests[2].result = 'success'
    room.quests[3] = { team: ['p1', 'p2', 'p3', 'p6'], result: 'success' }
  }

  const events = [
    ev(9, 41, 'ev.nomination', { n: 3 }),
    ev(8, 38, 'ev.ladyResult'),
    ev(7, 35, 'ev.missionResult.fail', { q: 2, fails: 1 }),
    ev(6, 33, 'ev.voteResult.pass', { approve: 5, reject: 2 }),
    ev(5, 31, 'ev.voteResult.reject', { approve: 3, reject: 4 }),
    ev(4, 28, 'ev.missionResult.success', { q: 1, fails: 0 }),
    ev(3, 26, 'ev.voteResult.pass', { approve: 6, reject: 1 }),
    ev(2, 20, 'ev.gameStart'),
  ]
  if (screen === 'discuss') events.splice(0, 1)

  return {
    room,
    me: { uid: 'p1', ...players.p1 },
    secret: { role: 'merlin', visibleUids: ['p4', 'p5'], youCanSee: 'x' },
    events: screen === 'discuss' ? events.slice(0, 4) : events,
  }
}
