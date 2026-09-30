import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import { createServer } from 'http'
import { pathToFileURL } from 'url'
import { Server } from 'socket.io'

import teamRoutes from './routes/teams.js'
import playerRoutes from './routes/players.js'
import gameRoutes from './routes/games.js'
import statsRoutes from './routes/stats.js'
import squadRoutes from './routes/squads.js'
import authRoutes from './routes/auth.js'
import { authenticate, requirePermission } from './middleware/auth.js'
import { authService } from './services/authService.js'
import { uploadDir, makeFilename, sniffImageType, resolveUploadPath, deleteUpload } from './uploads.js'
import { ah } from './routes/helpers.js'
import { HttpError } from './errors.js'
import './db.js'   // 触发 schema 与迁移

const app = express()
const httpServer = createServer(app)

const PORT = process.env.PORT || 3001
const IS_PROD = process.env.NODE_ENV === 'production'

// CORS：生产环境收敛到白名单，开发环境放开
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean)

const corsOptions = IS_PROD
  ? { origin: corsOrigins, credentials: true }
  : { origin: true, credentials: true }

const io = new Server(httpServer, { cors: { origin: corsOptions.origin, credentials: true } })
app.set('io', io)

// Socket 连接必须携带有效 token，否则立即断开
io.on('connection', socket => {
  const token = socket.handshake.auth?.token
  if (!token || !authService.verifyToken(token)) {
    socket.disconnect(true)
  }
})

app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))

// --- 上传 -----------------------------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),   // 读文件头校验真实类型后再落盘
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
})

app.post('/api/upload/team-logo',
  authenticate,
  requirePermission('teams:write'),
  upload.single('logo'),
  ah(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: '没有上传文件' })

    // 不信任客户端提供的 mimetype 与扩展名，以文件头为准
    const realType = sniffImageType(req.file.buffer)
    if (!realType) {
      return res.status(400).json({ error: '只支持 jpeg / png / gif / webp 图片' })
    }

    const filename = makeFilename('logo', realType)
    fs.writeFileSync(resolveUploadPath(`/uploads/${filename}`), req.file.buffer)
    res.status(201).json({ url: `/uploads/${filename}`, filename })
  })
)

app.delete('/api/upload/:filename',
  authenticate,
  requirePermission('teams:write'),
  ah(async (req, res) => {
    deleteUpload(req.params.filename)
    res.json({ success: true })
  })
)

// 上传文件读取：必须登录。此前用 express.static 裸暴露，任何人可直接下载。
// 同时挂在 /api/uploads 下，便于前端走 vite 代理；/uploads 保留兼容历史数据。
const serveUpload = (req, res) => {
  const full = resolveUploadPath(req.params.filename)
  if (!full || !fs.existsSync(full)) return res.status(404).json({ error: '文件不存在' })
  res.setHeader('Cache-Control', 'private, max-age=300')
  res.sendFile(full)
}
app.get('/api/uploads/:filename', authenticate, serveUpload)
app.get('/uploads/:filename', authenticate, serveUpload)

// --- 业务路由 --------------------------------------------------------------
// 所有业务接口均需登录，读写权限在各自路由内细分
app.use('/api/auth', authRoutes)
app.use('/api/teams', authenticate, teamRoutes)
app.use('/api/players', authenticate, playerRoutes)
app.use('/api/squads', authenticate, squadRoutes)
app.use('/api/stats', authenticate, statsRoutes)
app.use('/api/games', authenticate, gameRoutes)
// 保留 /api/v1 前缀兼容性（原先文档写的是 /api/v1/games）
app.use('/api/v1/games', authenticate, gameRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: `接口不存在: ${req.method} ${req.path}` })
})

// 统一错误处理
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? '文件超过 5MB 限制' : err.message
    return res.status(400).json({ error: msg })
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message })
  }
  console.error('[error]', err)
  res.status(500).json({ error: IS_PROD ? '服务器内部错误' : err.message })
})

// 仅在直接运行时监听端口；被 import（如测试）时由调用方决定何时 listen，
// 否则 import 就会抢占端口。
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

export function start(port = PORT) {
  return new Promise(resolve => {
    httpServer.listen(port, () => {
      console.log(`Server running on http://localhost:${httpServer.address().port}`)
      console.log(`Uploads dir: ${uploadDir}`)
      resolve(httpServer)
    })
  })
}

if (isMain) {
  start()
}

export { app, httpServer, io }
