/**
 * 路由辅助
 */

/**
 * 包装 async handler，把异常交给 express 错误处理中间件。
 * 避免每个路由都写一遍 try/catch。
 */
export function ah(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

/** 校验并取整数路由参数 */
export function intParam(req, res, name) {
  const raw = req.params[name]
  const n = Number(raw)
  if (!Number.isInteger(n) || n <= 0) {
    res.status(400).json({ error: `${name} 必须是正整数` })
    return null
  }
  return n
}
