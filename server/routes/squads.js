import express from 'express'
import { squadService } from '../services/squadService.js'

const router = express.Router()

// 获取所有梯队
router.get('/', async (req, res) => {
  try {
    const squads = await squadService.getAll()
    res.json(squads)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取单个梯队
router.get('/:id', async (req, res) => {
  try {
    const squad = await squadService.getById(req.params.id)
    if (!squad) return res.status(404).json({ error: 'Squad not found' })
    res.json(squad)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 按球队获取梯队
router.get('/team/:teamId', async (req, res) => {
  try {
    const squads = await squadService.getByTeam(req.params.teamId)
    res.json(squads)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 创建梯队
router.post('/', async (req, res) => {
  try {
    const { name, teamId } = req.body
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: '梯队名称必填' })
    }
    if (!teamId) {
      return res.status(400).json({ error: '所属球队必填' })
    }
    const squad = await squadService.create(req.body)
    res.json(squad)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 更新梯队
router.put('/:id', async (req, res) => {
  try {
    const squad = await squadService.update(req.params.id, req.body)
    res.json(squad)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除梯队
router.delete('/:id', async (req, res) => {
  try {
    await squadService.delete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取梯队球员
router.get('/:id/players', async (req, res) => {
  try {
    const players = await squadService.getPlayers(req.params.id)
    res.json(players)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router