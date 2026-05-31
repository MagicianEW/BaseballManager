import { POSITIONS } from '../constants/baseball'

/**
 * 打印友好型阵容卡组件
 * 
 * @param {Object} props
 * @param {Object} props.game - 比赛数据
 * @param {Array} props.players - 球员列表
 * @param {string} props.teamSide - 'home' 或 'away'
 */
export function LineupPrintCard({ game, players, teamSide = 'home' }) {
  const teamName = teamSide === 'home' ? game.homeTeamName : game.awayTeamName
  const lineup = teamSide === 'home' 
    ? JSON.parse(game.homeLineup || '[]') 
    : JSON.parse(game.awayLineup || '[]')
  const pitcherId = teamSide === 'home' ? game.homePitcherId : game.awayPitcherId

  const getPlayerInfo = (playerId) => {
    if (!playerId) return { number: '-', name: '-' }
    const player = players.find(p => p.id === playerId)
    return player ? { number: player.number || '-', name: player.name || '-' } : { number: '-', name: '-' }
  }

  const getPositionName = (code) => {
    const pos = POSITIONS.find(p => p.code === code)
    return pos ? pos.name : code
  }

  return (
    <div className="lineup-print-card p-8 bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .lineup-print-card, .lineup-print-card * { visibility: visible; }
          .lineup-print-card { position: absolute; left: 0; top: 0; width: 100%; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>
      
      {/* 头部 */}
      <div className="text-center mb-6 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-bold mb-2">{teamName}</h1>
        <p className="text-xl">比赛日期: {game.date}</p>
      </div>

      {/* 先发阵容表 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-center border-b border-black pb-2">先发打线</h2>
        <table className="w-full border-collapse text-lg">
          <thead>
            <tr className="border-bottom border-black">
              <th className="p-2 text-center font-bold border border-black w-12">棒次</th>
              <th className="p-2 text-center font-bold border border-black w-16">号码</th>
              <th className="p-2 text-center font-bold border border-black">姓名</th>
              <th className="p-2 text-center font-bold border border-black w-20">位置</th>
            </tr>
          </thead>
          <tbody>
            {lineup.map((playerId, index) => {
              const info = getPlayerInfo(playerId)
              return (
                <tr key={index} className="border-bottom border-black">
                  <td className="p-3 text-center border border-black font-bold text-xl">{index + 1}</td>
                  <td className="p-3 text-center border border-black text-xl">{info.number}</td>
                  <td className="p-3 border border-black text-xl font-medium">{info.name}</td>
                  <td className="p-3 border border-black text-center text-lg"></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 替补席 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-center border-b border-black pb-2">替补球员</h2>
        <div className="grid grid-cols-3 gap-2 text-lg">
          {players
            .filter(p => p.teamId === (teamSide === 'home' ? game.homeTeamId : game.awayTeamId))
            .filter(p => !lineup.includes(p.id) && p.id !== pitcherId)
            .map(player => (
              <div key={player.id} className="border border-black p-2 flex justify-between">
                <span>{player.number || '-'}</span>
                <span>{player.name}</span>
                <span>{player.positions ? (() => {
                  try {
                    const pos = JSON.parse(player.positions)
                    return pos.map(getPositionName).join(', ')
                  } catch { return '' }
                })() : ''}</span>
              </div>
            ))}
        </div>
      </div>

      {/* 先发投手 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-center border-b border-black pb-2">先发投手</h2>
        <div className="border border-black p-4 flex justify-between items-center text-xl">
          <div>
            <span className="font-bold">投手:</span>
            <span className="ml-2">{getPlayerInfo(pitcherId).name}</span>
          </div>
          <div>
            <span className="font-bold">号码:</span>
            <span className="ml-2">{getPlayerInfo(pitcherId).number}</span>
          </div>
        </div>
      </div>

      {/* 打印按钮区域 */}
      <div className="text-center no-print">
        <button 
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-500"
        >
          打印阵容卡
        </button>
      </div>
    </div>
  )
}

export default LineupPrintCard