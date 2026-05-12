import { useState, useEffect } from 'react'
import { api } from '../utils/api'

function Stats() {
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [p, t] = await Promise.all([api.getPlayers(), api.getTeams()])
    setPlayers(p)
    setTeams(t)
  }

  const getPlayerStats = async (playerId) => {
    try {
      return await api.getPlayerStats(playerId)
    } catch {
      return null
    }
  }

  const playersWithStats = players.map(player => {
    const stats = {
      ab: player.ab || 0,
      h: player.h || 0,
      r: player.r || 0,
      rbi: player.rbi || 0,
      bb: player.bb || 0,
      so: player.so || 0,
      ba: player.ab > 0 ? (player.h / player.ab).toFixed(3) : '.000'
    }
    return { ...player, ...stats }
  })

  const filteredPlayers = selectedTeam
    ? playersWithStats.filter(p => p.teamId === parseInt(selectedTeam))
    : playersWithStats

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">数据统计</h1>

      <div className="mb-4">
        <select value={selectedTeam || ''} onChange={e => setSelectedTeam(e.target.value || null)}
          className="border p-2 rounded">
          <option value="">全部球队</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">球员</th>
              <th className="p-2 text-left">球队</th>
              <th className="p-2 text-center">打数(AB)</th>
              <th className="p-2 text-center">安打(H)</th>
              <th className="p-2 text-center">得分(R)</th>
              <th className="p-2 text-center">打点(RBI)</th>
              <th className="p-2 text-center">四坏球(BB)</th>
              <th className="p-2 text-center">三振(SO)</th>
              <th className="p-2 text-center">打击率(BA)</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map(player => {
              const team = teams.find(t => t.id === player.teamId)
              return (
                <tr key={player.id} className="border-t">
                  <td className="p-2 font-medium">{player.name}</td>
                  <td className="p-2 text-gray-600">{team?.name || '-'}</td>
                  <td className="p-2 text-center">{player.ab}</td>
                  <td className="p-2 text-center">{player.h}</td>
                  <td className="p-2 text-center">{player.r}</td>
                  <td className="p-2 text-center">{player.rbi}</td>
                  <td className="p-2 text-center">{player.bb}</td>
                  <td className="p-2 text-center">{player.so}</td>
                  <td className="p-2 text-center font-bold">{player.ba}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          暂无数据。请先添加球员并记录比赛。
        </div>
      )}
    </div>
  )
}

export default Stats