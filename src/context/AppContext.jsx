import React, { createContext, useContext, useReducer, useCallback, useState, useEffect } from 'react'
import { api } from '../utils/api'

const AppContext = createContext(null)

// 可用主题色
export const THEMES = {
  green: { name: '绿色', primary: 'bg-green-800', hover: 'hover:bg-green-700', text: 'text-green-800' },
  blue: { name: '蓝色', primary: 'bg-blue-800', hover: 'hover:bg-blue-700', text: 'text-blue-800' },
  red: { name: '红色', primary: 'bg-red-800', hover: 'hover:bg-red-700', text: 'text-red-800' },
  purple: { name: '紫色', primary: 'bg-purple-800', hover: 'hover:bg-purple-700', text: 'text-purple-800' },
  orange: { name: '橙色', primary: 'bg-orange-700', hover: 'hover:bg-orange-600', text: 'text-orange-700' },
  yellow: { name: '黄色', primary: 'bg-yellow-600', hover: 'hover:bg-yellow-500', text: 'text-yellow-600' },
  indigo: { name: '靛蓝', primary: 'bg-indigo-800', hover: 'hover:bg-indigo-700', text: 'text-indigo-800' },
  cyan: { name: '青色', primary: 'bg-cyan-700', hover: 'hover:bg-cyan-600', text: 'text-cyan-700' },
}

