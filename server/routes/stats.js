import express from 'express'
import { statsService } from '../services/statsService.js'

const router = express.Router()

// 获取球员统计
router.get('/player/:id', async (req, res) => {
  try {
    const stats = await statsService.getPlayerStats(req.params.id)
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取球队统计
router.get('/team/:id', async (req, res) => {
  try {
    const stats = await statsService.getTeamStats(req.params.id)
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取比赛统计
router.get('/game/:id', async (req, res) => {
  try {
    const stats = await statsService.getGameStats(req.params.id)
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router