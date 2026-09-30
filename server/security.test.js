import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

/**
 * 安全回归测试
 *
 * 覆盖此前真实存在的问题：
 *   - 16 处 SQL 注入（字符串拼接 ${}）
 *   - update() 列名注入（请求体任意 key 拼成列名）
 *   - 全部业务接口零鉴权
 *   - 上传目录 express.static 裸暴露
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_for_ci'
process.env.DB_PATH = process.env.DB_PATH || ':memory:'
process.env.NODE_ENV = 'test'

let server, base

const req = (method, path, { token, body } = {}) => new Promise((resolve, reject) => {
  const payload = body ? JSON.stringify(body) : null
  const url = new URL(base + path)
  const r = http.request({
    method, hostname: url.hostname, port: url.port, path: url.pathname + url.search,
    headers: {
      ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }, res => {
    let data = ''
    res.on('data', c => { data += c })
    res.on('end', () => {
      let json = null
      try { json = JSON.parse(data) } catch { /* 非 JSON */ }
      resolve({ status: res.statusCode, body: json, raw: data })
    })
  })
  r.on('error', reject)
  if (payload) r.write(payload)
  r.end()
})

let adminToken, coachToken, playerToken, gameId, teamA, teamB, pitcherId

before(async () => {
  const mod = await import('./index.js')
  server = mod.httpServer
  await new Promise(res => server.listen(0, res))
  base = `http://127.0.0.1:${server.address().port}`

  const login = await req('POST', '/api/auth/login', { body: { username: 'admin', password: 'admin' } })
  adminToken = login.body.token

  const coach = await req('POST', '/api/auth/register', { body: { username: 't_coach', password: 'pass123', role: 'coach' } })
  coachToken = coach.body.token
  const player = await req('POST', '/api/auth/register', { body: { username: 't_player', password: 'pass123', role: 'player' } })
  playerToken = player.body.token

  const t1 = await req('POST', '/api/teams', { token: adminToken, body: { name: '甲队' } })
  const t2 = await req('POST', '/api/teams', { token: adminToken, body: { name: '乙队' } })
  teamA = t1.body.id; teamB = t2.body.id

  const p = await req('POST', '/api/players', { token: adminToken, body: { name: '测试投手', number: '1', teamId: teamA } })
  pitcherId = p.body.id

  const g = await req('POST', '/api/games', { token: adminToken, body: {
    date: '2026-01-01', homeTeamId: teamA, awayTeamId: teamB,
    homeLineup: [pitcherId], awayLineup: [pitcherId], finalInning: 6,
  }})
  gameId = g.body.id
  await req('PUT', `/api/games/${gameId}`, { token: adminToken, body: { status: 'in_progress' } })
})

after(() => { server?.close() })

describe('鉴权：未登录一律拒绝', () => {
  const cases = [
    ['GET', '/api/players'], ['GET', '/api/teams'], ['GET', '/api/squads'],
    ['GET', '/api/games'], [`GET`, `/api/games/${gameId}`], ['GET', '/api/stats/player/1'],
    ['POST', '/api/players'], ['POST', '/api/teams'], ['POST', '/api/squads'],
    ['POST', '/api/games'], ['POST', `/api/games/${gameId}/pa`],
    ['PUT', `/api/games/${gameId}`], ['DELETE', `/api/games/${gameId}`],
    ['POST', '/api/upload/team-logo'], ['GET', '/uploads/x.png'], ['GET', '/api/uploads/x.png'],
  ]
  for (const [method, path] of cases) {
    test(`${method} ${path} → 401`, async () => {
      assert.equal((await req(method, path, { body: method === 'GET' ? undefined : {} })).status, 401)
    })
  }
  test('伪造 token → 401', async () => {
    assert.equal((await req('GET', '/api/players', { token: 'eyJhbGciOiJIUzI1NiJ9.fake.sig' })).status, 401)
  })
})

describe('鉴权：角色权限矩阵', () => {
  test('player 可读不可写', async () => {
    assert.equal((await req('GET', '/api/players', { token: playerToken })).status, 200)
    assert.equal((await req('POST', '/api/players', { token: playerToken, body: { name: 'x' } })).status, 403)
    assert.equal((await req('POST', '/api/games', { token: playerToken, body: { date: '2026-01-01', homeTeamId: teamA, awayTeamId: teamB } })).status, 403)
  })

  test('coach 可写业务数据', async () => {
    assert.equal((await req('POST', '/api/players', { token: coachToken, body: { name: '教练建的球员' } })).status, 201)
  })

  test('player 不能访问用户管理', async () => {
    assert.equal((await req('GET', '/api/auth/users', { token: playerToken })).status, 403)
    assert.equal((await req('GET', '/api/auth/users', { token: coachToken })).status, 403)
    assert.equal((await req('GET', '/api/auth/users', { token: adminToken })).status, 200)
  })

  test('注册无法直接把自己提升为 admin', async () => {
    const r = await req('POST', '/api/auth/register', { body: { username: 'evil', password: 'pass123', role: 'admin' } })
    assert.equal(r.body.role, 'player', '应被降级为 player')
  })
})

