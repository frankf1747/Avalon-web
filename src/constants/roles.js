export const ROLES = {
  merlin:   { id: 'merlin',   name: '梅林',     side: 'good', image: '/images/roles/merlin.png',
    description: '知晓所有坏人（莫德雷德除外）。若被刺客认出，坏人逆转取胜。' },
  percival: { id: 'percival', name: '派西维尔', side: 'good', image: '/images/roles/percival.png',
    description: '看见梅林与莫甘娜举手，但无法分辨谁是谁。' },
  loyal:    { id: 'loyal',    name: '忠臣',     side: 'good', image: '/images/roles/loyal.png',
    description: '亚瑟王麾下，无特殊能力，纯粹的忠诚。' },
  mordred:  { id: 'mordred',  name: '莫德雷德', side: 'evil', image: '/images/roles/mordred.png',
    description: '梅林看不到他。其余坏人相互认识。' },
  morgana:  { id: 'morgana',  name: '莫甘娜',   side: 'evil', image: '/images/roles/morgana.png',
    description: '在派西维尔眼中伪装成梅林。与其它坏人互认。' },
  assassin: { id: 'assassin', name: '刺客',     side: 'evil', image: '/images/roles/assassin.png',
    description: '若好人赢得三局任务，刺客可指认梅林翻盘。' },
  oberon:   { id: 'oberon',   name: '奥伯伦',   side: 'evil', image: '/images/roles/oberon.png',
    description: '独行的邪恶。不参与坏人互认，其他坏人也不识他。' },
  minion:   { id: 'minion',   name: '爪牙',     side: 'evil', image: '/images/roles/minion.png',
    description: '普通莫德雷德走狗，坏人之间互相认识。' },
}

export const ROLE_ORDER = ['merlin', 'percival', 'loyal', 'mordred', 'morgana', 'assassin', 'oberon', 'minion']

export const STANDARD_SETUPS = {
  5:  { good: 3, evil: 2, suggested: ['merlin','percival','loyal','morgana','assassin'] },
  6:  { good: 4, evil: 2, suggested: ['merlin','percival','loyal','loyal','morgana','assassin'] },
  7:  { good: 4, evil: 3, suggested: ['merlin','percival','loyal','loyal','mordred','morgana','assassin'] },
  8:  { good: 5, evil: 3, suggested: ['merlin','percival','loyal','loyal','loyal','mordred','morgana','assassin'] },
  9:  { good: 6, evil: 3, suggested: ['merlin','percival','loyal','loyal','loyal','loyal','mordred','morgana','assassin'] },
  10: { good: 6, evil: 4, suggested: ['merlin','percival','loyal','loyal','loyal','loyal','mordred','morgana','assassin','minion'] },
}
