/**
 * 数据模型类型定义
 */

/**
 * @typedef {Object} Team
 * @property {number} id
 * @property {string} name
 * @property {string} [stadium]
 * @property {string} [logo]
 * @property {string} [createdAt]
 */

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {string} name
 * @property {string} [number]
 * @property {'L'|'R'|'S'} bats
 * @property {'L'|'R'} throws
 * @property {string[]} positions
 * @property {string} [height]
 * @property {string} [weight]
 * @property {string} [birthdate]
 * @property {number} [teamId]
 * @property {string} [photo]
 * @property {string} [createdAt]
 * @property {string} [teamName]
 */

/**
 * @typedef {Object} Game
 * @property {number} id
 * @property {string} date
 * @property {number} homeTeamId
 * @property {number} awayTeamId
 * @property {number} homeScore
 * @property {number} awayScore
 * @property {'scheduled'|'in_progress'|'completed'} status
 * @property {number} currentInning
 * @property {'top'|'bottom'} currentHalf
 * @property {number} outs
 * @property {number} balls
 * @property {number} strikes
 * @property {string} baseSituation
 * @property {number[]} homeLineup
 * @property {number[]} awayLineup
 * @property {number} [homePitcherId]
 * @property {number} [awayPitcherId]
 * @property {string} [createdAt]
 * @property {string} [homeTeamName]
 * @property {string} [awayTeamName]
 * @property {PlateAppearance[]} [plateAppearances]
 */

/**
 * @typedef {Object} PlateAppearance
 * @property {number} id
 * @property {number} gameId
 * @property {number} inning
 * @property {'top'|'bottom'} half
 * @property {number} paNumber
 * @property {number} batterId
 * @property {number} pitcherId
 * @property {string} result
 * @property {number} [rbi]
 * @property {number} [runsScored]
 * @property {Pitch[]} [pitches]
 * @property {string} [notes]
 * @property {string} [batterName]
 * @property {string} [pitcherName]
 */

/**
 * @typedef {Object} Pitch
 * @property {string} type
 * @property {string} result
 * @property {string} [zone]
 */

/**
 * @typedef {Object} PlayerStats
 * @property {number} playerId
 * @property {number} [gameId]
 * @property {number} [teamId]
 * @property {number} ab - 打数
 * @property {number} h - 安打
 * @property {number} r - 得分
 * @property {number} rbi - 打点
 * @property {number} bb - 四坏球
 * @property {number} hbp - 触身球
 * @property {number} so - 三振
 * @property {number} sb - 盗垒
 * @property {number} cs - 盗垒失败
 * @property {number} sac - 牺牲触击
 * @property {number} sf - 牺牲飞球
 * @property {number} gidp - 双杀打
 * @property {number} ip - 投球局数
 * @property {number} er - 自责分
 * @property {number} so_p - 投手三振
 * @property {number} bb_p - 投手四坏
 */

/**
 * @typedef {Object} BattingStats
 * @property {number} ab
 * @property {number} h
 * @property {number} r
 * @property {number} rbi
 * @property {number} bb
 * @property {number} hbp
 * @property {number} so
 * @property {number} sb
 * @property {number} cs
 * @property {number} sac
 * @property {number} sf
 * @property {number} gidp
 * @property {string} ba - 打击率
 * @property {string} obp - 上垒率
 * @property {string} slg - 长打率
 * @property {string} ops - OPS
 */

/**
 * @typedef {Object} PitchingStats
 * @property {number} ip
 * @property {number} h
 * @property {number} r
 * @property {number} er
 * @property {number} bb
 * @property {number} so
 * @property {string} era - 自责分率
 * @property {string} whip - WHIP
 */

// 导出空对象用于 JSDoc 引用
export const types = {}