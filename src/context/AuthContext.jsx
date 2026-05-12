import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI, setToken, clearToken, setCurrentUser, clearCurrentUser, getCurrentUser } from '../utils/api'

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

  // 检查是否有写权限
  const canWrite = useCallback((permission = null) => {
    if (!user) return false
    const perms = PERMISSIONS[user.role]
    if (!perms) return false
    if (perms.includes('*')) return true
    if (permission) {
      const writePerm = permission.replace(':read', ':write')
      return perms.includes(writePerm) || perms.includes(permission)
    }
    return perms.some(p => p.endsWith(':write'))
  }, [user])

  // 检查是否有读权限
  const canRead = useCallback((permission = null) => {
    if (!user) return false
    const perms = PERMISSIONS[user.role]
    if (!perms) return false
    if (perms.includes('*')) return true
    return perms.includes(permission) || perms.some(p => p.includes(permission?.split(':')[0]))
  }, [user])

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
    setUser(null)
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
  }, [logout])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const value = {
    user,
    loading,
    error,
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