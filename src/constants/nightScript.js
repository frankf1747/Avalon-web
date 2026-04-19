// Each step: { key, text, audio (public path), countdown (seconds) }
export function buildNightSteps(activeRoleIds, playMode = 'local') {
  const has = (id) => activeRoleIds.includes(id)
  const isOnline = playMode === 'online'
  const steps = [
    { key: 'all_close', text: '天黑请闭眼。阿瓦隆的子民请闭上双眼……', audio: '/audio/all_close.mp3', countdown: 3 },
  ]
  const evilLabel = has('oberon') ? '所有坏人（奥伯伦除外）' : '所有坏人'
  steps.push({
    key: 'evil_open',
    text: isOnline ? `${evilLabel}，现在请查看你的队友。` : `${evilLabel}，请睁开双眼，互相确认身份。`,
    audio: '/audio/evil_open.mp3',
    countdown: 5,
  })
  steps.push({
    key: 'evil_close',
    text: isOnline ? `${evilLabel}，请关闭视野，等待下一段引导。` : `${evilLabel}，请闭眼。`,
    audio: '/audio/evil_close.mp3',
    countdown: 3,
  })

  const merlinSee = has('mordred') ? '坏人（莫德雷德除外）' : '所有坏人'
  steps.push({
    key: 'merlin_open',
    text: isOnline ? `梅林现在请查看${merlinSee}。` : `梅林请睁眼，${merlinSee}，请伸出大拇指。`,
    audio: '/audio/merlin_open.mp3',
    countdown: 5,
  })
  steps.push({
    key: 'merlin_close',
    text: isOnline ? '梅林请关闭视野，等待下一段引导。' : '梅林请闭眼，坏人请放下大拇指。',
    audio: '/audio/merlin_close.mp3',
    countdown: 3,
  })

  if (has('percival')) {
    const pSee = has('morgana') ? '梅林与莫甘娜' : '梅林'
    steps.push({
      key: 'percival_open',
      text: isOnline ? `派西维尔现在请查看${pSee}。` : `派西维尔请睁眼，${pSee}，请伸出大拇指。`,
      audio: '/audio/percival_open.mp3',
      countdown: 5,
    })
    steps.push({
      key: 'percival_close',
      text: isOnline ? '派西维尔请关闭视野，等待下一段引导。' : '派西维尔请闭眼，请放下大拇指。',
      audio: '/audio/percival_close.mp3',
      countdown: 3,
    })
  }

  steps.push({ key: 'all_open', text: '天亮了，所有人请睁眼。愿圣杯指引你们。', audio: '/audio/all_open.mp3', countdown: 0 })
  return steps
}
