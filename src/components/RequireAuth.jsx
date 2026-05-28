import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

/**
 * 需要登录的路由包装组件
 */
function RequireAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default RequireAuth