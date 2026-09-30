import express from 'express'
import { squadService } from '../services/squadService.js'
import { requirePermission } from '../middleware/auth.js'
import { ah, intParam } from './helpers.js'

const router = express.Router()

// 读取（/team/:teamId 与 /:id/players 需声明在 /:id 之前）
router.get('/', requirePermission('squads:read'), ah(async (req, res) => {
  res.json(await squadService.getAll())
}))

router.get('/team/:teamId', requirePermission('squads:read'), ah(async (req, res) => {
  const teamId = intParam(req, res, 'teamId'); if (!teamId) return
  res.json(await squadService.getByTeam(teamId))
}))

router.get('/:id/players', requirePermission('squads:read'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  res.json(await squadService.getPlayers(id))
}))

router.get('/:id', requirePermission('squads:read'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  const squad = await squadService.getById(id)
  if (!squad) return res.status(404).json({ error: '梯队不存在' })
  res.json(squad)
}))

// 写入
router.post('/', requirePermission('squads:write'), ah(async (req, res) => {
  const { name, teamId } = req.body || {}
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: '梯队名称必填' })
  }
  if (!teamId) return res.status(400).json({ error: '所属球队必填' })
  res.status(201).json(await squadService.create(req.body))
}))

router.put('/:id', requirePermission('squads:write'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  const { name } = req.body || {}
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: '梯队名称必填' })
  }
  res.json(await squadService.update(id, req.body))
}))

router.delete('/:id', requirePermission('squads:write'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  res.json(await squadService.delete(id))
}))

export default router
