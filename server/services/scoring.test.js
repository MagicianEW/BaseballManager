import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  resolvePlay, toBitmask, toBaseCode, nextBatterIndex, OUTCOMES,
} from './scoring.js'

/**
 * 计分引擎单测
 *
 * 重要：此处 import 的是生产代码本身。
 * 旧版 test_2b_logic.mjs 把 updateBaseSituation 复制进测试文件再测，
 * 生产代码改了它不会红，且 package.json 里没有 test 脚本，从不执行。
 */

const r = (base, pid) => ({ playerId: pid, base })
const bases = rs => rs.map(x => x.base).sort().join('')

describe('resolvePlay —— 全垒打', () => {
  test('空垒全垒打：1 得分、0 RBI（官方口径打者自己不记 RBI）', () => {
    const p = resolvePlay([], 10, 'HR')
    assert.equal(p.runs.length, 1)
    assert.deepEqual(p.runs, [10])
    assert.equal(p.runs.length - 1, 0)
    assert.deepEqual(p.runners, [])
  })

  test('满垒全垒打：4 得分、3 RBI、垒上清空', () => {
    const p = resolvePlay([r(1, 1), r(2, 2), r(3, 3)], 4, 'HR')
    assert.equal(p.runs.length, 4)
    assert.equal(p.runs.length - 1, 3, 'RBI 应为 3（打者自己那分不计）')
    assert.deepEqual(p.runners, [])
  })

  test('满垒全垒打时所有跑者都得分', () => {
    const p = resolvePlay([r(1, 1), r(2, 2), r(3, 3)], 4, 'HR')
    assert.deepEqual([...p.runs].sort(), [1, 2, 3, 4])
  })
})

describe('resolvePlay —— 安打推进', () => {
  test('一垒安打推进所有跑者', () => {
    assert.equal(bases(resolvePlay([r(1, 1)], 9, '1B').runners), '12')
    assert.equal(bases(resolvePlay([r(1, 1), r(2, 2)], 9, '1B').runners), '123')
    assert.equal(bases(resolvePlay([r(1, 1), r(2, 2), r(3, 3)], 9, '1B').runners), '123')
    assert.equal(bases(resolvePlay([], 9, '1B').runners), '1')
  })

  test('三垒有人时一垒安打：三垒跑者回本垒得分', () => {
    const p = resolvePlay([r(3, 3)], 9, '1B')
    assert.equal(p.runs.length, 1)
    assert.equal(bases(p.runners), '1', '三垒跑者推进回本垒，垒上只剩打者')
  })

  test('二垒安打：一垒跑者进三垒，打者上二垒，原二垒跑者被取代', () => {
    assert.equal(bases(resolvePlay([r(1, 1)], 9, '2B').runners), '23')
    assert.equal(bases(resolvePlay([r(1, 1), r(2, 2)], 9, '2B').runners), '23')
  })

  test('三垒有人时二垒安打：得分 1，垒上只剩二垒', () => {
    const p = resolvePlay([r(3, 3)], 9, '2B')
    assert.equal(p.runs.length, 1, '三垒跑者回本垒得分')
    assert.equal(bases(p.runners), '2')
  })

  test('三垒安打：所有跑者得分，打者上三垒', () => {
    const p = resolvePlay([r(1, 1), r(2, 2), r(3, 3)], 9, '3B')
    assert.equal(p.runs.length, 3)
    assert.deepEqual(p.runners, [r(3, 9)])
  })
})

