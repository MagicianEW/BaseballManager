import { useState, useEffect, useMemo } from 'react'
import { api } from '../utils/api'
import { useApp } from '../context/AppContext'
import {
  PageHeader, Panel, StatBadge, StatRow, StatTable, EmptyState, SegmentedControl,
} from '../components/ui'

/**
 * 数据统计页
 *
 * 修复：此前本页定义了 getPlayerStats 却从未调用，而表格取的是
 * player.ab / player.h —— players 表里根本没有这些统计列，
 * 导致整张表永远显示 0。现改为真正调用统计接口。
 */

function Stats() {
  const { t } = useApp()
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('')
  const [view, setView] = useState('team')
  const [query, setQuery] = useState('')
  const [statsMap, setStatsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [p, t] = await Promise.all([api.getPlayers(), api.getTeams()])
      setPlayers(p)
      setTeams(t)

      // 逐个拉取统计（接口按球员返回）
      const entries = await Promise.all(
        p.map(async player => {
          try {
            return [player.id, await api.getPlayerStats(player.id)]
          } catch {
            return [player.id, null]
          }
        })
      )
      setStatsMap(Object.fromEntries(entries))
    } catch (err) {
      console.error('统计加载失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return players
      .map(p => ({ ...p, ...(statsMap[p.id] || {}) }))
      .filter(p => !selectedTeam || String(p.teamId) === String(selectedTeam))
      .filter(p => !q || String(p.name || '').toLowerCase().includes(q))
  }, [players, statsMap, selectedTeam, query])

  const columns = useMemo(() => [
    { key: 'name', label: t('colPlayer'), render: r => (
      <span className="font-semibold text-gray-800">{r.name}</span>
    ) },
    { key: 'teamName', label: t('colTeam'), render: r => {
      const team = teams.find(x => x.id === r.teamId)
      return <span className="text-gray-500">{team?.name || '—'}</span>
    } },
    { key: 'pa', label: t('colPA'), align: 'right' },
    { key: 'ab', label: t('colAB'), align: 'right' },
    { key: 'h', label: t('colH'), align: 'right' },
    { key: 'r', label: t('colR'), align: 'right' },
    { key: 'rbi', label: t('colRBI'), align: 'right' },
    { key: 'bb', label: t('colBB'), align: 'right' },
    { key: 'so', label: t('colSO'), align: 'right' },
    { key: 'ba', label: t('colBA'), align: 'right', render: r => (
      <span className="font-bold">{r.ba || '.000'}</span>
    ) },
    { key: 'obp', label: t('colOBP'), align: 'right', render: r => (
      <span className="font-bold">{r.obp || '.000'}</span>
    ) },
    { key: 'slg', label: t('colSLG'), align: 'right', render: r => (
      <span className="font-bold">{r.slg || '.000'}</span>
    ) },
    { key: 'ops', label: t('colOPS'), align: 'right', render: r => (
      <span className="font-bold text-blue-700">{r.ops || '.000'}</span>
    ) },
  ], [t, teams])

  const detail = selectedPlayer ? statsMap[selectedPlayer.id] : null

  return (
    <div>
      <PageHeader title={t('statsTitle')} subtitle={t('statsSubtitle')} />

      <Panel dense className="mb-4">
        <div className="p-4 flex flex-wrap items-center gap-3">
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { value: 'team', label: t('teamView') },
              { value: 'player', label: t('playerView') },
            ]}
          />
          <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
            <option value="">{t('allTeams')}</option>
            {teams.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
          </select>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder={t('searchPlayerPlaceholder')}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[12rem]" />
        </div>
      </Panel>

      {loading && (
        <Panel><div className="py-10 text-center text-gray-400">{t('loadingStats')}</div></Panel>
      )}

      {!loading && rows.length === 0 && (
        <Panel>
          <EmptyState icon="📊" title={t('noStats')} hint={t('noStatsHint')} />
        </Panel>
      )}

      {!loading && rows.length > 0 && view === 'team' && (
        <Panel dense>
          <StatTable
            columns={columns}
            rows={rows}
            rowKey={r => r.id}
            initialSort={{ key: 'ops', dir: 'desc' }}
            emptyText={t('noStats')}
            onRowClick={r => setSelectedPlayer(r)}
            compact
          />
        </Panel>
      )}

      {!loading && rows.length > 0 && view === 'player' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(r => {
            const s = statsMap[r.id] || {}
            const team = teams.find(x => x.id === r.teamId)
            return (
              <Panel key={r.id} title={r.name} subtitle={team?.name}>
                <StatRow className="mb-3">
                  <StatBadge label={t('ba')} value={s.ba || '.000'} hint={t('baHint')} tone="good" />
                  <StatBadge label={t('obp')} value={s.obp || '.000'} hint={t('obpHint')} tone="info" />
                  <StatBadge label={t('slg')} value={s.slg || '.000'} hint={t('slgHint')} tone="info" />
                  <StatBadge label={t('ops')} value={s.ops || '.000'} hint={t('opsHint')} tone="warn" />
                </StatRow>
                <StatRow className="mb-3">
                  <StatBadge label={t('pa')} value={s.pa ?? 0} hint={t('paHint')} />
                  <StatBadge label={t('ab')} value={s.ab ?? 0} hint={t('abHint')} />
                  <StatBadge label={t('h')} value={s.h ?? 0} hint={t('hHint')} />
                  <StatBadge label={t('r')} value={s.r ?? 0} hint={t('rHint')} />
                  <StatBadge label={t('rbi')} value={s.rbi ?? 0} hint={t('rbiHint')} />
                </StatRow>
                <StatRow className="mb-3">
                  <StatBadge label={t('hr')} value={s.hr ?? 0} />
                  <StatBadge label={t('d')} value={s.d ?? 0} />
                  <StatBadge label={t('t')} value={s.t ?? 0} />
                  <StatBadge label={t('xbh')} value={s.xbh ?? 0} hint={t('xbhHint')} />
                  <StatBadge label={t('tb')} value={s.tb ?? 0} hint={t('tbHint')} />
                </StatRow>
                <StatRow>
                  <StatBadge label={t('bb')} value={s.bb ?? 0} hint={t('bbHint')} />
                  <StatBadge label={t('hbp')} value={s.hbp ?? 0} hint={t('hbpHint')} />
                  <StatBadge label={t('so')} value={s.so ?? 0} hint={t('soHint')} />
                  <StatBadge label={t('iso')} value={s.iso || '.000'} hint={t('isoHint')} />
                  <StatBadge label={t('babip')} value={s.babip || '.000'} hint={t('babipHint')} />
                  <StatBadge label={t('kPct')} value={s.kPct || '.000'} hint={t('kPctHint')} />
                  <StatBadge label={t('bbPct')} value={s.bbPct || '.000'} hint={t('bbPctHint')} />
                  <StatBadge label={t('kbb')} value={s.kbb || '—'} hint={t('kbbHint')} />
                </StatRow>
              </Panel>
            )
          })}
        </div>
      )}

      {/* 球员详情（含投球统计） */}
      {selectedPlayer && detail && (
        <div className="fixed inset-0 bg-black/40 overflow-auto p-4 z-50"
          onClick={() => setSelectedPlayer(null)}>
          <div className="bg-white rounded-xl max-w-3xl mx-auto mt-10"
            onClick={e => e.stopPropagation()}>
            <Panel
              title={selectedPlayer.name}
              subtitle={teams.find(x => x.id === selectedPlayer.teamId)?.name}
              actions={<button onClick={() => setSelectedPlayer(null)}
                className="px-2 py-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200">✕</button>}>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('sectionCore')}</h3>
              <StatRow className="mb-4">
                <StatBadge label={t('ba')} value={detail.ba || '.000'} hint={t('baHint')} tone="good" />
                <StatBadge label={t('obp')} value={detail.obp || '.000'} hint={t('obpHint')} tone="info" />
                <StatBadge label={t('slg')} value={detail.slg || '.000'} hint={t('slgHint')} tone="info" />
                <StatBadge label={t('ops')} value={detail.ops || '.000'} hint={t('opsHint')} tone="warn" />
                <StatBadge label={t('iso')} value={detail.iso || '.000'} hint={t('isoHint')} />
                <StatBadge label={t('babip')} value={detail.babip || '.000'} hint={t('babipHint')} />
              </StatRow>

              <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('sectionCounting')}</h3>
              <StatRow className="mb-4">
                <StatBadge label={t('pa')} value={detail.pa ?? 0} hint={t('paHint')} />
                <StatBadge label={t('ab')} value={detail.ab ?? 0} hint={t('abHint')} />
                <StatBadge label={t('h')} value={detail.h ?? 0} hint={t('hHint')} />
                <StatBadge label={t('r')} value={detail.r ?? 0} hint={t('rHint')} />
                <StatBadge label={t('rbi')} value={detail.rbi ?? 0} hint={t('rbiHint')} />
                <StatBadge label={t('bb')} value={detail.bb ?? 0} hint={t('bbHint')} />
                <StatBadge label={t('hbp')} value={detail.hbp ?? 0} hint={t('hbpHint')} />
                <StatBadge label={t('so')} value={detail.so ?? 0} hint={t('soHint')} />
                <StatBadge label={t('sac')} value={detail.sac ?? 0} />
                <StatBadge label={t('sf')} value={detail.sf ?? 0} />
                <StatBadge label={t('gidp')} value={detail.gidp ?? 0} />
                <StatBadge label={t('ibb')} value={detail.ibb ?? 0} />
                <StatBadge label={t('statErrors')} value={detail.e ?? 0} />
              </StatRow>

              <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('sectionPower')}</h3>
              <StatRow className="mb-4">
                <StatBadge label={t('b')} value={detail.b ?? 0} />
                <StatBadge label={t('d')} value={detail.d ?? 0} />
                <StatBadge label={t('t')} value={detail.t ?? 0} />
                <StatBadge label={t('hr')} value={detail.hr ?? 0} />
                <StatBadge label={t('xbh')} value={detail.xbh ?? 0} hint={t('xbhHint')} />
                <StatBadge label={t('tb')} value={detail.tb ?? 0} hint={t('tbHint')} />
              </StatRow>

              <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('sectionPitching')}</h3>
              {detail.pitching ? (
                <StatRow>
                  <StatBadge label={t('ip')} value={detail.pitching.ip ?? 0} hint={t('ipHint')} tone="info" />
                  <StatBadge label={t('er')} value={detail.pitching.er ?? 0} hint={t('erHint')} />
                  <StatBadge label={t('pitchH')} value={detail.pitching.h ?? 0} />
                  <StatBadge label={t('pitchBb')} value={detail.pitching.bb ?? 0} />
                  <StatBadge label={t('pitchSo')} value={detail.pitching.so ?? 0} />
                  <StatBadge label={t('era')} value={detail.pitching.era || '—'} hint={t('eraHint')} tone="warn" />
                  <StatBadge label={t('whip')} value={detail.pitching.whip || '—'} hint={t('whipHint')} tone="warn" />
                </StatRow>
              ) : (
                <p className="text-sm text-gray-400">{t('sectionNoPitching')}</p>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  )
}

export default Stats
