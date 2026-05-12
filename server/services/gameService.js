import { getDb, saveDb } from '../db.js'

/**
 * 比赛服务层
 */

// 更新垒上局面
function updateBaseSituation(current, hitResult) {
  const bases = current.split('')
  let newBases = ['-', '-', '-']

  for (let i = 0; i < 3; i++) {
    if (i < bases.length && bases[i] !== '-') {
      newBases[i] = bases[i]
    }
  }

  if (hitResult === '1B') {
    if (newBases[0] !== '-') {
      if (newBases[1] !== '-') newBases[2] = newBases[1]
      newBases[1] = newBases[0]
    }
    newBases[0] = '1'
  } else if (hitResult === '2B') {
    if (newBases[0] !== '-') newBases[2] = newBases[0]
    newBases[0] = '-'
    newBases[1] = '2'
  } else if (hitResult === '3B') {
    newBases[0] = '-'
    newBases[2] = '3'
  } else if (hitResult === 'HR') {
    newBases = ['-', '-', '-']
  }

  return newBases.join('')
}

function advanceOnWalk(current) {
  const bases = current.split('')
  let newBases = ['-', '-', '-']

  for (let i = 0; i < 3; i++) {
    if (i < bases.length && bases[i] !== '-') {
      newBases[i] = bases[i]
    }
  }

  if (newBases[0] !== '-') {
    if (newBases[1] !== '-') {
      if (newBases[2] !== '-') newBases[2] = newBases[1]
      newBases[1] = newBases[0]
    }
    newBases[0] = '1'
  } else {
    newBases[0] = '1'
  }

  return newBases.join('')
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
      homeTeamName: row[17], awayTeamName: row[18], plateAppearances: []
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
    let baseSituation = game[12] || '---'
    let homeScore = game[4] || 0
    let awayScore = game[5] || 0

    if (['SO', 'GO', 'FO', 'GDP'].includes(result)) {
      outs++
      if (outs >= 3) {
        outs = 0
        baseSituation = '---'
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
  }
}