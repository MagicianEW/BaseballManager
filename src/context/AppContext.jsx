import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { api } from '../utils/api'

const AppContext = createContext(null)

const initialState = {
  teams: [],
  players: [],
  games: [],
  currentGame: null,
  loading: false,
  error: null,
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