/**
 * 统计指标纯计算
 *
 * 与数据库无关的纯函数，可直接单测。
 * 上一版测试把公式复制进测试文件再断言 —— 生产代码改了测试不会红，
 * 因此这里把公式抽成独立模块，测试直接 import 本文件。
 *
 * 公式口径参照 MLB 官方计分与 Baseball-Reference：
 *   BA   = H / AB
 *   OBP  = (H + BB + HBP) / (AB + BB + HBP + SF)
 *   SLG  = TB / AB ，TB = 1×1B + 2×2B + 3×3B + 4×HR
 *   OPS  = OBP + SLG
 *   ISO  = SLG − BA（纯长打率）
 *   XBH  = 2B + 3B + HR（长打）
 *   BABIP= (H − HR) / (AB − SO − GDP + SF)
 *   K%   = SO / AB ，BB% = BB / PA ，K/BB = SO / BB
 *
 * IBB（故意四坏）按官方口径计入 BB；
 * HBP（触身球）是独立分类，不计入 BB，只计入 OBP。
 */

/** 格式化率值：.325 风格（省略前导 0） */
export const fmtRate = (num, den) =>
  (den > 0 ? (num / den).toFixed(3).replace(/^0/, '') : '.000')

/** 由安打类型计算垒打数与长打数 */
export function tallyHits(counts) {
  return {
    b: counts['1B'] || 0,
    d: counts['2B'] || 0,
    t: counts['3B'] || 0,
    hr: counts['HR'] || 0,
    tb: (counts['1B'] || 0) * 1
       + (counts['2B'] || 0) * 2
       + (counts['3B'] || 0) * 3
       + (counts['HR'] || 0) * 4,
    xbh: (counts['2B'] || 0) + (counts['3B'] || 0) + (counts['HR'] || 0),
  }
}

/**
 * 由累计计数计算全部派生指标。
 * @param s {pa,ab,h,bb,hbp,so,gidp,sf,hr,tb}
 */
export function computeDerived(s) {
  const obpNum = s.h + s.bb + s.hbp
  const obpDen = s.ab + s.bb + s.hbp + s.sf
  const obp = fmtRate(obpNum, obpDen)
  const slg = fmtRate(s.tb, s.ab)
  const ba = fmtRate(s.h, s.ab)
  const ops = obpDen > 0
    ? (parseFloat(obp) + parseFloat(slg)).toFixed(3).replace(/^0/, '')
    : '.000'
  const iso = s.ab > 0
    ? (parseFloat(slg) - parseFloat(ba)).toFixed(3).replace(/^0/, '')
    : '.000'
  // BABIP = (H − HR) / (AB − SO − GDP + SF)
  const babip = fmtRate(s.h - (s.hr || 0), s.ab - s.so - s.gidp + s.sf)
  const kPct = fmtRate(s.so, s.ab)
  const bbPct = fmtRate(s.bb, s.pa)
  const kbb = s.bb > 0 ? (s.so / s.bb).toFixed(2) : (s.so > 0 ? '∞' : '—')

  return { ba, obp, slg, ops, iso, babip, kPct, bbPct, kbb }
}

/**
 * 投球侧派生指标
 * @param p {pa,outs,h,bb,hbp,so,er}
 */
export function computePitchDerived(p) {
  const ip = Number((p.outs / 3).toFixed(2))
  // ERA = 自责分 × 9 / 投球局数
  const era = ip > 0 ? ((p.er * 9) / ip).toFixed(2) : '—'
  // WHIP = (被安打 + 保送 + 触身球) / 投球局数
  const whip = ip > 0 ? ((p.h + p.bb + p.hbp) / ip).toFixed(2) : '—'
  return { ip, era, whip, kPct: fmtRate(p.so, p.pa), bbPct: fmtRate(p.bb, p.pa) }
}
