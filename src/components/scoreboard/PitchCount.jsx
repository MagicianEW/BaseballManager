import { PLAY_RESULTS, RESULT_LABELS } from '../../constants/baseball'

/**
 * 投手投球计数面板
 *
 * @param {Object} props
 * @param {number} props.balls - 坏球数
 * @param {number} props.strikes - 好球数
 * @param {Object} [props.pitcher] - 投手信息
 */
export function PitchCount({ balls = 0, strikes = 0, pitcher }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-bold mb-3">投球计数</h3>

      {/* 球数显示 */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <div>
          <div className="text-sm text-gray-600 mb-1">Balls</div>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map(i => (
              <span
                key={`b-${i}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  i < balls ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                {i < balls ? '●' : '○'}
              </span>
            ))}
          </div>
        </div>

        <div className="text-2xl font-bold text-gray-400">:</div>

        <div>
          <div className="text-sm text-gray-600 mb-1">Strikes</div>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span
                key={`s-${i}`}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  i < strikes ? 'bg-red-500' : 'bg-gray-300'
                }`}
              >
                {i < strikes ? '●' : '○'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 投手信息 */}
      {pitcher && (
        <div className="border-t pt-3 mt-3">
          <div className="text-sm text-gray-600">投手</div>
          <div className="font-bold">{pitcher.name}</div>
          {pitcher.pitchCount !== undefined && (
            <div className="text-sm text-gray-500">
              投球数: {pitcher.pitchCount}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 球种分布图
 */
export function PitchTypeChart({ pitches = [] }) {
  const pitchCounts = {}

  for (const pitch of pitches) {
    const type = pitch.type || 'UNKNOWN'
    pitchCounts[type] = (pitchCounts[type] || 0) + 1
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <h4 className="text-sm font-semibold text-gray-600 mb-2">球种分布</h4>
      <div className="flex flex-wrap gap-2">
        {Object.entries(pitchCounts).map(([type, count]) => (
          <span key={type} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
            {RESULT_LABELS[type] || type}: {count}
          </span>
        ))}
        {pitches.length === 0 && (
          <span className="text-gray-400 text-sm">暂无投球数据</span>
        )}
      </div>
    </div>
  )
}

export default PitchCount