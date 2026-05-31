// 棒球相关常量

export const PLAY_RESULTS = {
  // 安打
  SINGLE: '1B',
  DOUBLE: '2B',
  TRIPLE: '3B',
  HOME_RUN: 'HR',
  // 出局
  STRIKEOUT: 'SO',
  GROUND_OUT: 'GO',
  FLY_OUT: 'FO',
  DOUBLE_PLAY: 'GDP',
  // 保送
  WALK: 'BB',
  HIT_BY_PITCH: 'HBP',
  // 牺牲
  SACRIFICE_BUNT: 'SAC',
  SACRIFICE_FLY: 'SF',
  // 其他
  ERROR: 'E',
  INTENTIONAL_WALK: 'IBB',
  STEAL: 'SB',
  CAUGHT_STEALING: 'CS',
  PICKOFF: 'PK',
  WILD_PITCH: 'WP',
  BALK: 'BALK',
  PASSED_BALL: 'PB',
}

export const RESULT_LABELS = {
  '1B': '一垒安打',
  '2B': '二垒安打',
  '3B': '三垒安打',
  'HR': '本垒打',
  'SO': '三振',
  'GO': '外野飞球',
  'FO': '高飞球',
  'GDP': '双杀打',
  'BB': '四坏球',
  'HBP': '触身球',
  'SAC': '牺牲触击',
  'SF': '牺牲飞球',
  'E': '失误',
  'IBB': '故意四坏',
  'SB': '盗垒',
  'CS': '盗垒失败',
  'PK': '牵制出局',
  'WP': '暴投',
  'BALK': '投手犯规',
  'PB': '捕逸',
}

export const RESULT_CATEGORIES = {
  hits: {
    label: '安打',
    items: ['1B', '2B', '3B', 'HR'],
  },
  outs: {
    label: '出局',
    items: ['SO', 'GO', 'FO', 'GDP'],
  },
  walks: {
    label: '保送',
    items: ['BB', 'HBP', 'IBB'],
  },
  baserunning: {
    label: '跑垒',
    items: ['SB', 'CS', 'PK'],
  },
  defense: {
    label: '守备',
    items: ['E', 'WP', 'BALK', 'PB'],
  },
}

// 位置定义
export const POSITIONS = [
  { code: 'P', name: '投手', abbreviation: 'P' },
  { code: 'C', name: '捕手', abbreviation: 'C' },
  { code: '1B', name: '一垒手', abbreviation: '1B' },
  { code: '2B', name: '二垒手', abbreviation: '2B' },
  { code: '3B', name: '三垒手', abbreviation: '3B' },
  { code: 'SS', name: '游击手', abbreviation: 'SS' },
  { code: 'LF', name: '左外野手', abbreviation: 'LF' },
  { code: 'CF', name: '中外野手', abbreviation: 'CF' },
  { code: 'RF', name: '右外野手', abbreviation: 'RF' },
  { code: 'DH', name: '指定打击', abbreviation: 'DH' },
]

// 投打习惯
export const BAT_OPTIONS = [
  { value: 'R', label: '右打' },
  { value: 'L', label: '左打' },
  { value: 'S', label: '左右开' },
]

export const THROW_OPTIONS = [
  { value: 'R', label: '右手' },
  { value: 'L', label: '左手' },
]

// 局面状态位掩码定义
// bit 0 (1) = 一垒有人, bit 1 (2) = 二垒有人, bit 2 (4) = 三垒有人
// 可以通过 OR 组合：0=无人, 1=一垒, 2=二垒, 4=三垒, 3=一二垒, 5=一三垒, 6=二三垒, 7=满垒
export const BASE_FIRST = 1
export const BASE_SECOND = 2
export const BASE_THIRD = 4

// 局面状态（用于显示转换）
export const BASE_SITUATIONS = [
  { bitmask: 0, code: '---', label: '无人' },
  { bitmask: BASE_FIRST, code: '1B-', label: '一垒有人' },
  { bitmask: BASE_SECOND, code: '-2B', label: '二垒有人' },
  { bitmask: BASE_FIRST | BASE_SECOND, code: '12B', label: '一二垒有人' },
  { bitmask: BASE_THIRD, code: '--3', label: '三垒有人' },
  { bitmask: BASE_FIRST | BASE_THIRD, code: '1-3', label: '一三垒有人' },
  { bitmask: BASE_SECOND | BASE_THIRD, code: '-23', label: '二三垒有人' },
  { bitmask: BASE_FIRST | BASE_SECOND | BASE_THIRD, code: '123', label: '满垒' },
]

// 比赛状态
export const GAME_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SUSPENDED: 'suspended',
  CANCELED: 'canceled',
}

// 局半
export const INNING_HALF = {
  TOP: 'top',
  BOTTOM: 'bottom',
}

// 球种
export const PITCH_TYPES = {
  FASTBALL: 'FB',
  CURVEBALL: 'CB',
  SLIDER: 'SL',
  CHANGEUP: 'CH',
  CUTTER: 'CT',
  KNUCKLE: 'KN',
  FORK: 'FO',
  SCREWBALL: 'SC',
}

export const PITCH_TYPE_LABELS = {
  FB: '直球',
  CB: '曲球',
  SL: '滑球',
  CH: '变速球',
  CT: '切球',
  KN: '弹指球',
  FO: '叉球',
  SC: '螺旋球',
}

// 球数结果
export const PITCH_RESULTS = {
  STRIKE: 'S',
  BALL: 'B',
  FOUL: 'F',
  IN_PLAY: 'X',
  HIT_BY_PITCH: 'H',
}

// 梯队年龄组
export const AGE_GROUPS = [
  { code: 'U7', label: 'U7', description: '7岁以下' },
  { code: 'U8', label: 'U8', description: '7-8岁' },
  { code: 'U9', label: 'U9', description: '8-9岁' },
  { code: 'U10', label: 'U10', description: '9-10岁' },
  { code: 'U12', label: 'U12', description: '10-12岁' },
  { code: 'U15', label: 'U15', description: '12-15岁' },
  { code: 'U18', label: 'U18', description: '15-18岁' },
]

// 梯队等级（数字越大级别越高）
export const SQUAD_LEVELS = {
  YOUTH_7: 1,
  YOUTH_8: 2,
  YOUTH_9: 3,
  YOUTH_10: 4,
  YOUTH_12: 5,
  YOUTH_15: 6,
  YOUTH_18: 7,
}

export const SQUAD_LEVEL_LABELS = {
  1: 'U7',
  2: 'U8',
  3: 'U9',
  4: 'U10',
  5: 'U12',
  6: 'U15',
  7: 'U18',
}
