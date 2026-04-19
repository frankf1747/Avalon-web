import {
  doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, addDoc, writeBatch, getDocs,
} from 'firebase/firestore'
import { db, auth } from '../firebase'
import { STANDARD_SETUPS } from '../constants/roles'
import { initQuests, nextLeaderIndex, tallyApproval, resolveMission, checkWinner } from './gameLogic'
import { buildSecrets } from './assignRoles'

const ROOMS = 'rooms'
const SECRETS = 'secrets'

function safeLogEvent(roomId, type, message, data = {}) {
  void logEvent(roomId, type, message, data)
}

function normalizeQuests(quests) {
  if (Array.isArray(quests)) return quests
  if (!quests || typeof quests !== 'object') return []
  return Object.keys(quests)
    .sort((a, b) => Number(a) - Number(b))
    .map((key, index) => ({ index, ...quests[key] }))
}

function withQuestUpdate(room, qi, updater) {
  const quests = normalizeQuests(room.quests)
  const next = quests.map((quest, index) => (
    index === qi ? updater({ ...quest }) : quest
  ))
  return next
}

function discussionStartState(leaderIndex) {
  return {
    phase: 'discuss',
    'game.nominatedTeam': [],
    'game.currentSpeakerIndex': leaderIndex,
    'game.discussionCount': 0,
    'game.nightStepIndex': 0,
  }
}

