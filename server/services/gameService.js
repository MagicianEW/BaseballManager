import { getDb, saveDb } from '../db.js'

/**
 * 比赛服务层
 */

// 垒上局面位掩码定义
// bit 0 (1) = 一垒有人
// bit 1 (2) = 二垒有人
// bit 2 (4) = 三垒有人
// 可以通过 OR 组合：0=无人, 1=一垒, 2=二垒, 4=三垒, 3=一二垒, 5=一三垒, 6=二三垒, 7=满垒
const FIRST_BASE = 1
const SECOND_BASE = 2
const THIRD_BASE = 4

// 更新垒上局面（位掩码版本）
function updateBaseSituation(currentBitmask, hitResult) {
  let bases = currentBitmask || 0

  if (hitResult === '1B') {
    // 打者上一垒，所有跑垒员各进一垒，三垒直接回家（得分）
    // 从原始状态推导，避免顺序依赖bug
    let newBases = 0
    if (currentBitmask & THIRD_BASE) {} // 三垒得分，清空
    if (currentBitmask & SECOND_BASE) newBases |= THIRD_BASE // 二垒→三垒
    if (currentBitmask & FIRST_BASE) newBases |= SECOND_BASE // 一垒→二垒
    newBases |= FIRST_BASE // 打者→一垒
    return newBases
  } else if (hitResult === '2B') {
    // 打者上二垒，一垒→三垒，三垒得分
    let newBases = 0
    if (currentBitmask & THIRD_BASE) {} // 三垒得分
    if (currentBitmask & FIRST_BASE) newBases |= THIRD_BASE // 一垒→三垒
    newBases |= SECOND_BASE // 打者→二垒
    return newBases
  } else if (hitResult === '3B') {
    // 打者上三垒，一垒→三垒
    let newBases = 0
    if (currentBitmask & SECOND_BASE) newBases |= THIRD_BASE // 二垒→三垒
    if (currentBitmask & FIRST_BASE) newBases |= THIRD_BASE  // 一垒→三垒
    newBases |= THIRD_BASE // 打者→三垒
    return newBases
  } else if (hitResult === 'HR') {
    return 0
  }
}

// 保送时推进垒位（位掩码版本）
function advanceOnWalk(currentBitmask) {
  let bases = currentBitmask || 0

  // 如果一垒有人，一垒跑垒员前进到二垒（如果二垒也有，则到三垒）
  if (bases & FIRST_BASE) {
    if (bases & SECOND_BASE) {
      // 二垒的到三垒（清除二垒，设置三垒）
      bases = (bases & ~SECOND_BASE) | THIRD_BASE
    }
    // 一垒的到二垒（清除一垒，设置二垒）
    bases = (bases & ~FIRST_BASE) | SECOND_BASE
  }
  // 保送送打者上一垒
  bases = bases | FIRST_BASE

  return bases
}

