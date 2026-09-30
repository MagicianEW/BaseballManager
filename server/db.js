import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'baseball.db')

fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new Database(dbPath)
// WAL:读写并发；此前 sql.js 每次写都全量重写整个文件，且无事务
db.pragma('journal_mode = WAL')
// 此前 6 张表声明了外键但从未启用，删球队不会级联清理球员
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'player',
    isActive INTEGER DEFAULT 1,
    isInitial INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    stadium TEXT,
    logo TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS squads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teamId INTEGER NOT NULL,
    name TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    ageGroup TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    number TEXT,
    bats TEXT,
    throws TEXT,
    positions TEXT,
    height TEXT,
    weight TEXT,
    birthdate TEXT,
    teamId INTEGER,
    squadId INTEGER,
    photo TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (squadId) REFERENCES squads(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    homeTeamId INTEGER,
    awayTeamId INTEGER,
    homeScore INTEGER DEFAULT 0,
    awayScore INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled',
    currentInning INTEGER DEFAULT 1,
    currentHalf TEXT DEFAULT 'top',
    outs INTEGER DEFAULT 0,
    balls INTEGER DEFAULT 0,
    strikes INTEGER DEFAULT 0,
    -- 垒上跑者，JSON 数组 [{playerId, base}]，base ∈ {1,2,3}
    -- 这是计分的唯一真相来源
    runners TEXT DEFAULT '[]',
    -- 位掩码，由 runners 派生，仅供 UI 显示局面图，不参与计分
    baseSituation INTEGER DEFAULT 0,
    homeLineup TEXT,
    awayLineup TEXT,
    homePitcherId INTEGER,
    awayPitcherId INTEGER,
    homeConfirmed INTEGER DEFAULT 0,
    awayConfirmed INTEGER DEFAULT 0,
    finalInning INTEGER DEFAULT 6,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (homeTeamId) REFERENCES teams(id),
    FOREIGN KEY (awayTeamId) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS plate_appearances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gameId INTEGER NOT NULL,
    inning INTEGER,
    half TEXT,
    paNumber INTEGER,
    batterId INTEGER,
    pitcherId INTEGER,
    result TEXT,
    rbi INTEGER DEFAULT 0,
    runsScored INTEGER DEFAULT 0,
    -- 本打席推进回本垒的跑者 id，JSON 数组，用于「本场得分明细」
    scoredRunners TEXT DEFAULT '[]',
    pitches TEXT,
    notes TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (batterId) REFERENCES players(id) ON DELETE SET NULL,
    FOREIGN KEY (pitcherId) REFERENCES players(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS substitutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gameId INTEGER NOT NULL,
    atBatId INTEGER,
    type TEXT NOT NULL,
    originalPlayerId INTEGER NOT NULL,
    substitutePlayerId INTEGER NOT NULL,
    base INTEGER,
    reason TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (atBatId) REFERENCES plate_appearances(id) ON DELETE SET NULL,
    FOREIGN KEY (originalPlayerId) REFERENCES players(id),
    FOREIGN KEY (substitutePlayerId) REFERENCES players(id)
  );

  CREATE INDEX IF NOT EXISTS idx_players_team  ON players(teamId);
  CREATE INDEX IF NOT EXISTS idx_players_squad ON players(squadId);
  CREATE INDEX IF NOT EXISTS idx_pa_game        ON plate_appearances(gameId, inning, half, paNumber);
  CREATE INDEX IF NOT EXISTS idx_subs_game      ON substitutions(gameId);
`)

/**
 * 增量迁移：为已存在的库补齐新列。
 * 每次启动都跑，幂等。
 */
function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all()
  if (!cols.some(c => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

ensureColumn('games', 'runners', "TEXT DEFAULT '[]'")
ensureColumn('games', 'homeConfirmed', 'INTEGER DEFAULT 0')
ensureColumn('games', 'awayConfirmed', 'INTEGER DEFAULT 0')
ensureColumn('games', 'finalInning', 'INTEGER DEFAULT 6')
ensureColumn('plate_appearances', 'scoredRunners', "TEXT DEFAULT '[]'")

// 历史库迁移：confirmed(单数) 拆分为 homeConfirmed / awayConfirmed
{
  const cols = db.prepare('PRAGMA table_info(games)').all()
  if (cols.some(c => c.name === 'confirmed')) {
    const rows = db.prepare('SELECT id, confirmed FROM games WHERE confirmed = 1').all()
    if (rows.length) {
      const upd = db.prepare('UPDATE games SET homeConfirmed = 1, awayConfirmed = 1 WHERE id = ?')
      db.transaction(() => rows.forEach(r => upd.run(r.id)))()
    }
  }
}

// player_stats 表从未被写入过任何数据（历史上零 INSERT），
// 统计改为从 plate_appearances 实时汇总，这里移除废弃表。
{
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='player_stats'").all()
  if (tables.length) db.exec('DROP TABLE player_stats')
}

// 初始管理员
{
  const row = db.prepare('SELECT COUNT(*) AS n FROM users WHERE isInitial = 1').get()
  if (row.n === 0) {
    db.prepare(
      'INSERT INTO users (username, password, role, isActive, isInitial) VALUES (?, ?, ?, ?, ?)'
    ).run('admin', bcrypt.hashSync('admin', 10), 'admin', 1, 1)
  }
}

// --- 查询封装 -------------------------------------------------------------
// better-sqlite3 不接受 undefined / boolean，统一归一化
const norm = p => {
  if (p === undefined) return null
  if (typeof p === 'boolean') return p ? 1 : 0
  if (p !== null && typeof p === 'object') return JSON.stringify(p)
  return p
}

/** 查询多行，返回按列名映射的对象数组 */
export function all(sql, params = []) {
  return db.prepare(sql).all(...params.map(norm))
}

/** 查询单行，无结果返回 undefined */
export function get(sql, params = []) {
  return db.prepare(sql).get(...params.map(norm))
}

/** 执行写操作 */
export function run(sql, params = []) {
  return db.prepare(sql).run(...params.map(norm))
}

/** 事务包装。fn 内抛异常则整体回滚 */
export function tx(fn) {
  return db.transaction(fn)
}

export { db, dbPath }