describe('resolvePlay —— 出局', () => {
  test('纯出局：跑者不动，计 1 出局', () => {
    const p = resolvePlay([r(1, 1)], 9, 'SO')
    assert.equal(p.outs, 1)
    assert.equal(p.runs.length, 0)
    assert.equal(bases(p.runners), '1')
  })

  for (const res of ['SO', 'GO', 'FO']) {
    test(`${res}：1 出局、垒上不变`, () => {
      const p = resolvePlay([r(1, 1), r(2, 2)], 9, res)
      assert.equal(p.outs, 1)
      assert.equal(bases(p.runners), '12')
    })
  }

  test('GDP 双杀：计 2 出局，三垒跑者得分，打者不上垒', () => {
    const p = resolvePlay([r(1, 1), r(2, 2), r(3, 3)], 9, 'GDP')
    assert.equal(p.outs, 2)
    assert.equal(p.runs.length, 1, '仅三垒跑者推进回本垒')
    assert.equal(bases(p.runners), '23', '一垒、二垒跑者各进一垒')
  })

  test('牺牲飞球：1 出局、跑者推进、打者不上垒', () => {
    const p = resolvePlay([r(2, 2), r(3, 3)], 9, 'SF')
    assert.equal(p.outs, 1)
    assert.equal(p.runs.length, 1, '三垒跑者推进回本垒')
    assert.equal(bases(p.runners), '3')
  })

  test('牺牲触击 SAC：1 出局、跑者推进', () => {
    const p = resolvePlay([r(1, 1)], 9, 'SAC')
    assert.equal(p.outs, 1)
    assert.equal(bases(p.runners), '2')
  })
})

describe('resolvePlay —— 保送', () => {
  test('满垒保送：1 得分，垒上仍然满垒（打者补上一垒）', () => {
    const p = resolvePlay([r(1, 1), r(2, 2), r(3, 3)], 9, 'BB')
    assert.equal(p.runs.length, 1, '三垒跑者回本垒')
    assert.equal(p.outs, 0)
    assert.equal(bases(p.runners), '123', '二垒→三垒、一垒→二垒、打者→一垒，仍是满垒')
  })

  test('一三垒保送：三垒跑者得分，垒上留一二垒', () => {
    assert.equal(bases(resolvePlay([r(1, 1), r(3, 3)], 9, 'BB').runners), '12')
    assert.equal(resolvePlay([r(1, 1), r(3, 3)], 9, 'BB').runs.length, 1)
  })

  test('触身球 HBP 与四坏同规则', () => {
    assert.equal(bases(resolvePlay([r(1, 1)], 9, 'HBP').runners), '12')
  })

  test('故意四坏 IBB：一垒有人时降级按普通四坏处理', () => {
    // 真打不会在垒上有人时投 IBB；降级处理可避免打者与跑者同占一垒
    assert.equal(bases(resolvePlay([r(1, 1), r(2, 2)], 9, 'IBB').runners), '123')
  })

  test('故意四坏 IBB：满垒时被迫推进', () => {
    const p = resolvePlay([r(1, 1), r(2, 2), r(3, 3)], 9, 'IBB')
    assert.equal(p.runs.length, 1)
    assert.equal(bases(p.runners), '123')
  })

  test('空垒 IBB：只有打者上一垒', () => {
    assert.equal(bases(resolvePlay([], 9, 'IBB').runners), '1')
  })

  test('一三垒有人投 IBB 不产生两个一垒跑者', () => {
    const p = resolvePlay([r(1, 1), r(3, 3)], 9, 'IBB')
    assert.equal(p.runners.filter(x => x.base === 1).length, 1, '一垒只能有一个人')
  })
})

describe('得分归属：runners 谁回本垒', () => {
  // 回归测试：此前 getPlayerStats 用 SUM(runsScored) 统计「得分」，
  // 满垒全垒打时 4 分全部记到打者头上，被推进的 3 名跑者 r 仍为 0。
  const R = (base, pid) => ({ playerId: pid, base })

  test('满垒全垒打：4 名跑者各回本垒 1 次', () => {
    const p = resolvePlay([R(1, 1), R(2, 2), R(3, 3)], 4, 'HR')
    const counts = {}
    for (const pid of p.runs) counts[pid] = (counts[pid] || 0) + 1
    assert.deepEqual(counts, { 1: 1, 2: 1, 3: 1, 4: 1 })
  })

  test('跑者推进得分时，scoredRunners 里的 id 就是实际回本垒的人', () => {
    const p = resolvePlay([R(3, 3)], 9, '2B')
    assert.deepEqual(p.runs, [3], '只有三垒跑者得分，打者 9 留在二垒')
    assert.equal(p.runners.find(x => x.playerId === 9).base, 2)
  })

  test('无人推进时不产生得分', () => {
    assert.deepEqual(resolvePlay([R(1, 1)], 9, '1B').runs, [])
    assert.deepEqual(resolvePlay([R(1, 1)], 9, 'SO').runs, [])
  })
})

