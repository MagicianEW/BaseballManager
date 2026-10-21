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

// --- 加载翻译表 ---
const { ALL_TRANSLATIONS } = await import(
  path.join(srcDir, 'context/AppContext.jsx')
).catch(async () => {
  // AppContext.jsx 是 JSX，无法直接 import；改用 AppContext 里导出的纯 JS 分片
  const { mergeTranslations } = await import(path.join(srcDir, 'i18n/merge.js'))
  const slices = await Promise.all(
    ['stats', 'gameLive', 'games'].map(n => import(path.join(srcDir, `i18n/${n}.js`)))
  )
  const base = {}
  const src = readFileSync(path.join(srcDir, 'context/AppContext.jsx'), 'utf-8')
  for (const lang of LANGS) {
    const body = src.split(`'${lang}': {`)[1]?.split('\n  },\n')[0] || ''
    const obj = {}
    // 主表中部分值用双引号（如 en 的 noAccount: "Don't have an account?"），
    // 正则必须同时支持单双引号，否则会误判为「缺少翻译」
    for (const m of body.matchAll(/^    (\w+):\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/gm)) {
      const val = m[2] !== undefined ? m[2] : m[3]
      obj[m[1]] = val.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    }
    base[lang] = obj
  }
  return {
    ALL_TRANSLATIONS: mergeTranslations(
      base,
      slices[0].statsI18n, slices[1].gameLiveI18n, slices[2].gamesI18n,
    ),
  }
})

const ALL = ALL_TRANSLATIONS || {}
let errors = 0

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

// --- 3. 未使用的 key（仅提示，不算错误）---
const unused = [...baseSet].filter(k => !usedKeys.has(k))
if (unused.length) {
  console.log(`  ℹ️  主表中有 ${unused.length} 个 key 当前未被使用（可能是历史遗留，不影响运行）`)
}

if (errors || mismatch) {
  console.error(`\n❌ i18n 校验未通过：${errors} 个缺失翻译, ${mismatch} 个语言不一致`)
  process.exit(1)
}
console.log('\n✅ i18n 校验通过')
