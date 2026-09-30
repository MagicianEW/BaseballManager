import { useEffect, useState } from 'react'

/**
 * 需要鉴权的图片。
 *
 * 上传目录现在必须登录才能访问（此前用 express.static 裸暴露，
 * 任何知道文件名的人都能直接下载未成年人的照片），
 * 而 <img src> 无法携带 Authorization 头。
 *
 * 这里改为：带 token fetch 成 blob，再用 objectURL 渲染。
 * token 只出现在请求头里，不会泄漏到 URL / referrer / 访问日志。
 */

const cache = new Map()   // path -> objectURL

export default function AuthImage({ src, alt = '', className = '', ...rest }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!src) { setUrl(null); return }
    if (src.startsWith('http') || src.startsWith('data:')) { setUrl(src); return }
    if (cache.has(src)) { setUrl(cache.get(src)); return }

    let cancelled = false
    const filename = src.replace(/^\/uploads\//, '').replace(/^\//, '')
    const token = localStorage.getItem('token')

    fetch(`/api/uploads/${encodeURIComponent(filename)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => (res.ok ? res.blob() : Promise.reject(new Error('加载失败'))))
      .then(blob => {
        if (cancelled) return
        const objectUrl = URL.createObjectURL(blob)
        cache.set(src, objectUrl)
        setUrl(objectUrl)
      })
      .catch(() => { if (!cancelled) setUrl(null) })

    return () => { cancelled = true }
  }, [src])

  if (!src) return null
  if (!url) {
    // 加载中或失败时保留占位，避免布局跳动
    return <div className={`${className} bg-gray-200 rounded`} aria-label={alt} {...rest} />
  }
  return <img src={url} alt={alt} className={className} {...rest} />
}

/** 登出时清理缓存，避免跨用户残留 */
export function clearImageCache() {
  cache.forEach(url => URL.revokeObjectURL(url))
  cache.clear()
}
