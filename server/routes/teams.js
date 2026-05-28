import express from 'express'
import { teamService } from '../services/teamService.js'

const router = express.Router()

// 获取所有球队
router.get('/', async (req, res) => {
  try {
    const teams = await teamService.getAll()
    res.json(teams)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取单个球队
router.get('/:id', async (req, res) => {
  try {
    const team = await teamService.getById(req.params.id)
    if (!team) return res.status(404).json({ error: 'Team not found' })
    res.json(team)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 创建球队
router.post('/', async (req, res) => {
  try {
    const { name } = req.body
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: '球队名称必填' })
    }
    const team = await teamService.create(req.body)
    res.json(team)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 更新球队
router.put('/:id', async (req, res) => {
  try {
    const team = await teamService.update(req.params.id, req.body)
    res.json(team)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除球队
router.delete('/:id', async (req, res) => {
  try {
    await teamService.delete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router