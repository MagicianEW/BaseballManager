import fs from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * 上传文件管理
 *
 * 此前的实现有两个问题：
 *   1. 文件放在 server/public/uploads/ 下，并用 express.static 裸暴露，
 *      任何知道文件名的人都能直接下载（未成年人照片属于敏感个人信息）。
 *   2. 删除球员时只删数据库记录，磁盘上的图片永久残留。
 *
 * 现在改为：文件不放在任何静态目录下，必须经 authenticate + 权限校验后才能读取，
 * 且删除球员/替换照片时同步清理文件。
 */

export const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, 'data', 'uploads')

fs.mkdirSync(uploadDir, { recursive: true })

const IMAGE_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/gif', '.gif'],
  ['image/webp', '.webp'],
])

export const ALLOWED_MIME = [...IMAGE_TYPES.keys()]

/**
 * 通过读文件头判断真实类型，不信任客户端提供的 mimetype 与扩展名。
 */
export function sniffImageType(buffer) {
  if (buffer.length < 12) return null
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg'
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return 'image/png'
  if (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a') return 'image/gif'
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  return null
}

export const extForMime = mime => IMAGE_TYPES.get(mime) || '.bin'

/** 生成不易猜测且不可遍历的文件名 */
export function makeFilename(prefix, mime) {
  return `${prefix}-${Date.now().toString(36)}-${randomBytes(16).toString('hex')}${extForMime(mime)}`
}

/**
 * 把存储的路径（/uploads/foo.png 或 foo.png）解析为磁盘绝对路径。
 * 任何越出 uploadDir 的尝试一律拒绝。
 */
export function resolveUploadPath(stored) {
  if (!stored) return null
  const name = path.basename(String(stored))
  const full = path.join(uploadDir, name)
  const normalized = path.resolve(full)
  if (normalized !== path.resolve(uploadDir) && !normalized.startsWith(path.resolve(uploadDir) + path.sep)) {
    return null
  }
  return normalized
}

/** 删除上传文件。传入的是数据库里存的 photo 字段值 */
export function deleteUpload(stored) {
  const full = resolveUploadPath(stored)
  if (!full) return false
  try {
    if (fs.existsSync(full)) {
      fs.unlinkSync(full)
      return true
    }
  } catch (err) {
    console.error('[uploads] 删除失败:', err.message)
  }
  return false
}

export function uploadExists(stored) {
  const full = resolveUploadPath(stored)
  return !!full && fs.existsSync(full)
}