export const gameService = {
  async getAll() {
    const db = await getDb()
    const result = db.exec(`
      SELECT g.*, ht.name as homeTeamName, at.name as awayTeamName
      FROM games g
      LEFT JOIN teams ht ON g.homeTeamId = ht.id
      LEFT JOIN teams at ON g.awayTeamId = at.id
      ORDER BY g.id DESC
    `)
    return result[0]?.values.map(row => ({
      id: row[0], date: row[1], homeTeamId: row[2], awayTeamId: row[3],
      homeScore: row[4], awayScore: row[5], status: row[6],
      currentInning: row[7], currentHalf: row[8], outs: row[9],
      balls: row[10], strikes: row[11], baseSituation: row[12],
      homeLineup: row[13], awayLineup: row[14], homePitcherId: row[15], awayPitcherId: row[16],
      homeTeamName: row[17], awayTeamName: row[18]
    })) || []
  },

  async getById(id) {
    const db = await getDb()
    const result = db.exec(`
      SELECT g.*, ht.name as homeTeamName, at.name as awayTeamName
      FROM games g
      LEFT JOIN teams ht ON g.homeTeamId = ht.id
      LEFT JOIN teams at ON g.awayTeamId = at.id
      WHERE g.id = ${id}
    `)
    if (!result[0]?.values[0]) return null

    const row = result[0].values[0]
    const game = {
      id: row[0], date: row[1], homeTeamId: row[2], awayTeamId: row[3],
      homeScore: row[4], awayScore: row[5], status: row[6],
      currentInning: row[7], currentHalf: row[8], outs: row[9],
      balls: row[10], strikes: row[11], baseSituation: row[12],
      homeLineup: row[13], awayLineup: row[14], homePitcherId: row[15], awayPitcherId: row[16],
      homeTeamName: row[17], awayTeamName: row[18], confirmed: !!row[19], plateAppearances: []
    }

    const paResult = db.exec(`
      SELECT pa.*, pb.name as batterName, pp.name as pitcherName
      FROM plate_appearances pa
      LEFT JOIN players pb ON pa.batterId = pb.id
      LEFT JOIN players pp ON pa.pitcherId = pp.id
      WHERE pa.gameId = ${id}
      ORDER BY pa.inning, pa.half, pa.paNumber
    `)

    game.plateAppearances = paResult[0]?.values.map(paRow => ({
      id: paRow[0], gameId: paRow[1], inning: paRow[2], half: paRow[3],
      paNumber: paRow[4], batterId: paRow[5], pitcherId: paRow[6],
      result: paRow[7], rbi: paRow[8], runsScored: paRow[9],
      pitches: paRow[10], notes: paRow[11], batterName: paRow[12], pitcherName: paRow[13]
    })) || []

    return game
  },

  async create(data) {
    const db = await getDb()
    db.run(`
      INSERT INTO games (date, homeTeamId, awayTeamId, homeLineup, awayLineup, homePitcherId, awayPitcherId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      data.date || null,
      data.homeTeamId || null,
      data.awayTeamId || null,
      JSON.stringify(data.homeLineup || []),
      JSON.stringify(data.awayLineup || []),
      data.homePitcherId || null,
      data.awayPitcherId || null
    ])
    const result = db.exec('SELECT last_insert_rowid()')
    saveDb()
    return { id: result[0].values[0][0], ...data, status: 'scheduled' }
  },

  async update(id, data) {
    const db = await getDb()
    const fields = []
    const values = []

    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id') {
        fields.push(`${key} = ?`)
        values.push(typeof value === 'object' ? JSON.stringify(value) : value)
      }
    }

    values.push(id)
    db.run(`UPDATE games SET ${fields.join(', ')} WHERE id = ?`, values)
    saveDb()
    return { id, ...data }
  },

  async delete(id) {
    const db = await getDb()
    db.run('DELETE FROM plate_appearances WHERE gameId = ?', [id])
    db.run('DELETE FROM games WHERE id = ?', [id])
    saveDb()
    return { success: true }
  },

  async addPlateAppearance(gameId, data) {
    const db = await getDb()

    db.run(`
      INSERT INTO plate_appearances (gameId, inning, half, paNumber, batterId, pitcherId, result, rbi, runsScored, pitches, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      gameId, data.inning, data.half, data.paNumber,
      data.batterId, data.pitcherId, data.result,
      data.rbi || 0, data.runsScored || 0,
      JSON.stringify(data.pitches || []), data.notes || null
    ])

    const result = db.exec('SELECT last_insert_rowid()')
    saveDb()

    // 更新比赛状态
    await this.updateGameState(gameId, data.result, data.half)

    return { id: result[0].values[0][0], gameId, ...data }
  },

  async updateGameState(gameId, result, half) {
    const db = await getDb()
    const gameResult = db.exec(`SELECT * FROM games WHERE id = ${gameId}`)
    if (!gameResult[0]?.values[0]) return

    const game = gameResult[0].values[0]
    let outs = game[9] || 0
    let baseSituation = game[12] || 0
    let homeScore = game[4] || 0
    let awayScore = game[5] || 0

    if (['SO', 'GO', 'FO', 'GDP'].includes(result)) {
      outs++
      if (outs >= 3) {
        outs = 0
        baseSituation = 0
      }
    } else if (['1B', '2B', '3B', 'HR'].includes(result)) {
      baseSituation = updateBaseSituation(baseSituation, result)
      if (result === 'HR') {
        if (half === 'top') awayScore++
        else homeScore++
      }
    } else if (['BB', 'HBP', 'IBB'].includes(result)) {
      baseSituation = advanceOnWalk(baseSituation)
    }

    db.run(`
      UPDATE games SET outs = ?, baseSituation = ?, homeScore = ?, awayScore = ? WHERE id = ?
    `, [outs, baseSituation, homeScore, awayScore, gameId])
    saveDb()
  },

  async changePitcher(gameId, team, pitcherId) {
    const db = await getDb()
    const field = team === 'home' ? 'homePitcherId' : 'awayPitcherId'
    db.run(`UPDATE games SET ${field} = ? WHERE id = ?`, [pitcherId, gameId])
    saveDb()
    return { success: true, pitcherId }
  },

    async changeBatter(gameId, team, batterId, lineupIndex) {
    const db = await getDb()
    const field = team === 'home' ? 'homeLineup' : 'awayLineup'
    const gameResult = db.exec(`SELECT ${field} FROM games WHERE id = ${gameId}`)

    if (gameResult[0]?.values[0]) {
      const lineup = JSON.parse(gameResult[0].values[0][0] || '[]')
      lineup[lineupIndex] = batterId
      db.run(`UPDATE games SET ${field} = ? WHERE id = ?`, [JSON.stringify(lineup), gameId])
      saveDb()
    }

    return { success: true, batterId }
  },

  // 添加换人记录（代跑/代打）
  async addSubstitution(gameId, data) {
    const db = await getDb()
    db.run(`
      INSERT INTO substitutions (gameId, atBatId, type, originalPlayerId, substitutePlayerId, base, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      gameId,
      data.atBatId || null,
      data.type,
      data.originalPlayerId,
      data.substitutePlayerId,
      data.base || null,
      data.reason || null
    ])
    const result = db.exec('SELECT last_insert_rowid()')
    saveDb()
    return { id: result[0].values[0][0], gameId, ...data }
  },

  // 获取比赛的所有换人记录
  async getSubstitutions(gameId, type) {
    const db = await getDb()
    let query = `
      SELECT s.*, 
        op.name as originalPlayerName, 
        sp.name as substitutePlayerName,
        pa.inning, pa.half
      FROM substitutions s
      LEFT JOIN players op ON s.originalPlayerId = op.id
      LEFT JOIN players sp ON s.substitutePlayerId = sp.id
      LEFT JOIN plate_appearances pa ON s.atBatId = pa.id
      WHERE s.gameId = ${gameId}
    `
    if (type) {
      query += ` AND s.type = '${type}'`
    }
    query += ' ORDER BY s.createdAt'

    const result = db.exec(query)
    return result[0]?.values.map(row => ({
      id: row[0], gameId: row[1], atBatId: row[2], type: row[3],
      originalPlayerId: row[4], substitutePlayerId: row[5],
      base: row[6], reason: row[7], createdAt: row[8],
      originalPlayerName: row[9], substitutePlayerName: row[10],
      inning: row[11], half: row[12]
    })) || []
  },

  // 确认阵容（教练确认）
  async confirmLineup(gameId, team) {
    const db = await getDb()
    db.run(`UPDATE games SET confirmed = 1 WHERE id = ?`, [gameId])
    saveDb()
    return { success: true, confirmed: true }
  }
}