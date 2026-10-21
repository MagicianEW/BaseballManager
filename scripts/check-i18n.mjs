/**
 * i18n 完整性校验
 *
 * 检查两件事：
 *   1. 代码里用到的每个 t('key') 在四种语言下都能解析到（否则界面会显示 key 原文）
 *   2. 四个语言的 key 集合完全一致（不会某语言漏翻）
 *
 * 用法：node scripts/check-i18n.mjs
 * 也可以作为 npm test 的一部分运行。
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const srcDir = path.join(root, 'src')

const LANGS = ['zh-CN', 'zh-TW', 'en', 'ja']

// --- 收集源码文件 ---
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (/\.(jsx?|mjs)$/.test(name)) out.push(full)
  }
  return out
}
const files = walk(srcDir)

// --- 提取 t('key') 调用 ---
const usedKeys = new Map()   // key -> [files]
for (const file of files) {
  const text = readFileSync(file, 'utf-8')
  const re = /\bt\(\s*['"]([A-Za-z0-9_]+)['"]/g
  let m
  while ((m = re.exec(text))) {
    const key = m[1]
    if (!usedKeys.has(key)) usedKeys.set(key, [])
    usedKeys.get(key).push(path.relative(root, file))
  }
}

// --- 加载翻译表（与应用运行时引用同一份）---
const { ALL_TRANSLATIONS } = await import(path.join(srcDir, 'i18n/index.js'))

const ALL = ALL_TRANSLATIONS || {}
let errors = 0

// 动态 key：t(变量) 形式，静态扫描抓不到，需显式登记
// 例如 Settings.jsx 的 t(value.name)，value.name 取自 THEMES[].name
const DYNAMIC_KEYS = [
  'theme_green', 'theme_blue', 'theme_red', 'theme_purple',
  'theme_orange', 'theme_yellow', 'theme_indigo', 'theme_cyan',
]
for (const k of DYNAMIC_KEYS) {
  if (!usedKeys.has(k)) usedKeys.set(k, ['<dynamic>'])
}

// --- 1. 用到的 key 必须都能解析 ---
console.log('检查代码中使用的 i18n key…')
for (const [key, where] of [...usedKeys.entries()].sort()) {
  for (const lang of LANGS) {
    const table = ALL[lang] || {}
    if (!(key in table)) {
      console.error(`  ❌ [${lang}] t('${key}') 无对应翻译 — ${[...new Set(where)].join(', ')}`)
      errors++
    }
  }
}
if (!errors) console.log(`  ✅ ${usedKeys.size} 个 key × ${LANGS.length} 种语言全部可解析`)

// --- 2. 四语言 key 集合一致 ---
console.log('检查四语言 key 集合一致性…')
const sets = LANGS.map(l => new Set(Object.keys(ALL[l] || {})))
const baseSet = sets[0]
let mismatch = 0
LANGS.forEach((lang, i) => {
  const miss = [...baseSet].filter(k => !sets[i].has(k))
  const extra = [...sets[i]].filter(k => !baseSet.has(k))
  if (miss.length || extra.length) {
    console.error(`  ❌ ${lang} 缺少: ${miss.join(', ') || '无'} | 多出: ${extra.join(', ') || '无'}`)
    mismatch++
  }
})
if (!mismatch) {
  console.log(`  ✅ 四语言各 ${baseSet.size} 个 key，集合完全一致`)
}

// --- 3. 嵌套结构一致性（帮助页等内容是结构化对象，需逐层比对）---
console.log('检查嵌套结构一致性…')
function shapeOf(v) {
  if (Array.isArray(v)) {
    return v.length ? [shapeOf(v[0])] : []
  }
  if (v && typeof v === 'object') {
    const out = {}
    for (const k of Object.keys(v).sort()) out[k] = shapeOf(v[k])
    return out
  }
  return typeof v
}
let deepBad = 0
for (const [name, mod] of Object.entries({
  stats: (await import(path.join(srcDir, 'i18n/stats.js'))).statsI18n,
  gameLive: (await import(path.join(srcDir, 'i18n/gameLive.js'))).gameLiveI18n,
  games: (await import(path.join(srcDir, 'i18n/games.js'))).gamesI18n,
  help: (await import(path.join(srcDir, 'i18n/help.js'))).helpI18n,
})) {
  const ref = JSON.stringify(shapeOf(mod['zh-CN']))
  for (const lang of LANGS) {
    const cur = JSON.stringify(shapeOf(mod[lang]))
    if (cur !== ref) {
      console.error(`  ❌ ${name} [${lang}] 嵌套结构与 zh-CN 不一致`)
      deepBad++
    }
  }
}
if (!deepBad) console.log('  ✅ 所有分片的嵌套结构在四语言下完全一致')

// --- 4. 未使用的 key（仅提示，不算错误）---
const unused = [...baseSet].filter(k => !usedKeys.has(k))
if (unused.length) {
  console.log(`  ℹ️  主表中有 ${unused.length} 个 key 当前未被使用（可能是历史遗留，不影响运行）`)
}

if (errors || mismatch || deepBad) {
  console.error(`\n❌ i18n 校验未通过：${errors} 个缺失翻译, ${mismatch} 个语言不一致, ${deepBad} 个结构不一致`)
  process.exit(1)
}
console.log('\n✅ i18n 校验通过')
