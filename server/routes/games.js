import express from 'express'
import { gameService } from '../services/gameService.js'

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
    const game = await gameService.create(req.body)
    res.json(game)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 更新比赛
router.put('/:id', async (req, res) => {
  try {
    const game = await gameService.update(req.params.id, req.body)
    res.json(game)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除比赛
router.delete('/:id', async (req, res) => {
  try {
    await gameService.delete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 添加打席记录
router.post('/:id/pa', async (req, res) => {
  try {
    const pa = await gameService.addPlateAppearance(req.params.id, req.body)
    res.json(pa)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 换投手
router.post('/:id/pitcher', async (req, res) => {
  try {
    const result = await gameService.changePitcher(req.params.id, req.body.team, req.body.pitcherId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 换打者
router.post('/:id/batter', async (req, res) => {
  try {
    const result = await gameService.changeBatter(req.params.id, req.body.team, req.body.batterId, req.body.lineupIndex)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router