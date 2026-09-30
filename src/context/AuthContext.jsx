import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI, setToken, clearToken, setCurrentUser, clearCurrentUser, getCurrentUser } from '../utils/api'
import { closeSocket } from '../utils/socket'

const AuthContext = createContext(null)

// 用户角色
export const ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  PLAYER: 'player',
}

// 权限检查
export const PERMISSIONS = {
  [ROLES.ADMIN]: ['*'],
  [ROLES.COACH]: [
    'teams:read', 'teams:write',
    'players:read', 'players:write',
    'squads:read', 'squads:write',
    'games:read', 'games:write',
    'stats:read', 'stats:write',
  ],
  [ROLES.PLAYER]: [
    'teams:read',
    'players:read',
    'squads:read',
    'games:read',
    'stats:read',
  ],
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // 权限由服务端下发，避免前后端各维护一份 PERMISSIONS 导致漂移
  const [permissions, setPermissions] = useState(null)

  // 检查是否有写权限。
  // 修复：此前 canWrite('games') 里 'games'.replace(':read', ':write') 仍是 'games'，
  // 而 coach 权限表只有 'games:write'，导致 coach 在全部 27 个调用点被判为无写权限。
  const canWrite = useCallback((resource = null) => {
    if (!user) return false
    const perms = permissions ?? PERMISSIONS[user.role]
    if (!perms) return false
    if (perms.includes('*')) return true
    if (!resource) return perms.some(p => p.endsWith(':write'))
    return perms.includes(`${resource}:write`)
  }, [user, permissions])

  // 检查是否有读权限
  const canRead = useCallback((resource = null) => {
    if (!user) return false
    const perms = permissions ?? PERMISSIONS[user.role]
    if (!perms) return false
    if (perms.includes('*')) return true
    if (!resource) return true
    return perms.includes(`${resource}:read`) || perms.includes(`${resource}:write`)
  }, [user, permissions])

  // 检查是否是管理员
  const isAdmin = useCallback(() => {
    return user?.role === ROLES.ADMIN
  }, [user])

  // 检查是否是教练或管理员
  const isCoachOrAbove = useCallback(() => {
    return user?.role === ROLES.ADMIN || user?.role === ROLES.COACH
  }, [user])

  // 登录
  const login = useCallback(async (username, password) => {
    try {
      setError(null)
      const result = await authAPI.login(username, password)
      setToken(result.token)
      setCurrentUser({ id: result.id, username: result.username, role: result.role })
      setUser({ id: result.id, username: result.username, role: result.role })
      return result
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // 注册
  const register = useCallback(async (username, password, role = ROLES.PLAYER) => {
    try {
      setError(null)
      const result = await authAPI.register(username, password, role)
      setToken(result.token)
      setCurrentUser({ id: result.id, username: result.username, role: result.role })
      setUser({ id: result.id, username: result.username, role: result.role })
      return result
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  // 登出
  const logout = useCallback(() => {
    clearToken()
    clearCurrentUser()
    closeSocket()
    setUser(null)
    setPermissions(null)
  }, [])

  // 从服务端拉取当前用户的权限
  const loadPermissions = useCallback(async () => {
    try {
      const res = await authAPI.getPermissions()
      if (res?.permissions) setPermissions(res.permissions)
    } catch {
      setPermissions(null)   // 拉取失败时回退到本地表
    }
  }, [])

  // 检查登录状态
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true)
      const savedUser = getCurrentUser()
      if (savedUser) {
        setUser(savedUser)
        try {
          const freshUser = await authAPI.getMe()
          setUser(freshUser)
          setCurrentUser(freshUser)
          await loadPermissions()
        } catch {
          // token 失效，清除登录状态
          logout()
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [logout, loadPermissions])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // token 过期时 API 层会派发该事件
  useEffect(() => {
    const onExpired = () => logout()
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [logout])

  const value = {
    user,
    loading,
    error,
    permissions,
    login,
    register,
    logout,
    checkAuth,
    canWrite,
    canRead,
    isAdmin,
    isCoachOrAbove,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext