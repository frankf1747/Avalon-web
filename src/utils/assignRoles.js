import { ROLES } from '../constants/roles'

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Returns: { [uid]: { role, visibleUids, description, youCanSee } }
export function buildSecrets(playersArray, roleList) {
  const shuffled = shuffle(roleList)
  const assignment = {} // uid -> roleId
  playersArray.forEach((p, i) => { assignment[p.uid] = shuffled[i] })

  const secrets = {}
  for (const p of playersArray) {
    const role = assignment[p.uid]
    const others = playersArray.filter(x => x.uid !== p.uid)
    let visible = []
    let youCanSee = ''
    if (role === 'merlin') {
      visible = others.filter(x => ROLES[assignment[x.uid]].side === 'evil' && assignment[x.uid] !== 'mordred')
      youCanSee = '坏人（莫德雷德除外）'
    } else if (role === 'percival') {
      visible = others.filter(x => assignment[x.uid] === 'merlin' || assignment[x.uid] === 'morgana')
      youCanSee = '梅林与莫甘娜（无法分辨）'
    } else if (ROLES[role].side === 'evil' && role !== 'oberon') {
      visible = others.filter(x => ROLES[assignment[x.uid]].side === 'evil' && assignment[x.uid] !== 'oberon' && x.uid !== p.uid)
      youCanSee = '其他坏人（奥伯伦除外）'
    }
    secrets[p.uid] = {
      role,
      visibleUids: visible.map(x => x.uid),
      description: ROLES[role].description,
      youCanSee,
    }
  }
  return { assignment, secrets }
}
