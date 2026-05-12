import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { POSITIONS } from '../constants/baseball'

function Players() {
  const { canWrite } = useAuth()
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [squads, setSquads] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '', number: '', bats: 'R', throws: 'R',
    positions: [], height: '', weight: '', birthdate: '',
    teamId: '', squadId: '', photo: ''
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [p, t, s] = await Promise.all([
      api.players.getAll(),
      api.teams.getAll(),
      api.squads.getAll()
    ])
    setPlayers(p)
    setTeams(t)
    setSquads(s)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canWrite('players')) return
    const data = { ...form, positions: form.positions }
    if (editing) {
      await api.players.update(editing.id, data)
    } else {
      await api.players.create(data)
    }
    resetForm()
    loadData()
  }

  const resetForm = () => {
    setForm({
      name: '', number: '', bats: 'R', throws: 'R',
      positions: [], height: '', weight: '', birthdate: '',
      teamId: '', squadId: '', photo: ''
    })
    setEditing(null)
  }

  const handleDelete = async (id) => {
    if (!canWrite('players')) return
    if (confirm('确定删除？')) {
      await api.players.delete(id)
      loadData()
    }
  }

  const startEdit = (player) => {
    if (!canWrite('players')) return
    setEditing(player)
    setForm({
      name: player.name,
      number: player.number,
      bats: player.bats || 'R',
      throws: player.throws || 'R',
      positions: player.positions ? JSON.parse(player.positions) : [],
      height: player.height || '',
      weight: player.weight || '',
      birthdate: player.birthdate || '',
      teamId: player.teamId || '',
      squadId: player.squadId || '',
      photo: player.photo || ''
    })
  }

  const togglePosition = (pos) => {
    const newPos = form.positions.includes(pos)
      ? form.positions.filter(p => p !== pos)
      : [...form.positions, pos]
    setForm({ ...form, positions: newPos })
  }

  const handleTeamChange = (teamId) => {
    setForm({ ...form, teamId, squadId: '' })
  }

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId)
    return team ? team.name : '无球队'
  }

  const getSquadName = (squadId) => {
    if (!squadId) return '-'
    const squad = squads.find(s => s.id === squadId)
    return squad ? squad.name : '-'
  }

  const filteredSquads = squads.filter(s => !form.teamId || s.teamId === parseInt(form.teamId))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">球员管理</h1>

      {canWrite('players') && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <input type="text" placeholder="姓名" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} className="border p-2 rounded" required />
            <input type="text" placeholder="球衣号" value={form.number}
              onChange={e => setForm({ ...form, number: e.target.value })} className="border p-2 rounded" />
            <select value={form.bats} onChange={e => setForm({ ...form, bats: e.target.value })} className="border p-2 rounded">
              <option value="R">右打</option>
              <option value="L">左打</option>
              <option value="S">左右开</option>
            </select>
            <select value={form.throws} onChange={e => setForm({ ...form, throws: e.target.value })} className="border p-2 rounded">
              <option value="R">右手</option>
              <option value="L">左手</option>
            </select>
            <input type="text" placeholder="身高(cm)" value={form.height}
              onChange={e => setForm({ ...form, height: e.target.value })} className="border p-2 rounded" />
            <input type="text" placeholder="体重(kg)" value={form.weight}
              onChange={e => setForm({ ...form, weight: e.target.value })} className="border p-2 rounded" />
            <input type="date" value={form.birthdate}
              onChange={e => setForm({ ...form, birthdate: e.target.value })} className="border p-2 rounded" />
            <select value={form.teamId} onChange={e => handleTeamChange(e.target.value)} className="border p-2 rounded">
              <option value="">选择球队</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select value={form.squadId} onChange={e => setForm({ ...form, squadId: e.target.value })} className="border p-2 rounded">
              <option value="">选择梯队</option>
              {filteredSquads.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="block mb-2">守备位置：</label>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map(pos => (
                <button key={pos.code} type="button"
                  onClick={() => togglePosition(pos.code)}
                  className={`px-3 py-1 rounded ${form.positions.includes(pos.code) ? 'bg-green-800 text-white' : 'bg-gray-200'}`}>
                  {pos.code}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button type="submit" className="bg-green-800 text-white px-4 py-2 rounded">
              {editing ? '更新' : '添加'}球员
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded">
                取消
              </button>
            )}
          </div>
        </form>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">号码</th>
              <th className="p-2 text-left">姓名</th>
              <th className="p-2 text-left">球队</th>
              <th className="p-2 text-left">梯队</th>
              <th className="p-2 text-left">投打</th>
              <th className="p-2 text-left">位置</th>
              {canWrite('players') && <th className="p-2 text-left">操作</th>}
            </tr>
          </thead>
          <tbody>
            {players.map(player => (
              <tr key={player.id} className="border-t">
                <td className="p-2">{player.number || '-'}</td>
                <td className="p-2 font-medium">{player.name}</td>
                <td className="p-2">{getTeamName(player.teamId)}</td>
                <td className="p-2">{getSquadName(player.squadId)}</td>
                <td className="p-2">{player.throws}/{player.bats}</td>
                <td className="p-2">
                  {player.positions ? JSON.parse(player.positions).join(', ') : '-'}
                </td>
                {canWrite('players') && (
                  <td className="p-2">
                    <button onClick={() => startEdit(player)} className="text-blue-600 mr-2">编辑</button>
                    <button onClick={() => handleDelete(player.id)} className="text-red-600">删除</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Players