import { getDb } from '../db.js'

/**
 * 统计服务层
 */
export const statsService = {
  async getPlayerStats(playerId) {
    const db = await getDb()
    const statsResult = db.exec(`
      SELECT SUM(ab) as ab, SUM(h) as h, SUM(r) as r, SUM(rbi) as rbi,
             SUM(bb) as bb, SUM(hbp) as hbp, SUM(so) as so, SUM(sb) as sb,
             SUM(cs) as cs, SUM(sac) as sac, SUM(sf) as sf, SUM(gidp) as gidp
      FROM player_stats
      WHERE playerId = ${playerId}
    `)

    const row = statsResult[0]?.values[0] || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const stats = {
      ab: row[0] || 0, h: row[1] || 0, r: row[2] || 0, rbi: row[3] || 0,
      bb: row[4] || 0, hbp: row[5] || 0, so: row[6] || 0, sb: row[7] || 0,
      cs: row[8] || 0, sac: row[9] || 0, sf: row[10] || 0, gidp: row[11] || 0
    }

    const ab = stats.ab
    const h = stats.h
    const bb = stats.bb
    const hbp = stats.hbp
    const sf = stats.sf

    const ba = ab > 0 ? (h / ab).toFixed(3) : '.000'
    const obpDenom = ab + bb + hbp + sf
    const obp = obpDenom > 0 ? ((h + bb + hbp) / obpDenom).toFixed(3) : '.000'

    return { ...stats, ba, obp }
  },

  async getTeamStats(teamId) {
    const db = await getDb()
    const playersResult = db.exec(`SELECT * FROM players WHERE teamId = ${teamId}`)

    const playerStats = (playersResult[0]?.values || []).map(row => {
      const player = {
        id: row[0], name: row[1], number: row[2], bats: row[3], throws: row[4],
        positions: row[5], height: row[6], weight: row[7], birthdate: row[8],
        teamId: row[9], photo: row[10], createdAt: row[11]
      }

      const statsResult = db.exec(`
        SELECT SUM(ab), SUM(h), SUM(r), SUM(rbi), SUM(bb), SUM(so)
        FROM player_stats WHERE playerId = ${player.id}
      `)
      const statsRow = statsResult[0]?.values[0] || [0, 0, 0, 0, 0, 0]

      const ab = statsRow[0] || 0
      const h = statsRow[1] || 0

      return {
        ...player,
        ab, h, r: statsRow[2] || 0, rbi: statsRow[3] || 0,
        bb: statsRow[4] || 0, so: statsRow[5] || 0,
        ba: ab > 0 ? (h / ab).toFixed(3) : '.000'
      }
    })

    return playerStats
  },

  async getGameStats(gameId) {
    const db = await getDb()
    const paResult = db.exec(`
      SELECT pa.*, pb.name as batterName, pp.name as pitcherName
      FROM plate_appearances pa
      LEFT JOIN players pb ON pa.batterId = pb.id
      LEFT JOIN players pp ON pa.pitcherId = pp.id
      WHERE pa.gameId = ${gameId}
      ORDER BY pa.inning, pa.half, pa.paNumber
    `)

    const plateAppearances = paResult[0]?.values.map(row => ({
      id: row[0], gameId: row[1], inning: row[2], half: row[3],
      paNumber: row[4], batterId: row[5], pitcherId: row[6],
      result: row[7], rbi: row[8], runsScored: row[9],
      pitches: row[10], notes: row[11], batterName: row[12], pitcherName: row[13]
    })) || []

    // 计算统计
    const battingStats = {}
    const pitchingStats = {}

    for (const pa of plateAppearances) {
      // 打者统计
      if (!battingStats[pa.batterId]) {
        battingStats[pa.batterId] = {
          playerId: pa.batterId,
          name: pa.batterName,
          ab: 0, h: 0, r: 0, rbi: 0, bb: 0, hbp: 0, so: 0, sb: 0, cs: 0, sac: 0, sf: 0, gidp: 0
        }
      }
      const bs = battingStats[pa.batterId]

      if (['1B', '2B', '3B', 'HR', 'SO', 'GO', 'FO', 'GDP', 'E'].includes(pa.result)) {
        bs.ab++
      }
      if (['1B', '2B', '3B', 'HR'].includes(pa.result)) {
        bs.h++
      }
      if (['BB', 'HBP', 'IBB'].includes(pa.result)) {
        bs.bb++
      }
      if (pa.result === 'HBP') bs.hbp++
      if (pa.result === 'SO') bs.so++
      if (pa.result === 'SB') bs.sb++
      if (pa.result === 'CS') bs.cs++
      if (pa.result === 'SAC') bs.sac++
      if (pa.result === 'SF') bs.sf++
      if (pa.result === 'GDP') bs.gidp++
      if (pa.result === 'HR') bs.rbi += pa.rbi || 0

      // 投手统计
      if (!pitchingStats[pa.pitcherId]) {
        pitchingStats[pa.pitcherId] = {
          playerId: pa.pitcherId,
          name: pa.pitcherName,
          h: 0, r: 0, er: 0, bb: 0, so: 0, ip: 0
        }
      }
      const ps = pitchingStats[pa.pitcherId]

      if (['1B', '2B', '3B', 'HR'].includes(pa.result)) ps.h++
      if (pa.result === 'BB') ps.bb++
      if (pa.result === 'SO') ps.so++
      if (['SO', 'GO', 'FO', 'GDP'].includes(pa.result)) {
        ps.ip += 1/3
      }
    }

    return { batting: Object.values(battingStats), pitching: Object.values(pitchingStats) }
  }
}