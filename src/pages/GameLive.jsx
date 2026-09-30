import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../utils/api'
import { onSocket } from '../utils/socket'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { RESULT_LABELS, RESULT_CATEGORIES } from '../constants/baseball'
import { LineupPrintCard } from '../components/LineupPrintCard'

// 快速模式只显示常用结果
const QUICK_RESULTS = ['HR', 'SO', 'BB', 'GO', 'FO', '1B']

// 完整模式下排除跑垒动作与已单列的结果
const EXCLUDE_FROM_PANEL = ['SB', 'CS', 'PK', 'WP', 'BALK', 'PB', 'E', 'IBB']

const BASE_POS = { 1: [100, 30], 2: [170, 100], 3: [100, 170] }

function GameLive() {
  const { id } = useParams()
  const { t } = useApp()
  const { canWrite } = useAuth()

  const [game, setGame] = useState(null)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [flash, setFlash] = useState(null)
  const [busy, setBusy] = useState(false)
  const [quickMode, setQuickMode] = useState(() => localStorage.getItem('quickMode') !== 'false')
  const [showSubs, setShowSubs] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [subs, setSubs] = useState([])

  const loadGame = useCallback(async () => {
    try {
      setError(null)
      const g = await api.getGame(id)
      setGame(g)
    } catch (err) {
      setError(err.message || t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    setLoading(true)
    loadGame()
    api.getPlayers().then(setPlayers).catch(() => {})
  }, [loadGame])

  // 实时同步：此前靠 2 秒轮询且每次重拉全量球员，后端 socket 事件完全没接
  useEffect(() => {
    const off = onSocket('game:updated', payload => {
      if (String(payload?.gameId) === String(id)) loadGame()
    })
    return off
  }, [id, loadGame])

  useEffect(() => {
    if (!showSubs) return
    api.games.getSubstitutions(id).then(setSubs).catch(() => {})
  }, [showSubs, id])

  const playerMap = useMemo(() => {
    const m = new Map()
    players.forEach(p => m.set(p.id, p))
    return m
  }, [players])

  const nameOf = useCallback(pid => {
    if (pid == null) return null
    const p = playerMap.get(pid)
    return p ? `${p.number ?? ''} ${p.name}`.trim() : `#${pid}`
  }, [playerMap])

  // 下一位打者：按当前半局已有打席数在打线中轮转。
  // 此前用 paCount % 9 硬编码 9 人，且被 status === 'in_progress' 卡住（服务端从不写该状态）
  const currentBatter = useMemo(() => {
    if (!game) return null
    const lineup = game.currentHalf === 'top' ? game.awayLineup : game.homeLineup
    const size = Array.isArray(lineup) ? lineup.length : 0
    if (size === 0) return null
    const paCount = (game.plateAppearances || [])
      .filter(pa => pa.half === game.currentHalf && pa.inning === game.currentInning).length
    return lineup[paCount % size] ?? null
  }, [game])

  const currentPitcher = useMemo(() => {
    if (!game) return null
    // 上半由客队投手投球
    return game.currentHalf === 'top' ? game.awayPitcherId : game.homePitcherId
  }, [game])

  const runners = game?.runners || []

  const record = useCallback(async (result) => {
    if (!game || busy) return
    setBusy(true)
    try {
      const paCount = (game.plateAppearances || [])
        .filter(pa => pa.half === game.currentHalf && pa.inning === game.currentInning).length
      // 只发送打席事实，得分/RBI/局数推进全部由服务端计分引擎计算
      const res = await api.games.addPlateAppearance(game.id, {
        inning: game.currentInning,
        half: game.currentHalf,
        paNumber: paCount + 1,
        batterId: currentBatter,
        pitcherId: currentPitcher,
        result,
      })
      if (res?.runs > 0) {
        setFlash(t('runsScoredFlash', { n: res.runs }))
        setTimeout(() => setFlash(null), 2500)
      }
      await loadGame()
    } catch (err) {
      setError(err.message)
      setTimeout(() => setError(null), 4000)
    } finally {
      setBusy(false)
    }
  }, [game, currentBatter, currentPitcher, busy, loadGame, t])

  const endHalf = useCallback(async () => {
    if (!window.confirm(t('confirmEndHalf'))) return
    try {
      await api.games.advanceHalf(game.id)
      await loadGame()
    } catch (err) { setError(err.message) }
  }, [game, loadGame, t])

  const endGame = useCallback(async () => {
    if (!window.confirm(t('confirmEndGame'))) return
    try {
      await api.games.update(game.id, { status: 'completed' })
      await loadGame()
    } catch (err) { setError(err.message) }
  }, [game, loadGame, t])

  const toggleQuick = () => {
    setQuickMode(v => {
      localStorage.setItem('quickMode', String(!v))
      return !v
    })
  }

  const doConfirmLineup = useCallback(async (team) => {
    try {
      await api.games.confirmLineup(game.id, team)
      await loadGame()
    } catch (err) { setError(err.message) }
  }, [game, loadGame])

  const reopenLineup = useCallback(async (team) => {
    try {
      await api.games.reopenLineup(game.id, team)
      await loadGame()
    } catch (err) { setError(err.message) }
  }, [game, loadGame])

  const allResults = useMemo(
    () => Object.entries(RESULT_LABELS)
      .filter(([key]) => !EXCLUDE_FROM_PANEL.includes(key))
      .map(([value, label]) => ({ value, label })),
    []
  )
  const panelResults = quickMode ? allResults.filter(r => QUICK_RESULTS.includes(r.value)) : allResults

  if (loading) return <div className="p-8 text-center">{t('loadFailed')}…</div>
  if (error && !game) return <div className="p-8 text-center text-red-600">{error}</div>
  if (!game) return <div className="p-8 text-center">{t('gameNotFound')}</div>

  const isLive = game.status === 'in_progress'
  const isDone = game.status === 'completed'
  const writable = canWrite('games') && isLive

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          {game.awayTeamName} <span className="text-gray-400">vs</span> {game.homeTeamName}
        </h1>
        <Link to="/games" className="text-blue-600">← {t('backToList')}</Link>
      </div>

      {!isLive && !isDone && (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded p-3 mb-4">
          {t('notStartedHint')}
        </div>
      )}
      {isDone && (
        <div className="bg-green-100 border border-green-300 text-green-800 rounded p-3 mb-4">
          {t('completed')}
        </div>
      )}
      {flash && <div className="bg-green-600 text-white rounded p-3 mb-4 text-center font-bold">{flash}</div>}
      {error && <div className="bg-red-100 border border-red-300 text-red-700 rounded p-3 mb-4">{error}</div>}

      {/* 比分板 */}
      <div className="bg-white rounded shadow p-4 mb-4">
        <div className="flex justify-between items-center text-center">
          <div className="flex-1">
            <div className="text-3xl font-bold">{game.awayScore}</div>
            <div className="text-gray-600">{game.awayTeamName}</div>
          </div>
          <div className="px-8">
            <div className="text-2xl font-bold text-gray-400">
              {t('inningOf', { inning: game.currentInning, half: t(game.currentHalf === 'top' ? 'topHalf' : 'bottomHalf') })}
            </div>
            <div className="text-sm text-gray-500">/ {game.finalInning}</div>
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold">{game.homeScore}</div>
            <div className="text-gray-600">{game.homeTeamName}</div>
          </div>
        </div>
        <div className="flex justify-center gap-8 mt-4">
          <div className="flex items-center gap-2">
            <span>{t('outs')}:</span>
            {[1, 2, 3].map(n => (
              <span key={n}
                className={`w-6 h-6 rounded-full ${game.outs >= n ? 'bg-red-500' : 'bg-gray-300'}`} />
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>{t('balls')}: {game.balls || 0}</span>
            <span>{t('strikes')}: {game.strikes || 0}</span>
          </div>
        </div>
      </div>

      {/* 垒上局面 */}
      <div className="bg-white rounded shadow p-4 mb-4">
        <h2 className="text-lg font-bold mb-4 text-center">{t('baseState')}</h2>
        <div className="flex justify-center">
          <svg width="220" height="220" viewBox="0 0 200 200">
            {[1, 2, 3].map(base => {
              const occupant = runners.find(r => r.base === base)
              const [cx, cy] = BASE_POS[base]
              return (
                <polygon
                  key={base}
                  points={`${cx},${cy - 15} ${cx + 15},${cy} ${cx},${cy + 15} ${cx - 15},${cy}`}
                  fill={occupant ? '#dc2626' : '#fff'}
                  stroke="#000" strokeWidth="2" />
              )
            })}
            <circle cx="100" cy="100" r="10" fill="#e5e7eb" stroke="#000" strokeWidth="2" />
          </svg>
        </div>
        <div className="text-center mt-3 text-sm">
          {runners.length === 0
            ? <span className="text-gray-500">{t('basesEmpty')}</span>
            : runners.map(r => (
                <span key={r.playerId ?? r.base}
                  className="inline-block mr-2 px-2 py-1 rounded bg-red-50 text-red-700">
                  {r.base}B {nameOf(r.playerId) ?? '—'}
                </span>
              ))}
        </div>
      </div>

      {/* 当前打者 */}
      <div className="bg-white rounded shadow p-4 mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold mb-1">{t('currentBatter')}</h2>
          <div className="text-2xl font-bold">
            {currentBatter ? nameOf(currentBatter) : <span className="text-gray-400">{t('noLineup')}</span>}
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="text-gray-500">{t('pitcher')}</div>
          <div className="font-bold">{currentPitcher ? nameOf(currentPitcher) : '—'}</div>
        </div>
      </div>

      {/* 记分按钮 */}
      {writable ? (
        <div className="bg-white rounded shadow p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{t('recordResult')}</h2>
            <button onClick={toggleQuick}
              className={`px-3 py-1 rounded text-sm ${quickMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {quickMode ? t('quickMode') : t('fullMode')}
            </button>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {panelResults.map(r => (
              <button key={r.value} onClick={() => record(r.value)} disabled={busy}
                className={`${quickMode ? 'p-4 text-lg' : 'p-3'} rounded font-bold text-white disabled:opacity-50
                  ${RESULT_CATEGORIES.outs.items.includes(r.value) ? 'bg-gray-700 hover:bg-gray-600'
                    : RESULT_CATEGORIES.walks.items.includes(r.value) ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-green-800 hover:bg-green-700'}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        !isDone && (
          <div className="bg-gray-100 text-gray-600 rounded p-3 mb-4 text-center">{t('cannotRecord')}</div>
        )
      )}

      {/* 操作 */}
      {isLive && (
        <div className="flex flex-wrap gap-3 mb-4">
          {canWrite('games') && (
            <>
              <button onClick={endHalf} className="bg-blue-800 text-white px-4 py-2 rounded">
                {t('endHalf')}
              </button>
              <button onClick={endGame} className="bg-red-800 text-white px-4 py-2 rounded">
                {t('endGame')}
              </button>
            </>
          )}
          <button onClick={() => setShowSubs(v => !v)}
            className="bg-gray-700 text-white px-4 py-2 rounded">
            {t('substitution')} ({subs.length})
          </button>
        </div>
      )}

      {/* 换人记录 */}
      {showSubs && (
        <div className="bg-white rounded shadow p-4 mb-4">
          <h2 className="text-lg font-bold mb-3">{t('substitution')}</h2>
          {subs.length === 0
            ? <p className="text-gray-500 text-sm">{t('noSubstitutions')}</p>
            : (
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">{t('inningCol')}</th>
                    <th className="p-2 text-left">{t('type')}</th>
                    <th className="p-2 text-left">{t('name')}</th>
                    <th className="p-2 text-left">{t('substitutionReason')}</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map(s => (
                    <tr key={s.id} className="border-t">
                      <td className="p-2">{s.inning}{s.half === 'top' ? t('topHalf') : t('bottomHalf')}</td>
                      <td className="p-2">{s.type === 'PINCH_RUN' ? t('pinchRun') : t('pinchHit')}</td>
                      <td className="p-2">{s.originalPlayerName} → {s.substitutePlayerName}</td>
                      <td className="p-2 text-gray-600">{s.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      )}

      {/* 阵容确认与打印 */}
      <div className="bg-white rounded shadow p-4 mt-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">{t('changeLineup')}</h2>
          {canWrite('games') && (
            <div className="flex gap-2">
              <button onClick={() => setShowPrint(true)}
                className="bg-blue-800 text-white px-3 py-1 rounded text-sm">{t('preview')}</button>
            </div>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {['home', 'away'].map(side => {
            const lineup = side === 'home' ? game.homeLineup : game.awayLineup
            const confirmed = side === 'home' ? game.homeConfirmed : game.awayConfirmed
            const teamName = side === 'home' ? game.homeTeamName : game.awayTeamName
            return (
              <div key={side} className="border rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">{side === 'home' ? t('homeTeam') : t('awayTeam')}: {teamName}</h3>
                  {confirmed
                    ? <span className="text-green-700 text-sm font-bold">{t('lineupConfirmed')}</span>
                    : <span className="text-gray-400 text-sm">—</span>}
                </div>
                <ol className="text-sm space-y-1 mb-3">
                  {(lineup || []).length === 0
                    ? <li className="text-gray-400">{t('noLineup')}</li>
                    : lineup.map((pid, i) => (
                        <li key={`${side}-${i}`} className="flex gap-2">
                          <span className="text-gray-400 w-6">{i + 1}.</span>
                          <span>{nameOf(pid) ?? '—'}</span>
                        </li>
                      ))}
                </ol>
                {canWrite('games') && !isDone && (
                  confirmed ? (
                    <button onClick={() => reopenLineup(side)}
                      className="text-xs text-gray-500 underline">{t('edit')}</button>
                  ) : (
                    <button onClick={() => doConfirmLineup(side)}
                      className="bg-green-800 text-white px-3 py-1 rounded text-sm">
                      {t('confirmLineup')}
                    </button>
                  )
                )}
              </div>
            )
          })}
        </div>
        {showPrint && (
          <div className="fixed inset-0 bg-black/50 overflow-auto p-8 z-50">
            <div className="bg-white max-w-3xl mx-auto">
              <div className="flex justify-end p-3 no-print">
                <button onClick={() => setShowPrint(false)}
                  className="px-3 py-1 rounded bg-gray-200">✕</button>
              </div>
              <LineupPrintCard game={game} players={players} teamSide="away" />
              <LineupPrintCard game={game} players={players} teamSide="home" />
            </div>
          </div>
        )}
      </div>

      {/* 打席记录 */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-bold mb-4">{t('plateAppearances')}</h2>
        {(game.plateAppearances || []).length === 0
          ? <p className="text-gray-500 text-sm">—</p>
          : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">{t('inningCol')}</th>
                  <th className="p-2 text-left">{t('batterCol')}</th>
                  <th className="p-2 text-left">{t('pitcherCol')}</th>
                  <th className="p-2 text-left">{t('resultCol')}</th>
                  <th className="p-2 text-left">{t('rbiCol')}</th>
                </tr>
              </thead>
              <tbody>
                {game.plateAppearances.map(pa => (
                  <tr key={pa.id} className="border-t">
                    <td className="p-2">{pa.inning}{pa.half === 'top' ? t('topHalf') : t('bottomHalf')}</td>
                    <td className="p-2">{pa.batterName || '—'}</td>
                    <td className="p-2">{pa.pitcherName || '—'}</td>
                    <td className="p-2 font-bold">{RESULT_LABELS[pa.result] || pa.result}</td>
                    <td className="p-2">{pa.rbi || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  )
}

export default GameLive
