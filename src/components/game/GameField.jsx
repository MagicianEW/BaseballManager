import { POSITIONS } from '../../constants/baseball'

/**
 * 垒位标签
 */
export const BASE_LABELS = {
  first: '1B',
  second: '2B',
  third: '3B',
  home: 'HOME'
}

/**
 * 垒上跑垒员颜色
 */
export const RUNNER_COLOR = '#e53e3e'

/**
 * 空垒颜色
 */
export const EMPTY_BASE_COLOR = '#ffffff'

/**
 * 垒包边框颜色
 */
export const BASE_BORDER_COLOR = '#2d3748'

/**
 * 组件属性 PropTypes 注释
 * @param {Object} props
 * @param {string} props.baseSituation - 当前局面 (如 "12B", "---")
 */
export function GameField({ baseSituation = '---' }) {
  // 解析局面: --- = 无人, 1B- = 一垒有人, -2B = 二垒有人, 12B = 一二垒有人
  // --3 = 三垒有人, 1-3 = 一三垒有人, -23 = 二三垒有人, 123 = 满垒
  const bases = baseSituation.split('').map(c => c !== '-' ? c : null)
  const firstBase = bases[0] || null   // 一垒
  const secondBase = bases[1] || null  // 二垒
  const thirdBase = bases[2] || null   // 三垒

  return (
    <div className="flex justify-center items-center">
      <svg width="240" height="240" viewBox="0 0 240 240">
        {/* 扇形区域 */}
        <path d="M 120 20 L 220 200 L 20 200 Z" fill="#228b22" stroke="#1a7a1a" strokeWidth="2"/>

        {/* 界线 */}
        <line x1="120" y1="20" x2="120" y2="200" stroke="#ffffff" strokeWidth="1" strokeDasharray="5,5"/>
        <line x1="120" y1="200" x2="20" y2="200" stroke="#ffffff" strokeWidth="1" strokeDasharray="5,5"/>
        <line x1="120" y1="200" x2="220" y2="200" stroke="#ffffff" strokeWidth="1" strokeDasharray="5,5"/>

        {/* 一垒 */}
        <BasePackage x={185} y={65} occupied={firstBase} label="1B" />

        {/* 二垒 */}
        <BasePackage x={120} y={35} occupied={secondBase} label="2B" />

        {/* 三垒 */}
        <BasePackage x={55} y={65} occupied={thirdBase} label="3B" />

        {/* 本垒 */}
        <HomePlate x={120} y={185} />

        {/* 投手丘 */}
        <circle cx="120" cy="150" r="15" fill="#8b7355" stroke="#6b5344" strokeWidth="2"/>

        {/* 跑垒员标记 */}
        {firstBase && <RunnerMarker x={185} y={75} />}
        {secondBase && <RunnerMarker x={120} y={45} />}
        {thirdBase && <RunnerMarker x={55} y={75} />}

        {/* 局面文字显示 */}
        <text x="120" y="230" textAnchor="middle" fontSize="14" fill="#ffffff" fontFamily="monospace">
          {baseSituation}
        </text>
      </svg>
    </div>
  )
}

/**
 * 垒包组件
 */
function BasePackage({ x, y, occupied, label }) {
  return (
    <g>
      <polygon
        points={`${x},${y-15} ${x+15},${y} ${x},${y+15} ${x-15},${y}`}
        fill={occupied ? RUNNER_COLOR : EMPTY_BASE_COLOR}
        stroke={BASE_BORDER_COLOR}
        strokeWidth="2"
      />
      <text x={x} y={y+30} textAnchor="middle" fontSize="10" fill="#ffffff">
        {label}
      </text>
    </g>
  )
}

/**
 * 本垒板组件
 */
function HomePlate({ x, y }) {
  return (
    <g>
      <polygon
        points={`${x-12},${y-12} ${x+12},${y-12} ${x+12},${y+12} ${x},${y+18} ${x-12},${y+12}`}
        fill={EMPTY_BASE_COLOR}
        stroke={BASE_BORDER_COLOR}
        strokeWidth="2"
      />
      <text x={x} y={y+30} textAnchor="middle" fontSize="10" fill="#ffffff">
        HOME
      </text>
    </g>
  )
}

/**
 * 跑垒员标记
 */
function RunnerMarker({ x, y }) {
  return (
    <g>
      <circle cx={x} cy={y} r="10" fill={RUNNER_COLOR} stroke="#ffffff" strokeWidth="2"/>
      <text x={x} y={y+4} textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="bold">
        R
      </text>
    </g>
  )
}

export default GameField