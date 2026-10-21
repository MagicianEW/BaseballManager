import { all, get } from '../db.js'
import { fmtRate, computeDerived, computePitchDerived } from './statMath.js'

/**
 * 统计服务层
 *
 * 全部统计从 plate_appearances 实时汇总（单一数据源，不会两处不一致）。
 *
 * 指标口径参照 MLB 官方计分与 Baseball-Reference：
 *   BA   = H / AB
 *   OBP  = (H + BB + HBP) / (AB + BB + HBP + SF)
 *   SLG  = TB / AB ，TB = 1×1B + 2×2B + 3×3B + 4×HR
 *   OPS  = OBP + SLG
 *   ISO  = SLG − BA（纯长打率）
 *   XBH  = 2B + 3B + HR（长打）
 *   BABIP= (H − HR) / (AB − SO − GDP + SF)
 *   K%   = SO / AB ，BB% = BB / PA ，K/BB = SO / BB
 *
 * 关于 IBB（故意四坏）：按 MLB 官方计分，IBB 属于保送，计入 BB 统计，
 * 因此也计入 OBP。BB 单独拆分出 ibb 字段便于展示，但不要重复计数。
 * 关于 HBP（触身球）：是保送的一种独立分类，不计入 BB，只计入 OBP。
 */

// 记入打数 AB
const AB_RESULTS = ['1B', '2B', '3B', 'HR', 'SO', 'GO', 'FO', 'GDP', 'E']
// 记为安打 H
const HIT_RESULTS = ['1B', '2B', '3B', 'HR']
// 记为出局
const OUT_RESULTS = ['SO', 'GO', 'FO', 'GDP']
// 保送（不含触身球、不含故意四坏）
const WALK_RESULTS = ['BB']
// 跑垒类，不计入打数也不改变出局
const OTHER_RESULTS = ['SB', 'CS', 'PK', 'WP', 'BALK', 'PB']

const parse = v => {
  if (Array.isArray(v)) return v
  try { return v ? JSON.parse(v) : [] } catch { return [] }
}

/** 该球员作为跑者回本垒的总次数 */
const runsScoredAsRunner = (playerId, gameId = null) => {
  const params = [playerId]
  let sql = `SELECT COUNT(*) AS n
             FROM plate_appearances pa, json_each(pa.scoredRunners) je
             WHERE je.value = ?`
  if (gameId != null) {
    sql += ' AND pa.gameId = ?'
    params.push(gameId)
  }
  return get(sql, params)?.n ?? 0
}

/**
 * 从打席记录聚合出一个打者的完整打击统计。
 * 这是唯一的统计计算入口，getPlayerStats / getTeamStats / getGameStats 共用。
 */
function aggregateBatting(playerId, { gameId = null, name = null, number = null, teamId = null, squadId = null } = {}) {
  const params = [playerId]
  let sql = `SELECT result, scoredRunners, COUNT(*) AS n, SUM(rbi) AS rbi
             FROM plate_appearances WHERE batterId = ?`
  if (gameId != null) { sql += ' AND gameId = ?'; params.push(gameId) }
  sql += ' GROUP BY result'
  const rows = all(sql, params)

  const s = {
    pa: 0, ab: 0, h: 0, r: 0, rbi: 0,
    bb: 0, hbp: 0, so: 0, ibb: 0, sac: 0, sf: 0, gidp: 0, e: 0,
    d: 0, t: 0, hr: 0, xbh: 0, tb: 0,
    b: 0, po: 0, go: 0, fo: 0, sb: 0, cs: 0,
  }

  for (const row of rows) {
    const n = row.n
    s.pa += n
    s.rbi += row.rbi || 0

    if (AB_RESULTS.includes(row.result)) s.ab += n
    if (HIT_RESULTS.includes(row.result)) s.h += n

    switch (row.result) {
      case '1B': s.b += n; s.tb += n * 1; break
      case '2B': s.d += n; s.tb += n * 2; s.xbh += n; break
      case '3B': s.t += n; s.tb += n * 3; s.xbh += n; break
      case 'HR': s.hr += n; s.tb += n * 4; s.xbh += n; break
      case 'BB': s.bb += n; break
      case 'IBB': s.bb += n; s.ibb += n; break     // 故意四坏属于保送
      case 'HBP': s.hbp += n; break
      case 'SO': s.so += n; break
      case 'GDP': s.gidp += n; break
      case 'SAC': s.sac += n; break
      case 'SF': s.sf += n; break
      case 'E': s.e += n; break
      case 'SB': s.sb += n; break
      case 'CS': s.cs += n; break
      case 'GO': s.go += n; break
      case 'FO': s.fo += n; break
      case 'PO': s.po += n; break
    }
  }

  // 得分：作为跑者回本垒的次数（发生在别人的打席里）
  s.r = runsScoredAsRunner(playerId, gameId)

  // 派生指标（纯计算，公式在 statMath.js，测试直接覆盖该模块）
  const derived = computeDerived(s)

  return {
    playerId, name, number, teamId, squadId,
    ...s,
    ...derived,
  }
}

/**
 * 从打席记录聚合出一个投手的投球统计。
 */
