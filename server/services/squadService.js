import { getDb, saveDb } from '../db.js'

/**
 * 梯队服务层
 */
export const squadService = {
  async getAll() {
    const db = await getDb()
    const result = db.exec(`
      SELECT s.*, t.name as teamName
      FROM squads s
      LEFT JOIN teams t ON s.teamId = t.id
      ORDER BY s.teamId, s.level
    `)
    return result[0]?.values.map(row => ({
      id: row[0], teamId: row[1], name: row[2], level: row[3],
      ageGroup: row[4], createdAt: row[5], teamName: row[6]
    })) || []
  },

  async getById(id) {
    const db = await getDb()
    const result = db.exec(`
      SELECT s.*, t.name as teamName
      FROM squads s
      LEFT JOIN teams t ON s.teamId = t.id
      WHERE s.id = ${id}
    `)
    if (!result[0]) return null
    const row = result[0].values[0]
    return {
      id: row[0], teamId: row[1], name: row[2], level: row[3],
      ageGroup: row[4], createdAt: row[5], teamName: row[6]
    }
  },

  async getByTeam(teamId) {
    const db = await getDb()
    const result = db.exec(`
      SELECT s.*, t.name as teamName
      FROM squads s
      LEFT JOIN teams t ON s.teamId = t.id
      WHERE s.teamId = ${teamId}
      ORDER BY s.level
    `)
    return result[0]?.values.map(row => ({
      id: row[0], teamId: row[1], name: row[2], level: row[3],
      ageGroup: row[4], createdAt: row[5], teamName: row[6]
    })) || []
  },

  async create(data) {
    const db = await getDb()
    db.run(`
      INSERT INTO squads (teamId, name, level, ageGroup)
      VALUES (?, ?, ?, ?)
    `, [
      data.teamId || null,
      data.name || null,
      data.level || 1,
      data.ageGroup || null
    ])
    const result = db.exec('SELECT last_insert_rowid()')
    saveDb()
    return { id: result[0].values[0][0], ...data }
  },

  async update(id, data) {
    const db = await getDb()
    db.run(`
      UPDATE squads SET teamId = ?, name = ?, level = ?, ageGroup = ?
      WHERE id = ?
    `, [
      data.teamId || null,
      data.name || null,
      data.level || 1,
      data.ageGroup || null,
      id
    ])
    saveDb()
    return { id, ...data }
  },

  async delete(id) {
    const db = await getDb()
    // 将属于此梯队的球员的 squadId 设为 null
    db.run('UPDATE players SET squadId = NULL WHERE squadId = ?', [id])
    db.run('DELETE FROM squads WHERE id = ?', [id])
    saveDb()
    return { success: true }
  },

  async getPlayers(squadId) {
    const db = await getDb()
    const result = db.exec(`
      SELECT p.*, s.name as squadName
      FROM players p
      LEFT JOIN squads s ON p.squadId = s.id
      WHERE p.squadId = ${squadId}
      ORDER BY p.number, p.name
    `)
    return result[0]?.values.map(row => ({
      id: row[0], name: row[1], number: row[2], bats: row[3], throws: row[4],
      positions: row[5], height: row[6], weight: row[7], birthdate: row[8],
      teamId: row[9], squadId: row[10], photo: row[11], createdAt: row[12],
      squadName: row[13]
    })) || []
  }
}