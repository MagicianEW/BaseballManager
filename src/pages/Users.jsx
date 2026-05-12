import { useState, useEffect } from 'react'
import { authAPI } from '../utils/api'
import { ROLES } from '../context/AuthContext'

function Users() {
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', password: '', role: ROLES.ADMIN })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await authAPI.getUsers()
      setUsers(data)
    } catch (err) {
      alert('无权限访问')
    }
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    setError('')

    if (!newUser.username || !newUser.password) {
      setError('用户名和密码不能为空')
      return
    }

    if (newUser.password.length < 6) {
      setError('密码至少需要6个字符')
      return
    }

    setLoading(true)
    try {
      await authAPI.createAdmin(newUser.username, newUser.password, newUser.role)
      setShowModal(false)
      setNewUser({ username: '', password: '', role: ROLES.ADMIN })
      loadUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (user) => {
    if (user.isInitial) {
      alert('不能停用初始管理员')
      return
    }
    try {
      await authAPI.updateUserStatus(user.id, !user.isActive)
      loadUsers()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (user) => {
    if (user.isInitial) {
      alert('不能删除初始管理员')
      return
    }
    if (!confirm(`确定删除用户 ${user.username}？`)) return
    try {
      await authAPI.deleteUser(user.id)
      loadUsers()
    } catch (err) {
      alert(err.message)
    }
  }

  const getRoleName = (role) => {
    switch (role) {
      case ROLES.ADMIN: return '管理员'
      case ROLES.COACH: return '教练/统计员'
      case ROLES.PLAYER: return '球员'
      default: return role
    }
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case ROLES.ADMIN: return 'bg-red-100 text-red-800'
      case ROLES.COACH: return 'bg-blue-100 text-blue-800'
      case ROLES.PLAYER: return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-800 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          创建管理员
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">用户名</th>
              <th className="p-3 text-left">角色</th>
              <th className="p-3 text-left">状态</th>
              <th className="p-3 text-left">类型</th>
              <th className="p-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t">
                <td className="p-3">{user.username}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-sm ${getRoleBadgeClass(user.role)}`}>
                    {getRoleName(user.role)}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-sm ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.isActive ? '启用' : '停用'}
                  </span>
                </td>
                <td className="p-3">
                  {user.isInitial && <span className="text-orange-600 text-sm">初始管理员</span>}
                </td>
                <td className="p-3">
                  {!user.isInitial && (
                    <>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        {user.isActive ? '停用' : '启用'}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-800"
                      >
                        删除
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 创建管理员弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">创建管理员</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateAdmin}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  placeholder="输入用户名"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  密码
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  placeholder="输入密码（至少6位）"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  角色
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                >
                  <option value={ROLES.ADMIN}>系统管理员</option>
                  <option value={ROLES.COACH}>教练/统计员</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  创建新管理员后，初始 admin 账户将自动停用
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(''); }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-800 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users