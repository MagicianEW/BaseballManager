import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDb, saveDb } from '../db.js'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set in production')
}
const JWT_EXPIRES = '24h'

// 用户角色
export const ROLES = {
  ADMIN: 'admin',         // 系统管理员 - 全部权限
  COACH: 'coach',         // 教练/统计员 - 除了用户管理以外的全部权限
  PLAYER: 'player'        // 球员 - 只读权限
}

// 权限配置
export const PERMISSIONS = {
  [ROLES.ADMIN]: ['*'], // 全部权限
  [ROLES.COACH]: [
    'teams:read', 'teams:write',
    'players:read', 'players:write',
    'squads:read', 'squads:write',
    'games:read', 'games:write',
    'stats:read', 'stats:write'
  ],
  [ROLES.PLAYER]: [
    'teams:read',
    'players:read',
    'squads:read',
    'games:read',
    'stats:read'
  ]
}

export const authService = {
  // 注册
  async register(username, password, role = ROLES.PLAYER) {
    const db = await getDb()

    // 检查用户名是否已存在
    const existing = db.exec(`SELECT id FROM users WHERE username = ?`, [username])
    if (existing[0]?.values.length > 0) {
      throw new Error('用户名已存在')
    }

    // 加密密码
    const hashedPassword = bcrypt.hashSync(password, 10)

    // 创建用户
    db.run(
      'INSERT INTO users (username, password, role, isActive, isInitial) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, role, 1, 0]
    )

    const result = db.exec('SELECT last_insert_rowid()')
    const userId = result[0].values[0][0]
    saveDb()

    // 生成 token
    const token = this.generateToken({ id: userId, username, role })

    return { id: userId, username, role, token }
  },

  // 登录
  async login(username, password) {
    const db = await getDb()

    const result = db.exec(`SELECT * FROM users WHERE username = ?`, [username])
    if (!result[0]?.values[0]) {
      throw new Error('用户名或密码错误')
    }

    const row = result[0].values[0]
    const user = {
      id: row[0],
      username: row[1],
      password: row[2],
      role: row[3],
      isActive: row[4],
      isInitial: row[5]
    }

    if (!user.isActive) {
      throw new Error('账户已被停用')
    }

    // 验证密码
    if (!bcrypt.compareSync(password, user.password)) {
      throw new Error('用户名或密码错误')
    }

    // 生成 token
    const token = this.generateToken({ id: user.id, username: user.username, role: user.role })

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      token
    }
  },

  // 创建管理员（仅管理员可调用）
  async createAdmin(newUsername, newPassword, role = ROLES.ADMIN) {
    const db = await getDb()

    // 检查用户名是否已存在
    const existing = db.exec(`SELECT id FROM users WHERE username = ?`, [newUsername])
    if (existing[0]?.values.length > 0) {
      throw new Error('用户名已存在')
    }

    // 加密密码
    const hashedPassword = bcrypt.hashSync(newPassword, 10)

    // 创建用户
    db.run(
      'INSERT INTO users (username, password, role, isActive, isInitial) VALUES (?, ?, ?, ?, ?)',
      [newUsername, hashedPassword, role, 1, 0]
    )

    // 如果创建了新管理员，停用初始管理员
    db.run("UPDATE users SET isActive = 0 WHERE isInitial = 1")

    const result = db.exec('SELECT last_insert_rowid()')
    saveDb()

    return { id: result[0].values[0][0], username: newUsername, role }
  },

  // 获取所有用户（仅管理员）
  async getAllUsers() {
    const db = await getDb()
    const result = db.exec('SELECT id, username, role, isActive, isInitial, createdAt FROM users ORDER BY createdAt')
    return result[0]?.values.map(row => ({
      id: row[0],
      username: row[1],
      role: row[2],
      isActive: row[3] === 1,
      isInitial: row[4] === 1,
      createdAt: row[5]
    })) || []
  },

  // 更新用户状态（仅管理员）
  async updateUserStatus(userId, isActive) {
    const db = await getDb()
    db.run('UPDATE users SET isActive = ? WHERE id = ?', [isActive ? 1 : 0, userId])
    saveDb()
    return { success: true }
  },

  // 删除用户（仅管理员）
  async deleteUser(userId) {
    const db = await getDb()
    // 不能删除初始管理员
    const user = db.exec(`SELECT isInitial FROM users WHERE id = ?`, [userId])
    if (user[0]?.values[0]?.[0] === 1) {
      throw new Error('不能删除初始管理员')
    }
    db.run('DELETE FROM users WHERE id = ?', [userId])
    saveDb()
    return { success: true }
  },

  // 生成 JWT token
  generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
  },

  // 验证 token
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch {
      return null
    }
  },

  // 检查权限
  hasPermission(role, permission) {
    const perms = PERMISSIONS[role]
    if (!perms) return false
    if (perms.includes('*')) return true
    return perms.includes(permission)
  },

  // 获取用户信息
  async getUserById(userId) {
    const db = await getDb()
    const result = db.exec(`SELECT id, username, role, isActive, isInitial FROM users WHERE id = ?`, [userId])
    if (!result[0]?.values[0]) return null
    const row = result[0].values[0]
    return {
      id: row[0],
      username: row[1],
      role: row[2],
      isActive: row[3] === 1,
      isInitial: row[4] === 1
    }
  }
}