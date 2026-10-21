import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { LineupPrintCard } from '../components/LineupPrintCard'
import { PageHeader, Panel, Button, EmptyState, SegmentedControl } from '../components/ui'

/**
 * 比赛列表页
 */

function Games() {
  const { t } = useApp()
  const { canWrite } = useAuth()

  const [games, setGames] = useState([])
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [teamFilter, setTeamFilter] = useState('')
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [printGame, setPrintGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formError, setFormError] = useState(null)
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    homeTeamId: '', awayTeamId: '',
    finalInning: 6, runLimit: 0,
    homeLineup: [], awayLineup: [],
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [g, tm, p] = await Promise.all([api.getGames(), api.getTeams(), api.getPlayers()])
      setGames(g); setTeams(tm); setPlayers(p)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return games
      .filter(g => statusFilter === 'all' || g.status === statusFilter)
      .filter(g => !teamFilter || String(g.homeTeamId) === teamFilter || String(g.awayTeamId) === teamFilter)
      .filter(g => {
        if (!q) return true
        return [g.homeTeamName, g.awayTeamName, g.date]
          .some(v => String(v || '').toLowerCase().includes(q))
      })
  }, [games, statusFilter, teamFilter, query])

  const teamPlayers = teamId => players.filter(p => String(p.teamId) === String(teamId))

  const toggleLineupPlayer = (side, pid) => {
    setForm(f => {
      const key = side === 'home' ? 'homeLineup' : 'awayLineup'
      const list = f[key]
      const next = list.includes(pid) ? list.filter(x => x !== pid) : [...list, pid]
      return { ...f, [key]: next }
    })
  }

  const submit = async e => {
    e.preventDefault()
    setFormError(null)
    if (!form.homeTeamId || !form.awayTeamId) {
      setFormError(t('selectHomeTeam')); return
    }
    if (form.homeTeamId === form.awayTeamId) {
      setFormError(t('sameTeamError')); return
    }
    if (!form.date) {
      setFormError(t('dateRequired')); return
    }
    try {
      await api.createGame({
        date: form.date,
        homeTeamId: Number(form.homeTeamId),
        awayTeamId: Number(form.awayTeamId),
        finalInning: Number(form.finalInning) || 6,
        runLimit: Number(form.runLimit) || 0,
        homeLineup: form.homeLineup,
        awayLineup: form.awayLineup,
      })
      setShowForm(false)
      setForm(f => ({ ...f, homeLineup: [], awayLineup: [] }))
      loadData()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const startGame = async id => {
    try {
      await api.updateGame(id, { status: 'in_progress' })
      loadData()
    } catch (err) { console.error(err) }
  }

  const removeGame = async id => {
    if (!window.confirm(t('confirmDeleteGame'))) return
    try {
      await api.deleteGame(id)
      loadData()
    } catch (err) { console.error(err) }
  }

  const statusTone = status => ({
    scheduled: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-sky-100 text-sky-700',
    completed: 'bg-emerald-100 text-emerald-700',
  }[status] || 'bg-gray-100 text-gray-600')

  const statusLabel = status => ({
    scheduled: t('statusScheduled'),
    in_progress: t('statusInProgress'),
    completed: t('statusCompleted'),
  }[status] || status)

  const lineupPicker = (side, label) => (
    <div>
      <div className="text-xs font-semibold text-gray-600 mb-1">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {teamPlayers(side === 'home' ? form.homeTeamId : form.awayTeamId).map(p => {
          const list = side === 'home' ? form.homeLineup : form.awayLineup
          const idx = list.indexOf(p.id)
          return (
            <button key={p.id} type="button"
              onClick={() => toggleLineupPlayer(side, p.id)}
              className={`px-2 py-1 rounded-lg text-xs border transition-colors
                ${idx >= 0 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
              {idx >= 0 ? `${idx + 1}. ` : ''}{p.number} {p.name}
            </button>
          )
        })}
        {teamPlayers(side === 'home' ? form.homeTeamId : form.awayTeamId).length === 0 && (
          <span className="text-xs text-gray-400">{t('noTeam')}</span>
        )}
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader
        title={t('gameManagement')}
        subtitle={t('gameManagementSubtitle')}
        actions={canWrite('games') && (
          <Button onClick={() => setShowForm(v => !v)}>{t('createGame')}</Button>
        )}
      />

      {showForm && canWrite('games') && (
        <Panel title={t('createGame')} className="mb-4">
          <form onSubmit={submit}>
            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-2 mb-3 text-sm">
                {formError}
              </div>
            )}
            <div className="grid md:grid-cols-4 gap-3 mb-4">
              <label className="block">
                <span className="text-xs text-gray-600 font-medium">{t('date')}</span>
                <input type="date" value={form.date} required
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-600 font-medium">{t('homeTeam')}</span>
                <select value={form.homeTeamId}
                  onChange={e => setForm({ ...form, homeTeamId: e.target.value, homeLineup: [] })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">{t('selectHomeTeam')}</option>
                  {teams.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-gray-600 font-medium">{t('awayTeam')}</span>
                <select value={form.awayTeamId}
                  onChange={e => setForm({ ...form, awayTeamId: e.target.value, awayLineup: [] })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">{t('selectAwayTeam')}</option>
                  {teams.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs text-gray-600 font-medium">{t('finalInning')}</span>
                  <input type="number" min="1" max="20" value={form.finalInning}
                    onChange={e => setForm({ ...form, finalInning: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-600 font-medium">{t('runLimit')}</span>
                  <input type="number" min="0" max="20" value={form.runLimit}
                    onChange={e => setForm({ ...form, runLimit: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </label>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-2">{t('runLimitHint')} · {t('lineupHint')}</p>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {lineupPicker('home', t('homeLineup'))}
              {lineupPicker('away', t('awayLineup'))}
            </div>

            <div className="flex gap-2">
              <Button type="submit">{t('save')}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>{t('cancel')}</Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel dense className="mb-4">
        <div className="p-4 flex flex-wrap items-center gap-3">
          <SegmentedControl
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: t('statusAll') },
              { value: 'scheduled', label: t('statusScheduled') },
              { value: 'in_progress', label: t('statusInProgress') },
              { value: 'completed', label: t('statusCompleted') },
            ]}
          />
          <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
            <option value="">{t('allTeams')}</option>
            {teams.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
          </select>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[12rem]" />
        </div>
      </Panel>

      {loading && <Panel><div className="py-10 text-center text-gray-400">…</div></Panel>}

      {!loading && filtered.length === 0 && (
        <Panel><EmptyState icon="⚾" title={t('noGames')} hint={t('noGamesHint')} /></Panel>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(g => {
            const runnerCount = (g.runners || []).length
            return (
              <Panel key={g.id} dense>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500">{g.date}</div>
                      <div className="font-bold text-gray-800 truncate">
                        {g.awayTeamName || t('noTeam')} <span className="text-gray-400 font-normal">vs</span> {g.homeTeamName || t('noTeam')}
                      </div>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${statusTone(g.status)}`}>
                      {statusLabel(g.status)}
                    </span>
                  </div>

                  {(g.status !== 'scheduled') && (
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-3xl font-black tabular-nums text-gray-800">
                        {g.awayScore}<span className="text-gray-300 mx-1">:</span>{g.homeScore}
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <div>{t('inningShort', {
                          inning: g.currentInning,
                          half: t(g.currentHalf === 'top' ? 'topHalf' : 'bottomHalf'),
                        })}</div>
                        <div>{t('outsShort', { outs: g.outs })}</div>
                        {runnerCount > 0 && <div>{t('runnersOnShort', { n: runnerCount })}</div>}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3 text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                      {t('finalInning')}: {g.finalInning}
                    </span>
                    {g.runLimit > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                        {t('runLimit')}: {g.runLimit}
                      </span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded ${g.homeConfirmed && g.awayConfirmed
                      ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {g.homeConfirmed && g.awayConfirmed ? t('lineupConfirmed') : t('lineupNotConfirmed')}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {g.status === 'scheduled' && canWrite('games') && (
                      <Button size="sm" onClick={() => startGame(g.id)}>{t('startGame')}</Button>
                    )}
                    {g.status === 'in_progress' && (
                      <Link to={`/game/${g.id}`}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-600">
                        {t('scoring')}
                      </Link>
                    )}
                    {g.status === 'completed' && (
                      <Link to={`/game/${g.id}`}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">
                        {t('view')}
                      </Link>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => setPrintGame(g)}>{t('printCard')}</Button>
                    {canWrite('games') && (
                      <Button size="sm" variant="ghost" onClick={() => removeGame(g.id)}>{t('delete')}</Button>
                    )}
                  </div>
                </div>
              </Panel>
            )
          })}
        </div>
      )}

      {/* 打印阵容卡 */}
      {printGame && (
        <div className="fixed inset-0 bg-black/50 overflow-auto p-6 z-50 print:hidden">
          <div className="bg-white max-w-4xl mx-auto rounded-xl">
            <div className="flex justify-between items-center p-3 border-b border-gray-100">
              <div>
                <div className="font-bold">{t('printCardTitle')}</div>
                <div className="text-xs text-gray-500">{t('printHint')}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => window.print()}>{t('print')}</Button>
                <Button size="sm" variant="secondary" onClick={() => setPrintGame(null)}>✕</Button>
              </div>
            </div>
            <div className="p-4">
              <LineupPrintCard game={printGame} players={players} teamSide="away" />
              <div className="my-4 border-t border-dashed border-gray-300" />
              <LineupPrintCard game={printGame} players={players} teamSide="home" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Games
