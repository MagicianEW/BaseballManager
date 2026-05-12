import { getDb, saveDb } from '../db.js'

/**
 * 球队服务层
 */
export const teamService = {
  async getAll() {
    const db = await getDb()
    const result = db.exec('SELECT * FROM teams ORDER BY id')
    return result[0]?.values.map(row => ({
      id: row[0], name: row[1], stadium: row[2], logo: row[3], createdAt: row[4]
    })) || []
  },

  async getById(id) {
    const db = await getDb()
    const result = db.exec(`SELECT * FROM teams WHERE id = ${id}`)
    if (!result[0]) return null
    const row = result[0].values[0]
    return { id: row[0], name: row[1], stadium: row[2], logo: row[3], createdAt: row[4] }
  },

  async create(data) {
    const db = await getDb()
    db.run('INSERT INTO teams (name, stadium, logo) VALUES (?, ?, ?)',
      [data.name || null, data.stadium || null, data.logo || null])
    const result = db.exec('SELECT last_insert_rowid()')
    saveDb()
    return { id: result[0].values[0][0], ...data }
  },

  async update(id, data) {
    const db = await getDb()
    db.run('UPDATE teams SET name = ?, stadium = ?, logo = ? WHERE id = ?',
      [data.name || null, data.stadium || null, data.logo || null, id])
    saveDb()
    return { id, ...data }
  },

  async delete(id) {
    const db = await getDb()
    db.run('DELETE FROM teams WHERE id = ?', [id])
    saveDb()
    return { success: true }
  }
}