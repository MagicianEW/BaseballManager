import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

import teamRoutes from './routes/teams.js'
import playerRoutes from './routes/players.js'
import gameRoutes from './routes/games.js'
import statsRoutes from './routes/stats.js'
import squadRoutes from './routes/squads.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, 'public', 'uploads')

// 确保上传目录存在
fs.mkdirSync(uploadDir, { recursive: true })

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// 静态文件服务（用于访问上传的图片）
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')))

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `team-${uniqueSuffix}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
      cb(null, true)
    } else {
      cb(new Error('只支持图片文件: jpeg, jpg, png, gif, webp'))
    }
  }
})

// 上传路由
app.post('/api/upload/team-logo', upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有上传文件' })
  }
  const logoUrl = `/uploads/${req.file.filename}`
  res.json({ url: logoUrl, filename: req.file.filename })
})

// 删除图片路由
app.delete('/api/upload/:filename', (req, res) => {
  const filename = req.params.filename
  const filepath = path.join(uploadDir, filename)
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath)
  }
  res.json({ success: true })
})

// Routes
app.use('/api/teams', teamRoutes)
app.use('/api/players', playerRoutes)
app.use('/api/games', gameRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/squads', squadRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})