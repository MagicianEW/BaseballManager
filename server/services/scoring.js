/**
 * 计分引擎
 *
 * 这是全项目最易出错的纯函数，因此不依赖任何 I/O，可直接单测。
 *
 * 计分口径：
 *   runsScored  = 本打席推进回本垒的跑者数（含全垒打打者自己）
 *   rbi         = runsScored - (result === 'HR' ? 1 : 0)
 *                 官方口径下，全垒打打者自己跑回本垒那一分不计 RBI。
 *                 因此满垒全垒打 = 4 得分 / 3 RBI，空垒全垒打 = 1 得分 / 0 RBI。
 */

export const OUTCOMES = {
  // 安打
  '1B': { kind: 'hit', advance: 1 },
  '2B': { kind: 'hit', advance: 2 },
  '3B': { kind: 'hit', advance: 3 },
  'HR': { kind: 'hr' },
  // 纯出局，跑者不动
  'SO': { kind: 'out' },
  'GO': { kind: 'out' },
  'FO': { kind: 'out' },
  // 推进型出局：跑者前进，打者出局
  'GDP': { kind: 'out', advance: 1, outs: 2 },  // 滚地双杀记 2 个出局
  'SAC': { kind: 'out', advance: 1 },
  'SF': { kind: 'out', advance: 1 },
  // 保送类：只有被迫推进的跑者才前进
  'BB': { kind: 'walk' },
  'HBP': { kind: 'walk' },
  'IBB': { kind: 'walk', force: true },
  // 失误：上垒一垒，记为打数不算安打
  'E': { kind: 'hit', advance: 1, isError: true },
}

// 垒包编号：runners[].base 取值 1/2/3
const BASE_1 = 1
const BASE_2 = 2
const BASE_3 = 3

// 位掩码位值：仅用于 toBitmask() 派生给 UI 局面图
// 注意与上面的垒包编号不是同一套值（历史上曾混用导致出现「4B」和两个跑者同在三垒）
const BIT_1 = 1
const BIT_2 = 2
const BIT_3 = 4

const isValidBase = b => b === BASE_1 || b === BASE_2 || b === BASE_3

/**
 * 解析一个打席，推进垒上局面。
 *
 * @param {Array<{playerId:number|null, base:number}>} runners 当前垒上跑者
 * @param {number|null} batterId 打者
 * @param {string} result 打席结果（OUTCOMES 的 key）
 * @returns {{runners:Array, runs:number[], outs:number, isOut:boolean, unknown:boolean}}
 *          runs  = 推进回本垒的跑者 id 列表（顺序即得分顺序）
 *          outs  = 本打席产生的出局数
 */
export function resolvePlay(runners, batterId, result) {
  const safeRunners = Array.isArray(runners) ? runners.filter(r => r && isValidBase(r.base)) : []
  const rule = OUTCOMES[result]

  // 跑垒类结果（盗垒等）不是打者打席，不走这个函数
  if (!rule) {
    return { runners: safeRunners, runs: [], outs: 0, isOut: false, unknown: true }
  }

  // 全垒打：所有跑者 + 打者全部回本垒
  if (rule.kind === 'hr') {
    return {
      runners: [],
      runs: [...safeRunners.map(r => r.playerId), batterId].filter(v => v !== null && v !== undefined),
      outs: 0,
      isOut: false,
      unknown: false,
    }
  }

  // 保送类
  if (rule.kind === 'walk') {
    const next = [...safeRunners]
    const runs = []
    const force = base => {
      const i = next.findIndex(r => r.base === base)
      if (i === -1) return false
      const r = next.splice(i, 1)[0]
      if (base === BASE_3) { runs.push(r.playerId); return true }
      next.push({ playerId: r.playerId, base: base + 1 })
      return true
    }

    if (rule.force) {
      // 故意四坏：仅在满垒时被迫推进
      const occ = new Set(next.map(r => r.base))
      if (occ.has(BASE_1) && occ.has(BASE_2) && occ.has(BASE_3)) {
        force(BASE_3); force(BASE_2); force(BASE_1)
      } else if (occ.has(BASE_1)) {
        // 非法输入：一垒有人时投手不会投故意四坏（真打则为一垒安打）。
        // 若强行记录会让打者与跑者同占一垒，这里降级按普通四坏处理。
        force(BASE_3); force(BASE_2); force(BASE_1)
      }
    } else {
      // 四坏 / 触身：所有跑者各进一垒
      force(BASE_3); force(BASE_2); force(BASE_1)
    }
    next.push({ playerId: batterId, base: BASE_1 })
    return { runners: next, runs, outs: 0, isOut: false, unknown: false }
  }

  // 命中 / 推进型出局
  const next = []
  const runs = []
  for (const r of safeRunners) {
    const to = r.base + (rule.advance || 0)
    if (to > BASE_3) runs.push(r.playerId)
    else next.push({ playerId: r.playerId, base: to })
  }
  if (rule.kind === 'hit') next.push({ playerId: batterId, base: rule.advance })

  return {
    runners: next,
    runs,
    outs: rule.outs ?? (rule.kind === 'out' ? 1 : 0),
    isOut: rule.kind === 'out',
    unknown: false,
  }
}

/**
 * 盗垒失败 / 触杀：出局的是跑者而不是打者，不计入打席。
 *
 * @returns {Array} 新的 runners
 */
export function removeRunner(runners, playerId) {
  return (runners || []).filter(r => r.playerId !== playerId)
}

/**
 * runners 数组 → 位掩码（0-7），仅供 UI 局面图使用
 */
export function toBitmask(runners) {
  return (runners || []).reduce((mask, r) => {
    if (r.base === BASE_1) return mask | BIT_1
    if (r.base === BASE_2) return mask | BIT_2
    if (r.base === BASE_3) return mask | BIT_3
    return mask
  }, 0)
}

/**
 * 位掩码（0-7）→ 展示代码，例：7 → '123'，1 → '1B'
 */
export function toBaseCode(bitmask) {
  if (!bitmask) return '---'
  const parts = []
  if (bitmask & BIT_1) parts.push('1')
  if (bitmask & BIT_2) parts.push('2')
  if (bitmask & BIT_3) parts.push('3')
  return parts.join('') + 'B'
}

/**
 * 由当前局面推导下一位打者。
 * 按打线顺序轮转，回绕；支持不足 9 人的打线。
 */
export function nextBatterIndex(lineup, paCountInHalf) {
  const size = Array.isArray(lineup) ? lineup.length : 0
  if (size === 0) return null
  return paCountInHalf % size
}
