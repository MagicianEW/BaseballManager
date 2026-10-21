/**
 * 翻译表统一入口
 *
 * 主表 + 全部页面级分片在这里合并成唯一的一份 ALL_TRANSLATIONS。
 * 应用运行时（AppContext）与校验脚本（scripts/check-i18n.mjs）引用的是
 * 同一份，避免「脚本校验的和应用用的不是一回事」这种盲区。
 */
import baseTranslations from './base.js'
import { mergeTranslations } from './merge.js'
import { statsI18n } from './stats.js'
import { gameLiveI18n } from './gameLive.js'
import { gamesI18n } from './games.js'
import { helpI18n } from './help.js'

export const translations = baseTranslations

export const ALL_TRANSLATIONS = mergeTranslations(
  baseTranslations,
  statsI18n,
  gameLiveI18n,
  gamesI18n,
  helpI18n,
)

export { mergeTranslations }
