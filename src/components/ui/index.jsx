import React from 'react'

/**
 * 共享 UI 组件
 *
 * 项目原有的页面全是裸 Tailwind class，缺少统一层次。
 * 这里提供一套轻量组件，保证记分页 / 统计页 / 列表页视觉一致。
 */

/** 卡片容器 */
export function Panel({ title, subtitle, actions, children, className = '', dense = false }) {
  return (
    <section className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div>
            {title && <h2 className="text-lg font-bold text-gray-800">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={dense ? '' : 'p-5'}>{children}</div>
    </section>
  )
}

/** 统计数字徽章 */
export function StatBadge({ label, value, hint, tone = 'default' }) {
  const tones = {
    default: 'bg-gray-50 text-gray-800 border-gray-200',
    good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    bad: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
  }
  return (
    <div className={`rounded-lg border px-3 py-2 min-w-[4.5rem] ${tones[tone] || tones.default}`}>
      <div className="text-[10px] uppercase tracking-wide opacity-70 font-semibold">{label}</div>
      <div className="text-lg font-bold leading-tight tabular-nums">{value}</div>
      {hint && <div className="text-[10px] opacity-60 leading-tight">{hint}</div>}
    </div>
  )
}

/** 一组统计徽章 */
export function StatRow({ children, className = '' }) {
  return <div className={`flex flex-wrap gap-2 ${className}`}>{children}</div>
}

/** 排序方向指示 */
function SortArrow({ dir }) {
  if (!dir) return <span className="text-gray-300 ml-1">↕</span>
  return <span className="text-blue-600 ml-1">{dir === 'asc' ? '↑' : '↓'}</span>
}

/**
 * 可排序数据表。
 * columns: [{ key, label, align, width, render(row), sortable, sortValue(row) }]
 */
export function StatTable({
  columns,
  rows,
  rowKey = r => r.id,
  initialSort = null,
  emptyText = '—',
  onRowClick,
  compact = false,
  stickyHeader = true,
}) {
  const [sort, setSort] = React.useState(initialSort)

  const sorted = React.useMemo(() => {
    if (!sort) return rows
    const col = columns.find(c => c.key === sort.key)
    if (!col) return rows
    const getVal = col.sortValue || (r => r[col.key])
    return [...rows].sort((a, b) => {
      const va = getVal(a), vb = getVal(b)
      if (typeof va === 'number' && typeof vb === 'number') {
        return sort.dir === 'asc' ? va - vb : vb - va
      }
      return sort.dir === 'asc'
        ? String(va ?? '').localeCompare(String(vb ?? ''))
        : String(vb ?? '').localeCompare(String(va ?? ''))
    })
  }, [rows, sort, columns])

  const toggle = key => {
    setSort(prev => {
      if (!prev || prev.key !== key) return { key, dir: 'desc' }
      if (prev.dir === 'desc') return { key, dir: 'asc' }
      return null
    })
  }

  const pad = compact ? 'px-2 py-1' : 'px-3 py-2'

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
          <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            {columns.map(col => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className={`${pad} font-semibold whitespace-nowrap
                  ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                  ${col.sortable === false ? '' : 'cursor-pointer select-none hover:text-gray-900'}`}
                onClick={col.sortable === false ? undefined : () => toggle(col.key)}>
                {col.label}
                {col.sortable !== false && <SortArrow dir={sort?.key === col.key ? sort.dir : null} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-gray-400">{emptyText}</td></tr>
          )}
          {sorted.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-t border-gray-100 ${i % 2 ? 'bg-gray-50/40' : ''}
                ${onRowClick ? 'hover:bg-blue-50 cursor-pointer transition-colors' : ''}`}>
              {columns.map(col => (
                <td key={col.key}
                  className={`${pad} whitespace-nowrap tabular-nums
                    ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                    ${col.className || ''}`}>
                  {col.render ? col.render(row, i) : (row[col.key] ?? emptyText)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * 逐局比分表（Box Score）
 * lineScore: { away: [{inning, runs, hits, errors}], home: [...] }
 */
export function BoxScore({ lineScore, totals, awayName, homeName }) {
  if (!lineScore) return null
  const innings = lineScore.away?.length || 0
  const cell = (side, i, key) => {
    const v = lineScore[side]?.[i]?.[key]
    return v === undefined || v === null ? '—' : v
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
            <th className="px-3 py-2 text-left">{awayName || '客队'}</th>
            {Array.from({ length: innings }, (_, i) => (
              <th key={i} className="px-2 py-2 text-center font-semibold">{i + 1}</th>
            ))}
            <th className="px-3 py-2 text-right">R</th>
            <th className="px-3 py-2 text-right">H</th>
            <th className="px-3 py-2 text-right">E</th>
          </tr>
        </thead>
        <tbody>
          {['away', 'home'].map(side => (
            <tr key={side} className="border-t border-gray-100">
              <td className="px-3 py-2 font-medium">
                {side === 'away' ? (awayName || '客队') : (homeName || '主队')}
              </td>
              {Array.from({ length: innings }, (_, i) => (
                <td key={i} className="px-2 py-2 text-center tabular-nums font-semibold">
                  {cell(side, i, 'runs')}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-bold tabular-nums">{totals?.[side]?.runs ?? '—'}</td>
              <td className="px-3 py-2 text-right tabular-nums">{totals?.[side]?.hits ?? '—'}</td>
              <td className="px-3 py-2 text-right tabular-nums">{totals?.[side]?.errors ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** 空状态 */
export function EmptyState({ icon = '📊', title, hint, action }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3 opacity-50">{icon}</div>
      {title && <div className="text-gray-700 font-semibold">{title}</div>}
      {hint && <div className="text-gray-400 text-sm mt-1">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** 页面标题栏 */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

/** 主按钮 */
export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }) {
  const variants = {
    primary: 'bg-green-800 text-white hover:bg-green-700 shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger: 'bg-rose-700 text-white hover:bg-rose-600 shadow-sm',
    info: 'bg-sky-700 text-white hover:bg-sky-600 shadow-sm',
    ghost: 'text-gray-600 hover:bg-gray-100',
  }
  const sizes = { sm: 'px-2.5 py-1 text-xs', md: 'px-3.5 py-2 text-sm', lg: 'px-5 py-2.5 text-base' }
  return (
    <button
      className={`rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...rest}>
      {children}
    </button>
  )
}

/** 分段控件 */
export function SegmentedControl({ options, value, onChange, className = '' }) {
  return (
    <div className={`inline-flex rounded-lg bg-gray-100 p-0.5 ${className}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
            ${value === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}
