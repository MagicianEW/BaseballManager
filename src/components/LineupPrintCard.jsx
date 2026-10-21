import { useApp } from '../context/AppContext'

/**
 * 打印友好型阵容卡
 *
 * 此前这个组件从未被任何页面引用（README 宣传的「一键打印阵容卡」等于不存在），
 * 且守备位置用的是中文常量硬编码，切到 English/Japanese 仍是中文。
 * 现在位置名走 i18n（position_P / position_C / ...）。
 *
 * @param {Object} props
 * @param {Object} props.game - 比赛数据
 * @param {Array}  props.players - 球员列表
 * @param {string} props.teamSide - 'home' | 'away'
 */

export function LineupPrintCard({ game, players = [], teamSide = 'home' }) {
  const { t } = useApp()

  const isHome = teamSide === 'home'
  const teamName = isHome ? game.homeTeamName : game.awayTeamName
  const lineup = isHome ? game.homeLineup : game.awayLineup
  const list = Array.isArray(lineup) ? lineup : []
  const pitcherId = isHome ? game.homePitcherId : game.awayPitcherId

  const infoOf = playerId => {
    if (!playerId) return null
    const p = players.find(x => x.id === playerId)
    return p ? { number: p.number || '—', name: p.name || '—', positions: p.positions } : null
  }

  const positionName = code => {
    if (!code) return ''
    const key = `position_${code}`
    const label = t(key)
    return label === key ? code : label   // 没翻译就退回位置代码本身
  }

  const positionsOf = playerId => {
    const info = infoOf(playerId)
    if (!info?.positions) return ''
    let codes = []
    try { codes = JSON.parse(info.positions) } catch { codes = [] }
    if (!Array.isArray(codes) || codes.length === 0) return ''
    return codes.map(positionName).join('/')
  }

  const pitcher = infoOf(pitcherId)

  return (
    <div className="lineup-print-card bg-white text-gray-900"
      style={{ fontFamily: '"Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans", sans-serif' }}>
      <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
        <h1 className="text-2xl font-black tracking-wide">{teamName}</h1>
        <div className="text-sm mt-1">
          {t('printCardTitle')} · {game.date}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-400">
            <th className="text-left py-1.5 w-12">{t('pitchOrder')}</th>
            <th className="text-left py-1.5 w-16">{t('jersey')}</th>
            <th className="text-left py-1.5">{t('playerName')}</th>
            <th className="text-left py-1.5 w-28">{t('position')}</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 && (
            <tr><td colSpan={4} className="py-4 text-center text-gray-400">{t('noLineup')}</td></tr>
          )}
          {list.map((pid, i) => {
            const info = infoOf(pid)
            return (
              <tr key={`${teamSide}-${i}`} className="border-b border-gray-200">
                <td className="py-1.5 font-bold">{i + 1}</td>
                <td className="py-1.5">{info?.number || '—'}</td>
                <td className="py-1.5 font-medium">{info?.name || '—'}</td>
                <td className="py-1.5 text-gray-600">{positionsOf(pid)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-6 mt-5 text-sm">
        <div>
          <div className="font-bold border-b border-gray-400 pb-1 mb-1.5">{t('pitcher')}</div>
          <div className="flex gap-3">
            <span className="tabular-nums">{pitcher?.number || '—'}</span>
            <span className="font-medium">{pitcher?.name || '—'}</span>
          </div>
        </div>
        <div>
          <div className="font-bold border-b border-gray-400 pb-1 mb-1.5">{t('coach')}</div>
          <div className="text-gray-400">{t('coachBlank')}</div>
        </div>
      </div>

      {/* 打印时只显示卡片本体 */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .lineup-print-card, .lineup-print-card * { visibility: visible; }
          .lineup-print-card {
            position: absolute; left: 0; top: 0; width: 100%;
            padding: 24px; page-break-after: always;
          }
          @page { margin: 12mm; }
        }
      `}</style>
    </div>
  )
}

export default LineupPrintCard
