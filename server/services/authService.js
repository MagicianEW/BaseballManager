import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { all, get, run, tx } from '../db.js'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set')
}
const JWT_EXPIRES = '24h'

// 用户角色
export const ROLES = {
  ADMIN: 'admin',         // 系统管理员 - 全部权限
  COACH: 'coach',         // 教练/统计员 - 除用户管理外的全部权限
  PLAYER: 'player',       // 球员 - 只读权限
}

// 权限配置。这是权限的唯一真相来源，服务端强制校验。
export const PERMISSIONS = {
  [ROLES.ADMIN]: ['*'],
  [ROLES.COACH]: [
    'teams:read', 'teams:write',
    'players:read', 'players:write',
    'squads:read', 'squads:write',
    'games:read', 'games:write',
    'stats:read',
  ],
  [ROLES.PLAYER]: [
    'teams:read',
    'players:read',
    'squads:read',
    'games:read',
    'stats:read',
  ],
}

export const authService = {
  async register(username, password, role = ROLES.PLAYER) {
    const existing = get('SELECT id FROM users WHERE username = ?', [username])
    if (existing) throw new Error('用户名已存在')

    const id = run(
      'INSERT INTO users (username, password, role, isActive, isInitial) VALUES (?, ?, ?, ?, ?)',
      [username, bcrypt.hashSync(password, 10), role, 1, 0]
    ).lastInsertRowid

    return { id: Number(id), username, role, token: this.generateToken({ id: Number(id), username, role }) }
  },

  async login(username, password) {
    const user = get('SELECT id, username, password, role, isActive FROM users WHERE username = ?', [username])
    if (!user) throw new Error('用户名或密码错误')
    if (!user.isActive) throw new Error('账户已被停用')
    if (!bcrypt.compareSync(password, user.password)) throw new Error('用户名或密码错误')

    const payload = { id: user.id, username: user.username, role: user.role }
    return { id: user.id, username: user.username, role: user.role, token: this.generateToken(payload) }
  },

  // 创建管理员（仅管理员可调用）
  async createAdmin(newUsername, newPassword, role = ROLES.ADMIN) {
    if (get('SELECT id FROM users WHERE username = ?', [newUsername])) {
      throw new Error('用户名已存在')
    }
    if (![ROLES.ADMIN, ROLES.COACH, ROLES.PLAYER].includes(role)) {
      throw new Error('角色不合法')
    }

    // 创建新管理员后停用初始管理员，两步必须原子执行
    const id = tx(() => {
      const newId = run(
        'INSERT INTO users (username, password, role, isActive, isInitial) VALUES (?, ?, ?, ?, ?)',
        [newUsername, bcrypt.hashSync(newPassword, 10), role, 1, 0]
      ).lastInsertRowid
      run('UPDATE users SET isActive = 0 WHERE isInitial = 1')
      return Number(newId)
    })()

    return { id, username: newUsername, role }
  },

  async getAllUsers() {
    return all('SELECT id, username, role, isActive, isInitial, createdAt FROM users ORDER BY createdAt')
      .map(u => ({ ...u, isActive: !!u.isActive, isInitial: !!u.isInitial }))
  },

  async updateUserStatus(userId, isActive) {
    const user = get('SELECT isInitial, username FROM users WHERE id = ?', [userId])
    if (!user) throw new Error('用户不存在')
    if (user.isInitial === 1) throw new Error('不能停用初始管理员')
    run('UPDATE users SET isActive = ? WHERE id = ?', [isActive ? 1 : 0, userId])
    return { success: true }
  },

  async deleteUser(userId) {
    const user = get('SELECT isInitial FROM users WHERE id = ?', [userId])
    if (!user) throw new Error('用户不存在')
    if (user.isInitial === 1) throw new Error('不能删除初始管理员')
    run('DELETE FROM users WHERE id = ?', [userId])
    return { success: true }
  },

  generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch {
      return null
    }
  },

  hasPermission(role, permission) {
    const perms = PERMISSIONS[role]
    if (!perms) return false
    if (perms.includes('*')) return true
    return perms.includes(permission)
  },

  async getUserById(userId) {
    const u = get('SELECT id, username, role, isActive, isInitial FROM users WHERE id = ?', [userId])
    if (!u) return null
    return { ...u, isActive: !!u.isActive, isInitial: !!u.isInitial }
  },
}
