/**
 * 统计计算工具函数
 */

/**
 * 计算打击率
 * @param {number} hits - 安打数
 * @param {number} atBats - 打数
 * @returns {string} 打击率 (.000 格式)
 */
export function calcBA(hits, atBats) {
  if (!atBats || atBats === 0) return '.000'
  const ba = hits / atBats
  return ba.toFixed(3).replace(/^0+(?=\.)/, '').replace(/^\./, '0.')
}

/**
 * 计算上垒率
 * @param {number} hits - 安打数
 * @param {number} walks - 四坏球
 * @param {number} hbp - 触身球
 * @param {number} atBats - 打数
 * @param {number} sf - 牺牲飞球
 * @returns {string} 上垒率
 */
export function calcOBP(hits, walks, hbp, atBats, sf = 0) {
  const denom = atBats + walks + hbp + sf
  if (!denom) return '.000'
  const obp = (hits + walks + hbp) / denom
  return obp.toFixed(3).replace(/^0+(?=\.)/, '').replace(/^\./, '0.')
}

/**
 * 计算长打率
 * @param {number} singles - 一垒安打
 * @param {number} doubles - 二垒安打
 * @param {number} triples - 三垒安打
 * @param {number} hr - 本垒打
 * @param {number} atBats - 打数
 * @returns {string} 长打率
 */
export function calcSLG(singles, doubles, triples, hr, atBats) {
  if (!atBats || atBats === 0) return '.000'
  const tb = singles + 2 * doubles + 3 * triples + 4 * hr
  const slg = tb / atBats
  return slg.toFixed(3).replace(/^0+(?=\.)/, '').replace(/^\./, '0.')
}

/**
 * 计算纯长打率 (ISO)
 * @param {string} slg - 长打率
 * @param {string} ba - 打击率
 * @returns {string} ISO
 */
export function calcISO(slg, ba) {
  const slgNum = parseFloat(slg) || 0
  const baNum = parseFloat(ba) || 0
  const iso = slgNum - baNum
  return iso.toFixed(3).replace(/^0+(?=\.)/, '').replace(/^\./, '0.')
}

/**
 * 计算 OPS (上垒加长打)
 * @param {string} obp - 上垒率
 * @param {string} slg - 长打率
 * @returns {string} OPS
 */
export function calcOPS(obp, slg) {
  const obpNum = parseFloat(obp) || 0
  const slgNum = parseFloat(slg) || 0
  return (obpNum + slgNum).toFixed(3)
}

/**
 * 计算自责分率 (ERA)
 * @param {number} earnedRuns - 自责分
 * @param {number} inningsPitched - 投球局数
 * @returns {string} ERA
 */
export function calcERA(earnedRuns, inningsPitched) {
  if (!inningsPitched || inningsPitched === 0) return '0.00'
  const era = (earnedRuns * 9) / inningsPitched
  return era.toFixed(2)
}

/**
 * 计算每局被上垒率 (WHIP)
 * @param {number} hits - 被安打
 * @param {number} walks - 四坏球
 * @param {number} inningsPitched - 投球局数
 * @returns {string} WHIP
 */
export function calcWHIP(hits, walks, inningsPitched) {
  if (!inningsPitched || inningsPitched === 0) return '0.00'
  const whip = (hits + walks) / inningsPitched
  return whip.toFixed(2)
}

/**
 * 计算投球局数 (1/3局进制)
 * @param {number} totalOuts - 总出局数
 * @returns {string} IP (如 "6.2" 表示 6⅔ 局)
 */
export function calcIP(totalOuts) {
  const fullInnings = Math.floor(totalOuts / 3)
  const outsInInning = totalOuts % 3
  return `${fullInnings}.${outsInInning}`
}

/**
 * 计算三振率 (K/9)
 * @param {number} strikeouts - 三振数
 * @param {number} inningsPitched - 投球局数
 * @returns {string} K/9
 */
