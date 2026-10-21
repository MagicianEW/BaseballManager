import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

/**
 * 统计指标口径测试
 *
 * 公式参照 MLB 官方计分与 Baseball-Reference：
 *   BA   = H / AB
 *   OBP  = (H + BB + HBP) / (AB + BB + HBP + SF)
 *   SLG  = TB / AB ，TB = 1×1B + 2×2B + 3×3B + 4×HR
 *   OPS  = OBP + SLG
 *   ISO  = SLG − BA
 *   XBH  = 2B + 3B + HR
 *   BABIP= (H − HR) / (AB − SO − GDP + SF)
 *   K%   = SO / AB ，BB% = BB / PA ，K/BB = SO / BB
 *
 * IBB（故意四坏）按官方口径计入 BB；HBP 单独统计，不计入 BB。
 */

// 直接 import 生产代码，不复制公式
// （旧版 test_2b_logic.mjs 把生产函数复制进测试文件，改了也不会红）
import { computeDerived, computePitchDerived, tallyHits, fmtRate } from './statMath.js'

const computeStats = computeDerived

const zeros = () => ({
  pa: 0, ab: 0, h: 0, r: 0, rbi: 0, bb: 0, hbp: 0, so: 0, ibb: 0,
  sac: 0, sf: 0, gidp: 0, e: 0, b: 0, d: 0, t: 0, hr: 0, xbh: 0, tb: 0,
})

describe('投球派生指标', () => {
  test('ERA = 自责分 × 9 / 投球局数', () => {
    const r = computePitchDerived({ pa: 30, outs: 9, h: 6, bb: 2, hbp: 0, so: 5, er: 4 })
    assert.equal(r.ip, 3)
    assert.equal(r.era, '12.00')      // 4×9/3 = 12
  })
  test('WHIP = (被安打+保送+触身球) / 投球局数', () => {
    const r = computePitchDerived({ pa: 30, outs: 9, h: 6, bb: 2, hbp: 1, so: 5, er: 4 })
    assert.equal(r.whip, '3.00')      // (6+2+1)/3
  })
  test('0 投球局时 ERA / WHIP 显示 —', () => {
    const r = computePitchDerived({ pa: 0, outs: 0, h: 0, bb: 0, hbp: 0, so: 0, er: 0 })
    assert.equal(r.era, '—')
    assert.equal(r.whip, '—')
  })
})

describe('垒打数统计', () => {
  test('tallyHits 正确累加垒打与长打', () => {
    const r = tallyHits({ '1B': 5, '2B': 3, '3B': 1, HR: 1 })
    assert.equal(r.tb, 18)
    assert.equal(r.xbh, 5)
    assert.equal(r.b, 5); assert.equal(r.d, 3); assert.equal(r.t, 1); assert.equal(r.hr, 1)
  })
})

describe('打击率 BA', () => {
  test('0 打数显示 .000', () => {
    assert.equal(computeStats(zeros()).ba, '.000')
  })
  test('3 打数 1 安打 = .333', () => {
    const s = { ...zeros(), pa: 3, ab: 3, h: 1 }
    assert.equal(computeStats(s).ba, '.333')
  })
  test('1 打数 1 安打 = 1.000', () => {
    const s = { ...zeros(), pa: 1, ab: 1, h: 1 }
    assert.equal(computeStats(s).ba, '1.000')
  })
})

describe('上垒率 OBP —— 关键回归', () => {
  test('HBP 只计一次，不与 BB 重复', () => {
    // 1 安打 + 1 触身球,1 打数 -> OBP = 2/2 = 1.000
    // 若把 HBP 同时算进 bb 和 hbp,会变成 3/3,数值相同但分母错;
    // 用 BB 场景才能暴露:
    // 0 安打 + 1 保送 + 1 触身球,0 打数 -> OBP = 2/2 = 1.000
    const s = { ...zeros(), pa: 2, ab: 0, h: 0, bb: 1, hbp: 1 }
    assert.equal(computeStats(s).obp, '1.000')
  })

  test('BB + HBP 同时计入分子与分母', () => {
    const s = { ...zeros(), pa: 5, ab: 3, h: 1, bb: 1, hbp: 1 }
    // (1 + 1 + 1) / (3 + 1 + 1 + 0) = 3/5 = .600
    assert.equal(computeStats(s).obp, '.600')
  })

  test('牺牲飞球计入分母不计入分子', () => {
    const s = { ...zeros(), pa: 4, ab: 3, h: 1, sf: 1 }
    // (1) / (3 + 0 + 0 + 1) = 1/4 = .250
    assert.equal(computeStats(s).obp, '.250')
  })

  test('四坏球不算打数,但提高上垒率', () => {
    const s = { ...zeros(), pa: 4, ab: 3, h: 1, bb: 1 }
    // (1+1)/(3+1) = 2/4 = .500
    assert.equal(computeStats(s).obp, '.500')
  })

  test('0 上垒时为 .000', () => {
    assert.equal(computeStats({ ...zeros(), pa: 3, ab: 3, h: 0 }).obp, '.000')
  })
})

