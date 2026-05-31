import initSqlJs from 'sql.js'
import { readFileSync } from 'fs'

const SQL = await initSqlJs()
const db = new SQL.Database(readFileSync('server/data/baseball.db'))

const cols = db.exec('PRAGMA table_info(games)')
console.log('games columns:')
cols[0].values.forEach(r => console.log(' ', r[1], r[2]))

const check = db.exec("SELECT COUNT(*) FROM pragma_table_info('games') WHERE name='confirmed'")
console.log('confirmed exists:', check[0]?.values[0][0] > 0)