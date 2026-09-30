import express from 'express'
import { authService, PERMISSIONS, ROLES } from '../services/authService.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { ah, intParam } from './helpers.js'

const router = express.Router()

// 注册：新用户只能是球员或教练，不能直接注册为管理员
router.post('/register', ah(async (req, res) => {
  const { username, password, role } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }
  if (typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: '用户名至少 3 个字符' })
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: '密码至少 6 个字符' })
  }

  const validRole = [ROLES.COACH, ROLES.PLAYER].includes(role) ? role : ROLES.PLAYER
  try {
    res.status(201).json(await authService.register(username.trim(), password, validRole))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}))

router.post('/login', ah(async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }
  try {
    res.json(await authService.login(username, password))
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
}))

router.get('/me', authenticate, ah(async (req, res) => {
  const user = await authService.getUserById(req.user.id)
  if (!user) return res.status(404).json({ error: '用户不存在' })
  if (!user.isActive) return res.status(403).json({ error: '账户已被停用' })
  res.json(user)
}))

router.get('/permissions', authenticate, ah(async (req, res) => {
  const user = await authService.getUserById(req.user.id)
  res.json({ role: user?.role ?? req.user.role, permissions: PERMISSIONS[req.user.role] || [] })
}))

// 以下均需管理员
router.get('/users', authenticate, requireRole(ROLES.ADMIN), ah(async (req, res) => {
  res.json(await authService.getAllUsers())
}))

router.post('/admin', authenticate, requireRole(ROLES.ADMIN), ah(async (req, res) => {
  const { username, password, role } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: '密码至少 6 个字符' })
  }
  try {
    res.status(201).json(await authService.createAdmin(username, password, role || ROLES.ADMIN))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}))

router.put('/users/:id/status', authenticate, requireRole(ROLES.ADMIN), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  try {
    res.json(await authService.updateUserStatus(id, req.body?.isActive))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}))

router.delete('/users/:id', authenticate, requireRole(ROLES.ADMIN), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  try {
    res.json(await authService.deleteUser(id))
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}))

export default router
