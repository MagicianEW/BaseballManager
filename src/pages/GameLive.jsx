import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../utils/api'
import { PLAY_RESULTS, RESULT_LABELS, RESULT_CATEGORIES } from '../constants/baseball'

// 垒上局面位掩码定义
// bit 0 (1) = 一垒有人, bit 1 (2) = 二垒有人, bit 2 (4) = 三垒有人
// 组合值：0=无人, 1=一垒, 2=二垒, 3=一二垒, 4=三垒, 5=一三垒, 6=二三垒, 7=满垒
const BASE_FIRST = 1
const BASE_SECOND = 2
const BASE_THIRD = 4

const OUT_RESULTS = RESULT_CATEGORIES.outs.items

// 快速模式按钮（只显示常用6个）
const QUICK_RESULTS = ['HR', 'SO', 'BB', 'GO', 'FO', '1B']

// 生成打席结果选项（从 RESULT_LABELS）
const HIT_RESULTS = Object.entries(RESULT_LABELS)
  .filter(([key]) => !['SB', 'CS', 'PK', 'WP', 'BALK', 'PB', 'E', 'IBB'].includes(key))
  .map(([value, label]) => ({ value, label }))

// 将位掩码转换为显示字符串
const baseMaskToString = (bitmask) => {
  if (!bitmask) return '---'
  const parts = []
  if (bitmask & BASE_FIRST) parts.push('1')
  if (bitmask & BASE_SECOND) parts.push('2')
  if (bitmask & BASE_THIRD) parts.push('3')
  return parts.length === 0 ? '---' : parts.join('') + 'B'
}

// 位掩码版本：推进垒位
const advanceBaseBitmask = (bitmask, result) => {
  let bases = bitmask || 0

  if (result === '1B') {
    // 一垒安打：所有跑垒员前进
    if (bases & BASE_FIRST) bases |= BASE_SECOND
    if (bases & BASE_SECOND) bases |= BASE_THIRD
    if (bases & BASE_FIRST) bases = (bases & ~BASE_SECOND) | BASE_SECOND
    bases = (bases & ~BASE_FIRST) | BASE_FIRST
  } else if (result === '2B') {
    // 二垒安打：一垒到三垒
    if (bases & BASE_FIRST) bases |= BASE_THIRD
    bases = (bases & ~BASE_FIRST & ~BASE_SECOND) | BASE_SECOND
  } else if (result === '3B') {
    // 三垒安打
    bases = (bases & ~BASE_FIRST & ~BASE_SECOND) | BASE_THIRD
  } else if (result === 'HR') {
    // 本垒打清空
    bases = 0
  } else if (result === 'walk') {
    // 保送：一垒有人推进
    if (bases & BASE_FIRST) {
      if (bases & BASE_SECOND) bases |= BASE_THIRD
      bases = (bases & ~BASE_SECOND) | BASE_SECOND
    }
    bases |= BASE_FIRST
  }
  return bases
}

