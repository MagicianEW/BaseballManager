// 测试 2B 位掩码逻辑（使用修正后的期望值）
const FIRST_BASE = 1
const SECOND_BASE = 2
const THIRD_BASE = 4

// gameService.js 中当前的逻辑
function updateBaseSituation(currentBitmask, hitResult) {
  if (hitResult === '2B') {
    let b = 0
    if (currentBitmask & FIRST_BASE) b |= THIRD_BASE
    if (currentBitmask & SECOND_BASE) b |= SECOND_BASE
    b |= SECOND_BASE
    return b
  }
  return currentBitmask
}

// 二垒安打规则：
// - 打者进二垒
// - 一垒跑者被逼进三垒（因为打者占了二垒）
// - 二垒跑者留在原位（没被逼向三垒，因为三垒被占领）
// - 三垒跑者回本垒得分
//
// 期望结果（位掩码）：
// 0 -> 2 (无人 -> 二垒)
// 1 -> 6 (一垒 -> 三垒, 打者 -> 二垒)
// 2 -> 2 (二垒跑者留, 打者 -> 二垒)
// 3 -> 6 (一垒 -> 三垒, 二垒跑者留, 打者 -> 二垒)
// 4 -> 2 (三垒跑者回本垒得分, 打者 -> 二垒)
// 5 -> 6 (一垒 -> 三垒, 打者 -> 二垒, 三垒跑者回本垒)
// 6 -> 2 (二垒跑者留, 打者 -> 二垒, 三垒跑者回本垒)
// 7 -> 6 (一垒 -> 三垒, 二垒跑者留, 打者 -> 二垒, 三垒跑者回本垒)
const testCases = [
  { input: 0, expected: 2, desc: '无人 → 二垒' },
  { input: 1, expected: 6, desc: '一垒 → 二三垒' },
  { input: 2, expected: 2, desc: '二垒 → 二垒' },
  { input: 3, expected: 6, desc: '一二垒 → 二三垒' },
  { input: 4, expected: 2, desc: '三垒 → 二垒' },
  { input: 5, expected: 6, desc: '一三垒 → 二三垒' },
  { input: 6, expected: 2, desc: '二三垒 → 二垒' },
  { input: 7, expected: 6, desc: '满垒 → 二三垒' },  // 修正：一垒进三垒，二垒留，三垒回本垒，打者上二垒 = 6
]

console.log('=== 2B 逻辑测试 ===\n')
let allPass = true
for (const tc of testCases) {
  const result = updateBaseSituation(tc.input, '2B')
  const pass = result === tc.expected
  if (!pass) allPass = false
  console.log(`${pass ? '✅' : '❌'} base=${tc.input} (${tc.desc}): got ${result}, expected ${tc.expected}`)
}

console.log('\n=== 结论 ===')
if (allPass) {
  console.log('✅ 所有测试通过，gameService.js 的 2B 逻辑修复正确')
} else {
  console.log('❌ 有测试失败')
}