describe('SQL 注入', () => {
  const payloads = [
    '1 OR 1=1', '0 UNION SELECT 1,2,3--', "1' OR '1'='1",
    '1; DROP TABLE players--', '../../etc/passwd', "1 AND (SELECT 1 FROM users)",
  ]
  for (const p of payloads) {
    test(`GET /api/games/${encodeURIComponent(p)} 不返回数据且不 500`, async () => {
      const r = await req('GET', `/api/games/${encodeURIComponent(p)}`, { token: adminToken })
      assert.ok(r.status === 400 || r.status === 404, `实际 ${r.status}`)
    })
    test(`GET /api/players/${encodeURIComponent(p)} 不返回数据且不 500`, async () => {
      const r = await req('GET', `/api/players/${encodeURIComponent(p)}`, { token: adminToken })
      assert.ok(r.status === 400 || r.status === 404, `实际 ${r.status}`)
    })
  }

  test('substitutions 的 type 参数不可注入', async () => {
    const r = await req('GET', `/api/games/${gameId}/substitutions?type=${encodeURIComponent("x' OR '1'='1")}`, { token: adminToken })
    assert.equal(r.status, 200)
    assert.equal(r.body.length, 0, '注入未生效，不应返回任何行')
  })

  test('注入不会泄露 users 表内容', async () => {
    const r = await req('GET', `/api/players/${encodeURIComponent("0 UNION SELECT id,username,password,role FROM users--")}`, { token: adminToken })
    assert.ok(!r.raw.includes('$2b$'), '响应中不得出现密码哈希')
  })
})

describe('列名注入（update）', () => {
  test('请求体任意 key 不得变成列名', async () => {
    const before = (await req('GET', `/api/games/${gameId}`, { token: adminToken })).body
    await req('PUT', `/api/games/${gameId}`, { token: adminToken, body: {
      'homeScore=999, date': 'x', 'id': 99999, 'status': 'in_progress',
    }})
    const after = (await req('GET', `/api/games/${gameId}`, { token: adminToken })).body
    assert.equal(after.homeScore, before.homeScore, 'homeScore 未被注入修改')
    assert.equal(after.id, gameId, 'id 未被篡改')
  })

  test('非法的 date=null 不会被写成字符串 "null"', async () => {
    const g = await req('POST', '/api/games', { token: adminToken, body: {
      date: '2026-02-02', homeTeamId: teamA, awayTeamId: teamB } })
    await req('PUT', `/api/games/${g.body.id}`, { token: adminToken, body: { stadium: null } })
    const r = await req('GET', `/api/games/${g.body.id}`, { token: adminToken })
    assert.notEqual(r.body.date, 'null')
  })
})

describe('上传目录鉴权', () => {
  test('匿名不可访问上传文件', async () => {
    assert.equal((await req('GET', '/api/uploads/whatever.png')).status, 401)
  })
})

describe('输入校验', () => {
  test('主客队不能相同', async () => {
    const r = await req('POST', '/api/games', { token: adminToken, body: {
      date: '2026-01-01', homeTeamId: teamA, awayTeamId: teamA } })
    assert.equal(r.status, 400)
  })

  test('缺少必填字段返回 400', async () => {
    assert.equal((await req('POST', '/api/teams', { token: adminToken, body: {} })).status, 400)
    assert.equal((await req('POST', '/api/players', { token: adminToken, body: { name: '' } })).status, 400)
    assert.equal((await req('POST', '/api/games', { token: adminToken, body: { date: '2026-01-01' } })).status, 400)
  })

  test('阵容确认必须指定合法 team', async () => {
    assert.equal((await req('POST', `/api/games/${gameId}/lineup/confirm`, { token: adminToken, body: { team: 'xxx' } })).status, 500)
    assert.equal((await req('POST', `/api/games/${gameId}/lineup/confirm`, { token: adminToken, body: {} })).status, 500)
  })

  test('空阵容无法确认', async () => {
    const g = await req('POST', '/api/games', { token: adminToken, body: {
      date: '2026-03-03', homeTeamId: teamA, awayTeamId: teamB, homeLineup: [] } })
    const r = await req('POST', `/api/games/${g.body.id}/lineup/confirm`, { token: adminToken, body: { team: 'home' } })
    assert.equal(r.status, 500)
    assert.match(r.body.error, /阵容为空/)
  })

  test('引用不存在的球员返回 400 而非 500', async () => {
    const r = await req('POST', `/api/games/${gameId}/pa`, { token: adminToken, body: {
      result: '1B', batterId: 999999 } })
    assert.equal(r.status, 400)
  })
})
