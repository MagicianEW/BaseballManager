import { all, get, run, tx } from '../db.js'
import { resolvePlay, toBitmask } from './scoring.js'
import { BadRequest } from '../errors.js'

/**
 * 比赛服务层
 *
 * 计分相关的规则全部在 scoring.js 中，本文件只负责读写与状态推进。
 */

const GAME_COLUMNS = `g.id, g.date, g.homeTeamId, g.awayTeamId,
  g.homeScore, g.awayScore, g.status, g.currentInning, g.currentHalf,
  g.outs, g.balls, g.strikes, g.runners, g.baseSituation,
  g.homeLineup, g.awayLineup, g.homePitcherId, g.awayPitcherId,
  g.homeConfirmed, g.awayConfirmed, g.finalInning, g.createdAt,
  ht.name AS homeTeamName, at.name AS awayTeamName`

const GAME_FROM = `FROM games g
  LEFT JOIN teams ht ON g.homeTeamId = ht.id
  LEFT JOIN teams at  ON g.awayTeamId = at.id`

/** 允许通过 update() 修改的列，防止请求体任意 key 变成列名 */
const UPDATABLE_COLUMNS = new Set([
  'date', 'homeTeamId', 'awayTeamId', 'homeScore', 'awayScore', 'status',
  'currentInning', 'currentHalf', 'outs', 'balls', 'strikes',
  'homeLineup', 'awayLineup', 'homePitcherId', 'awayPitcherId',
  'homeConfirmed', 'awayConfirmed', 'finalInning',
])

const parseJSON = (v, fallback) => {
  try { return v ? JSON.parse(v) : fallback } catch { return fallback }
}

/**
 * 推进局数 / 出局 / 比分。
 * 仅由 addPlateAppearance 在事务内调用。
 */
function advanceGameState(game, play, half) {
  const scoringHalf = half === 'bottom' ? 'home' : 'away'
  let outs = (game.outs || 0) + play.outs
  let inning = game.currentInning
  let curHalf = game.currentHalf
  const finalInning = game.finalInning || 6

  if (outs >= 3) {
    outs = 0
    if (curHalf === 'top') {
      curHalf = 'bottom'                    // 上半结束 → 下半
    } else {
      curHalf = 'top'                       // 下半结束 → 下一局上半
      inning += 1
    }
  }

  // 打满最终局下半即比赛结束（此时已换到下一局上半，需要回退）
  let status = game.status
  if (game.status === 'in_progress' && curHalf === 'top' && inning > finalInning) {
    status = 'completed'
    inning = finalInning
    curHalf = 'bottom'
  }

  const homeScore = (game.homeScore || 0) + (scoringHalf === 'home' ? play.runs.length : 0)
  const awayScore = (game.awayScore || 0) + (scoringHalf === 'away' ? play.runs.length : 0)

  run(`UPDATE games SET runners = ?, baseSituation = ?, outs = ?, balls = 0, strikes = 0,
       currentInning = ?, currentHalf = ?, homeScore = ?, awayScore = ?, status = ?
     WHERE id = ?`,
    [JSON.stringify(play.runners), toBitmask(play.runners), outs, inning, curHalf,
     homeScore, awayScore, status, game.id])

  return { runners: play.runners, outs, inning, curHalf, homeScore, awayScore, status }
}

