import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { AGE_GROUPS, SQUAD_LEVEL_LABELS } from '../constants/baseball'

/**
 * 梯队管理页面
 */
function Squads() {
  const [squads, setSquads] = useState([])
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [selectedSquad, setSelectedSquad] = useState(null)
  const [squadPlayers, setSquadPlayers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '',
    teamId: '',
    level: 1,
    ageGroup: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [s, t, p] = await Promise.all([
      api.squads.getAll(),
      api.teams.getAll(),
      api.players.getAll()
    ])
    setSquads(s)
    setTeams(t)
    setPlayers(p)
  }

  const loadSquadPlayers = async (squadId) => {
    const players = await api.squads.getPlayers(squadId)
    setSquadPlayers(players)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editing) {
      await api.squads.update(editing.id, form)
    } else {
      await api.squads.create(form)
    }
    resetForm()
    loadData()
  }

  const resetForm = () => {
    setForm({ name: '', teamId: '', level: 1, ageGroup: '' })
    setEditing(null)
    setShowForm(false)
  }

  const startEdit = (squad) => {
    setEditing(squad)
    setForm({
      name: squad.name,
      teamId: squad.teamId,
      level: squad.level,
      ageGroup: squad.ageGroup || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (confirm('确定删除此梯队？球员不会被删除，只会解除与梯队的关联。')) {
      await api.squads.delete(id)
      loadData()
      if (selectedSquad?.id === id) {
        setSelectedSquad(null)
        setSquadPlayers([])
      }
    }
  }

  const selectSquad = (squad) => {
    setSelectedSquad(squad)
    loadSquadPlayers(squad.id)
  }

  const handlePromotePlayer = async (player) => {
    // 获取当前球队的所有梯队
    const teamSquads = squads.filter(s => s.teamId === player.teamId)
    const currentSquadIndex = teamSquads.findIndex(s => s.id === player.squadId)
    const nextSquad = teamSquads[currentSquadIndex + 1]

    if (!nextSquad) {
      alert('该球员已在最高级别梯队')
      return
    }

    if (confirm(`确认将 ${player.name} 晋升到 ${nextSquad.name}？`)) {
      await api.players.promote(player.id, nextSquad.id)
      loadData()
      loadSquadPlayers(selectedSquad.id)
    }
  }

  // 按球队分组显示梯队
  const squadsByTeam = teams.map(team => ({
    team,
    squads: squads.filter(s => s.teamId === team.id)
  })).filter(g => g.squads.length > 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">梯队管理</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-800 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {showForm ? '取消' : '新建梯队'}
        </button>
      </div>

      {/* 创建/编辑表单 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">梯队名称</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="border p-2 rounded w-full"
                placeholder="如：U12、一队"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属球队</label>
              <select
                value={form.teamId}
                onChange={e => setForm({ ...form, teamId: e.target.value })}
                className="border p-2 rounded w-full"
                required
              >
                <option value="">选择球队</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">级别</label>
              <select
                value={form.level}
                onChange={e => setForm({ ...form, level: parseInt(e.target.value) })}
                className="border p-2 rounded w-full"
              >
                {Object.entries(SQUAD_LEVEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年龄组</label>
              <select
                value={form.ageGroup}
                onChange={e => setForm({ ...form, ageGroup: e.target.value })}
                className="border p-2 rounded w-full"
              >
                <option value="">选择年龄组</option>
                {AGE_GROUPS.map(ag => (
                  <option key={ag.code} value={ag.code}>{ag.label} - {ag.description}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="bg-green-800 text-white px-4 py-2 rounded">
              {editing ? '更新' : '创建'}梯队
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded">
                取消
              </button>
            )}
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 梯队列表 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded shadow">
            <div className="p-4 border-b">
              <h2 className="font-bold text-lg">梯队列表</h2>
            </div>
            <div className="p-4">
              {squadsByTeam.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无梯队，请先创建梯队</p>
              ) : (
                squadsByTeam.map(({ team, squads: teamSquads }) => (
                  <div key={team.id} className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-2">{team.name}</h3>
                    <div className="space-y-2">
                      {teamSquads.map(squad => (
                        <div
                          key={squad.id}
                          onClick={() => selectSquad(squad)}
                          className={`p-3 rounded cursor-pointer border ${
                            selectedSquad?.id === squad.id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <div className="font-medium">{squad.name}</div>
                          <div className="text-sm text-gray-500">
                            {SQUAD_LEVEL_LABELS[squad.level] || squad.level}级
                            {squad.ageGroup && ` · ${squad.ageGroup}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 梯队详情 */}
        <div className="lg:col-span-2">
          {selectedSquad ? (
            <div className="bg-white rounded shadow">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg">{selectedSquad.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedSquad.teamName} · {SQUAD_LEVEL_LABELS[selectedSquad.level]}级
                    {selectedSquad.ageGroup && ` · ${selectedSquad.ageGroup}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(selectedSquad)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(selectedSquad.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold mb-3">梯队球员 ({squadPlayers.length})</h3>
                {squadPlayers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">暂无球员</p>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">号码</th>
                        <th className="p-2 text-left">姓名</th>
                        <th className="p-2 text-left">位置</th>
                        <th className="p-2 text-left">投打</th>
                        <th className="p-2 text-left">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {squadPlayers.map(player => (
                        <tr key={player.id} className="border-t">
                          <td className="p-2">{player.number || '-'}</td>
                          <td className="p-2 font-medium">{player.name}</td>
                          <td className="p-2">
                            {player.positions ? JSON.parse(player.positions).join(', ') : '-'}
                          </td>
                          <td className="p-2">{player.throws}/{player.bats}</td>
                          <td className="p-2">
                            <button
                              onClick={() => handlePromotePlayer(player)}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              晋升
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded shadow p-8 text-center text-gray-500">
              点击左侧梯队查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Squads