function code6() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''; for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function shuffle(arr) {
  const next = arr.slice()
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

export async function createRoom(hostName) {
  const uid = auth.currentUser.uid
  let roomId = code6()
  // Cheap collision check (one attempt is fine for a hobby app)
  const snap = await getDoc(doc(db, ROOMS, roomId))
  if (snap.exists()) roomId = code6()

  const suggested = STANDARD_SETUPS[5].suggested.slice()
  const player = { name: hostName, isHost: true, isReady: false, order: 0, joinedAt: Date.now() }
  await setDoc(doc(db, ROOMS, roomId), {
    hostUid: uid,
    phase: 'lobby',
    players: { [uid]: player },
    config: { roles: suggested, useLadyOfLake: false, playMode: 'local' },
    game: {
      currentQuest: 0, currentLeaderIndex: 0, rejectedCount: 0, roundId: 0,
      ladyHolderUid: null, usedLadyUids: [],
      nominatedTeam: [], winner: null, assassinTarget: null,
      ladyTarget: null, ladyResult: null,
      currentSpeakerIndex: 0, discussionCount: 0, nightStepIndex: 0, endRevealOpen: false,
    },
    quests: initQuests(5),
    createdAt: serverTimestamp(),
  })
  safeLogEvent(roomId, 'roomCreated', `${hostName} 创建了房间 ${roomId}`)
  return roomId
}

export async function joinRoom(roomId, name) {
  const uid = auth.currentUser.uid
  const ref = doc(db, ROOMS, roomId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('房间不存在')
  const room = snap.data()
  if (room.phase !== 'lobby' && !room.players[uid]) throw new Error('游戏已开始')
  if (room.players[uid]) return
  const count = Object.keys(room.players).length
  if (count >= 10) throw new Error('房间已满')
  const newPlayer = { name, isHost: false, isReady: false, order: count, joinedAt: Date.now() }
  const suggested = STANDARD_SETUPS[count + 1]?.suggested?.slice() || room.config.roles
  await updateDoc(ref, {
    [`players.${uid}`]: newPlayer,
    'config.roles': suggested,
    quests: initQuests(count + 1),
  })
  safeLogEvent(roomId, 'playerJoined', `${name} 加入了房间`)
}

export async function leaveRoom(roomId) {
  const uid = auth.currentUser.uid
  const ref = doc(db, ROOMS, roomId)
  const snap = await getDoc(ref); if (!snap.exists()) return
  const room = snap.data()
  const players = { ...room.players }; delete players[uid]
  const remaining = Object.keys(players).length
  if (remaining === 0) {
    // Last player out → tear down the room and its events/secrets
    await destroyRoom(roomId, Object.keys(room.players))
    return
  }
  const ordered = Object.entries(players)
    .sort((a, b) => a[1].order - b[1].order)
    .reduce((acc, [k, v], i) => ({ ...acc, [k]: { ...v, order: i } }), {})
  // If host left, promote the lowest-order remaining player
  let hostUid = room.hostUid
  if (uid === hostUid) {
    hostUid = Object.entries(ordered).sort((a, b) => a[1].order - b[1].order)[0][0]
    Object.keys(ordered).forEach(k => { ordered[k] = { ...ordered[k], isHost: k === hostUid } })
  }
  await updateDoc(ref, { players: ordered, hostUid })
}

const STALE_LOBBY_MS = 30 * 60 * 1000

// Returns true if it deleted the room.
export async function reapIfStale(roomId, room) {
  if (!room || room.phase !== 'lobby' || !room.createdAt?.toMillis) return false
  const age = Date.now() - room.createdAt.toMillis()
  if (age < STALE_LOBBY_MS) return false
  await destroyRoom(roomId, Object.keys(room.players || {}))
  return true
}

async function destroyRoom(roomId, playerUids = []) {
  try {
    const batch = writeBatch(db)
    await clearRoomEvents(roomId, batch)
    playerUids.forEach(uid => batch.delete(doc(db, SECRETS, `${roomId}_${uid}`)))
    batch.delete(doc(db, ROOMS, roomId))
    await batch.commit()
  } catch (e) { console.warn('destroyRoom partial failure', e) }
}

async function clearRoomEvents(roomId, batchMaybe) {
  const ev = await getDocs(collection(db, ROOMS, roomId, 'events'))
  const batch = batchMaybe || writeBatch(db)
  ev.forEach(d => batch.delete(d.ref))
  if (!batchMaybe) await batch.commit()
}

export async function updateRoomConfig(roomId, partial) {
  await updateDoc(doc(db, ROOMS, roomId), partial)
}

const BOT_NAMES = ['亚瑟','兰斯洛特','盖文','崔斯坦','加拉哈德','帕西法尔','凯伊','贝迪维尔','伊万']

export async function addDebugBot(roomId) {
  const ref = doc(db, ROOMS, roomId)
  const snap = await getDoc(ref); if (!snap.exists()) return
  const room = snap.data()
  const count = Object.keys(room.players).length
  if (count >= 10) return
  const used = new Set(Object.values(room.players).map(p => p.name))
  const name = BOT_NAMES.find(n => !used.has(n)) || `骑士${count + 1}`
  const botUid = `bot-${Math.random().toString(36).slice(2, 8)}`
  const newPlayer = { name, isHost: false, isReady: false, isBot: true, order: count, joinedAt: Date.now() }
  const suggested = STANDARD_SETUPS[count + 1]?.suggested?.slice() || room.config.roles
  await updateDoc(ref, {
    [`players.${botUid}`]: newPlayer,
    'config.roles': suggested,
    quests: initQuests(count + 1),
  })
}

export async function removePlayer(roomId, uid) {
  const ref = doc(db, ROOMS, roomId)
  const snap = await getDoc(ref); if (!snap.exists()) return
  const room = snap.data()
  const players = { ...room.players }; delete players[uid]
  const ordered = Object.entries(players)
    .sort((a, b) => a[1].order - b[1].order)
    .reduce((acc, [k, v], i) => ({ ...acc, [k]: { ...v, order: i } }), {})
  const count = Object.keys(ordered).length
  const suggested = STANDARD_SETUPS[count]?.suggested?.slice() || room.config.roles
  await updateDoc(ref, { players: ordered, 'config.roles': suggested, quests: initQuests(Math.max(count, 5)) })
}

export async function startGame(roomId) {
  const ref = doc(db, ROOMS, roomId)
  const snap = await getDoc(ref); if (!snap.exists()) throw new Error('房间不存在')
  const room = snap.data()
  const lobbyPlayers = Object.entries(room.players)
    .map(([uid, p]) => ({ uid, ...p }))
    .sort((a, b) => a.order - b.order)
  if (lobbyPlayers.length < 5) throw new Error('至少需要 5 人')
  if (lobbyPlayers.length !== room.config.roles.length) throw new Error('角色数与玩家数不符')

  const players = shuffle(lobbyPlayers).map((player, index) => ({ ...player, order: index }))
  const startingLeaderIndex = Math.floor(Math.random() * players.length)

  const { assignment, secrets } = buildSecrets(players, room.config.roles)

  const batch = writeBatch(db)
  for (const p of players) {
    batch.set(doc(db, SECRETS, `${roomId}_${p.uid}`), secrets[p.uid])
  }
  const ladyHolder = room.config.useLadyOfLake ? players[players.length - 1].uid : null
  const playerUpdates = {}
  for (const p of players) {
    playerUpdates[`players.${p.uid}.order`] = p.order
    playerUpdates[`players.${p.uid}.isReady`] = !!p.isBot
  }
  batch.update(ref, {
    phase: 'roleReveal',
    quests: initQuests(players.length),
    assignment, // written to room doc so referee can display at end
    'game.roundId': (room.game?.roundId || 0) + 1,
    'game.currentLeaderIndex': startingLeaderIndex,
    'game.currentQuest': 0,
    'game.rejectedCount': 0,
    'game.ladyHolderUid': ladyHolder,
    'game.usedLadyUids': [],
    'game.nightStepIndex': 0,
    'game.endRevealOpen': false,
    'game.currentSpeakerIndex': startingLeaderIndex,
    'game.discussionCount': 0,
  })
  batch.update(ref, playerUpdates)
  await batch.commit()
  safeLogEvent(roomId, 'gameStart', '游戏开始')
}

export async function setPlayerReady(roomId, ready = true) {
  const uid = auth.currentUser.uid
  await updateDoc(doc(db, ROOMS, roomId), { [`players.${uid}.isReady`]: ready })
}

// When all players ready, host can trigger this to advance to night
export async function advanceToNight(roomId) {
  await updateDoc(doc(db, ROOMS, roomId), {
    phase: 'night',
    'game.nightStepIndex': 0,
  })
}

export async function setNightStep(roomId, stepIndex) {
  await updateDoc(doc(db, ROOMS, roomId), {
    'game.nightStepIndex': stepIndex,
  })
}

export async function setDraftNomination(roomId, teamUids) {
  await updateDoc(doc(db, ROOMS, roomId), {
    'game.nominatedTeam': teamUids,
  })
}

export async function setEndRevealOpen(roomId, open = true) {
  await updateDoc(doc(db, ROOMS, roomId), {
    'game.endRevealOpen': open,
  })
}

export async function advanceToDiscuss(roomId) {
  const snap = await getDoc(doc(db, ROOMS, roomId))
  const room = snap.data()
  if (!room) return
  await updateDoc(doc(db, ROOMS, roomId), discussionStartState(room.game.currentLeaderIndex))
}

export async function advanceDiscussion(roomId) {
  const snap = await getDoc(doc(db, ROOMS, roomId))
  const room = snap.data()
  if (!room || room.phase !== 'discuss') return

  const playerCount = Object.keys(room.players).length
  const discussionCount = room.game.discussionCount || 0
  const currentSpeakerIndex = room.game.currentSpeakerIndex ?? room.game.currentLeaderIndex

  if (discussionCount + 1 >= playerCount) {
    await updateDoc(doc(db, ROOMS, roomId), {
      phase: 'nominate',
      'game.currentSpeakerIndex': null,
      'game.discussionCount': playerCount,
    })
    return
  }

  await updateDoc(doc(db, ROOMS, roomId), {
    'game.currentSpeakerIndex': nextLeaderIndex(currentSpeakerIndex, playerCount),
    'game.discussionCount': discussionCount + 1,
  })
}

export async function submitNomination(roomId, teamUids) {
  const snap = await getDoc(doc(db, ROOMS, roomId))
  const room = snap.data()
  const qi = room.game.currentQuest
  const quests = withQuestUpdate(room, qi, (quest) => ({
    ...quest,
    team: teamUids,
    approveVotes: {},
  }))

  await updateDoc(doc(db, ROOMS, roomId), {
    'game.nominatedTeam': teamUids,
    phase: 'vote',
    quests,
  })
  safeLogEvent(roomId, 'nomination', `队长提名了 ${teamUids.length} 位出征`)
}

export async function castApprovalVote(roomId, vote /* 'approve' | 'reject' */, asUid) {
  const uid = asUid || auth.currentUser.uid
  const snap = await getDoc(doc(db, ROOMS, roomId))
  const room = snap.data()
  const qi = room.game.currentQuest
  const quests = normalizeQuests(room.quests)
  const votes = { ...(quests[qi]?.approveVotes || {}), [uid]: vote }
  const playerCount = Object.keys(room.players).length

  const nextQuests = withQuestUpdate({ ...room, quests }, qi, (quest) => ({ ...quest, approveVotes: votes }))
  const update = { quests: nextQuests }
  if (Object.keys(votes).length >= playerCount) {
    const { approve, reject, passed } = tallyApproval(votes)
    safeLogEvent(roomId, 'voteResult', `投票：${approve} 赞成 / ${reject} 反对 → ${passed ? '通过' : '拒绝'}`)
    update.phase = 'voteResult'
  }
  await updateDoc(doc(db, ROOMS, roomId), update)
}

export async function castMissionVote(roomId, vote /* 'success' | 'fail' */, asUid) {
  const uid = asUid || auth.currentUser.uid
  const snap = await getDoc(doc(db, ROOMS, roomId))
  const room = snap.data()
  const qi = room.game.currentQuest
  const quests = normalizeQuests(room.quests)
  if (!quests[qi]?.team?.includes(uid)) throw new Error('你不在队伍中')
  const votes = { ...(quests[qi]?.missionVotes || {}), [uid]: vote }
  const update = {
    quests: withQuestUpdate({ ...room, quests }, qi, (quest) => ({ ...quest, missionVotes: votes })),
  }

  if (Object.keys(votes).length >= quests[qi].team.length) {
    const playerCount = Object.keys(room.players).length
    const { fails, success } = resolveMission(votes, playerCount, qi)
    update.quests = withQuestUpdate({ ...room, quests }, qi, (quest) => ({
      ...quest,
      missionVotes: votes,
      result: success ? 'success' : 'fail',
      fails,
    }))
    safeLogEvent(roomId, 'missionResult', `第${qi + 1}局任务：${success ? '成功' : '失败'}（${fails} 票失败）`)
    update.phase = 'missionResult'
  }
  await updateDoc(doc(db, ROOMS, roomId), update)
}

export async function finalizeApprovalResult(roomId) {
  const snap = await getDoc(doc(db, ROOMS, roomId))
  const room = snap.data()
  if (!room || room.phase !== 'voteResult') return

  room.quests = normalizeQuests(room.quests)
  const qi = room.game.currentQuest
  const playerCount = Object.keys(room.players).length
  const votes = room.quests?.[qi]?.approveVotes || {}
  const { passed } = tallyApproval(votes)
  const update = {}

  if (passed) {
    update.phase = 'mission'
    update.quests = withQuestUpdate(room, qi, (quest) => ({ ...quest, missionVotes: {} }))
    update['game.rejectedCount'] = 0
  } else {
    const rejectedCount = (room.game.rejectedCount || 0) + 1
    update['game.rejectedCount'] = rejectedCount
    update.quests = withQuestUpdate(room, qi, (quest) => ({
      ...quest,
      rejections: [...(quest.rejections || []), { team: room.game.nominatedTeam, votes }],
    }))
    if (rejectedCount >= 5) {
      update.phase = 'end'
      update['game.winner'] = 'evil'
      safeLogEvent(roomId, 'gameOver', '连续 5 次拒绝，坏人胜')
    } else {
      const nextLeader = nextLeaderIndex(room.game.currentLeaderIndex, playerCount)
      update['game.currentLeaderIndex'] = nextLeader
      Object.assign(update, discussionStartState(nextLeader))
    }
  }

  await updateDoc(doc(db, ROOMS, roomId), update)
}

export async function finalizeMissionResult(roomId) {
  const snap = await getDoc(doc(db, ROOMS, roomId))
  const room = snap.data()
  if (!room || room.phase !== 'missionResult') return

  room.quests = normalizeQuests(room.quests)
  const qi = room.game.currentQuest
  const playerCount = Object.keys(room.players).length
  const quest = room.quests?.[qi] || {}
  const result = quest.result
  if (!result) return

  const newQuests = room.quests.map((q, i) => i === qi ? { ...q, result } : q)
  const winner = checkWinner(newQuests, room.game.rejectedCount)
  const update = {}

  if (winner === 'evil') {
    update.phase = 'end'
    update['game.winner'] = 'evil'
  } else if (winner === 'good_pending_assassin') {
    update.phase = 'assassin'
  } else {
    const nextQi = qi + 1
    const nextLeader = nextLeaderIndex(room.game.currentLeaderIndex, playerCount)
    update['game.currentQuest'] = nextQi
    update['game.currentLeaderIndex'] = nextLeader
    const ladyOK = room.config.useLadyOfLake && qi >= 1 && qi <= 3
    if (ladyOK) {
      update.phase = 'lady'
    } else {
      Object.assign(update, discussionStartState(nextLeader))
    }
  }

  await updateDoc(doc(db, ROOMS, roomId), update)
}

function approvalResultUpdateFromRoom(room) {
  room = { ...room, quests: normalizeQuests(room.quests) }
  const qi = room.game.currentQuest
  const playerCount = Object.keys(room.players).length
  const votes = room.quests?.[qi]?.approveVotes || {}
  const { passed } = tallyApproval(votes)
  const update = {}

  if (passed) {
    update.phase = 'mission'
    update.quests = withQuestUpdate(room, qi, (quest) => ({ ...quest, missionVotes: {} }))
    update['game.rejectedCount'] = 0
  } else {
    const rejectedCount = (room.game.rejectedCount || 0) + 1
    update['game.rejectedCount'] = rejectedCount
    update.quests = withQuestUpdate(room, qi, (quest) => ({
      ...quest,
      rejections: [...(quest.rejections || []), { team: room.game.nominatedTeam, votes }],
    }))
    if (rejectedCount >= 5) {
      update.phase = 'end'
      update['game.winner'] = 'evil'
      safeLogEvent(room.id || room.code || '', 'gameOver', '连续 5 次拒绝，坏人胜')
    } else {
      const nextLeader = nextLeaderIndex(room.game.currentLeaderIndex, playerCount)
      update['game.currentLeaderIndex'] = nextLeader
      Object.assign(update, discussionStartState(nextLeader))
    }
  }

  return update
}

function missionResultUpdateFromRoom(room) {
  room = { ...room, quests: normalizeQuests(room.quests) }
  const qi = room.game.currentQuest
  const playerCount = Object.keys(room.players).length
  const quest = room.quests?.[qi] || {}
  const result = quest.result
  if (!result) throw new Error('当前任务结果缺失')

  const newQuests = room.quests.map((q, i) => i === qi ? { ...q, result } : q)
  const winner = checkWinner(newQuests, room.game.rejectedCount)
  const update = {}

  if (winner === 'evil') {
    update.phase = 'end'
    update['game.winner'] = 'evil'
  } else if (winner === 'good_pending_assassin') {
    update.phase = 'assassin'
  } else {
    const nextQi = qi + 1
    const nextLeader = nextLeaderIndex(room.game.currentLeaderIndex, playerCount)
    update['game.currentQuest'] = nextQi
    update['game.currentLeaderIndex'] = nextLeader
    const ladyOK = room.config.useLadyOfLake && qi >= 1 && qi <= 3
    if (ladyOK) {
      update.phase = 'lady'
    } else {
      Object.assign(update, discussionStartState(nextLeader))
    }
  }

  return update
}

export async function advanceResultPhase(roomId) {
  const snap = await getDoc(doc(db, ROOMS, roomId))
  const room = snap.data()
  if (!room) return

  if (room.phase === 'voteResult') {
    await finalizeApprovalResult(roomId)
    return
  }

  if (room.phase === 'missionResult') {
    await finalizeMissionResult(roomId)
  }
}

export async function advanceResultPhaseFromRoom(room) {
  if (!room?.id) throw new Error('房间信息缺失')
  if (room.phase === 'voteResult') {
    await updateDoc(doc(db, ROOMS, room.id), approvalResultUpdateFromRoom(room))
    return
  }
  if (room.phase === 'missionResult') {
    await updateDoc(doc(db, ROOMS, room.id), missionResultUpdateFromRoom(room))
    return
  }
  throw new Error(`当前阶段无法继续：${room.phase}`)
}

export async function submitLady(roomId, targetUid, asUid) {
  const snap = await getDoc(doc(db, ROOMS, roomId))
  const room = snap.data()
  const uid = asUid || auth.currentUser.uid
  if (room.game.ladyHolderUid !== uid) throw new Error('你不是湖中女神持有者')
  const targetRoleSide = await sideForUid(roomId, targetUid, room)
  await updateDoc(doc(db, ROOMS, roomId), {
    'game.ladyTarget': targetUid,
    'game.ladyResult': targetRoleSide,
    'game.usedLadyUids': [...(room.game.usedLadyUids || []), uid],
    'game.ladyHolderUid': targetUid,
  })
  safeLogEvent(roomId, 'ladyResult', `湖中女神查验了一位玩家`)
}

export async function closeLady(roomId) {
  const snap = await getDoc(doc(db, ROOMS, roomId))
  const room = snap.data()
  if (!room) return
  await updateDoc(doc(db, ROOMS, roomId), {
    ...discussionStartState(room.game.currentLeaderIndex),
    'game.ladyTarget': null,
    'game.ladyResult': null,
  })
}

async function sideForUid(roomId, uid, roomMaybe) {
  const room = roomMaybe || (await getDoc(doc(db, ROOMS, roomId))).data()
  const roleId = room.assignment?.[uid]
  if (!roleId) return 'unknown'
  const evil = new Set(['mordred', 'morgana', 'assassin', 'oberon', 'minion'])
  return evil.has(roleId) ? 'evil' : 'good'
}

export async function submitAssassin(roomId, targetUid) {
  const snap = await getDoc(doc(db, ROOMS, roomId))
  const room = snap.data()
  const merlinUid = Object.entries(room.assignment || {}).find(([, r]) => r === 'merlin')?.[0]
  const success = targetUid === merlinUid
  await updateDoc(doc(db, ROOMS, roomId), {
    'game.assassinTarget': targetUid,
    'game.winner': success ? 'evil' : 'good',
    phase: 'end',
  })
  safeLogEvent(roomId, 'assassin', success ? '刺客命中梅林，坏人逆转取胜' : '刺客猜错，好人胜利')
}

export async function triggerAssassination(roomId, asUid) {
  const uid = asUid || auth.currentUser.uid
  const snap = await getDoc(doc(db, ROOMS, roomId))
  const room = snap.data()
  if (!room) throw new Error('房间不存在')
  if (room.phase === 'end') throw new Error('游戏已结束')
  if ((room.assignment || {})[uid] !== 'assassin') throw new Error('只有刺客可以发动刺杀')

  await updateDoc(doc(db, ROOMS, roomId), {
    phase: 'assassin',
  })
  safeLogEvent(roomId, 'assassinReady', '刺客决定提前发动刺杀')
}

export async function resetToLobby(roomId) {
  const ref = doc(db, ROOMS, roomId)
  const snap = await getDoc(ref); if (!snap.exists()) return
  const room = snap.data()
  const players = Object.fromEntries(Object.entries(room.players).map(([k, v]) => [k, { ...v, isReady: false }]))
  const batch = writeBatch(db)
  await clearRoomEvents(roomId, batch)
  batch.update(ref, {
    phase: 'lobby',
    players,
    assignment: null,
    game: {
      currentQuest: 0, currentLeaderIndex: 0, rejectedCount: 0, roundId: (room.game?.roundId || 0),
      ladyHolderUid: null, usedLadyUids: [], nominatedTeam: [],
      winner: null, assassinTarget: null, ladyTarget: null, ladyResult: null,
      currentSpeakerIndex: 0, discussionCount: 0, nightStepIndex: 0, endRevealOpen: false,
    },
    quests: initQuests(Object.keys(room.players).length),
  })
  await batch.commit()
}

export async function logEvent(roomId, type, message, data = {}) {
  try {
    await addDoc(collection(db, ROOMS, roomId, 'events'), {
      type, message, data, timestamp: serverTimestamp(),
    })
  } catch {}
}
