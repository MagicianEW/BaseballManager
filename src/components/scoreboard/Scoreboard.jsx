import { Link } from 'react-router-dom'
import { GameField } from '../game/GameField'
import { ResultBadge } from '../forms/PlayForm'
import { INNING_HALF } from '../../constants/baseball'

/**
 * 比分板组件
 *
 * @param {Object} props
 * @param {Object} props.game - 比赛数据
 * @param {number} props.currentBatterIndex - 当前打者索引
 * @param {string} props.currentBatterName - 当前打者名称
 */
export function Scoreboard({ game, currentBatterIndex, currentBatterName }) {
  if (!game) return null

  const inningLabel = `${game.currentInning || 1}${game.currentHalf === INNING_HALF.TOP ? '上' : '下'}`

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* 比分头部 */}
      <div className="bg-green-800 text-white p-4">
        <div className="flex justify-between items-center text-center">
          {/* 客队 */}
          <div className="flex-1">
            <div className="text-sm opacity-75">{game.awayTeamName}</div>
            <div className="text-4xl font-bold">{game.awayScore || 0}</div>
          </div>

          {/* 局数 */}
          <div className="px-6">
            <div className="text-2xl font-bold">{inningLabel}</div>
          </div>

          {/* 主队 */}
          <div className="flex-1">
            <div className="text-sm opacity-75">{game.homeTeamName}</div>
            <div className="text-4xl font-bold">{game.homeScore || 0}</div>
          </div>
        </div>
      </div>

      {/* 局面信息 */}
      <div className="p-4 border-b">
        <div className="flex justify-around items-center">
          {/* 出局数 */}
          <div className="flex items-center gap-2">
            <span className="text-gray-600">出局：</span>
            <div className="flex gap-1">
              {[1, 2].map(i => (
                <span
                  key={i}
                  className={`w-6 h-6 rounded-full ${(game.outs || 0) >= i ? 'bg-red-500' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          </div>

          {/* 球数 */}
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              球数：<span className="font-bold text-lg">{game.balls || 0}</span>
            </span>
            <span className="text-gray-600">
              strike：<span className="font-bold text-lg">{game.strikes || 0}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 垒上局面 */}
      <div className="p-4 border-b">
        <h3 className="text-center text-sm font-semibold text-gray-600 mb-2">场上局面</h3>
        <GameField baseSituation={game.baseSituation || '---'} />
      </div>

      {/* 当前打者 */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">当前打者：</span>
          <span className="font-bold text-xl">{currentBatterName || '-'}</span>
          <span className="text-sm text-gray-500">
            {typeof currentBatterIndex === 'number' ? `第${currentBatterIndex + 1}棒` : ''}
          </span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="p-4 flex gap-2">
        <Link
          to={`/game/${game.id}`}
          className="flex-1 bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-500 transition-colors"
        >
          进入打分
        </Link>
      </div>
    </div>
  )
}

export default Scoreboard