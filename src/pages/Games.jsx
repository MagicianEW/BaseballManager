import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'

function Games() {
  const { canWrite } = useAuth()
  const { t } = useApp()
  const [games, setGames] = useState([])
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: '', homeTeamId: '', awayTeamId: '',
    homeLineup: Array(9).fill(''),
    awayLineup: Array(9).fill(''),
    homePitcherId: '', awayPitcherId: ''
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [g, t, p] = await Promise.all([
      api.games.getAll(),
      api.teams.getAll(),
      api.players.getAll()
    ])
    setGames(g)
    setTeams(t)
    setPlayers(p)
  }

  const getTeamPlayers = (teamId) => players.filter(p => p.teamId === parseInt(teamId))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canWrite('games')) return
    const { homeLineup, awayLineup, homePitcherId, awayPitcherId, ...rest } = form
    const data = {
      ...rest,
      homeLineup: homeLineup.filter(id => id),
      awayLineup: awayLineup.filter(id => id),
      homePitcherId: parseInt(homePitcherId) || null,
      awayPitcherId: parseInt(awayPitcherId) || null
    }
    await api.games.create(data)
    setShowForm(false)
    loadData()
  }

  const handleLineupChange = (team, index, playerId) => {
    const key = team === 'home' ? 'homeLineup' : 'awayLineup'
    const newLineup = [...form[key]]
    newLineup[index] = playerId ? parseInt(playerId) : ''
    setForm({ ...form, [key]: newLineup })
  }

  const getPlayerName = (id) => {
    const player = players.find(p => p.id === parseInt(id))
    return player ? `${player.number} ${player.name}` : '-'
  }

  const handleDelete = async (id) => {
    if (!canWrite('games')) return
    if (confirm(t('confirmDeleteGame'))) {
      await api.games.delete(id)
      loadData()
    }
  }

  const startGame = async (id) => {
    if (!canWrite('games')) return
    await api.games.update(id, { status: 'in_progress' })
    loadData()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t('gameManagement')}</h1>
        {canWrite('games') && (
          <button onClick={() => setShowForm(!showForm)}
            className="bg-green-800 text-white px-4 py-2 rounded">
            {showForm ? t('cancel') : t('createGame')}
          </button>
        )}
      </div>

      {showForm && canWrite('games') && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              className="border p-2 rounded" required />
            <div className="flex gap-4">
              <select value={form.homeTeamId} onChange={e => setForm({ ...form, homeTeamId: e.target.value })}
                className="border p-2 rounded flex-1">
                <option value="">{t('homeTeam')}</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select value={form.awayTeamId} onChange={e => setForm({ ...form, awayTeamId: e.target.value })}
                className="border p-2 rounded flex-1">
                <option value="">{t('awayTeam')}</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-medium mb-2">{t('homeStartingPitcher')}</label>
              <select value={form.homePitcherId} onChange={e => setForm({ ...form, homePitcherId: e.target.value })}
                className="border p-2 rounded w-full">
                <option value="">{t('selectPitcher')}</option>
                {getTeamPlayers(form.homeTeamId).map(p => (
                  <option key={p.id} value={p.id}>{p.number} {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-2">{t('awayStartingPitcher')}</label>
              <select value={form.awayPitcherId} onChange={e => setForm({ ...form, awayPitcherId: e.target.value })}
                className="border p-2 rounded w-full">
                <option value="">{t('selectPitcher')}</option>
                {getTeamPlayers(form.awayTeamId).map(p => (
                  <option key={p.id} value={p.id}>{p.number} {p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-2">{t('homeLineup')}</label>
              {form.homeLineup.map((id, i) => (
                <select key={i} value={id} onChange={e => handleLineupChange('home', i, e.target.value)}
                  className="border p-2 rounded w-full mb-1">
                  <option value="">{t('battingOrderSlot').replace('{order}', i + 1)}</option>
                  {getTeamPlayers(form.homeTeamId).map(p => (
                    <option key={p.id} value={p.id}>{p.number} {p.name}</option>
                  ))}
                </select>
              ))}
            </div>
            <div>
              <label className="block font-medium mb-2">{t('awayLineup')}</label>
              {form.awayLineup.map((id, i) => (
                <select key={i} value={id} onChange={e => handleLineupChange('away', i, e.target.value)}
                  className="border p-2 rounded w-full mb-1">
                  <option value="">{t('battingOrderSlot').replace('{order}', i + 1)}</option>
                  {getTeamPlayers(form.awayTeamId).map(p => (
                    <option key={p.id} value={p.id}>{p.number} {p.name}</option>
                  ))}
                </select>
              ))}
            </div>
          </div>

          <button type="submit" className="mt-4 bg-green-800 text-white px-4 py-2 rounded">
            {t('createGame')}
          </button>
        </form>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">{t('date')}</th>
              <th className="p-2 text-left">{t('score')}</th>
              <th className="p-2 text-left">{t('status')}</th>
              <th className="p-2 text-left">{t('action')}</th>
            </tr>
          </thead>
          <tbody>
            {games.map(game => (
              <tr key={game.id} className="border-t">
                <td className="p-2">{game.date}</td>
                <td className="p-2">
                  <span className="text-gray-600">{game.awayTeamName}</span>
                  <span className="mx-2 font-bold">{game.awayScore}</span>
                  <span className="text-gray-400">-</span>
                  <span className="mx-2 font-bold">{game.homeScore}</span>
                  <span className="text-gray-600">{game.homeTeamName}</span>
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    game.status === 'completed' ? 'bg-green-100 text-green-800' :
                    game.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {game.status === 'completed' ? t('completed') : game.status === 'in_progress' ? t('inProgress') : t('notStarted')}
                  </span>
                </td>
                <td className="p-2">
                  {game.status === 'scheduled' && canWrite('games') && (
                    <button onClick={() => startGame(game.id)} className="text-blue-600 mr-2">{t('gameStart')}</button>
                  )}
                  {game.status === 'in_progress' && (
                    <Link to={`/game/${game.id}`} className="text-green-600 mr-2">{t('scoring')}</Link>
                  )}
                  {canWrite('games') && (
                    <button onClick={() => handleDelete(game.id)} className="text-red-600">{t('delete')}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Games