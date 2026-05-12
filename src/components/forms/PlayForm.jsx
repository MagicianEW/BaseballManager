import { RESULT_CATEGORIES, RESULT_LABELS } from '../../constants/baseball'

/**
 * 打席记录表单组件
 *
 * @param {Object} props
 * @param {Function} props.onRecord - 记录打席结果的回调
 * @param {boolean} props.disabled - 是否禁用
 */
export function PlayForm({ onRecord, disabled = false }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-bold mb-4">记录打席结果</h3>

      {Object.entries(RESULT_CATEGORIES).map(([key, category]) => (
        <div key={key} className="mb-4">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">{category.label}</h4>
          <div className="flex flex-wrap gap-2">
            {category.items.map(result => (
              <button
                key={result}
                onClick={() => onRecord(result)}
                disabled={disabled}
                className={`
                  px-4 py-2 rounded font-medium transition-colors
                  ${disabled
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-700 text-white hover:bg-green-600'
                  }
                `}
              >
                {RESULT_LABELS[result] || result}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 打席结果展示组件
 *
 * @param {Object} props
 * @param {string} props.result - 打席结果
 */
export function ResultBadge({ result }) {
  const label = RESULT_LABELS[result] || result
  const colorClass = getResultColor(result)

  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-sm font-bold ${colorClass}`}>
      {label}
    </span>
  )
}

function getResultColor(result) {
  const hitResults = ['1B', '2B', '3B', 'HR']
  const outResults = ['SO', 'GO', 'FO', 'GDP']
  const walkResults = ['BB', 'HBP', 'IBB']
  const baserunResults = ['SB', 'CS']

  if (hitResults.includes(result)) return 'bg-green-100 text-green-800'
  if (outResults.includes(result)) return 'bg-red-100 text-red-800'
  if (walkResults.includes(result)) return 'bg-blue-100 text-blue-800'
  if (baserunResults.includes(result)) return 'bg-yellow-100 text-yellow-800'
  return 'bg-gray-100 text-gray-800'
}

export default PlayForm