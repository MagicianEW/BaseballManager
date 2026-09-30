import express from 'express'
import { statsService } from '../services/statsService.js'
import { requirePermission } from '../middleware/auth.js'
import { ah, intParam } from './helpers.js'

const router = express.Router()

router.get('/player/:id', requirePermission('stats:read'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  const stats = await statsService.getPlayerStats(id)
  if (!stats) return res.status(404).json({ error: '球员不存在' })
  res.json(stats)
}))

router.get('/team/:id', requirePermission('stats:read'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  res.json(await statsService.getTeamStats(id))
}))

router.get('/game/:id', requirePermission('stats:read'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  res.json(await statsService.getGameStats(id))
}))

export default router
