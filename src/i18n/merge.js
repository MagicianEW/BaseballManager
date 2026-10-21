/**
 * i18n 分片合并
 *
 * 原本所有翻译都堆在一个 900 行的 AppContext.jsx 里，
 * 多人/多页面并行改动必然冲突。改为：每个页面导出自己的翻译分片，
 * 由 mergeTranslations 统一合并进主翻译表。
 *
 * 分片格式：{ 'zh-CN': {...}, 'zh-TW': {...}, 'en': {...}, 'ja': {...} }
 */

export const LANGS = ['zh-CN', 'zh-TW', 'en', 'ja']

/**
 * 合并主翻译表与各页面分片。
 *
 * 优先级：分片 > 主表。
 * 主表是通用兜底文案，分片是页面专用文案 —— 页面的语境更准确，
 * 例如主表的 balls='球'（棒球里易与球棒混淆），
 * 而记分页分片的 balls='坏球' 才是该场景下正确的说法。
 */
export function mergeTranslations(base, ...slices) {
  const out = {}
  for (const lang of LANGS) {
    // 主表先铺底
    out[lang] = { ...(base?.[lang] || {}) }
    // 分片覆盖主表（页面专用文案优先）
    for (const slice of slices) {
      out[lang] = { ...out[lang], ...(slice?.[lang] || {}) }
    }
  }
  return out
}

/** 校验分片完整性：返回各语言缺失的 key */
export function missingKeys(slice) {
  const ref = Object.keys(slice['zh-CN'] || {})
  const missing = {}
  for (const lang of LANGS) {
    const have = new Set(Object.keys(slice[lang] || {}))
    const miss = ref.filter(k => !have.has(k))
    if (miss.length) missing[lang] = miss
  }
  return missing
}
