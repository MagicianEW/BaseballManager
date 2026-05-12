/**
 * 数据验证工具
 * 提供各类数据的验证函数
 */

/**
 * 验证必填字段
 * @param {*} value - 值
 * @param {string} fieldName - 字段名称
 */
export function required(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} 是必填项`
  }
  return null
}

/**
 * 验证字符串长度
 * @param {string} value - 值
 * @param {number} min - 最小长度
 * @param {number} max - 最大长度
 * @param {string} fieldName - 字段名称
 */
export function length(value, min, max, fieldName) {
  if (value && (value.length < min || value.length > max)) {
    return `${fieldName} 长度必须在 ${min} 到 ${max} 之间`
  }
  return null
}

/**
 * 验证范围
 * @param {number} value - 值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {string} fieldName - 字段名称
 */
export function range(value, min, max, fieldName) {
  if (value !== null && value !== undefined && (value < min || value > max)) {
    return `${fieldName} 必须在 ${min} 到 ${max} 之间`
  }
  return null
}

/**
 * 验证枚举值
 * @param {*} value - 值
 * @param {Array} allowedValues - 允许的值
 * @param {string} fieldName - 字段名称
 */
export function enumValue(value, allowedValues, fieldName) {
  if (value !== null && value !== undefined && !allowedValues.includes(value)) {
    return `${fieldName} 必须是以下值之一: ${allowedValues.join(', ')}`
  }
  return null
}

/**
 * 球队数据验证
 * @param {Object} data - 球队数据
 * @returns {Object} { valid: boolean, errors: Object }
 */
export function validateTeam(data) {
  const errors = {}

  const nameError = required(data.name, '球队名称') ||
    length(data.name, 1, 50, '球队名称')
  if (nameError) errors.name = nameError

  if (data.stadium) {
    const stadiumError = length(data.stadium, 1, 100, '主场球场')
    if (stadiumError) errors.stadium = stadiumError
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * 球员数据验证
 * @param {Object} data - 球员数据
 * @returns {Object} { valid: boolean, errors: Object }
 */
export function validatePlayer(data) {
  const errors = {}

  const nameError = required(data.name, '球员姓名') ||
    length(data.name, 1, 50, '球员姓名')
  if (nameError) errors.name = nameError

  if (data.number) {
    const numberError = length(data.number, 1, 10, '球衣号')
    if (numberError) errors.number = numberError
  }

  const batsError = enumValue(data.bats, ['L', 'R', 'S'], '投打习惯')
  if (batsError) errors.bats = batsError

  const throwsError = enumValue(data.throws, ['L', 'R'], '投球手')
  if (throwsError) errors.throws = throwsError

  if (data.positions && !Array.isArray(data.positions)) {
    errors.positions = '位置必须是数组'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * 比赛数据验证
 * @param {Object} data - 比赛数据
 * @returns {Object} { valid: boolean, errors: Object }
 */
export function validateGame(data) {
  const errors = {}

  const dateError = required(data.date, '比赛日期')
  if (dateError) errors.date = dateError

  if (!data.homeTeamId) {
    errors.homeTeamId = '主队是必填项'
  }

  if (!data.awayTeamId) {
    errors.awayTeamId = '客队是必填项'
  }

  if (data.homeTeamId && data.awayTeamId && data.homeTeamId === data.awayTeamId) {
    errors.general = '主队和客队不能相同'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * 打席记录验证
 * @param {Object} data - 打席数据
 * @returns {Object} { valid: boolean, errors: Object }
 */
export function validatePlateAppearance(data) {
  const errors = {}

  if (data.inning === undefined || data.inning === null) {
    errors.inning = '局数是必填项'
  } else if (data.inning < 1 || data.inning > 15) {
    errors.inning = '局数必须在 1 到 15 之间'
  }

  const halfError = enumValue(data.half, ['top', 'bottom'], '局半')
  if (halfError) errors.half = halfError

  if (!data.batterId) errors.batterId = '打者是必填项'
  if (!data.pitcherId) errors.pitcherId = '投手是必填项'

  // 验证打席结果
  const validResults = ['1B', '2B', '3B', 'HR', 'SO', 'GO', 'FO', 'GDP', 'BB', 'HBP', 'IBB', 'SAC', 'SF', 'E', 'SB', 'CS', 'PK', 'WP', 'BALK', 'PB']
  if (data.result && !validResults.includes(data.result)) {
    errors.result = `无效的打席结果: ${data.result}`
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * 投球记录验证
 * @param {Object} data - 投球数据
 * @returns {Object} { valid: boolean, errors: Object }
 */
export function validatePitch(data) {
  const errors = {}

  const validPitches = ['FB', 'CB', 'SL', 'CH', 'CT', 'KN', 'FO', 'SC']
  if (data.type && !validPitches.includes(data.type)) {
    errors.type = `无效的球种: ${data.type}`
  }

  const validResults = ['S', 'B', 'F', 'X', 'H']
  if (data.result && !validResults.includes(data.result)) {
    errors.result = `无效的投球结果: ${data.result}`
  }

  if (data.zone !== undefined && (data.zone < 1 || data.zone > 9)) {
    errors.zone = '好球带编号必须在 1 到 9 之间'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * 阵容验证
 * @param {number[]} lineup - 阵容数组
 * @param {number} expectedLength - 期望长度
 * @returns {Object} { valid: boolean, errors: Object }
 */
export function validateLineup(lineup, expectedLength = 9) {
  const errors = {}

  if (!Array.isArray(lineup)) {
    return { valid: false, errors: { lineup: '阵容必须是数组' } }
  }

  if (lineup.length !== expectedLength) {
    errors.lineup = `阵容必须有 ${expectedLength} 名球员`
  }

  // 检查是否有重复
  const uniqueIds = lineup.filter(id => id !== null && id !== undefined)
  const duplicates = uniqueIds.filter((id, index) => uniqueIds.indexOf(id) !== index)
  if (duplicates.length > 0) {
    errors.duplicates = `阵容中有重复的球员: ${duplicates.join(', ')}`
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export default {
  required,
  length,
  range,
  enumValue,
  validateTeam,
  validatePlayer,
  validateGame,
  validatePlateAppearance,
  validatePitch,
  validateLineup,
}