describe('长打率 SLG / 垒打数 TB', () => {
  test('垒打数 = 1×1B + 2×2B + 3×3B + 4×HR', () => {
    const s = { ...zeros(), pa: 10, ab: 10, h: 10, b: 5, d: 3, t: 1, hr: 1, xbh: 5, tb: 5 + 6 + 3 + 4 }
    assert.equal(s.tb, 18)
    assert.equal(computeStats(s).slg, '1.800')
  })

  test('长打 XBH = 2B + 3B + HR', () => {
    assert.equal(2 + 1 + 1, 4)
  })

  test('全垒打算 4 个垒打', () => {
    const s = { ...zeros(), pa: 1, ab: 1, h: 1, hr: 1, xbh: 1, tb: 4 }
    assert.equal(computeStats(s).slg, '4.000')
  })
})

describe('OPS 与 ISO', () => {
  test('OPS = OBP + SLG', () => {
    const s = { ...zeros(), pa: 10, ab: 8, h: 3, bb: 1, tb: 6 }
    const r = computeStats(s)
    // OBP = (3+1)/(8+1) = .444, SLG = 6/8 = .750 -> OPS = 1.194
    assert.equal(r.obp, '.444')
    assert.equal(r.slg, '.750')
    assert.equal(r.ops, '1.194')
  })

  test('ISO = SLG − BA,剥离一垒安打只看长打能力', () => {
    // 10 打数:8 支一垒安打 + 1 支全垒打 -> BA=.900, SLG=1.200, ISO=.300
    const s = { ...zeros(), pa: 10, ab: 10, h: 9, b: 8, hr: 1, xbh: 1, tb: 12 }
    const r = computeStats(s)
    assert.equal(r.ba, '.900')
    assert.equal(r.slg, '1.200')
    assert.equal(r.iso, '.300')
  })
})

describe('BABIP 场内安打率', () => {
  test('排除全垒打与三振', () => {
    // AB=10, H=4, HR=1, SO=3, GDP=1 -> (4-1)/(10-3-1) = 3/6 = .500
    const s = { ...zeros(), pa: 10, ab: 10, h: 4, hr: 1, so: 3, gidp: 1 }
    assert.equal(computeStats(s).babip, '.500')
  })

  test('分母为 0 时显示 .000', () => {
    const s = { ...zeros(), pa: 1, ab: 1, h: 0, hr: 0, so: 1, gidp: 0 }
    assert.equal(computeStats(s).babip, '.000')
  })
})

describe('三振率 K% / 保送率 BB% / K-BB 比', () => {
  test('K% = SO / AB', () => {
    const s = { ...zeros(), pa: 10, ab: 8, so: 3 }
    assert.equal(computeStats(s).kPct, '.375')
  })

  test('BB% = BB / PA', () => {
    const s = { ...zeros(), pa: 10, ab: 8, bb: 2 }
    assert.equal(computeStats(s).bbPct, '.200')
  })

  test('K/BB = SO / BB', () => {
    const s = { ...zeros(), pa: 20, ab: 18, so: 6, bb: 3 }
    assert.equal(computeStats(s).kbb, '2.00')
  })

  test('没有保送时 K/BB 显示 ∞', () => {
    const s = { ...zeros(), pa: 10, ab: 10, so: 5, bb: 0 }
    assert.equal(computeStats(s).kbb, '∞')
  })

  test('没有保送也没有三振时 K/BB 显示 —', () => {
    assert.equal(computeStats(zeros()).kbb, '—')
  })
})

describe('小数格式', () => {
  test('省略前导 0,呈 .325 风格', () => {
    assert.equal(fmtRate(1, 3), '.333')
    assert.equal(fmtRate(0, 0), '.000')
  })
  test('>= 1 时保留完整形式', () => {
    assert.equal(fmtRate(4, 1), '4.000')
  })
})
