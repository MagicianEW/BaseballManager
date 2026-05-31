import initSqlJs from 'sql.js'
import { readFileSync } from 'fs'

const SQL = await initSqlJs()
const db = new SQL.Database(readFileSync('server/data/baseball.db'))

// 1. 检查 confirmed 列是否存在于 games 表
const cols = db.exec('PRAGMA table_info(games)')
const hasConfirmed = cols[0].values.some(r => r[1] === 'confirmed')
console.log('games confirmed column exists:', hasConfirmed)

// 2. 检查 baseSituation 列类型
const bsType = cols[0].values.find(r => r[1] === 'baseSituation')
console.log('baseSituation type:', bsType ? bsType[2] : 'MISSING')

// 3. 测试 updateBaseSituation 函数逻辑（从 gameService.js 提取）
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

// 运行测试
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
console.log(`Logic tests: ${pass}/${pass+fail} passed`)

// 4. 检查 substitutions 表
const subCols = db.exec('PRAGMA table_info(substitutions)')
console.log('substitutions table exists:', subCols[0]?.values.length > 0)

// 5. 检查 games 数据
const games = db.exec('SELECT id, confirmed, baseSituation, status FROM games')
if (games[0]) {
  console.log('\ngames table:')
  games[0].values.forEach(r => console.log(' ', r))
}