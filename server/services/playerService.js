import { all, get, run, tx } from '../db.js'
import { deleteUpload } from '../uploads.js'

/**
 * 球员服务层
 *
 * players 表存有未成年人的出生日期、身高、体重与照片，属敏感个人信息。
 * 删除球员时必须同步清理磁盘上的照片文件，否则文件会永久残留。
 */

const PLAYER_SELECT = `
  SELECT p.id, p.name, p.number, p.bats, p.throws, p.positions,
         p.height, p.weight, p.birthdate, p.teamId, p.squadId, p.photo, p.createdAt,
         t.name AS teamName, s.name AS squadName
  FROM players p
  LEFT JOIN teams t  ON p.teamId = t.id
  LEFT JOIN squads s ON p.squadId = s.id`

const parsePositions = p => {
  try { return p ? JSON.parse(p) : [] } catch { return [] }
}
const formatPlayer = p => ({ ...p, positions: parsePositions(p.positions) })

export const playerService = {
  async getAll() {
    return all(`${PLAYER_SELECT} ORDER BY p.id`).map(formatPlayer)
  },

  async getById(id) {
    const p = get(`${PLAYER_SELECT} WHERE p.id = ?`, [id])
    return p ? formatPlayer(p) : null
  },

  async getByTeam(teamId) {
    return all(`${PLAYER_SELECT} WHERE p.teamId = ? ORDER BY p.id`, [teamId]).map(formatPlayer)
  },

  async getBySquad(squadId) {
    return all(`${PLAYER_SELECT} WHERE p.squadId = ? ORDER BY p.id`, [squadId]).map(formatPlayer)
  },

  async create(data) {
    const id = run(`
      INSERT INTO players
        (name, number, bats, throws, positions, height, weight, birthdate, teamId, squadId, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.number || null, data.bats || 'R', data.throws || 'R',
       JSON.stringify(data.positions || []), data.height || null, data.weight || null,
       data.birthdate || null, data.teamId || null, data.squadId || null, data.photo || null]
    ).lastInsertRowid
    return { id: Number(id), ...data }
  },

  async update(id, data) {
    const existing = get('SELECT photo FROM players WHERE id = ?', [id])
    if (!existing) throw new Error('球员不存在')

    run(`
      UPDATE players SET name = ?, number = ?, bats = ?, throws = ?, positions = ?,
             height = ?, weight = ?, birthdate = ?, teamId = ?, squadId = ?, photo = ?
      WHERE id = ?`,
      [data.name, data.number || null, data.bats || 'R', data.throws || 'R',
       JSON.stringify(data.positions || []), data.height || null, data.weight || null,
       data.birthdate || null, data.teamId || null, data.squadId || null,
       data.photo || null, id])

    // 换了照片则清理旧文件，避免孤儿文件堆积
    if (existing.photo && existing.photo !== data.photo) {
      deleteUpload(existing.photo)
    }
    return { id, ...data }
  },

  async delete(id) {
    const existing = get('SELECT photo FROM players WHERE id = ?', [id])
    if (!existing) throw new Error('球员不存在')

    // plate_appearances / substitutions 的外键为 ON DELETE SET NULL，
    // 保留历史比赛记录的同时解除球员关联
    run('DELETE FROM players WHERE id = ?', [id])
    if (existing.photo) deleteUpload(existing.photo)
    return { success: true }
  },

  async promote(squadId, playerId) {
    return tx(() => {
      const squad = get('SELECT level, teamId FROM squads WHERE id = ?', [squadId])
      if (!squad) throw new Error('目标梯队不存在')
      const player = get('SELECT squadId FROM players WHERE id = ?', [playerId])
      if (!player) throw new Error('球员不存在')
      run('UPDATE players SET squadId = ?, teamId = ? WHERE id = ?', [squadId, squad.teamId, playerId])
      return { success: true, squadId, playerId, newLevel: squad.level }
    })()
  },
}
