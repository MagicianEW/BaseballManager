import initSqlJs from 'sql.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'data', 'baseball.db')

let db = null

async function getDb() {
  if (db) return db

  const SQL = await initSqlJs()
  const data = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : null
  db = data ? new SQL.Database(data) : new SQL.Database()

  // 初始化表
  db.run(`
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
      FOREIGN KEY (teamId) REFERENCES teams(id),
      FOREIGN KEY (squadId) REFERENCES squads(id)
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
      baseSituation INTEGER DEFAULT 0,
      homeLineup TEXT,
      awayLineup TEXT,
      homePitcherId INTEGER,
      awayPitcherId INTEGER,
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
      pitches TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gameId) REFERENCES games(id),
      FOREIGN KEY (batterId) REFERENCES players(id),
      FOREIGN KEY (pitcherId) REFERENCES players(id)
    );

    -- TODO: player_stats 表与 plate_appearances 存在字段重叠
    -- plate_appearances 已记录详细打席数据 (result, rbi, runsScored 等)
    -- player_stats 表的 ab, h, r, rbi 等字段可通过 plate_appearances 汇总计算
    -- 考虑在未来版本中移除 player_stats 表，或仅用于缓存预计算结果
    CREATE TABLE IF NOT EXISTS player_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playerId INTEGER,
      gameId INTEGER,
      teamId INTEGER,
      squadId INTEGER,
      ab INTEGER DEFAULT 0,
      h INTEGER DEFAULT 0,
      r INTEGER DEFAULT 0,
      rbi INTEGER DEFAULT 0,
      bb INTEGER DEFAULT 0,
      hbp INTEGER DEFAULT 0,
      so INTEGER DEFAULT 0,
      sb INTEGER DEFAULT 0,
      cs INTEGER DEFAULT 0,
      sac INTEGER DEFAULT 0,
      sf INTEGER DEFAULT 0,
      gidp INTEGER DEFAULT 0,
      ip REAL DEFAULT 0,
      er INTEGER DEFAULT 0,
      so_p INTEGER DEFAULT 0,
      bb_p INTEGER DEFAULT 0,
      earnedRuns INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (playerId) REFERENCES players(id),
      FOREIGN KEY (gameId) REFERENCES games(id),
      FOREIGN KEY (teamId) REFERENCES teams(id),
      FOREIGN KEY (squadId) REFERENCES squads(id)
    );

    CREATE TABLE IF NOT EXISTS squads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teamId INTEGER NOT NULL,
      name TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      ageGroup TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teamId) REFERENCES teams(id)
    );
  `)

  // 创建初始管理员（如果不存在）
  const adminExists = db.exec("SELECT COUNT(*) FROM users WHERE isInitial = 1")
  if (adminExists[0]?.values[0][0] === 0) {
    // 密码是 admin，使用 bcrypt 加密
    const bcrypt = (await import('bcryptjs')).default
    const hashedPassword = bcrypt.hashSync('admin', 10)
    db.run(
      "INSERT INTO users (username, password, role, isActive, isInitial) VALUES (?, ?, ?, ?, ?)",
      ['admin', hashedPassword, 'admin', 1, 1]
    )
    saveDb()
  }

  saveDb()
  return db
}

function saveDb() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  fs.writeFileSync(dbPath, buffer)
}

export { getDb, saveDb }