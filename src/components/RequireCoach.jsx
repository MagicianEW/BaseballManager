import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

/**
 * 需要教练或以上权限的路由包装组件
 */
function RequireCoach({ children }) {
  const { user, loading, isCoachOrAbove } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  if (!user || !isCoachOrAbove()) {
    return <Navigate to="/" replace />
  }

  return children
}

export default RequireCoach