import express from 'express'
import { teamService } from '../services/teamService.js'
import { requirePermission } from '../middleware/auth.js'
import { ah, intParam } from './helpers.js'

const router = express.Router()

// 读取
router.get('/', requirePermission('teams:read'), ah(async (req, res) => {
  res.json(await teamService.getAll())
}))

router.get('/:id', requirePermission('teams:read'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  const team = await teamService.getById(id)
  if (!team) return res.status(404).json({ error: '球队不存在' })
  res.json(team)
}))

// 写入
router.post('/', requirePermission('teams:write'), ah(async (req, res) => {
  const { name } = req.body || {}
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: '球队名称必填' })
  }
  res.status(201).json(await teamService.create(req.body))
}))

router.put('/:id', requirePermission('teams:write'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  const { name } = req.body || {}
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: '球队名称必填' })
  }
  res.json(await teamService.update(id, req.body))
}))

router.delete('/:id', requirePermission('teams:write'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  res.json(await teamService.delete(id))
}))

export default router
