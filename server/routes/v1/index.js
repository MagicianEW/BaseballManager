import express from 'express'
import gameRoutes from './games.js'

const router = express.Router()
router.use('/games', gameRoutes)

export default router