export const gameService = {
  async getAll() {
    return all(`SELECT ${GAME_COLUMNS} ${GAME_FROM} ORDER BY g.id DESC`).map(g => ({
      ...g,
      homeConfirmed: !!g.homeConfirmed,
      awayConfirmed: !!g.awayConfirmed,
    }))
  },

  async getById(id) {
    const game = get(`SELECT ${GAME_COLUMNS} ${GAME_FROM} WHERE g.id = ?`, [id])
    if (!game) return null

    const pa = all(`
      SELECT pa.id, pa.gameId, pa.inning, pa.half, pa.paNumber,
             pa.batterId, pa.pitcherId, pa.result, pa.rbi, pa.runsScored,
             pa.scoredRunners, pa.pitches, pa.notes, pa.createdAt,
             pb.name AS batterName, pp.name AS pitcherName
      FROM plate_appearances pa
      LEFT JOIN players pb ON pa.batterId = pb.id
      LEFT JOIN players pp ON pa.pitcherId = pp.id
      WHERE pa.gameId = ?
      ORDER BY pa.inning, pa.half, pa.paNumber`, [id])

    return {
      ...game,
      homeConfirmed: !!game.homeConfirmed,
      awayConfirmed: !!game.awayConfirmed,
      runners: parseJSON(game.runners, []),
      homeLineup: parseJSON(game.homeLineup, []),
      awayLineup: parseJSON(game.awayLineup, []),
      plateAppearances: pa.map(p => ({ ...p, scoredRunners: parseJSON(p.scoredRunners, []) })),
    }
  },

  async create(data) {
    const id = run(`
      INSERT INTO games (date, homeTeamId, awayTeamId, homeLineup, awayLineup,
                         homePitcherId, awayPitcherId, finalInning)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.date || null,
        data.homeTeamId,
        data.awayTeamId,
        JSON.stringify(data.homeLineup || []),
        JSON.stringify(data.awayLineup || []),
        data.homePitcherId || null,
        data.awayPitcherId || null,
        data.finalInning || 6,
      ]).lastInsertRowid

    return { id: Number(id), ...data, status: 'scheduled' }
  },

  async update(id, data) {
    const fields = []
    const values = []

    for (const [key, value] of Object.entries(data)) {
      if (key === 'id') continue
      // 非法列名直接丢弃，不拼进 SQL
      if (!UPDATABLE_COLUMNS.has(key)) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[gameService.update] 忽略不可写字段: ${key}`)
        }
        continue
      }
      fields.push(`${key} = ?`)
      values.push(Array.isArray(value) || (value !== null && typeof value === 'object')
        ? JSON.stringify(value)
        : value)
    }

    if (fields.length) {
      values.push(id)
      run(`UPDATE games SET ${fields.join(', ')} WHERE id = ?`, values)
    }
    return { id, ...data }
  },

  async delete(id) {
    // plate_appearances / substitutions 由外键 ON DELETE CASCADE 清理
    run('DELETE FROM games WHERE id = ?', [id])
    return { success: true }
  },

  /**
   * 记录一个打席。插入记录与推进比赛状态必须在同一事务内，
   * 否则中途失败会留下「比分变了但没有打席记录」的脏数据。
   */
  async addPlateAppearance(gameId, data) {
    const result = data.result

    return tx(() => {
      const game = get('SELECT * FROM games WHERE id = ?', [gameId])
      if (!game) throw new Error('比赛不存在')

      // 外键现在真正启用（此前 6 张表声明了 FK 却从未打开约束），
      // 需要显式校验，给出可读错误而不是 500
      for (const [field, pid] of [['batterId', data.batterId], ['pitcherId', data.pitcherId]]) {
        if (pid != null && !get('SELECT id FROM players WHERE id = ?', [pid])) {
          throw new BadRequest(`${field}=${pid} 对应的球员不存在`)
        }
      }

      const half = data.half || game.currentHalf
      const inning = data.inning || game.currentInning
      const runners = parseJSON(game.runners, [])

      // 未知结果码（SB/CS 等跑垒动作）原样记录，不改变局面
      const play = resolvePlay(runners, data.batterId, result)
      if (play.unknown) {
        const id = run(`
          INSERT INTO plate_appearances
            (gameId, inning, half, paNumber, batterId, pitcherId, result, pitches, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [gameId, inning, half, data.paNumber, data.batterId, data.pitcherId,
           result, JSON.stringify(data.pitches || []), data.notes || null]).lastInsertRowid
        return { id: Number(id), gameId, ...data, runs: 0, rbi: 0, runsScored: 0 }
      }

      const runsScored = play.runs.length
      // 官方口径：全垒打打者自己跑回本垒那一分不计 RBI
      const rbi = Math.max(0, runsScored - (result === 'HR' ? 1 : 0))

      const paId = run(`
        INSERT INTO plate_appearances
          (gameId, inning, half, paNumber, batterId, pitcherId, result,
           rbi, runsScored, scoredRunners, pitches, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [gameId, inning, half, data.paNumber, data.batterId, data.pitcherId, result,
         rbi, runsScored, JSON.stringify(play.runs),
         JSON.stringify(data.pitches || []), data.notes || null]).lastInsertRowid

      const next = advanceGameState(game, play, half)

      return {
        id: Number(paId),
        gameId,
        ...data,
        runs: runsScored,
        runsScored,
        rbi,
        scoredRunners: play.runs,
        game: next,
      }
    })()
  },

  /**
   * 手动结束半局（记分员手动纠错用）
   */
  async advanceHalf(gameId) {
    return tx(() => {
      const game = get('SELECT * FROM games WHERE id = ?', [gameId])
      if (!game) throw new Error('比赛不存在')
      const finalInning = game.finalInning || 6
      let inning = game.currentInning
      let curHalf = game.currentHalf === 'top' ? 'bottom' : 'top'
      let status = game.status
      if (curHalf === 'top') {
        inning += 1
        if (inning > finalInning) { status = 'completed'; inning = finalInning; curHalf = 'bottom' }
      }
      run(`UPDATE games SET currentHalf = ?, currentInning = ?, outs = 0, balls = 0, strikes = 0,
           baseSituation = 0, runners = '[]', status = ? WHERE id = ?`,
        [curHalf, inning, status, gameId])
      return { inning, curHalf, status }
    })()
  },

  async changePitcher(gameId, team, pitcherId) {
    if (team !== 'home' && team !== 'away') throw new Error('team 必须是 home 或 away')
    const field = team === 'home' ? 'homePitcherId' : 'awayPitcherId'
    run(`UPDATE games SET ${field} = ? WHERE id = ?`, [pitcherId, gameId])
    return { success: true, pitcherId }
  },

  async changeBatter(gameId, team, batterId, lineupIndex) {
    if (team !== 'home' && team !== 'away') throw new Error('team 必须是 home 或 away')
    const field = team === 'home' ? 'homeLineup' : 'awayLineup'
    const game = get(`SELECT ${field} AS lineup FROM games WHERE id = ?`, [gameId])
    if (!game) throw new Error('比赛不存在')

    const lineup = parseJSON(game.lineup, [])
    const idx = Number(lineupIndex)
    if (!Number.isInteger(idx) || idx < 0 || idx >= lineup.length) {
      throw new Error('lineupIndex 超出范围')
    }
    lineup[idx] = batterId
    run(`UPDATE games SET ${field} = ? WHERE id = ?`, [JSON.stringify(lineup), gameId])
    return { success: true, batterId, lineupIndex: idx }
  },

  // 代跑 / 代打
  async addSubstitution(gameId, data) {
    const id = run(`
      INSERT INTO substitutions
        (gameId, atBatId, type, originalPlayerId, substitutePlayerId, base, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [gameId, data.atBatId || null, data.type, data.originalPlayerId,
       data.substitutePlayerId, data.base || null, data.reason || null]).lastInsertRowid
    return { id: Number(id), gameId, ...data }
  },

  async getSubstitutions(gameId, type) {
    const params = [gameId]
    let filter = ''
    if (type) { filter = ' AND s.type = ?'; params.push(type) }

    return all(`
      SELECT s.id, s.gameId, s.atBatId, s.type, s.originalPlayerId, s.substitutePlayerId,
             s.base, s.reason, s.createdAt,
             op.name AS originalPlayerName, sp.name AS substitutePlayerName,
             pa.inning, pa.half
      FROM substitutions s
      LEFT JOIN players op ON s.originalPlayerId = op.id
      LEFT JOIN players sp ON s.substitutePlayerId = sp.id
      LEFT JOIN plate_appearances pa ON s.atBatId = pa.id
      WHERE s.gameId = ?${filter}
      ORDER BY s.createdAt`, params)
  },

  /**
   * 确认阵容。主客队分别锁定，此前 team 参数被忽略导致一把锁两队，
   * 且空阵容也能确认。
   */
  async confirmLineup(gameId, team) {
    if (team !== 'home' && team !== 'away') throw new Error('team 必须是 home 或 away')
    const game = get('SELECT homeLineup, awayLineup FROM games WHERE id = ?', [gameId])
    if (!game) throw new Error('比赛不存在')

    const lineup = parseJSON(team === 'home' ? game.homeLineup : game.awayLineup, [])
    const filled = lineup.filter(Boolean).length
    if (filled === 0) throw new Error('阵容为空，无法确认')

    const field = team === 'home' ? 'homeConfirmed' : 'awayConfirmed'
    run(`UPDATE games SET ${field} = 1 WHERE id = ?`, [gameId])
    return { success: true, team, confirmed: true, lineupSize: filled }
  },

  // 解锁阵容（赛前调整）
  async reopenLineup(gameId, team) {
    if (team !== 'home' && team !== 'away') throw new Error('team 必须是 home 或 away')
    const field = team === 'home' ? 'homeConfirmed' : 'awayConfirmed'
    run(`UPDATE games SET ${field} = 0 WHERE id = ?`, [gameId])
    return { success: true, team, confirmed: false }
  },
}
