/**
 * API 客户端
 * 提供与后端 API 通信的接口
 */

const API_BASE = '/api'

// 获取 token
const getToken = () => localStorage.getItem('token')

/**
 * 发送 API 请求
 * @param {string} endpoint - API 端点
 * @param {Object} [options] - 请求选项
 * @param {boolean} [options.auth] - 是否需要认证
 * @returns {Promise<Object>} 响应数据
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // 如果需要认证，添加 token
  if (options.auth !== false) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const config = {
    ...options,
    headers,
  }

  try {
    const response = await fetch(url, config)
    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP ${response.status}`)
    }
    return response.json()
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error)
    throw error
  }
}

/**
 * 认证 API
 */
export const authAPI = {
  login: (username, password) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      auth: false,
    }),

  register: (username, password, role) =>
    fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
      auth: false,
    }),

  getMe: () => fetchAPI('/auth/me'),

  getUsers: () => fetchAPI('/auth/users'),

  createAdmin: (username, password, role) =>
    fetchAPI('/auth/admin', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    }),

  updateUserStatus: (userId, isActive) =>
    fetchAPI(`/auth/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    }),

  deleteUser: (userId) =>
    fetchAPI(`/auth/users/${userId}`, { method: 'DELETE' }),

  getPermissions: () => fetchAPI('/auth/permissions'),
}

// 保存 token
export const setToken = (token) => {
  localStorage.setItem('token', token)
}

// 清除 token
export const clearToken = () => {
  localStorage.removeItem('token')
}

// 获取当前用户
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

// 保存当前用户
export const setCurrentUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user))
}

// 清除当前用户
export const clearCurrentUser = () => {
  localStorage.removeItem('user')
}

/**
 * 球队 API
 */
export const teamsAPI = {
  getAll: () => fetchAPI('/teams'),
  getById: (id) => fetchAPI(`/teams/${id}`),
  create: (data) => fetchAPI('/teams', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/teams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/teams/${id}`, { method: 'DELETE' }),
}

/**
 * 球员 API
 */
export const playersAPI = {
  getAll: () => fetchAPI('/players'),
  getById: (id) => fetchAPI(`/players/${id}`),
  getByTeam: (teamId) => fetchAPI(`/players/team/${teamId}`),
  getBySquad: (squadId) => fetchAPI(`/players/squad/${squadId}`),
  create: (data) => fetchAPI('/players', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/players/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/players/${id}`, { method: 'DELETE' }),
  promote: (playerId, squadId) => fetchAPI('/players/promote', {
    method: 'POST',
    body: JSON.stringify({ playerId, squadId }),
  }),
}

/**
 * 梯队 API
 */
export const squadsAPI = {
  getAll: () => fetchAPI('/squads'),
  getById: (id) => fetchAPI(`/squads/${id}`),
  getByTeam: (teamId) => fetchAPI(`/squads/team/${teamId}`),
  create: (data) => fetchAPI('/squads', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/squads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/squads/${id}`, { method: 'DELETE' }),
  getPlayers: (squadId) => fetchAPI(`/squads/${squadId}/players`),
}

/**
 * 比赛 API
 */
export const gamesAPI = {
  getAll: () => fetchAPI('/games'),
  getById: (id) => fetchAPI(`/games/${id}`),
  create: (data) => fetchAPI('/games', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/games/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/games/${id}`, { method: 'DELETE' }),

  // 打席记录
  addPlateAppearance: (gameId, data) =>
    fetchAPI(`/games/${gameId}/pa`, { method: 'POST', body: JSON.stringify(data) }),

  // 换人
  changePitcher: (gameId, team, pitcherId) =>
    fetchAPI(`/games/${gameId}/pitcher`, {
      method: 'POST',
      body: JSON.stringify({ team, pitcherId }),
    }),
  changeBatter: (gameId, team, batterId, lineupIndex) =>
    fetchAPI(`/games/${gameId}/batter`, {
      method: 'POST',
      body: JSON.stringify({ team, batterId, lineupIndex }),
    }),
}

/**
 * 统计 API
 */
export const statsAPI = {
  getPlayerStats: (playerId) => fetchAPI(`/stats/player/${playerId}`),
  getTeamStats: (teamId) => fetchAPI(`/stats/team/${teamId}`),
  getGameStats: (gameId) => fetchAPI(`/stats/game/${gameId}`),
}

/**
 * 健康检查
 */
export const healthAPI = {
  check: () => fetchAPI('/health', { auth: false }),
}

/**
 * 文件上传 API
 */
export const uploadAPI = {
  uploadTeamLogo: async (file) => {
    const formData = new FormData()
    formData.append('logo', file)
    const token = getToken()
    const response = await fetch('/api/upload/team-logo', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    })
    if (!response.ok) {
      throw new Error('上传失败')
    }
    return response.json()
  },
  deleteFile: (filename) => fetchAPI(`/upload/${filename}`, { method: 'DELETE' }),
}

// 统一导出
export const api = {
  auth: authAPI,
  teams: teamsAPI,
  players: playersAPI,
  games: gamesAPI,
  stats: statsAPI,
  squads: squadsAPI,
  health: healthAPI,
  upload: uploadAPI,
}

export default api