function GameLive() {
  const { id } = useParams()
  const [game, setGame] = useState(null)
  const [players, setPlayers] = useState([])
  const [currentBatter, setCurrentBatter] = useState(null)
  const [quickMode, setQuickMode] = useState(() => {
    return localStorage.getItem('quickMode') !== 'false' // 默认 true
  })

  useEffect(() => {
    loadGame()
    const interval = setInterval(loadGame, 2000)
    return () => clearInterval(interval)
  }, [id])

  const loadGame = async () => {
    const g = await api.getGame(id)
    setGame(g)
    const p = await api.getPlayers()
    setPlayers(p)

    // 设置当前打者
    if (g.status === 'in_progress') {
      const lineup = g.currentHalf === 'top' ? JSON.parse(g.awayLineup || '[]') : JSON.parse(g.homeLineup || '[]')
      const paCount = (g.plateAppearances || []).filter(pa => pa.half === g.currentHalf && pa.inning === g.currentInning).length
      const nextBatterIndex = paCount % 9
      setCurrentBatter(lineup[nextBatterIndex])
    }
  }

  const getPlayerName = (playerId) => {
    if (!playerId) return '-'
    const player = players.find(p => p.id === playerId)
    return player ? `${player.number} ${player.name}` : '-'
  }

  const handleRecord = async (result) => {
    const half = game.currentHalf
    const inning = game.currentInning
    const paNumber = ((game.plateAppearances || []).filter(pa => pa.inning === inning && pa.half === half).length) + 1

    const pitcherId = half === 'top' ? game.awayPitcherId : game.homePitcherId
    const batterId = currentBatter

    // 保存当前状态用于回滚
    const savedGame = { ...game }

    try {
      await api.addPlateAppearance(game.id, {
        inning, half, paNumber, batterId, pitcherId, result,
        rbi: result === 'HR' ? 1 : 0,
        runsScored: 0
      })

      // 更新局面
      let newOuts = game.outs
      let newBaseSituation = game.baseSituation
      let newHomeScore = game.homeScore
      let newAwayScore = game.awayScore

      if (OUT_RESULTS.includes(result)) {
        newOuts++
        if (newOuts >= 3) {
          // 半局结束
          newOuts = 0
          newBaseSituation = 0
        }
      } else if (['1B', '2B', '3B', 'HR'].includes(result)) {
        newBaseSituation = advanceBaseBitmask(newBaseSituation, result)
        if (result === 'HR') {
          if (half === 'top') newAwayScore++
          else newHomeScore++
        }
      } else if (['BB', 'HBP'].includes(result)) {
        newBaseSituation = advanceBaseBitmask(newBaseSituation, 'walk')
      }

      await api.updateGame(game.id, {
        outs: newOuts,
        baseSituation: newBaseSituation,
        homeScore: newHomeScore,
        awayScore: newAwayScore
      })

      loadGame()
    } catch (error) {
      console.error('记录打席失败:', error)
      // 回滚本地状态
      setGame(savedGame)
      alert('记录打席失败，请重试')
    }
  }

  const toggleQuickMode = () => {
    const newMode = !quickMode
    setQuickMode(newMode)
    localStorage.setItem('quickMode', String(newMode))
  }

  const nextInning = async () => {
    const newHalf = game.currentHalf === 'top' ? 'bottom' : 'top'
    const newInning = newHalf === 'top' ? game.currentInning + 1 : game.currentInning

    await api.updateGame(game.id, {
      currentHalf: newHalf,
      currentInning: newInning,
      outs: 0,
      baseSituation: 0,
      balls: 0,
      strikes: 0
    })
    loadGame()
  }

  if (!game) return <div>加载中...</div>

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          {game.awayTeamName} vs {game.homeTeamName}
        </h1>
        <Link to="/games" className="text-blue-600">返回比赛列表</Link>
      </div>

      {/* 比分板 */}
      <div className="bg-white rounded shadow p-4 mb-4">
        <div className="flex justify-between items-center text-center">
          <div className="flex-1">
            <div className="text-3xl font-bold">{game.awayScore}</div>
            <div className="text-gray-600">{game.awayTeamName}</div>
          </div>
          <div className="px-8">
            <div className="text-2xl font-bold text-gray-400">
              第{g.currentInning}局{g.currentHalf === 'top' ? '上半' : '下半'}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold">{game.homeScore}</div>
            <div className="text-gray-600">{game.homeTeamName}</div>
          </div>
        </div>

        <div className="flex justify-center gap-8 mt-4">
          <div className="flex items-center gap-2">
            <span>出局：</span>
            <span className={`w-6 h-6 rounded-full ${game.outs >= 1 ? 'bg-red-500' : 'bg-gray-300'}`}></span>
            <span className={`w-6 h-6 rounded-full ${game.outs >= 2 ? 'bg-red-500' : 'bg-gray-300'}`}></span>
          </div>
          <div className="flex items-center gap-2">
            <span>球数：{game.balls || 0}</span>
            <span>strike：{game.strikes || 0}</span>
          </div>
        </div>
      </div>

      {/* 垒上局面 */}
      <div className="bg-white rounded shadow p-4 mb-4">
        <h2 className="text-lg font-bold mb-4 text-center">场上局面</h2>
        <div className="flex justify-center">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* 垒包 */}
            <polygon points="100,30 115,45 100,60 85,45" fill={(game.baseSituation & BASE_FIRST) ? '#f00' : '#fff'} stroke="#000" strokeWidth="2"/>
            <polygon points="170,100 155,115 140,100 155,85" fill={(game.baseSituation & BASE_SECOND) ? '#f00' : '#fff'} stroke="#000" strokeWidth="2"/>
            <polygon points="100,170 85,155 70,170 85,185" fill={(game.baseSituation & BASE_THIRD) ? '#f00' : '#fff'} stroke="#000" strokeWidth="2"/>
            {/* 本垒 */}
            <rect x="85" y="155" width="30" height="30" fill="#fff" stroke="#000" strokeWidth="2" transform="rotate(45 100 170)"/>
          </svg>
        </div>
        <div className="text-center mt-2 font-mono">{baseMaskToString(game.baseSituation)}</div>
      </div>

      {/* 当前打者 */}
      <div className="bg-white rounded shadow p-4 mb-4">
        <h2 className="text-lg font-bold mb-2">当前打者</h2>
        <div className="text-2xl font-bold">{getPlayerName(currentBatter)}</div>
      </div>

      {/* 记录按钮 */}
      <div className="bg-white rounded shadow p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">记录打席结果</h2>
          <button 
            onClick={toggleQuickMode}
            className={`px-3 py-1 rounded text-sm ${quickMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {quickMode ? '快速模式' : '完整模式'}
          </button>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {(quickMode ? HIT_RESULTS.filter(r => QUICK_RESULTS.includes(r.value)) : HIT_RESULTS).map(r => (
            <button key={r.value} onClick={() => handleRecord(r.value)}
              className={quickMode ? 'bg-green-800 text-white p-4 rounded hover:bg-green-700 text-lg font-bold' : 'bg-green-800 text-white p-3 rounded hover:bg-green-700'}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <button onClick={nextInning} className="bg-blue-800 text-white px-4 py-2 rounded">
          结束半局
        </button>
      </div>

      {/* 打席记录 */}
      <div className="bg-white rounded shadow p-4 mt-4">
        <h2 className="text-lg font-bold mb-4">打席记录</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">局</th>
              <th className="p-2">打者</th>
              <th className="p-2">投手</th>
              <th className="p-2">结果</th>
            </tr>
          </thead>
          <tbody>
            {(game.plateAppearances || []).map(pa => (
              <tr key={pa.id} className="border-t">
                <td className="p-2">{pa.inning}{pa.half === 'top' ? '上' : '下'}</td>
                <td className="p-2">{pa.batterName}</td>
                <td className="p-2">{pa.pitcherName}</td>
                <td className="p-2 font-bold">{pa.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default GameLive