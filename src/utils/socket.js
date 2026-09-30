import { io } from 'socket.io-client'

/**
 * Socket 客户端
 *
 * 此前后端 5 个路由都在 io.emit()，但前端完全没有接入（grep socket src/ 零命中），
 * 事件全部发给空气，GameLive 靠 2 秒轮询代替。
 */

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

let socket = null

/** 建立连接（带 token，服务端会校验）。已连接则复用 */
export function getSocket() {
  if (socket?.connected) return socket
  if (socket) return socket

  socket = io(SOCKET_URL, {
    auth: { token: localStorage.getItem('token') },
    transports: ['websocket', 'polling'],
  })

  socket.on('connect_error', err => {
    // token 无效时服务端会立即断开
    if (err.message?.includes('unauthorized') || err.message?.includes('disconnect')) {
      socket?.disconnect()
      socket = null
    }
  })

  return socket
}

/** 订阅事件，组件卸载时调用返回的函数即可解绑 */
export function onSocket(event, handler) {
  const s = getSocket()
  s.on(event, handler)
  return () => s.off(event, handler)
}

export function closeSocket() {
  socket?.disconnect()
  socket = null
}
