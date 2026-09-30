import { all, get } from '../db.js'

/**
 * 统计服务层
 *
 * 原实现在 player_stats 表上做 SUM()，但全仓库从未有任何 INSERT 写入该表，
 * 导致所有球员统计恒为 0。现改为从 plate_appearances 实时汇总，
 * 单一数据源，不会出现两处数据不一致。
 */

// 记入打数的结果
const AB_RESULTS = ['1B', '2B', '3B', 'HR', 'SO', 'GO', 'FO', 'GDP', 'E']
// 记为安打
const HIT_RESULTS = ['1B', '2B', '3B', 'HR']
// 记为出局
const OUT_RESULTS = ['SO', 'GO', 'FO', 'GDP']
// 计入保送（故意四坏按官方口径不计入 BB）
const BB_RESULTS = ['BB', 'HBP']

const PA_SELECT = `
  SELECT pa.id, pa.gameId, pa.inning, pa.half, pa.paNumber,
         pa.batterId, pa.pitcherId, pa.result, pa.rbi, pa.runsScored,
         pa.scoredRunners, pa.pitches, pa.notes, pa.createdAt,
         pb.name AS batterName, pp.name AS pitcherName
  FROM plate_appearances pa
  LEFT JOIN players pb ON pa.batterId = pb.id
  LEFT JOIN players pp ON pa.pitcherId = pp.id`

const parse = v => {
  if (Array.isArray(v)) return v
  try { return v ? JSON.parse(v) : [] } catch { return [] }
}

/**
 * 该球员作为跑者回本垒的总次数。
 *
 * 注意：得分发生在「别人的打席」里 —— 被满垒全垒打送回本垒的三名跑者，
 * 他们自己的打席记录里 scoredRunners 是空的。因此不能只查 batterId = ?，
 * 必须扫全部打席的 scoredRunners 字段（SQLite JSON1 的 json_each）。
 */
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

const battingRate = (h, ab) => (ab > 0 ? (h / ab).toFixed(3).replace(/^0/, '') : '.000')
const onBase = (h, bb, hbp, sf, denom) =>
  denom > 0 ? ((h + bb + hbp) / denom).toFixed(3).replace(/^0/, '') : '.000'

