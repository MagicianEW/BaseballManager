/**
 * 业务异常。带 httpStatus 的错误由全局错误中间件转成对应状态码，
 * 而不是一律 500。
 */
export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export class BadRequest extends HttpError {
  constructor(message) { super(400, message) }
}

export class Unauthorized extends HttpError {
  constructor(message = '未登录') { super(401, message) }
}

export class Forbidden extends HttpError {
  constructor(message = '无权限执行此操作') { super(403, message) }
}

export class NotFound extends HttpError {
  constructor(message = '资源不存在') { super(404, message) }
}