function aggregatePitching(playerId, { gameId = null, name = null } = {}) {
  const params = [playerId]
  let sql = `SELECT result, COUNT(*) AS n, SUM(runsScored) AS runs
             FROM plate_appearances WHERE pitcherId = ?`
  if (gameId != null) { sql += ' AND gameId = ?'; params.push(gameId) }
  sql += ' GROUP BY result'
  const rows = all(sql, params)

  const p = {
    playerId, name,
    pa: 0, outs: 0, h: 0, r: 0, er: 0, bb: 0, hbp: 0, so: 0, ibb: 0, gdp: 0,
    sf: 0, sac: 0, ip: 0, whip: '—', era: '—', kPct: '.000', bbPct: '.000',
  }

  for (const row of rows) {
    const n = row.n
    p.pa += n
    if (OUT_RESULTS.includes(row.result)) { p.outs += n; p.ip += n / 3 }
    if (HIT_RESULTS.includes(row.result)) p.h += n
    if (row.result === 'BB') p.bb += n
    if (row.result === 'IBB') { p.bb += n; p.ibb += n }
    if (row.result === 'HBP') p.hbp += n
    if (row.result === 'SO') p.so += n
    if (row.result === 'GDP') p.gdp += n
    if (row.result === 'SF') p.sf += n
    if (row.result === 'SAC') p.sac += n
    // 本打席推进的得分记在该投手账上
    const scored = row.runs || 0
    p.r += scored
    p.er += scored
  }

  Object.assign(p, computePitchDerived(p))

  return p
}

export const statsService = {
  /** 单个球员的完整统计（打击 + 投球） */
  async getPlayerStats(playerId) {
    const player = get('SELECT id, name, number, teamId, squadId FROM players WHERE id = ?', [playerId])
    if (!player) return null

    const batting = aggregateBatting(playerId, {
      name: player.name, number: player.number,
      teamId: player.teamId, squadId: player.squadId,
    })
    const pitching = aggregatePitching(playerId, { name: player.name })

    return {
      ...batting,
      pitching: pitching.pa > 0 ? pitching : null,
      // 扁平别名，便于前端直接展示
      pitchH: pitching.h, pitchR: pitching.r, pitchEr: pitching.er,
      pitchSo: pitching.so, pitchBb: pitching.bb, pitchIp: pitching.ip,
    }
  },

  /** 球队全部球员的统计 */
  async getTeamStats(teamId) {
    const players = all(
      'SELECT id, name, number, teamId, squadId, positions, photo FROM players WHERE teamId = ? ORDER BY number',
      [teamId])
    return players.map(p => ({
      ...p,
      ...aggregateBatting(p.id, { name: p.name, number: p.number, teamId: p.teamId, squadId: p.squadId }),
    }))
  },

  /** 单场比赛的打投统计 + 逐局比分表 */
  async getGameStats(gameId) {
    const game = get('SELECT * FROM games WHERE id = ?', [gameId])
    if (!game) return null

    const pas = all(`
      SELECT pa.id, pa.gameId, pa.inning, pa.half, pa.paNumber,
             pa.batterId, pa.pitcherId, pa.result, pa.rbi, pa.runsScored,
             pa.scoredRunners, pa.pitches, pa.notes, pa.createdAt,
             pb.name AS batterName, pp.name AS pitcherName
      FROM plate_appearances pa
      LEFT JOIN players pb ON pa.batterId = pb.id
      LEFT JOIN players pp ON pa.pitcherId = pp.id
      WHERE pa.gameId = ? ORDER BY pa.inning, pa.half, pa.paNumber`, [gameId])
      .map(p => ({ ...p, scoredRunners: parse(p.scoredRunners), pitches: parse(p.pitches) }))

    const batting = new Map()
    const pitching = new Map()

    for (const pa of pas) {
      // aggregateBatting / aggregatePitching 已通过 SQL 汇总过 rbi / r，
      // 此处只补齐没有聚合到的字段（打者姓名、投手姓名），
      // 绝不能再累加 rbi / r，否则会重复计算。
      if (pa.batterId != null && !batting.has(pa.batterId)) {
        batting.set(pa.batterId, aggregateBatting(pa.batterId, { gameId, name: pa.batterName }))
      }
      if (pa.pitcherId != null && !pitching.has(pa.pitcherId)) {
        pitching.set(pa.pitcherId, aggregatePitching(pa.pitcherId, { gameId, name: pa.pitcherName }))
      }
    }

    // 补齐各打者的得分（作为跑者得分发生在别人的打席里）
    for (const [pid, b] of batting) b.r = runsScoredAsRunner(pid, gameId)
    // 补齐投手的 IP / 派生指标
    for (const [, p] of pitching) {
      Object.assign(p, computePitchDerived(p))
    }

    // 逐局比分表：R / H / E
    const line = { away: [], home: [] }
    for (let i = 1; i <= (game.finalInning || 6); i++) {
      line.away.push({ inning: i, runs: 0, hits: 0, errors: 0 })
      line.home.push({ inning: i, runs: 0, hits: 0, errors: 0 })
    }
    for (const pa of pas) {
      const half = pa.half === 'top' ? 'away' : 'home'
      const idx = pa.inning - 1
      if (idx < 0 || idx >= line[half].length) continue
      line[half][idx].runs += pa.runsScored || 0
      if (HIT_RESULTS.includes(pa.result)) line[half][idx].hits += 1
      if (pa.result === 'E') line[half][idx].errors += 1
    }

    return {
      gameId,
      batting: [...batting.values()],
      pitching: [...pitching.values()],
      plateAppearances: pas,
      lineScore: line,
      totals: {
        away: {
          runs: line.away.reduce((s, x) => s + x.runs, 0),
          hits: line.away.reduce((s, x) => s + x.hits, 0),
          errors: line.away.reduce((s, x) => s + x.errors, 0),
        },
        home: {
          runs: line.home.reduce((s, x) => s + x.runs, 0),
          hits: line.home.reduce((s, x) => s + x.hits, 0),
          errors: line.home.reduce((s, x) => s + x.errors, 0),
        },
      },
    }
  },
}
