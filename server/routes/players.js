import express from 'express'
import { playerService } from '../services/playerService.js'
import { requirePermission } from '../middleware/auth.js'
import { ah, intParam } from './helpers.js'

const router = express.Router()

// 注意：/team/:teamId 与 /squad/:squadId 必须声明在 /:id 之前，
// 否则 "team" 会被当作 :id 匹配

// 读取
router.get('/', requirePermission('players:read'), ah(async (req, res) => {
  res.json(await playerService.getAll())
}))

router.get('/team/:teamId', requirePermission('players:read'), ah(async (req, res) => {
  const teamId = intParam(req, res, 'teamId'); if (!teamId) return
  res.json(await playerService.getByTeam(teamId))
}))

router.get('/squad/:squadId', requirePermission('players:read'), ah(async (req, res) => {
  const squadId = intParam(req, res, 'squadId'); if (!squadId) return
  res.json(await playerService.getBySquad(squadId))
}))

router.get('/:id', requirePermission('players:read'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  const player = await playerService.getById(id)
  if (!player) return res.status(404).json({ error: '球员不存在' })
  res.json(player)
}))

// 写入
const validatePlayer = (body, res) => {
  if (!body?.name || typeof body.name !== 'string' || !body.name.trim()) {
    res.status(400).json({ error: '球员姓名必填' })
    return false
  }
  return true
}

router.post('/', requirePermission('players:write'), ah(async (req, res) => {
  if (!validatePlayer(req.body, res)) return
  res.status(201).json(await playerService.create(req.body))
}))

router.put('/:id', requirePermission('players:write'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  if (!validatePlayer(req.body, res)) return
  res.json(await playerService.update(id, req.body))
}))

router.delete('/:id', requirePermission('players:write'), ah(async (req, res) => {
  const id = intParam(req, res, 'id'); if (!id) return
  res.json(await playerService.delete(id))
}))

// 球员晋升
router.post('/promote', requirePermission('players:write'), ah(async (req, res) => {
  const { playerId, squadId } = req.body || {}
  if (!playerId || !squadId) {
    return res.status(400).json({ error: 'playerId 与 squadId 必填' })
  }
  res.json(await playerService.promote(squadId, playerId))
}))

export default router