export const statsService = {
  /**
   * 单个球员的生涯统计，从 plate_appearances 汇总
   */
  async getPlayerStats(playerId) {
    const player = get('SELECT id, name, number, teamId, squadId FROM players WHERE id = ?', [playerId])
    if (!player) return null

    const rows = all('SELECT result, scoredRunners, COUNT(*) AS n, SUM(rbi) AS rbi ' +
                     'FROM plate_appearances WHERE batterId = ? GROUP BY result', [playerId])
    const pitchRows = all('SELECT result, COUNT(*) AS n FROM plate_appearances ' +
                          'WHERE pitcherId = ? GROUP BY result', [playerId])

    // 得分 (R) 单独统计：得分发生在别人的打席里，见 runsScoredAsRunner 说明
    const s = { ab: 0, h: 0, r: runsScoredAsRunner(playerId), rbi: 0, bb: 0, hbp: 0, so: 0, ibb: 0, sac: 0, sf: 0, gidp: 0, e: 0 }
    for (const row of rows) {
      const n = row.n
      s.rbi += row.rbi || 0
      if (AB_RESULTS.includes(row.result)) s.ab += n
      if (HIT_RESULTS.includes(row.result)) s.h += n
      if (BB_RESULTS.includes(row.result)) s.bb += n
      if (row.result === 'HBP') s.hbp += n
      if (row.result === 'IBB') s.ibb += n
      if (row.result === 'SO') s.so += n
      if (row.result === 'GDP') s.gidp += n
      if (row.result === 'SAC') s.sac += n
      if (row.result === 'SF') s.sf += n
      if (row.result === 'E') s.e += n
    }

    const p = { h: 0, r: 0, so: 0, bb: 0, ip: 0 }
    for (const row of pitchRows) {
      const n = row.n
      if (HIT_RESULTS.includes(row.result)) p.h += n
      if (row.result === 'BB') p.bb += n
      if (row.result === 'SO') p.so += n
      if (OUT_RESULTS.includes(row.result)) p.ip += n
    }

    return {
      playerId: player.id,
      name: player.name,
      number: player.number,
      teamId: player.teamId,
      squadId: player.squadId,
      ...s,
      ba: battingRate(s.h, s.ab),
      obp: onBase(s.h, s.bb, s.hbp, s.sf, s.ab + s.bb + s.hbp + s.sf),
      // 投球
      pitchH: p.h, pitchR: p.r, pitchSo: p.so, pitchBb: p.bb,
      ip: Number(p.ip.toFixed(2)),
    }
  },

  /**
   * 球队全部球员的统计
   */
  async getTeamStats(teamId) {
    const players = all('SELECT id, name, number, teamId, squadId, positions, photo FROM players WHERE teamId = ? ORDER BY number', [teamId])
    return players.map(p => {
      const s = this.statRowFor(p.id)
      return { ...p, ...s }
    })
  },

  /** 单个球员的扁平统计行（getTeamStats 内部复用） */
  statRowFor(playerId) {
    const rows = all('SELECT result, scoredRunners, COUNT(*) AS n, SUM(rbi) AS rbi ' +
                     'FROM plate_appearances WHERE batterId = ? GROUP BY result', [playerId])
    const s = { ab: 0, h: 0, r: runsScoredAsRunner(playerId), rbi: 0, bb: 0, hbp: 0, so: 0, ibb: 0, sac: 0, sf: 0, gidp: 0 }
    for (const row of rows) {
      const n = row.n
      s.rbi += row.rbi || 0
      if (AB_RESULTS.includes(row.result)) s.ab += n
      if (HIT_RESULTS.includes(row.result)) s.h += n
      if (BB_RESULTS.includes(row.result)) s.bb += n
      if (row.result === 'HBP') s.hbp += n
      if (row.result === 'IBB') s.ibb += n
      if (row.result === 'SO') s.so += n
      if (row.result === 'GDP') s.gidp += n
      if (row.result === 'SAC') s.sac += n
      if (row.result === 'SF') s.sf += n
    }
    return { ...s, ba: battingRate(s.h, s.ab) }
  },

  /**
   * 单场比赛的打投统计
   */
  async getGameStats(gameId) {
    const pas = all(`${PA_SELECT} WHERE pa.gameId = ? ORDER BY pa.inning, pa.half, pa.paNumber`, [gameId])
      .map(p => ({ ...p, scoredRunners: parse(p.scoredRunners) }))

    const batting = new Map()
    const pitching = new Map()

    for (const pa of pas) {
      if (pa.batterId != null) {
        if (!batting.has(pa.batterId)) {
          batting.set(pa.batterId, {
            playerId: pa.batterId, name: pa.batterName,
            ab: 0, h: 0, r: 0, rbi: 0, bb: 0, hbp: 0, ibb: 0, so: 0, sac: 0, sf: 0, gidp: 0, pa: 0,
          })
        }
        const b = batting.get(pa.batterId)
        b.pa++
        // 得分统计在循环外用 runsScoredAsRunner 统一补齐，
        // 因为得分可能发生在该球员没有出棒的其它打席
        b.rbi += pa.rbi || 0
        if (AB_RESULTS.includes(pa.result)) b.ab++
        if (HIT_RESULTS.includes(pa.result)) b.h++
        if (BB_RESULTS.includes(pa.result)) b.bb++
        if (pa.result === 'HBP') b.hbp++
        if (pa.result === 'IBB') b.ibb++
        if (pa.result === 'SO') b.so++
        if (pa.result === 'GDP') b.gidp++
        if (pa.result === 'SAC') b.sac++
        if (pa.result === 'SF') b.sf++
      }

      if (pa.pitcherId != null) {
        if (!pitching.has(pa.pitcherId)) {
          pitching.set(pa.pitcherId, {
            playerId: pa.pitcherId, name: pa.pitcherName,
            outs: 0, h: 0, r: 0, er: 0, bb: 0, so: 0, ibb: 0, ip: 0, pa: 0,
          })
        }
        const p = pitching.get(pa.pitcherId)
        p.pa++
        if (OUT_RESULTS.includes(pa.result)) { p.outs++; p.ip += 1 / 3 }
        if (HIT_RESULTS.includes(pa.result)) p.h++
        if (pa.result === 'BB') p.bb++
        if (pa.result === 'IBB') p.ibb++
        if (pa.result === 'SO') p.so++
        // 本打席推进的得分记在该投手账上
        const scored = pa.runsScored || 0
        p.r += scored
        p.er += scored
      }
    }

    // 补齐各打者的得分（含发生在其它打席的跑者得分）
    for (const [pid, b] of batting) {
      b.r = runsScoredAsRunner(pid, gameId)
    }

    const finalizeBatting = b => ({ ...b, ba: battingRate(b.h, b.ab) })

    return {
      batting: [...batting.values()].map(finalizeBatting),
      pitching: [...pitching.values()].map(p => ({ ...p, ip: Number(p.ip.toFixed(2)) })),
      plateAppearances: pas,
    }
  },
}
