import express from 'express'
import { gameService } from '../../services/gameService.js'

const router = express.Router()

// 获取所有比赛
router.get('/', async (req, res) => {
  try {
    const games = await gameService.getAll()
    res.json(games)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取单个比赛
router.get('/:id', async (req, res) => {
  try {
    const game = await gameService.getById(req.params.id)
    if (!game) return res.status(404).json({ error: 'Game not found' })
    res.json(game)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 创建比赛
router.post('/', async (req, res) => {
  try {
    const { homeTeamId, awayTeamId, date } = req.body
    if (!homeTeamId || !awayTeamId) {
      return res.status(400).json({ error: '主队和客队必填' })
    }
    if (!date) {
      return res.status(400).json({ error: '比赛日期必填' })
    }
    const game = await gameService.create(req.body)
    const io = req.app.get('io')
    if (io) io.emit('games:v1:created', { gameId: game.id })
    res.json(game)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 更新比赛
router.put('/:id', async (req, res) => {
  try {
    const game = await gameService.update(req.params.id, req.body)
    const io = req.app.get('io')
    if (io) io.emit('games:v1:updated', { gameId: req.params.id })
    res.json(game)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除比赛
router.delete('/:id', async (req, res) => {
  try {
    await gameService.delete(req.params.id)
    const io = req.app.get('io')
    if (io) io.emit('games:v1:deleted', { gameId: req.params.id })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 添加打席记录
router.post('/:id/pa', async (req, res) => {
  try {
    const pa = await gameService.addPlateAppearance(req.params.id, req.body)
    const io = req.app.get('io')
    if (io) io.emit('games:v1:updated', { gameId: req.params.id })
    res.json(pa)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 换投手
router.post('/:id/pitcher', async (req, res) => {
  try {
    const result = await gameService.changePitcher(req.params.id, req.body.team, req.body.pitcherId)
    const io = req.app.get('io')
    if (io) io.emit('games:v1:updated', { gameId: req.params.id })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 换打者
router.post('/:id/batter', async (req, res) => {
  try {
    const result = await gameService.changeBatter(req.params.id, req.body.team, req.body.batterId, req.body.lineupIndex)
    const io = req.app.get('io')
    if (io) io.emit('games:v1:updated', { gameId: req.params.id })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 添加换人记录（代跑/代打）
router.post('/:id/substitutions', async (req, res) => {
  try {
    const { type, originalPlayerId, substitutePlayerId, base, reason, atBatId } = req.body
    if (!type || !originalPlayerId || !substitutePlayerId) {
      return res.status(400).json({ error: 'type, originalPlayerId, substitutePlayerId 必填' })
    }
    if (!['PINCH_RUN', 'PINCH_HIT'].includes(type)) {
      return res.status(400).json({ error: 'type 必须是 PINCH_RUN 或 PINCH_HIT' })
    }
    const result = await gameService.addSubstitution(req.params.id, { type, originalPlayerId, substitutePlayerId, base, reason, atBatId })
    const io = req.app.get('io')
    if (io) io.emit('games:v1:updated', { gameId: req.params.id })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取换人记录
router.get('/:id/substitutions', async (req, res) => {
  try {
    const { type } = req.query
    const substitutions = await gameService.getSubstitutions(req.params.id, type)
    res.json(substitutions)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 确认阵容
router.post('/:id/lineup/confirm', async (req, res) => {
  try {
    const result = await gameService.confirmLineup(req.params.id)
    const io = req.app.get('io')
    if (io) io.emit('games:v1:updated', { gameId: req.params.id })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router