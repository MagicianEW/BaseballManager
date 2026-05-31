import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../utils/api'
import { uploadAPI } from '../utils/api'
import { ROLES } from '../context/AuthContext'
import { THEMES, LANGUAGES } from '../context/AppContext'
import { API_BASE_URL } from '../utils/apiConfig'

function Settings() {
  const { theme, language, clubName, clubLogo, setTheme, setLanguage, setClubName, setClubLogo, t } = useApp()
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', password: '', role: ROLES.ADMIN })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef(null)

  // 加载用户列表
  const loadUsers = async () => {
    try {
      const data = await authAPI.getUsers()
      setUsers(data)
    } catch (err) {
      // ignore
    }
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    // 刷新页面以应用新主题
    window.location.reload()
  }

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang)
  }

  const handleClubNameChange = (e) => {
    setClubName(e.target.value)
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const result = await uploadAPI.uploadTeamLogo(file)
      setClubLogo(result.url)
    } catch (err) {
      alert(t('uploadFailed') + err.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleRemoveLogo = () => {
    setClubLogo('')
  }

  const getLogoUrl = (logo) => {
    if (!logo) return null
    if (logo.startsWith('http')) return logo
    return `${API_BASE_URL}${logo}`
  }

  // 用户管理相关函数
  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    setError('')

    if (!newUser.username || !newUser.password) {
      setError(t('usernameAndPasswordRequired'))
      return
    }

    if (newUser.password.length < 6) {
      setError(t('passwordMinLength'))
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
      alert(t('cannotDisableInitialAdmin'))
      return
    }
    try {
      await authAPI.updateUserStatus(user.id, !user.isActive)
      loadUsers()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteUser = async (user) => {
    if (user.isInitial) {
      alert(t('cannotDeleteInitialAdmin'))
      return
    }
    if (!confirm(t('confirmDeleteUser').replace('{username}', user.username))) return
    try {
      await authAPI.deleteUser(user.id)
      loadUsers()
    } catch (err) {
      alert(err.message)
    }
  }

  const getRoleName = (role) => {
    switch (role) {
      case ROLES.ADMIN: return t('admin')
      case ROLES.COACH: return t('coach')
      case ROLES.PLAYER: return t('player')
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('settings')}</h1>

      {/* 主题设置 */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">{t('theme')}</h2>
        <div className="flex gap-4">
          {Object.entries(THEMES).map(([key, value]) => (
            <button
              key={key}
              onClick={() => handleThemeChange(key)}
              className={`w-12 h-12 rounded-full ${value.primary} ${
                theme === key ? 'ring-4 ring-offset-2 ring-gray-400' : ''
              }`}
              title={value.name}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">{t('selectTheme')}</p>
      </div>

      {/* 语言设置 */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">{t('language')}</h2>
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="border p-2 rounded w-full md:w-64"
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
        <p className="text-sm text-gray-500 mt-2">{t('selectLanguage')}</p>
      </div>

      {/* 俱乐部名称设置 */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">{t('clubName')}</h2>
        <input
          type="text"
          value={clubName}
          onChange={handleClubNameChange}
          placeholder={t('enterClubName')}
          className="border p-2 rounded w-full md:w-64"
        />
      </div>

      {/* 队标设置 */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">{t('logo')}</h2>
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleLogoUpload}
            className="border p-2 rounded"
            disabled={uploadingLogo}
          />
          {uploadingLogo && <span className="text-blue-600">{t('uploading')}</span>}
        </div>

        {clubLogo && (
          <div className="mt-4 flex items-center gap-4">
            <img
              src={getLogoUrl(clubLogo)}
              alt="Club Logo"
              className="w-20 h-20 object-contain border rounded"
            />
            <button
              onClick={handleRemoveLogo}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              {t('delete')}
            </button>
          </div>
        )}
      </div>

      {/* 用户管理（仅管理员） */}
      {isAdmin() && (
        <div className="bg-white p-6 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">{t('users')}</h2>
            <button
              onClick={() => { loadUsers(); setShowModal(true); }}
              className="bg-green-800 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {t('createAdmin')}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">{t('username')}</th>
                <th className="p-3 text-left">{t('role')}</th>
                <th className="p-3 text-left">{t('status')}</th>
                <th className="p-3 text-left">{t('userType')}</th>
                <th className="p-3 text-left">{t('action')}</th>
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
                      {user.isActive ? t('enabled') : t('disabled')}
                    </span>
                  </td>
                  <td className="p-3">
                    {user.isInitial && <span className="text-orange-600 text-sm">{t('initialAdmin')}</span>}
                  </td>
                  <td className="p-3">
                    {!user.isInitial && (
                      <>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          {user.isActive ? t('disabled') : t('enabled')}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-800"
                        >
                          {t('delete')}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 创建管理员弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{t('createAdmin')}</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateAdmin}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  {t('username')}
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  {t('password')}
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  {t('role')}
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                >
                  <option value={ROLES.ADMIN}>{t('systemAdmin')}</option>
                  <option value={ROLES.COACH}>{t('coachOrStat')}</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {t('newAdminInfo')}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(''); }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-800 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? t('creating') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings