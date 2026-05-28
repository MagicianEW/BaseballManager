import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../utils/api'
import { PLAY_RESULTS, RESULT_LABELS, RESULT_CATEGORIES } from '../constants/baseball'

// 使用 constants 中定义的出局类型
const OUT_RESULTS = RESULT_CATEGORIES.outs.items

// 生成打席结果选项（从 RESULT_LABELS）
const HIT_RESULTS = Object.entries(RESULT_LABELS)
  .filter(([key]) => !['SB', 'CS', 'PK', 'WP', 'BALK', 'PB', 'E', 'IBB'].includes(key))
  .map(([value, label]) => ({ value, label }))

function GameLive() {
  const { id } = useParams()
  const [game, setGame] = useState(null)
  const [players, setPlayers] = useState([])
  const [currentBatter, setCurrentBatter] = useState(null)

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
          newBaseSituation = '---'
        }
      } else if (['1B', '2B', '3B', 'HR'].includes(result)) {
        newBaseSituation = advanceBase(newBaseSituation, result)
        if (result === 'HR') {
          if (half === 'top') newAwayScore++
          else newHomeScore++
        }
      } else if (['BB', 'HBP'].includes(result)) {
        newBaseSituation = advanceBase(newBaseSituation, 'walk')
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

  const advanceBase = (situation, result) => {
    const bases = situation.split('').map(c => c === '-' ? null : c)
    let newBases = [null, null, null]

    for (let i = 0; i < 3; i++) {
      if (bases[i]) newBases[i] = bases[i]
    }

    if (result === '1B') {
      if (newBases[0]) {
        if (newBases[1]) newBases[2] = newBases[1]
        newBases[1] = newBases[0]
      }
      newBases[0] = 'B'
    } else if (result === '2B') {
      if (newBases[0]) newBases[2] = newBases[0]
      newBases[0] = null
      newBases[1] = 'B'
    } else if (result === '3B') {
      newBases[0] = null
      newBases[2] = 'B'
    } else if (result === 'HR') {
      newBases = [null, null, null]
    } else if (result === 'walk') {
      if (newBases[0]) {
        if (newBases[1]) {
          if (newBases[2]) newBases[2] = newBases[1]
          newBases[1] = newBases[0]
        }
        newBases[0] = 'B'
      } else {
        newBases[0] = 'B'
      }
    }

    return newBases.map(b => b || '-').join('')
  }

  const nextInning = async () => {
    const newHalf = game.currentHalf === 'top' ? 'bottom' : 'top'
    const newInning = newHalf === 'top' ? game.currentInning + 1 : game.currentInning

    await api.updateGame(game.id, {
      currentHalf: newHalf,
      currentInning: newInning,
      outs: 0,
      baseSituation: '---',
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
            <polygon points="100,30 115,45 100,60 85,45" fill={game.baseSituation[0] !== '-' ? '#f00' : '#fff'} stroke="#000" strokeWidth="2"/>
            <polygon points="170,100 155,115 140,100 155,85" fill={game.baseSituation[1] !== '-' ? '#f00' : '#fff'} stroke="#000" strokeWidth="2"/>
            <polygon points="100,170 85,155 70,170 85,185" fill={game.baseSituation[2] !== '-' ? '#f00' : '#fff'} stroke="#000" strokeWidth="2"/>
            {/* 本垒 */}
            <rect x="85" y="155" width="30" height="30" fill="#fff" stroke="#000" strokeWidth="2" transform="rotate(45 100 170)"/>
          </svg>
        </div>
        <div className="text-center mt-2 font-mono">{game.baseSituation}</div>
      </div>

      {/* 当前打者 */}
      <div className="bg-white rounded shadow p-4 mb-4">
        <h2 className="text-lg font-bold mb-2">当前打者</h2>
        <div className="text-2xl font-bold">{getPlayerName(currentBatter)}</div>
      </div>

      {/* 记录按钮 */}
      <div className="bg-white rounded shadow p-4 mb-4">
        <h2 className="text-lg font-bold mb-4">记录打席结果</h2>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {HIT_RESULTS.map(r => (
            <button key={r.value} onClick={() => handleRecord(r.value)}
              className="bg-green-800 text-white p-3 rounded hover:bg-green-700">
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