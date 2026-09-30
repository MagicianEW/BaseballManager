/**
 * 数据迁移脚本
 *
 * v0.1.x → v0.2.0：
 *   1. baseSituation 保持为位掩码（仅供 UI 局面图）
 *   2. 新增 runners 列，从位掩码反推跑者数组（位掩码不含跑者身份，
 *      playerId 只能置空，由记分员在后续打席中逐步补全）
 *   3. confirmed 拆分为 homeConfirmed / awayConfirmed
 *   4. 新增 finalInning / scoredRunners
 *   5. 移除从未写入过数据的 player_stats 表
 *
 * 用法：npm run migrate
 * 脚本幂等，可重复执行。
 *
 * 注意：此前版本此文件硬编码了开发者本机绝对路径（含用户名与目录结构），
 * 该路径已随代码提交进仓库构成信息泄露，故改为基于 __dirname 相对解析。
 */

import { db, all, get, run, tx } from './server/db.js'

const log = (...a) => console.log(...a)

/** 位掩码 → 跑者数组（playerId 置空，位掩码不含身份信息） */
const BIT_TO_BASE = { 1: 1, 2: 2, 4: 3 }
function bitmaskToRunners(mask) {
  const runners = []
  for (const [bit, base] of Object.entries(BIT_TO_BASE)) {
    if (Number(mask) & Number(bit)) runners.push({ playerId: null, base })
  }
  return runners
}

let migrated = 0

tx(() => {
  // 1) runners 列
  const gameCols = all('PRAGMA table_info(games)')
  const hasRunners = gameCols.some(c => c.name === 'runners')
  if (!hasRunners) {
    run("ALTER TABLE games ADD COLUMN runners TEXT DEFAULT '[]'")
    log('  + games.runners')
  }

  // 2) confirmed 拆分
  for (const [col, def] of [['homeConfirmed', 'INTEGER DEFAULT 0'], ['awayConfirmed', 'INTEGER DEFAULT 0']]) {
    if (!gameCols.some(c => c.name === col)) {
      run(`ALTER TABLE games ADD COLUMN ${col} ${def}`)
      log(`  + games.${col}`)
    }
  }

  // 3) finalInning
  if (!gameCols.some(c => c.name === 'finalInning')) {
    run('ALTER TABLE games ADD COLUMN finalInning INTEGER DEFAULT 6')
    log('  + games.finalInning')
  }

  // 4) plate_appearances.scoredRunners
  const paCols = all('PRAGMA table_info(plate_appearances)')
  if (!paCols.some(c => c.name === 'scoredRunners')) {
    run("ALTER TABLE plate_appearances ADD COLUMN scoredRunners TEXT DEFAULT '[]'")
    log('  + plate_appearances.scoredRunners')
  }

  // 5) 位掩码 → runners
  const games = all('SELECT id, baseSituation, runners FROM games')
  for (const g of games) {
    if (g.runners && g.runners !== '[]') continue   // 已有 runners，跳过
    const runners = bitmaskToRunners(g.baseSituation || 0)
    if (runners.length) {
      run('UPDATE games SET runners = ? WHERE id = ?', [JSON.stringify(runners), g.id])
      migrated++
    }
  }

  // 6) confirmed 单数 → 双数
  if (gameCols.some(c => c.name === 'confirmed')) {
    const rows = all('SELECT id FROM games WHERE confirmed = 1')
    for (const r of rows) {
      run('UPDATE games SET homeConfirmed = 1, awayConfirmed = 1 WHERE id = ?', [r.id])
    }
    log(`  ~ confirmed → homeConfirmed/awayConfirmed（${rows.length} 场）`)
  }

  // 7) 移除废弃表
  const t = get("SELECT name FROM sqlite_master WHERE type='table' AND name='player_stats'")
  if (t) {
    run('DROP TABLE player_stats')
    log('  - player_stats（历史零写入，统计改从 plate_appearances 汇总）')
  }
})()

const stats = get('SELECT COUNT(*) AS n FROM games')
log(`\n迁移完成：${migrated} 场比赛已回填 runners，当前共 ${stats.n} 场`)
log('提示：由位掩码回填的跑者 playerId 为 null，界面上显示为「—」，')
log('      需在记分过程中由记分员逐步指定；比分与统计不受影响。')

db.close()
