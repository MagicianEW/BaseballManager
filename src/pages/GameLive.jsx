import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../utils/api'
import { onSocket } from '../utils/socket'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { RESULT_LABELS, RESULT_CATEGORIES } from '../constants/baseball'
import { PageHeader, Panel, StatBadge, StatRow, StatTable, BoxScore, EmptyState, Button } from '../components/ui'

/**
 * 实时记分页
 *
 * 关键设计：比分、出局、垒上局面、球数好球全部由服务端计分引擎计算，
 * 前端只提交「打席事实」（打者、投手、结果、投球序列），不自行推算局面。
 * 此前前后端各算一遍再互相覆盖，是双重真相。
 */

const QUICK_RESULTS = ['HR', 'SO', 'BB', 'GO', 'FO', '1B']
const EXCLUDE_FROM_PANEL = ['SB', 'CS', 'PK', 'WP', 'BALK', 'PB', 'E', 'IBB']
const BASE_POS = { 1: [160, 165], 2: [100, 100], 3: [40, 35] }

function GameLive() {
  const { id } = useParams()
  const { t } = useApp()
  const { canWrite } = useAuth()

  const [game, setGame] = useState(null)
  const [players, setPlayers] = useState([])
  const [boxStats, setBoxStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [flash, setFlash] = useState(null)
  const [busy, setBusy] = useState(false)
  const [quickMode, setQuickMode] = useState(() => localStorage.getItem('quickMode') !== 'false')
  const [showSubs, setShowSubs] = useState(false)
  const [subs, setSubs] = useState([])
  const [pitches, setPitches] = useState([])

  const loadGame = useCallback(async () => {
    try {
      setError(null)
      const g = await api.getGame(id)
      setGame(g)
      if (g?.status === 'in_progress' || g?.status === 'completed') {
        api.getGameStats(id).then(setBoxStats).catch(() => {})
      }
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

  // 实时同步（替换此前的 2 秒轮询）
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

  // 下一位打者：按当前半局已有打席数在打线中轮转
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

  // 投球计数：好球满 2 后界外不再加好球
  const pitchCounts = useMemo(() => {
    let balls = 0, strikes = 0
    for (const p of pitches) {
      if (p === 'B') balls++
      else if (p === 'S') strikes++
      else if (p === 'F') { if (strikes < 2) strikes++ }
    }
    return { balls, strikes }
  }, [pitches])

  const addPitch = kind => {
    setPitches(p => {
      const next = [...p, kind]
      const b = next.filter(x => x === 'B').length
      const s = next.filter(x => x === 'S').length
      const f = next.filter(x => x === 'F').length
      if (b >= 4) return next   // 4 坏球 → 记为保送结果
      if (s + Math.min(f, 2) >= 3) return next
      return next
    })
  }

  const record = useCallback(async (result) => {
    if (!game || busy) return
    setBusy(true)
    try {
      const paCount = (game.plateAppearances || [])
        .filter(pa => pa.half === game.currentHalf && pa.inning === game.currentInning).length
      // 只发事实：局面与比分由服务端计分引擎计算
      const res = await api.games.addPlateAppearance(game.id, {
        inning: game.currentInning,
        half: game.currentHalf,
        paNumber: paCount + 1,
        batterId: currentBatter,
        pitcherId: currentPitcher,
        result,
        pitches: [...pitches, 'X'],
      })
      setPitches([])
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
  }, [game, currentBatter, currentPitcher, busy, loadGame, pitches, t])

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

  const allResults = useMemo(
    () => Object.entries(RESULT_LABELS)
      .filter(([key]) => !EXCLUDE_FROM_PANEL.includes(key))
      .map(([value, label]) => ({ value, label })),
    []
  )
  const panelResults = quickMode ? allResults.filter(r => QUICK_RESULTS.includes(r.value)) : allResults

  const toneFor = result => {
    if (RESULT_CATEGORIES.outs.items.includes(result)) return 'bg-gray-700 hover:bg-gray-600'
    if (RESULT_CATEGORIES.walks.items.includes(result)) return 'bg-amber-600 hover:bg-amber-500'
    if (result === 'HR') return 'bg-rose-700 hover:bg-rose-600'
    return 'bg-green-800 hover:bg-green-700'
  }

  if (loading) return <div className="p-10 text-center text-gray-400">{t('loading')}</div>
  if (error && !game) return <div className="p-10 text-center text-rose-600">{error}</div>
  if (!game) return <EmptyState icon="⚾" title={t('gameNotFound')} />

  const isLive = game.status === 'in_progress'
  const isDone = game.status === 'completed'
  const writable = canWrite('games') && isLive
  const halfLabel = t(game.currentHalf === 'top' ? 'topHalf' : 'bottomHalf')

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={`${game.awayTeamName} vs ${game.homeTeamName}`}
        subtitle={game.date}
        actions={<Link to="/games" className="text-sm text-blue-700 hover:underline">← {t('backToList')}</Link>}
      />

      {!isLive && !isDone && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 mb-4 text-sm">
          {t('notStartedHint')}
        </div>
      )}
      {isDone && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 mb-4 text-sm font-semibold">
          {t('statusCompleted')}
        </div>
      )}
      {flash && (
        <div className="bg-emerald-600 text-white rounded-xl p-3 mb-4 text-center font-bold shadow">
          {flash}
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 mb-4 text-sm">{error}</div>
      )}

      {/* 比分板 —— 记分员最常看的地方，做成强对比的大号显示 */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl shadow-lg p-5 mb-4">
        <div className="flex justify-between items-center text-center">
          <div className="flex-1">
            <div className="text-5xl font-black tabular-nums leading-none">{game.awayScore}</div>
            <div className="text-sm text-slate-300 mt-1.5 truncate">{game.awayTeamName}</div>
          </div>
          <div className="px-4">
            <div className="text-xl font-bold text-slate-200 whitespace-nowrap">
              {t('inningShort', { inning: game.currentInning, half: halfLabel })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">/ {game.finalInning} {t('inningCol')}</div>
          </div>
          <div className="flex-1">
            <div className="text-5xl font-black tabular-nums leading-none">{game.homeScore}</div>
            <div className="text-sm text-slate-300 mt-1.5 truncate">{game.homeTeamName}</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{t('outs')}</span>
            {[1, 2, 3].map(n => (
              <span key={n}
                className={`w-5 h-5 rounded-full border border-slate-600 ${game.outs >= n ? 'bg-rose-500' : 'bg-slate-700'}`} />
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm tabular-nums">
            <span><span className="text-slate-400 text-xs">{t('balls')}</span> {pitchCounts.balls}</span>
            <span><span className="text-slate-400 text-xs">{t('strikes')}</span> {pitchCounts.strikes}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        {/* 垒上局面 */}
        <Panel title={t('baseState')}>
          <div className="flex justify-center">
            <svg width="220" height="200" viewBox="0 0 200 200">
              {/* 标准菱形：本垒左下、一垒右下、二垒右上、三垒左上 */}
              {[1, 2, 3].map(base => {
                const occupant = runners.find(r => r.base === base)
                const [cx, cy] = BASE_POS[base]
                return (
                  <polygon
                    key={base}
                    points={`${cx},${cy - 13} ${cx + 13},${cy} ${cx},${cy + 13} ${cx - 13},${cy}`}
                    fill={occupant ? '#dc2626' : '#f1f5f9'}
                    stroke="#334155" strokeWidth="2" />
                )
              })}
              <circle cx="100" cy="100" r="9" fill="#e2e8f0" stroke="#334155" strokeWidth="2" />
            </svg>
          </div>
          <div className="mt-3 text-center text-sm">
            {runners.length === 0
              ? <span className="text-gray-400">{t('basesEmpty')}</span>
              : runners.map(r => (
                <span key={`${r.base}-${r.playerId}`}
                  className="inline-block mr-1.5 mb-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-medium">
                  {r.base}B {nameOf(r.playerId) ?? '—'}
                </span>
              ))}
          </div>
        </Panel>

        {/* 当前打者 / 投手 */}
        <Panel title={t('currentBatter')}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">{t('currentBatter')}</div>
              <div className="text-xl font-bold text-gray-800">
                {currentBatter ? nameOf(currentBatter) : <span className="text-gray-400">{t('noLineup')}</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">{t('currentPitcher')}</div>
              <div className="text-xl font-bold text-gray-800">
                {currentPitcher ? nameOf(currentPitcher) : '—'}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
            <span>{t('finalInning')}: {game.finalInning}</span>
            <span>{t('runLimit')}: {game.runLimit > 0 ? game.runLimit : '—'}</span>
            <span>{t('outs')}: {game.outs}/3</span>
          </div>
        </Panel>
      </div>

      {/* 记分按钮 */}
      {writable && (
        <Panel
          title={t('recordResult')}
          actions={
            <button onClick={toggleQuick}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${quickMode ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {quickMode ? t('quickMode') : t('fullMode')}
            </button>
          }>
          {/* 投球计数 */}
          <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-gray-100">
            <span className="text-xs text-gray-500 font-medium">{t('pitchCount')}:</span>
            <span className="text-sm font-bold tabular-nums mr-2">
              {pitchCounts.balls}-{pitchCounts.strikes}
            </span>
            <button onClick={() => addPitch('B')} disabled={busy}
              className="px-3 py-1 rounded-lg bg-slate-700 text-white text-xs font-medium hover:bg-slate-600 disabled:opacity-50">
              {t('ballShort')}
            </button>
            <button onClick={() => addPitch('S')} disabled={busy}
              className="px-3 py-1 rounded-lg bg-slate-700 text-white text-xs font-medium hover:bg-slate-600 disabled:opacity-50">
              {t('strikeShort')}
            </button>
            <button onClick={() => addPitch('F')} disabled={busy}
              className="px-3 py-1 rounded-lg bg-slate-700 text-white text-xs font-medium hover:bg-slate-600 disabled:opacity-50">
              {t('foulShort')}
            </button>
            {pitches.length > 0 && (
              <button onClick={() => setPitches([])}
                className="px-2 py-1 rounded-lg text-xs text-gray-500 hover:bg-gray-100">
                {t('clearPitch')}
              </button>
            )}
            <span className="text-[11px] text-gray-400 ml-auto">
              {pitches.length > 0 ? pitches.join(' · ') : ''}
            </span>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {panelResults.map(r => (
              <button key={r.value} onClick={() => record(r.value)} disabled={busy}
                className={`${quickMode ? 'p-4 text-lg' : 'p-3 text-sm'} rounded-xl font-bold text-white
                  transition-colors disabled:opacity-50 ${toneFor(r.value)}`}>
                {r.label}
              </button>
            ))}
          </div>
        </Panel>
      )}

      {!writable && !isDone && (
        <Panel><div className="py-6 text-center text-gray-500 text-sm">{t('cannotRecord')}</div></Panel>
      )}

      {/* 操作 */}
      {isLive && (
        <div className="flex flex-wrap gap-2 mb-4">
          {canWrite('games') && (
            <>
              <Button variant="info" onClick={endHalf}>{t('endHalf')}</Button>
              <Button variant="danger" onClick={endGame}>{t('endGame')}</Button>
            </>
          )}
          <Button variant="secondary" onClick={() => setShowSubs(v => !v)}>
            {t('substitution')} ({subs.length})
          </Button>
        </div>
      )}

      {/* 逐局比分表 */}
      {boxStats?.lineScore && (
        <Panel title={t('boxScore')} className="mb-4" dense>
          <BoxScore
            lineScore={boxStats.lineScore}
            totals={boxStats.totals}
            awayName={game.awayTeamName}
            homeName={game.homeTeamName} />
        </Panel>
      )}

      {/* 阵容 */}
      <Panel title={t('changeLineup')} className="mb-4">
        <div className="grid md:grid-cols-2 gap-4">
          {['home', 'away'].map(side => {
            const lineup = side === 'home' ? game.homeLineup : game.awayLineup
            const confirmed = side === 'home' ? game.homeConfirmed : game.awayConfirmed
            const teamName = side === 'home' ? game.homeTeamName : game.awayTeamName
            const pitcherId = side === 'home' ? game.homePitcherId : game.awayPitcherId
            return (
              <div key={side} className="border border-gray-200 rounded-xl p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-sm">
                    {side === 'home' ? t('homeTeam') : t('awayTeam')}: {teamName}
                  </h3>
                  {confirmed
                    ? <span className="text-emerald-700 text-xs font-bold">{t('lineupConfirmed')}</span>
                    : <span className="text-gray-400 text-xs">—</span>}
                </div>
                <ol className="text-sm space-y-0.5 mb-3">
                  {(lineup || []).length === 0
                    ? <li className="text-gray-400">{t('noLineup')}</li>
                    : lineup.map((pid, i) => (
                        <li key={`${side}-${i}`} className="flex gap-2">
                          <span className="text-gray-400 w-5 tabular-nums">{i + 1}.</span>
                          <span>{nameOf(pid) ?? '—'}</span>
                        </li>
                      ))}
                </ol>
                <div className="text-xs text-gray-500 mb-2">
                  {t('pitcher')}: {pitcherId ? nameOf(pitcherId) : '—'}
                </div>
                {canWrite('games') && !isDone && (
                  confirmed ? (
                    <button onClick={async () => {
                      try { await api.games.reopenLineup(game.id, side); await loadGame() } catch (e) { setError(e.message) }
                    }}
                      className="text-xs text-gray-500 underline">{t('unlockLineup')}</button>
                  ) : (
                    <button onClick={async () => {
                      try { await api.games.confirmLineup(game.id, side); await loadGame() } catch (e) { setError(e.message) }
                    }}
                      className="px-3 py-1 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-600">
                      {t('confirmLineup')}
                    </button>
                  )
                )}
              </div>
            )
          })}
        </div>
      </Panel>

      {/* 换人记录 */}
      {showSubs && (
        <Panel title={t('substitution')} className="mb-4">
          {subs.length === 0
            ? <p className="text-gray-400 text-sm">{t('noSubstitutions')}</p>
            : (
              <StatTable
                compact
                rows={subs}
                rowKey={s => s.id}
                columns={[
                  { key: 'inning', label: t('inningCol'), align: 'center', render: s => `${s.inning}${s.half === 'top' ? t('topHalf') : t('bottomHalf')}` },
                  { key: 'type', label: t('substitution'), render: s => (s.type === 'PINCH_RUN' ? t('pinchRun') : t('pinchHit')) },
                  { key: 'players', label: t('playerName'), sortable: false, render: s => `${s.originalPlayerName || '—'} → ${s.substitutePlayerName || '—'}` },
                  { key: 'reason', label: t('substitutionReason'), sortable: false, render: s => s.reason || '—' },
                ]} />
            )}
        </Panel>
      )}

      {/* 打席记录 */}
      <Panel title={t('plateAppearances')} dense>
        {(game.plateAppearances || []).length === 0
          ? <div className="py-6 text-center text-gray-400 text-sm">—</div>
          : (
            <StatTable
              compact
              rows={game.plateAppearances}
              rowKey={pa => pa.id}
              columns={[
                { key: 'inning', label: t('inningCol'), align: 'center', render: pa => `${pa.inning}${pa.half === 'top' ? t('topHalf') : t('bottomHalf')}` },
                { key: 'batterName', label: t('batterCol'), render: pa => pa.batterName || '—' },
                { key: 'pitcherName', label: t('pitcherCol'), render: pa => pa.pitcherName || '—' },
                { key: 'result', label: t('resultCol'), render: pa => (
                  <span className="font-bold">{RESULT_LABELS[pa.result] || pa.result}</span>
                ) },
                { key: 'rbi', label: t('rbiCol'), align: 'right', render: pa => pa.rbi || 0 },
              ]} />
          )}
      </Panel>
    </div>
  )
}

export default GameLive
