// Each step: { key, text, audio (public path), countdown (seconds) }
// `t` is the translator from useT(); the recorded mp3s are Chinese, so English narration uses TTS only.
export function buildNightSteps(activeRoleIds, playMode = 'local', t) {
  const has = (id) => activeRoleIds.includes(id)
  const isOnline = playMode === 'online'
  const audio = (key) => (t.lang === 'zh' ? `/audio/${key}.mp3` : null)
  const steps = [
    { key: 'all_close', text: t('night.allClose'), audio: audio('all_close'), countdown: 3 },
  ]
  const evilLabel = has('oberon') ? t('night.evilNoOberon') : t('night.evilAll')
  steps.push({
    key: 'evil_open',
    text: isOnline ? t('night.evilOpenOnline') : t('night.evilOpen', { who: evilLabel }),
    audio: audio('evil_open'),
    countdown: 5,
  })
  steps.push({
    key: 'evil_close',
    text: isOnline ? t('night.evilCloseOnline') : t('night.evilClose', { who: evilLabel }),
    audio: audio('evil_close'),
    countdown: 3,
  })

  const merlinSee = has('mordred') ? t('night.merlinSeeNoMordred') : t('night.merlinSeeAll')
  steps.push({
    key: 'merlin_open',
    text: isOnline ? t('night.merlinOpenOnline', { who: merlinSee }) : t('night.merlinOpen', { who: merlinSee }),
    audio: audio('merlin_open'),
    countdown: 5,
  })
  steps.push({
    key: 'merlin_close',
    text: isOnline ? t('night.merlinCloseOnline') : t('night.merlinClose'),
    audio: audio('merlin_close'),
    countdown: 3,
  })

  if (has('percival')) {
    const pSee = has('morgana') ? t('night.pSeeBoth') : t('night.pSeeMerlin')
    steps.push({
      key: 'percival_open',
      text: isOnline ? t('night.percivalOpenOnline', { who: pSee }) : t('night.percivalOpen', { who: pSee }),
      audio: audio('percival_open'),
      countdown: 5,
    })
    steps.push({
      key: 'percival_close',
      text: isOnline ? t('night.percivalCloseOnline') : t('night.percivalClose'),
      audio: audio('percival_close'),
      countdown: 3,
    })
  }

  steps.push({ key: 'all_open', text: t('night.allOpen'), audio: audio('all_open'), countdown: 0 })
  return steps
}
