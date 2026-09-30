import { authService, ROLES } from '../services/authService.js'

/**
 * 鉴权中间件
 *
 * 此前整套权限体系（ROLES / PERMISSIONS / hasPermission）从未被调用，
 * 只有 /api/auth/* 内部手写 token 校验，其余业务接口全部匿名可读写。
 */

/** 要求已登录 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null
  if (!token) return res.status(401).json({ error: '未登录' })

  const decoded = authService.verifyToken(token)
  if (!decoded) return res.status(401).json({ error: '登录已过期，请重新登录' })

  req.user = decoded
  next()
}

/** 要求具备指定权限，如 requirePermission('games:write') */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: '未登录' })
    if (!authService.hasPermission(req.user.role, permission)) {
      return res.status(403).json({ error: '无权限执行此操作' })
    }
    next()
  }
}

/** 要求具备指定角色之一 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: '未登录' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '无权限执行此操作' })
    }
    next()
  }
}

export { ROLES }
