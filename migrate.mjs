import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync } from 'fs'

const SQL = await initSqlJs()
const db = new SQL.Database(readFileSync('/home/ew/workspace/baseballmanager/server/data/baseball.db'))

// 迁移 baseSituation: TEXT → INTEGER
// sqlite 不支持直接 ALTER COLUMN，步骤：
// 1. 创建新表（INTEGER 版 baseSituation）
// 2. 复制数据（CAST）
// 3. 删除旧表
// 4. 重命名新表
db.run(`
  CREATE TABLE games_new AS
  SELECT
    id, date, homeTeamId, awayTeamId, homeScore, awayScore, status,
    currentInning, currentHalf, outs, balls, strikes,
    CAST(baseSituation AS INTEGER) as baseSituation,
    homeLineup, awayLineup, homePitcherId, awayPitcherId,
    createdAt, confirmed
  FROM games
`)
db.run('DROP TABLE games')
db.run('ALTER TABLE games_new RENAME TO games')

// 验证新结构
const newCols = db.exec('PRAGMA table_info(games)')
console.log('New games columns:')
newCols[0].values.forEach(r => console.log(' ', r[1], r[2]))

// 验证数据
const games = db.exec('SELECT id, baseSituation, confirmed FROM games')
console.log('\nData:')
games[0].values.forEach(r => console.log(' ', r))

writeFileSync('/home/ew/workspace/baseballmanager/server/data/baseball.db', Buffer.from(db.export()))
console.log('\nMigration done')

// 验证：确认位掩码逻辑（40/40 tests）
const FIRST_BASE = 1, SECOND_BASE = 2, THIRD_BASE = 4

function updateBaseSituation(currentBitmask, hitResult) {
  if (hitResult === '1B') {
    let b = 0
    if (currentBitmask & FIRST_BASE)  b |= SECOND_BASE
    if (currentBitmask & SECOND_BASE) b |= THIRD_BASE
    b |= FIRST_BASE
    return b
  }
  if (hitResult === '2B') {
    let b = 0
    if (currentBitmask & SECOND_BASE) b |= THIRD_BASE
    b |= SECOND_BASE
    return b
  }
  if (hitResult === '3B') {
    let b = THIRD_BASE
    if (currentBitmask & FIRST_BASE)  b |= THIRD_BASE
    if (currentBitmask & SECOND_BASE) b |= THIRD_BASE
    return b
  }
  if (hitResult === 'HR') return 0
  return currentBitmask
}

function advanceOnWalk(currentBitmask) {
  let b = 0
  if (currentBitmask & SECOND_BASE) b |= THIRD_BASE
  if (currentBitmask & FIRST_BASE)  b |= SECOND_BASE
  b |= FIRST_BASE
  return b
}

const allTests = [
  [0,'1B',1],[1,'1B',3],[2,'1B',5],[4,'1B',1],[3,'1B',7],[5,'1B',3],[6,'1B',5],[7,'1B',7],
  [0,'2B',2],[1,'2B',2],[2,'2B',6],[4,'2B',2],[3,'2B',6],[5,'2B',2],[6,'2B',6],[7,'2B',6],
  [0,'3B',4],[1,'3B',4],[2,'3B',4],[4,'3B',4],[3,'3B',4],[5,'3B',4],[6,'3B',4],[7,'3B',4],
  [0,'HR',0],[1,'HR',0],[2,'HR',0],[4,'HR',0],[3,'HR',0],[5,'HR',0],[6,'HR',0],[7,'HR',0],
  [0,'walk',1],[1,'walk',3],[2,'walk',5],[4,'walk',1],[3,'walk',7],[5,'walk',3],[6,'walk',5],[7,'walk',7],
]

let pass = 0, fail = 0
for (const [inp, hit, exp] of allTests) {
  const fn = hit === 'walk' ? advanceOnWalk : updateBaseSituation
  const got = fn(inp, hit)
  if (got === exp) { pass++ }
  else { fail++; console.log(`FAIL base${inp}+${hit} → ${got}, expected ${exp}`) }
}
console.log(`\nLogic tests: ${pass}/${pass+fail} passed`)