import express from 'express'
import { playerService } from '../services/playerService.js'

const router = express.Router()

// 获取所有球员
router.get('/', async (req, res) => {
  try {
    const players = await playerService.getAll()
    res.json(players)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取单个球员
router.get('/:id', async (req, res) => {
  try {
    const player = await playerService.getById(req.params.id)
    if (!player) return res.status(404).json({ error: 'Player not found' })
    res.json(player)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 创建球员
router.post('/', async (req, res) => {
  try {
    const { name } = req.body
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: '球员姓名必填' })
    }
    const player = await playerService.create(req.body)
    res.json(player)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 更新球员
router.put('/:id', async (req, res) => {
  try {
    const player = await playerService.update(req.params.id, req.body)
    res.json(player)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除球员
router.delete('/:id', async (req, res) => {
  try {
    await playerService.delete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取球队球员
router.get('/team/:teamId', async (req, res) => {
  try {
    const players = await playerService.getByTeam(req.params.teamId)
    res.json(players)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取梯队球员
router.get('/squad/:squadId', async (req, res) => {
  try {
    const players = await playerService.getBySquad(req.params.squadId)
    res.json(players)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 球员晋升
router.post('/promote', async (req, res) => {
  try {
    const { playerId, squadId } = req.body
    const result = await playerService.promote(squadId, playerId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router