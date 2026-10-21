import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { helpI18n } from '../i18n/help'
import { PageHeader, Panel, StatTable } from '../components/ui'

/**
 * 帮助页
 *
 * 帮助内容是结构化数据，放在 src/i18n/help.js（四种语言结构完全一致），
 * 页面组件只负责渲染。这样翻译与排版分离，新增语言不需要改组件。
 */

function Help() {
  const { t, language } = useApp()
  const data = helpI18n[language] || helpI18n['zh-CN']

  const sections = useMemo(() => [
    { id: 'quickstart', label: t('navQuickstart') },
    { id: 'roles', label: t('navRoles') },
    { id: 'pages', label: t('navPages') },
    { id: 'scoring', label: t('navScoring') },
    { id: 'metrics', label: t('navMetrics') },
    { id: 'rules', label: t('navRules') },
    { id: 'privacy', label: t('navPrivacy') },
    { id: 'faq', label: t('navFaq') },
  ], [t])

  const scrollTo = id => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <PageHeader title={t('helpTitle')} subtitle={t('helpSubtitle')} />

      {/* 页内导航 */}
      <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur border border-gray-200 rounded-xl px-4 py-2.5 mb-5 flex flex-wrap gap-x-1 gap-y-1 shadow-sm">
        <span className="text-xs text-gray-500 font-semibold mr-2 self-center">{t('onThisPage')}</span>
        {sections.map(s => (
          <button key={s.id} onClick={() => scrollTo(s.id)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-600 hover:bg-green-50 hover:text-green-800 transition-colors">
            {s.label}
          </button>
        ))}
      </nav>

      {/* 快速上手 */}
      <Panel id="quickstart" title={data.quickstart.title} subtitle={data.quickstart.desc} className="mb-4">
        <ol className="space-y-4">
          {data.quickstart.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-green-800 text-white text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <div className="font-semibold text-gray-800">{s.title}</div>
                <div className="text-sm text-gray-600 mt-0.5 leading-relaxed">{s.body}</div>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      {/* 角色权限 */}
      <Panel id="roles" title={data.roles.title} subtitle={data.roles.desc} className="mb-4" dense>
        <StatTable
          compact
          rows={data.roles.rows}
          rowKey={(r, i) => i}
          columns={[
            { key: 'role', label: data.roles.columns[0], render: r => (
              <span className="font-semibold text-gray-800">{r.role}</span>
            ) },
            { key: 'can', label: data.roles.columns[1], render: r => (
              <span className="text-gray-600">{r.can}</span>
            ) },
            { key: 'cannot', label: data.roles.columns[2], render: r => (
              <span className="text-gray-500">{r.cannot}</span>
            ) },
          ]} />
        {data.roles.note && (
          <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 text-sm text-amber-800">
            {data.roles.note}
          </div>
        )}
      </Panel>

      {/* 页面导览 */}
      <Panel id="pages" title={data.pages.title} subtitle={data.pages.desc} className="mb-4">
        <div className="space-y-5">
          {data.pages.items.map(p => (
            <div key={p.name} className="border-l-4 border-green-700 pl-4">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h3 className="font-bold text-gray-800">{p.name}</h3>
                <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{p.route}</code>
              </div>
              <div className="text-sm text-gray-600 mt-0.5">{p.purpose}</div>
              <ul className="mt-2 space-y-1">
                {p.points.map((pt, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-green-700 shrink-0">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>

      {/* 记分操作 */}
      <Panel id="scoring" title={data.scoring.title} subtitle={data.scoring.desc} className="mb-4">
        <ol className="space-y-4 mb-5">
          {data.scoring.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-sky-700 text-white text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <div className="font-semibold text-gray-800">{s.title}</div>
                <div className="text-sm text-gray-600 mt-0.5 leading-relaxed">{s.detail}</div>
              </div>
            </li>
          ))}
        </ol>
        {data.scoring.tips?.length > 0 && (
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
            <div className="text-sm font-bold text-sky-900 mb-2">💡</div>
            <ul className="space-y-1.5">
              {data.scoring.tips.map((tip, i) => (
                <li key={i} className="text-sm text-sky-900 flex gap-2">
                  <span className="shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      {/* 统计指标 */}
      <Panel id="metrics" title={data.metrics.title} subtitle={data.metrics.desc} className="mb-4" dense>
        <StatTable
          compact
          rows={data.metrics.rows}
          rowKey={(r, i) => i}
          columns={[
            { key: 'name', label: data.metrics.columns[0], render: r => (
              <span className="font-semibold text-gray-800 whitespace-nowrap">{r.name}</span>
            ) },
            { key: 'formula', label: data.metrics.columns[1], render: r => (
              <code className="text-xs text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                {r.formula}
              </code>
            ) },
            { key: 'note', label: data.metrics.columns[2], render: r => (
              <span className="text-gray-600">{r.note}</span>
            ) },
          ]} />
        {data.metrics.notes?.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <ul className="space-y-1.5">
              {data.metrics.notes.map((n, i) => (
                <li key={i} className="text-xs text-gray-600 flex gap-2">
                  <span className="shrink-0 text-green-700">•</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      {/* 比赛规则 */}
      <Panel id="rules" title={data.rules.title} subtitle={data.rules.desc} className="mb-4" dense>
        <StatTable
          compact
          rows={data.rules.rows}
          rowKey={(r, i) => i}
          columns={[
            { key: 'name', label: data.rules.columns[0], render: r => (
              <span className="font-semibold text-gray-800 whitespace-nowrap">{r.name}</span>
            ) },
            { key: 'detail', label: data.rules.columns[1], render: r => (
              <span className="text-gray-600">{r.detail}</span>
            ) },
          ]} />
      </Panel>

      {/* 数据与隐私 */}
      <Panel id="privacy" title={data.privacy.title} subtitle={data.privacy.desc} className="mb-4">
        <ul className="space-y-2">
          {data.privacy.points.map((p, i) => (
            <li key={i} className="text-sm text-gray-700 flex gap-2">
              <span className="shrink-0 text-emerald-700">🔒</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </Panel>

      {/* 常见问题 */}
      <Panel id="faq" title={data.faq.title} className="mb-4">
        <div className="space-y-3">
          {data.faq.items.map((f, i) => (
            <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden">
              <summary className="cursor-pointer select-none px-4 py-3 bg-gray-50 hover:bg-gray-100 font-semibold text-gray-800 flex items-center justify-between gap-3">
                <span>{f.q}</span>
                <span className="text-gray-400 text-xs group-open:rotate-45 transition-transform">＋</span>
              </summary>
              <div className="px-4 py-3 text-sm text-gray-600 leading-relaxed bg-white">{f.a}</div>
            </details>
          ))}
        </div>
      </Panel>
    </div>
  )
}

export default Help
