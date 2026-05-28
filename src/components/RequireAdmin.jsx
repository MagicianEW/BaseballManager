import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

/**
 * 需要管理员权限的路由包装组件
 */
function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  if (!user || !isAdmin()) {
    return <Navigate to="/" replace />
  }

  return children
}

export default RequireAdmin