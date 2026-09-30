import { all, get, run } from '../db.js'
import { deleteUpload } from '../uploads.js'

/**
 * 球队服务层
 */

const TEAM_COLUMNS = 'id, name, stadium, logo, createdAt'

export const teamService = {
  async getAll() {
    return all(`SELECT ${TEAM_COLUMNS} FROM teams ORDER BY id`)
  },

  async getById(id) {
    return get(`SELECT ${TEAM_COLUMNS} FROM teams WHERE id = ?`, [id]) || null
  },

  async create(data) {
    if (!data.name) throw new Error('球队名称必填')
    const id = run('INSERT INTO teams (name, stadium, logo) VALUES (?, ?, ?)',
      [data.name, data.stadium || null, data.logo || null]).lastInsertRowid
    return { id: Number(id), ...data }
  },

  async update(id, data) {
    const existing = get('SELECT logo FROM teams WHERE id = ?', [id])
    if (!existing) throw new Error('球队不存在')

    run('UPDATE teams SET name = ?, stadium = ?, logo = ? WHERE id = ?',
      [data.name, data.stadium || null, data.logo || null, id])

    // 换队标时清理旧文件
    if (existing.logo && existing.logo !== data.logo) deleteUpload(existing.logo)
    return { id, ...data }
  },

  async delete(id) {
    const team = get('SELECT logo FROM teams WHERE id = ?', [id])
    if (!team) throw new Error('球队不存在')

    // players.teamId / squads.teamId 由外键 ON DELETE SET NULL 处理，
    // 球员与梯队记录保留，仅解除关联
    run('DELETE FROM teams WHERE id = ?', [id])
    if (team.logo) deleteUpload(team.logo)
    return { success: true }
  },
}
