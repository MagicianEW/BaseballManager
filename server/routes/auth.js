import express from 'express'
import { authService, ROLES } from '../services/authService.js'

const router = express.Router()

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }
    // 新用户只能是球员或教练，不能直接注册为管理员
    const validRole = [ROLES.PLAYER, ROLES.COACH].includes(role) ? role : ROLES.PLAYER
    const result = await authService.register(username, password, validRole)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }
    const result = await authService.login(username, password)
    res.json(result)
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
})

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: '未登录' })
    }
    const decoded = authService.verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ error: 'token无效' })
    }
    const user = await authService.getUserById(decoded.id)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取所有用户（仅管理员）
router.get('/users', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: '未登录' })
    }
    const decoded = authService.verifyToken(token)
    if (!decoded || decoded.role !== ROLES.ADMIN) {
      return res.status(403).json({ error: '无权限' })
    }
    const users = await authService.getAllUsers()
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 创建管理员（仅初始管理员或现有管理员）
router.post('/admin', async (req, res) => {
  try {
    const { username, password, role } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: '未登录' })
    }
    const decoded = authService.verifyToken(token)
    if (!decoded || decoded.role !== ROLES.ADMIN) {
      return res.status(403).json({ error: '无权限' })
    }
    const result = await authService.createAdmin(username, password, role || ROLES.ADMIN)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// 更新用户状态（仅管理员）
router.put('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: '未登录' })
    }
    const decoded = authService.verifyToken(token)
    if (!decoded || decoded.role !== ROLES.ADMIN) {
      return res.status(403).json({ error: '无权限' })
    }
    const result = await authService.updateUserStatus(req.params.id, isActive)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// 删除用户（仅管理员）
router.delete('/users/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: '未登录' })
    }
    const decoded = authService.verifyToken(token)
    if (!decoded || decoded.role !== ROLES.ADMIN) {
      return res.status(403).json({ error: '无权限' })
    }
    const result = await authService.deleteUser(req.params.id)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// 检查权限
router.get('/permissions', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: '未登录' })
    }
    const decoded = authService.verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ error: 'token无效' })
    }
    const user = await authService.getUserById(decoded.id)
    res.json({ role: user.role })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router