import express from 'express'
import { gameService } from '../services/gameService.js'
import { requirePermission } from '../middleware/auth.js'
import { ah, intParam } from './helpers.js'

const router = express.Router()

const emit = (req, event, payload) => {
  const io = req.app.get('io')
  if (io) io.emit(event, payload)
}

// 读取
router.get('/', requirePermission('games:read'), ah(async (req, res) => {
  res.json(await gameService.getAll())
}))

router.get('/:id', requirePermission('games:read'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  const game = await gameService.getById(id)
  if (!game) return res.status(404).json({ error: '比赛不存在' })
  res.json(game)
}))

router.get('/:id/substitutions', requirePermission('games:read'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  const { type } = req.query
  res.json(await gameService.getSubstitutions(id, type))
}))

// 写入
router.post('/', requirePermission('games:write'), ah(async (req, res) => {
  const { homeTeamId, awayTeamId, date } = req.body || {}
  if (!homeTeamId) return res.status(400).json({ error: '主队必填' })
  if (!awayTeamId) return res.status(400).json({ error: '客队必填' })
  if (!date) return res.status(400).json({ error: '比赛日期必填' })
  if (String(homeTeamId) === String(awayTeamId)) {
    return res.status(400).json({ error: '主队与客队不能是同一支球队' })
  }

  const game = await gameService.create(req.body)
  emit(req, 'games:created', { gameId: game.id })
  res.status(201).json(game)
}))

router.put('/:id', requirePermission('games:write'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  const game = await gameService.update(id, req.body)
  emit(req, 'games:updated', { gameId: id })
  res.json(game)
}))

router.delete('/:id', requirePermission('games:write'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  await gameService.delete(id)
  emit(req, 'games:deleted', { gameId: id })
  res.json({ success: true })
}))

// 记录打席：比分、RBI、局数推进全部由服务端计分引擎计算
router.post('/:id/pa', requirePermission('games:write'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  const { result, batterId, pitcherId, inning, half, paNumber } = req.body || {}
  if (!result) return res.status(400).json({ error: '打席结果必填' })

  const pa = await gameService.addPlateAppearance(id, req.body)
  emit(req, 'game:updated', { gameId: id })
  res.status(201).json(pa)
}))

// 手动结束半局（记分员纠错用）
router.post('/:id/advance', requirePermission('games:write'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  const next = await gameService.advanceHalf(id)
  emit(req, 'game:updated', { gameId: id })
  res.json({ success: true, ...next })
}))

router.post('/:id/pitcher', requirePermission('games:write'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  const { team, pitcherId } = req.body || {}
  const result = await gameService.changePitcher(id, team, pitcherId)
  emit(req, 'game:updated', { gameId: id })
  res.json(result)
}))

router.post('/:id/batter', requirePermission('games:write'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  const { team, batterId, lineupIndex } = req.body || {}
  const result = await gameService.changeBatter(id, team, batterId, lineupIndex)
  emit(req, 'game:updated', { gameId: id })
  res.json(result)
}))

// 代跑 / 代打
router.post('/:id/substitutions', requirePermission('games:write'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  const { type, originalPlayerId, substitutePlayerId, base, reason, atBatId } = req.body || {}
  if (!originalPlayerId || !substitutePlayerId) {
    return res.status(400).json({ error: 'originalPlayerId 与 substitutePlayerId 必填' })
  }
  if (!['PINCH_RUN', 'PINCH_HIT'].includes(type)) {
    return res.status(400).json({ error: 'type 必须是 PINCH_RUN 或 PINCH_HIT' })
  }
  const result = await gameService.addSubstitution(id,
    { type, originalPlayerId, substitutePlayerId, base, reason, atBatId })
  emit(req, 'game:updated', { gameId: id })
  res.status(201).json(result)
}))

// 确认阵容：主客队分别锁定
router.post('/:id/lineup/confirm', requirePermission('games:write'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  const { team } = req.body || {}
  const result = await gameService.confirmLineup(id, team)
  emit(req, 'game:updated', { gameId: id })
  res.json(result)
}))

// 解锁阵容（赛前调整）
router.post('/:id/lineup/reopen', requirePermission('games:write'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  const { team } = req.body || {}
  const result = await gameService.reopenLineup(id, team)
  emit(req, 'game:updated', { gameId: id })
  res.json(result)
}))

export default router