export function calcK9(strikeouts, inningsPitched) {
  if (!inningsPitched || inningsPitched === 0) return '0.00'
  const k9 = (strikeouts * 9) / inningsPitched
  return k9.toFixed(2)
}

/**
 * 计算保送率 (BB/9)
 * @param {number} walks - 四坏球
 * @param {number} inningsPitched - 投球局数
 * @returns {string} BB/9
 */
export function calcBB9(walks, inningsPitched) {
  if (!inningsPitched || inningsPitched === 0) return '0.00'
  const bb9 = (walks * 9) / inningsPitched
  return bb9.toFixed(2)
}

/**
 * 计算 K/BB 比
 * @param {number} strikeouts - 三振数
 * @param {number} walks - 四坏球
 * @returns {string} K/BB
 */
export function calcKBB(strikeouts, walks) {
  if (!walks || walks === 0) return strikeouts > 0 ? '999.99' : '0.00'
  return (strikeouts / walks).toFixed(2)
}

/**
 * 计算得分创造 (RC)
 * @param {number} hits - 安打
 * @param {number} walks - 四坏球
 * @param {number} totalBases - 垒打数
 * @param {number} atBats - 打数
 * @returns {number} RC
 */
export function calcRC(hits, walks, totalBases, atBats) {
  if (!atBats) return 0
  const denom = atBats + walks
  if (!denom) return 0
  return ((hits + walks) * totalBases) / denom
}

/**
 * 计算守备率 (FPCT)
 * @param {number} putouts - 刺杀
 * @param {number} assists - 助杀
 * @param {number} errors - 失误
 * @returns {string} FPCT
 */
export function calcFPCT(putouts, assists, errors) {
  const denom = putouts + assists + errors
  if (!denom) return '.000'
  const fpct = (putouts + assists) / denom
  return fpct.toFixed(3).replace(/^0+(?=\.)/, '').replace(/^\./, '0.')
}

/**
 * 计算盗垒阻止率 (CS%)
 * @param {number} stolenBases - 盗垒成功
 * @param {number} caughtStealing - 盗垒失败
 * @returns {string} CS%
 */
export function calcCSPercent(stolenBases, caughtStealing) {
  const total = stolenBases + caughtStealing
  if (!total) return '.000'
  const csPercent = caughtStealing / total
  return csPercent.toFixed(3).replace(/^0+(?=\.)/, '').replace(/^\./, '0.')
}

/**
 * 根据打席结果获取垒打数
 * @param {string} result - 打席结果
 * @returns {number} 垒打数
 */
export function getTotalBasesFromResult(result) {
  const basesMap = {
    '1B': 1,
    '2B': 2,
    '3B': 3,
    'HR': 4,
    // 以下不增加垒打数
    'SB': 0, 'CS': 0, 'BB': 0, 'HBP': 0, 'IBB': 0,
    'SO': 0, 'GO': 0, 'FO': 0, 'GDP': 0, 'E': 0,
    'SAC': 0, 'SF': 0, 'PK': 0, 'WP': 0, 'BALK': 0, 'PB': 0,
  }
  return basesMap[result] || 0
}

/**
 * 根据打席结果判断是否为有效打席 (AB)
 * @param {string} result - 打席结果
 * @returns {boolean} 是否为有效打席
 */
export function isAtBat(result) {
  const atBatResults = ['1B', '2B', '3B', 'HR', 'SO', 'GO', 'FO', 'GDP', 'E']
  return atBatResults.includes(result)
}

/**
 * 根据打席结果判断是否为安打
 * @param {string} result - 打席结果
 * @returns {boolean} 是否为安打
 */
export function isHit(result) {
  return ['1B', '2B', '3B', 'HR'].includes(result)
}

/**
 * 根据打席结果判断是否结束比赛
 * @param {string} result - 打席结果
 * @returns {boolean} 是否结束打席
 */
export function endsPlateAppearance(result) {
  return ['1B', '2B', '3B', 'HR', 'SO', 'GO', 'FO', 'GDP', 'BB', 'HBP', 'IBB', 'SAC', 'SF'].includes(result)
}