// 可用语言
export const LANGUAGES = [
  { code: 'zh-CN', name: '中文（简体）' },
  { code: 'zh-TW', name: '中文（繁體）' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
]

// 翻译数据
export const translations = {
  'zh-CN': {
    appName: '棒球球队管理系统',
    loginTitle: '请登录以继续',
    teams: '球队',
    squads: '梯队',
    players: '球员',
    games: '比赛',
    stats: '统计',
    users: '设置',
    logout: '退出',
    admin: '管理员',
    coach: '教练',
    player: '球员',
    noAccount: '还没有账户？',
    register: '注册',
    initialAdmin: '初始管理员账户：',
    username: '用户名',
    password: '密码',
    login: '登录',
    loggingIn: '登录中...',
    settings: '设置',
    theme: '主题',
    logo: '队标',
    clubName: '俱乐部名称',
    language: '语言',
    uploadLogo: '上传队标',
    save: '保存',
    cancel: '取消',
    selectTheme: '选择主题色',
    enterClubName: '输入俱乐部名称',
    selectLanguage: '选择语言',
    noTeams: '暂无球队',
    noSquads: '暂无梯队',
    noPlayers: '暂无球员',
    noGames: '暂无比赛',
    createTeam: '创建球队',
    createSquad: '创建梯队',
    createPlayer: '创建球员',
    createGame: '创建比赛',
    edit: '编辑',
    delete: '删除',
    confirmDelete: '确定删除？',
    backToList: '返回列表',
  },
  'zh-TW': {
    appName: '棒球球隊管理系統',
    loginTitle: '請登入以繼續',
    teams: '球隊',
    squads: '梯隊',
    players: '球員',
    games: '比賽',
    stats: '統計',
    users: '設置',
    logout: '退出',
    admin: '管理員',
    coach: '教練',
    player: '球員',
    noAccount: '還沒有帳戶？',
    register: '註冊',
    initialAdmin: '初始管理員帳戶：',
    username: '用戶名',
    password: '密碼',
    login: '登入',
    loggingIn: '登入中...',
    settings: '設置',
    theme: '主題',
    logo: '隊標',
    clubName: '俱樂部名稱',
    language: '語言',
    uploadLogo: '上傳隊標',
    save: '儲存',
    cancel: '取消',
    selectTheme: '選擇主題色',
    enterClubName: '輸入俱樂部名稱',
    selectLanguage: '選擇語言',
    noTeams: '暫無球隊',
    noSquads: '暫無梯隊',
    noPlayers: '暫無球員',
    noGames: '暫無比賽',
    createTeam: '建立球隊',
    createSquad: '建立梯隊',
    createPlayer: '建立球員',
    createGame: '建立比賽',
    edit: '編輯',
    delete: '刪除',
    confirmDelete: '確定刪除？',
    backToList: '返回列表',
  },
  'en': {
    appName: 'Baseball Team Manager',
    loginTitle: 'Please login to continue',
    teams: 'Teams',
    squads: 'Squads',
    players: 'Players',
    games: 'Games',
    stats: 'Stats',
    users: 'Settings',
    logout: 'Logout',
    admin: 'Admin',
    coach: 'Coach',
    player: 'Player',
    noAccount: "Don't have an account?",
    register: 'Register',
    initialAdmin: 'Initial Admin Account:',
    username: 'Username',
    password: 'Password',
    login: 'Login',
    loggingIn: 'Logging in...',
    settings: 'Settings',
    theme: 'Theme',
    logo: 'Logo',
    clubName: 'Club Name',
    language: 'Language',
    uploadLogo: 'Upload Logo',
    save: 'Save',
    cancel: 'Cancel',
    selectTheme: 'Select Theme Color',
    enterClubName: 'Enter Club Name',
    selectLanguage: 'Select Language',
    noTeams: 'No teams',
    noSquads: 'No squads',
    noPlayers: 'No players',
    noGames: 'No games',
    createTeam: 'Create Team',
    createSquad: 'Create Squad',
    createPlayer: 'Create Player',
    createGame: 'Create Game',
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: 'Confirm delete?',
    backToList: 'Back to list',
  },
  'ja': {
    appName: '野球チーム管理系统',
    loginTitle: 'ログインしてください',
    teams: 'チーム',
    squads: 'リザーブ',
    players: '選手',
    games: '試合',
    stats: '統計',
    users: '設定',
    logout: 'ログアウト',
    admin: '管理者',
    coach: '監督',
    player: '選手',
    noAccount: 'アカウントがありませんか？',
    register: '登録',
    initialAdmin: '初期管理者アカウント：',
    username: 'ユーザー名',
    password: 'パスワード',
    login: 'ログイン',
    loggingIn: 'ログイン中...',
    settings: '設定',
    theme: 'テーマ',
    logo: 'ロゴ',
    clubName: 'クラブ名',
    language: '言語',
    uploadLogo: 'ロゴアップロード',
    save: '保存',
    cancel: 'キャンセル',
    selectTheme: 'テーマ色を選択',
    enterClubName: 'クラブ名を入力',
    selectLanguage: '言語を選択',
    noTeams: 'チームなし',
    noSquads: 'リザーブなし',
    noPlayers: '選手なし',
    noGames: '試合なし',
    createTeam: 'チーム作成',
    createSquad: 'リザーブを作成',
    createPlayer: '選手作成',
    createGame: '試合作成',
    edit: '編集',
    delete: '削除',
    confirmDelete: '削除しますか？',
    backToList: '戻る',
  },
}

const initialState = {
  teams: [],
  players: [],
  games: [],
  currentGame: null,
  loading: false,
  error: null,
  // 系统设置
  theme: localStorage.getItem('theme') || 'green',
  language: localStorage.getItem('language') || 'zh-CN',
  clubName: localStorage.getItem('clubName') || '',
  clubLogo: localStorage.getItem('clubLogo') || '',
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'SET_TEAMS':
      return { ...state, teams: action.payload }
    case 'SET_PLAYERS':
      return { ...state, players: action.payload }
    case 'SET_GAMES':
      return { ...state, games: action.payload }
    case 'SET_CURRENT_GAME':
      return { ...state, currentGame: action.payload }
    case 'ADD_TEAM':
      return { ...state, teams: [...state.teams, action.payload] }
    case 'UPDATE_TEAM':
      return { ...state, teams: state.teams.map(t => t.id === action.payload.id ? action.payload : t) }
    case 'DELETE_TEAM':
      return { ...state, teams: state.teams.filter(t => t.id !== action.payload) }
    case 'ADD_PLAYER':
      return { ...state, players: [...state.players, action.payload] }
    case 'UPDATE_PLAYER':
      return { ...state, players: state.players.map(p => p.id === action.payload.id ? action.payload : p) }
    case 'DELETE_PLAYER':
      return { ...state, players: state.players.filter(p => p.id !== action.payload) }
    case 'ADD_GAME':
      return { ...state, games: [action.payload, ...state.games] }
    case 'UPDATE_GAME':
      return { ...state, games: state.games.map(g => g.id === action.payload.id ? action.payload : g) }
    case 'SET_THEME':
      localStorage.setItem('theme', action.payload)
      return { ...state, theme: action.payload }
    case 'SET_LANGUAGE':
      localStorage.setItem('language', action.payload)
      return { ...state, language: action.payload }
    case 'SET_CLUB_NAME':
      localStorage.setItem('clubName', action.payload)
      return { ...state, clubName: action.payload }
    case 'SET_CLUB_LOGO':
      localStorage.setItem('clubLogo', action.payload)
      return { ...state, clubLogo: action.payload }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadTeams = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const teams = await api.getTeams()
      dispatch({ type: 'SET_TEAMS', payload: teams })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const loadPlayers = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const players = await api.getPlayers()
      dispatch({ type: 'SET_PLAYERS', payload: players })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const loadGames = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const games = await api.getGames()
      dispatch({ type: 'SET_GAMES', payload: games })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const loadGame = useCallback(async (id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const game = await api.getGame(id)
      dispatch({ type: 'SET_CURRENT_GAME', payload: game })
      return game
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      return null
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const createTeam = useCallback(async (data) => {
    const team = await api.createTeam(data)
    dispatch({ type: 'ADD_TEAM', payload: team })
    return team
  }, [])

  const updateTeam = useCallback(async (id, data) => {
    const team = await api.updateTeam(id, data)
    dispatch({ type: 'UPDATE_TEAM', payload: team })
    return team
  }, [])

  const deleteTeam = useCallback(async (id) => {
    await api.deleteTeam(id)
    dispatch({ type: 'DELETE_TEAM', payload: id })
  }, [])

  const createPlayer = useCallback(async (data) => {
    const player = await api.createPlayer(data)
    dispatch({ type: 'ADD_PLAYER', payload: player })
    return player
  }, [])

  const updatePlayer = useCallback(async (id, data) => {
    const player = await api.updatePlayer(id, data)
    dispatch({ type: 'UPDATE_PLAYER', payload: player })
    return player
  }, [])

  const deletePlayer = useCallback(async (id) => {
    await api.deletePlayer(id)
    dispatch({ type: 'DELETE_PLAYER', payload: id })
  }, [])

  const createGame = useCallback(async (data) => {
    const game = await api.createGame(data)
    dispatch({ type: 'ADD_GAME', payload: game })
    return game
  }, [])

  const updateGame = useCallback(async (id, data) => {
    const game = await api.updateGame(id, data)
    dispatch({ type: 'UPDATE_GAME', payload: game })
    return game
  }, [])

  const addPlateAppearance = useCallback(async (gameId, data) => {
    return await api.addPlateAppearance(gameId, data)
  }, [])

  const setTheme = useCallback((theme) => {
    dispatch({ type: 'SET_THEME', payload: theme })
  }, [])

  const setLanguage = useCallback((language) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language })
  }, [])

  const setClubName = useCallback((name) => {
    dispatch({ type: 'SET_CLUB_NAME', payload: name })
  }, [])

  const setClubLogo = useCallback((logo) => {
    dispatch({ type: 'SET_CLUB_LOGO', payload: logo })
  }, [])

  const t = useCallback((key) => {
    return translations[state.language]?.[key] || translations['zh-CN'][key] || key
  }, [state.language])

  const value = {
    ...state,
    loadTeams,
    loadPlayers,
    loadGames,
    loadGame,
    createTeam,
    updateTeam,
    deleteTeam,
    createPlayer,
    updatePlayer,
    deletePlayer,
    createGame,
    updateGame,
    addPlateAppearance,
    setTheme,
    setLanguage,
    setClubName,
    setClubLogo,
    t,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export default AppContext