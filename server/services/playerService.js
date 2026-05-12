import { getDb, saveDb } from '../db.js'

/**
 * 球员服务层
 */
export const playerService = {
  async getAll() {
    const db = await getDb()
    const result = db.exec(`
      SELECT p.*, t.name as teamName, s.name as squadName
      FROM players p
      LEFT JOIN teams t ON p.teamId = t.id
      LEFT JOIN squads s ON p.squadId = s.id
      ORDER BY p.id
    `)
    return result[0]?.values.map(row => ({
      id: row[0], name: row[1], number: row[2], bats: row[3], throws: row[4],
      positions: row[5], height: row[6], weight: row[7], birthdate: row[8],
      teamId: row[9], squadId: row[10], photo: row[11], createdAt: row[12],
      teamName: row[13], squadName: row[14]
    })) || []
  },

  async getById(id) {
    const db = await getDb()
    const result = db.exec(`
      SELECT p.*, t.name as teamName, s.name as squadName
      FROM players p
      LEFT JOIN teams t ON p.teamId = t.id
      LEFT JOIN squads s ON p.squadId = s.id
      WHERE p.id = ${id}
    `)
    if (!result[0]?.values[0]) return null
    const row = result[0].values[0]
    return {
      id: row[0], name: row[1], number: row[2], bats: row[3], throws: row[4],
      positions: row[5], height: row[6], weight: row[7], birthdate: row[8],
      teamId: row[9], squadId: row[10], photo: row[11], createdAt: row[12],
      teamName: row[13], squadName: row[14]
    }
  },

  async getByTeam(teamId) {
    const db = await getDb()
    const result = db.exec(`
      SELECT p.*, t.name as teamName, s.name as squadName
      FROM players p
      LEFT JOIN teams t ON p.teamId = t.id
      LEFT JOIN squads s ON p.squadId = s.id
      WHERE p.teamId = ${teamId}
      ORDER BY s.level, p.number, p.name
    `)
    return result[0]?.values.map(row => ({
      id: row[0], name: row[1], number: row[2], bats: row[3], throws: row[4],
      positions: row[5], height: row[6], weight: row[7], birthdate: row[8],
      teamId: row[9], squadId: row[10], photo: row[11], createdAt: row[12],
      teamName: row[13], squadName: row[14]
    })) || []
  },

  async getBySquad(squadId) {
    const db = await getDb()
    const result = db.exec(`
      SELECT p.*, t.name as teamName, s.name as squadName
      FROM players p
      LEFT JOIN teams t ON p.teamId = t.id
      LEFT JOIN squads s ON p.squadId = s.id
      WHERE p.squadId = ${squadId}
      ORDER BY p.number, p.name
    `)
    return result[0]?.values.map(row => ({
      id: row[0], name: row[1], number: row[2], bats: row[3], throws: row[4],
      positions: row[5], height: row[6], weight: row[7], birthdate: row[8],
      teamId: row[9], squadId: row[10], photo: row[11], createdAt: row[12],
      teamName: row[13], squadName: row[14]
    })) || []
  },

  async create(data) {
    const db = await getDb()
    db.run(`
      INSERT INTO players (name, number, bats, throws, positions, height, weight, birthdate, teamId, squadId, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.name || null,
      data.number || null,
      data.bats || 'R',
      data.throws || 'R',
      JSON.stringify(data.positions || []),
      data.height || null,
      data.weight || null,
      data.birthdate || null,
      data.teamId || null,
      data.squadId || null,
      data.photo || null
    ])
    const result = db.exec('SELECT last_insert_rowid()')
    saveDb()
    return { id: result[0].values[0][0], ...data }
  },

  async update(id, data) {
    const db = await getDb()
    db.run(`
      UPDATE players SET name = ?, number = ?, bats = ?, throws = ?, positions = ?,
      height = ?, weight = ?, birthdate = ?, teamId = ?, squadId = ?, photo = ?
      WHERE id = ?
    `, [
      data.name || null,
      data.number || null,
      data.bats || 'R',
      data.throws || 'R',
      JSON.stringify(data.positions || []),
      data.height || null,
      data.weight || null,
      data.birthdate || null,
      data.teamId || null,
      data.squadId || null,
      data.photo || null,
      id
    ])
    saveDb()
    return { id, ...data }
  },

  async delete(id) {
    const db = await getDb()
    db.run('DELETE FROM players WHERE id = ?', [id])
    saveDb()
    return { success: true }
  },

  async promote(squadId, playerId) {
    const db = await getDb()
    // 获取目标梯队的level
    const squadResult = db.exec(`SELECT level, teamId FROM squads WHERE id = ${squadId}`)
    if (!squadResult[0]?.values[0]) {
      throw new Error('目标梯队不存在')
    }

    const newLevel = squadResult[0].values[0][0]
    const teamId = squadResult[0].values[0][1]

    // 将球员晋升到上一级梯队
    db.run('UPDATE players SET squadId = ?, teamId = ? WHERE id = ?', [squadId, teamId, playerId])
    saveDb()
    return { success: true, squadId, playerId, newLevel }
  }
}