describe('不变量：任何打法后每个垒包最多一名跑者', () => {
  const allResults = Object.keys(OUTCOMES)
  const allStates = [
    [], [r(1, 1)], [r(2, 2)], [r(3, 3)],
    [r(1, 1), r(2, 2)], [r(1, 1), r(3, 3)], [r(2, 2), r(3, 3)],
    [r(1, 1), r(2, 2), r(3, 3)],
  ]
  for (const state of allStates) {
    for (const result of allResults) {
      test(`${bases(state) || '空垒'} + ${result}`, () => {
        const p = resolvePlay(state, 99, result)
        const seen = new Set()
        for (const r of p.runners) {
          assert.ok(isValidBaseNum(r.base), `出现非法垒包编号 ${r.base}`)
          assert.ok(!seen.has(r.base), `${r.base}B 出现重复跑者`)
          seen.add(r.base)
        }
        assert.ok(p.runs.length <= state.length + 1)
      })
    }
  }
})

function isValidBaseNum(b) { return b === 1 || b === 2 || b === 3 }

describe('resolvePlay —— 边界', () => {
  test('未知结果码（SB/CS 等跑垒动作）不改变局面', () => {
    const before = [r(1, 1)]
    const p = resolvePlay(before, 9, 'SB')
    assert.equal(p.unknown, true)
    assert.deepEqual(p.runners, before)
    assert.equal(p.outs, 0)
  })

  test('runners 为 null / 脏数据时不崩溃', () => {
    assert.doesNotThrow(() => resolvePlay(null, 9, '1B'))
    assert.doesNotThrow(() => resolvePlay([null, { base: 9 }, { base: 0 }], 9, 'HR'))
  })

  test('batterId 为 null（未指定打者）时不产生空跑者', () => {
    const p = resolvePlay([], null, '1B')
    assert.deepEqual(p.runners, [{ playerId: null, base: 1 }])
  })

  test('OUTCOMES 表中每个结果都有 kind', () => {
    for (const [key, rule] of Object.entries(OUTCOMES)) {
      assert.ok(rule.kind, `${key} 缺少 kind`)
    }
  })
})

describe('toBitmask / toBaseCode', () => {
  test('runners 数组转位掩码', () => {
    assert.equal(toBitmask([]), 0)
    assert.equal(toBitmask([r(1, 1)]), 1)
    assert.equal(toBitmask([r(2, 2)]), 2)
    assert.equal(toBitmask([r(1, 1), r(2, 2)]), 3)
    assert.equal(toBitmask([r(3, 3)]), 4)
    assert.equal(toBitmask([r(1, 1), r(3, 3)]), 5)
    assert.equal(toBitmask([r(2, 2), r(3, 3)]), 6)
    assert.equal(toBitmask([r(1, 1), r(2, 2), r(3, 3)]), 7)
  })

  test('位掩码转展示代码', () => {
    assert.equal(toBaseCode(0), '---')
    assert.equal(toBaseCode(1), '1B')
    assert.equal(toBaseCode(2), '2B')
    assert.equal(toBaseCode(7), '123B')
  })

  test('toBitmask(null) 不崩溃', () => {
    assert.equal(toBitmask(null), 0)
    assert.equal(toBaseCode(null), '---')
  })
})

describe('nextBatterIndex', () => {
  test('返回打线索引而非球员 id', () => {
    const ten = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110]
    assert.equal(nextBatterIndex(ten, 0), 0)
    assert.equal(nextBatterIndex(ten, 9), 9)
    assert.equal(nextBatterIndex(ten, 10), 0, '第 11 打席回到打线开头')
  })

  test('支持非 9 人打线（此前硬编码 % 9）', () => {
    assert.equal(nextBatterIndex([1, 2, 3, 4, 5, 6, 7, 8], 7), 7)
    assert.equal(nextBatterIndex([1, 2, 3, 4, 5, 6, 7, 8], 8), 0)
    assert.equal(nextBatterIndex([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 9), 9)
  })

  test('空打线返回 null', () => {
    assert.equal(nextBatterIndex([], 0), null)
    assert.equal(nextBatterIndex(null, 0), null)
  })
})
