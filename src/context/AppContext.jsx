import React, { createContext, useContext, useReducer, useCallback, useState, useEffect } from 'react'
import { api } from '../utils/api'
import { ALL_TRANSLATIONS } from '../i18n'

const AppContext = createContext(null)

// 可用主题色
export const THEMES = {
  green: { name: 'theme_green', primary: 'bg-green-800', hover: 'hover:bg-green-700', text: 'text-green-800' },
  blue: { name: 'theme_blue', primary: 'bg-blue-800', hover: 'hover:bg-blue-700', text: 'text-blue-800' },
  red: { name: 'theme_red', primary: 'bg-red-800', hover: 'hover:bg-red-700', text: 'text-red-800' },
  purple: { name: 'theme_purple', primary: 'bg-purple-800', hover: 'hover:bg-purple-700', text: 'text-purple-800' },
  orange: { name: 'theme_orange', primary: 'bg-orange-700', hover: 'hover:bg-orange-600', text: 'text-orange-700' },
  yellow: { name: 'theme_yellow', primary: 'bg-yellow-600', hover: 'hover:bg-yellow-500', text: 'text-yellow-600' },
  indigo: { name: 'theme_indigo', primary: 'bg-indigo-800', hover: 'hover:bg-indigo-700', text: 'text-indigo-800' },
  cyan: { name: 'theme_cyan', primary: 'bg-cyan-700', hover: 'hover:bg-cyan-600', text: 'text-cyan-700' },
}

// 可用语言
export const LANGUAGES = [
  { code: 'zh-CN', name: '中文（简体）' },
  { code: 'zh-TW', name: '中文（繁體）' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
]

// 翻译数据

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

  // t('battingOrderSlot', { order: 3 }) -> '第3棒'
  // 此前不支持插值，翻译表里的 {order} / {playerName} 等占位符会原样显示
  const t = useCallback((key, params) => {
    const raw = ALL_TRANSLATIONS[state.language]?.[key]
      ?? ALL_TRANSLATIONS['zh-CN'][key]
      ?? key
    // 分片里有些 key 是结构化对象（如帮助页内容），不能当文案渲染
    if (typeof raw !== 'string') return key
    if (!params) return raw
    return raw.replace(/\{(\w+)\}/g, (m, name) =>
      params[name] !== undefined ? String(params[name]) : m
    )
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