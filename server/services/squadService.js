import { all, get, run, tx } from '../db.js'

/**
 * 梯队服务层
 */

const SQUAD_SELECT = `
  SELECT s.id, s.teamId, s.name, s.level, s.ageGroup, s.createdAt,
         t.name AS teamName,
         (SELECT COUNT(*) FROM players p WHERE p.squadId = s.id) AS playerCount
  FROM squads s
  LEFT JOIN teams t ON s.teamId = t.id`

export const squadService = {
  async getAll() {
    return all(`${SQUAD_SELECT} ORDER BY s.teamId, s.level`)
  },

  async getById(id) {
    return get(`${SQUAD_SELECT} WHERE s.id = ?`, [id]) || null
  },

  async getByTeam(teamId) {
    return all(`${SQUAD_SELECT} WHERE s.teamId = ? ORDER BY s.level`, [teamId])
  },

  async create(data) {
    if (!data.name) throw new Error('梯队名称必填')
    if (!data.teamId) throw new Error('梯队必须归属一个球队')
    const id = run('INSERT INTO squads (teamId, name, level, ageGroup) VALUES (?, ?, ?, ?)',
      [data.teamId, data.name, data.level || 1, data.ageGroup || null]).lastInsertRowid
    return { id: Number(id), ...data }
  },

  async update(id, data) {
    const existing = get('SELECT teamId FROM squads WHERE id = ?', [id])
    if (!existing) throw new Error('梯队不存在')
    run('UPDATE squads SET name = ?, level = ?, ageGroup = ? WHERE id = ?',
      [data.name, data.level || 1, data.ageGroup || null, id])
    return { id, ...data }
  },

  async delete(id) {
    const existing = get('SELECT id FROM squads WHERE id = ?', [id])
    if (!existing) throw new Error('梯队不存在')
    // players.squadId 由外键 ON DELETE SET NULL 处理，球员本身保留
    run('DELETE FROM squads WHERE id = ?', [id])
    return { success: true }
  },

  async getPlayers(squadId) {
    return all(`
      SELECT p.id, p.name, p.number, p.bats, p.throws, p.positions,
             p.height, p.weight, p.birthdate, p.teamId, p.squadId, p.photo
      FROM players p WHERE p.squadId = ? ORDER BY p.number`, [squadId])
  },

  /**
   * 将球员晋升到指定梯队（并对齐该梯队的 teamId）
   */
  async promotePlayer(squadId, playerId) {
    return tx(() => {
      const squad = get('SELECT level, teamId FROM squads WHERE id = ?', [squadId])
      if (!squad) throw new Error('目标梯队不存在')
      if (!get('SELECT id FROM players WHERE id = ?', [playerId])) throw new Error('球员不存在')
      run('UPDATE players SET squadId = ?, teamId = ? WHERE id = ?', [squadId, squad.teamId, playerId])
      return { success: true, squadId, playerId, newLevel: squad.level }
    })()
  },
}
