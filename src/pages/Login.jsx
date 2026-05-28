import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { API_BASE_URL } from '../utils/apiConfig'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { clubLogo, clubName, t } = useApp()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const getLogoUrl = (logo) => {
    if (!logo) return null
    if (logo.startsWith('http')) return logo
    return `${API_BASE_URL}${logo}`
  }

  const theme = localStorage.getItem('theme') || 'green'
  const themeClasses = {
    green: 'bg-green-800 hover:bg-green-700 border-green-900',
    blue: 'bg-blue-800 hover:bg-blue-700 border-blue-900',
    red: 'bg-red-800 hover:bg-red-700 border-red-900',
    purple: 'bg-purple-800 hover:bg-purple-700 border-purple-900',
    orange: 'bg-orange-700 hover:bg-orange-600 border-orange-900',
    yellow: 'bg-yellow-600 hover:bg-yellow-500 border-yellow-700',
    indigo: 'bg-indigo-800 hover:bg-indigo-700 border-indigo-900',
    cyan: 'bg-cyan-700 hover:bg-cyan-600 border-cyan-900',
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${themeClasses[theme] || themeClasses.green}`}>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          {clubName && (
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{clubName}</h2>
          )}
          <div className="flex items-center justify-center gap-2 mb-2">
            {clubLogo && (
              <img src={getLogoUrl(clubLogo)} alt="Club" className="w-12 h-12 object-contain" />
            )}
            <h1 className={`text-3xl font-bold ${themeClasses[theme]?.replace('bg-', 'text-') || 'text-green-800'}`}>
              {clubLogo ? '' : '⚾'} {t('appName')}
            </h1>
          </div>
          <p className="text-gray-600">{t('loginTitle')}</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t('username')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder={t('username')}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder={t('password')}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${themeClasses[theme] || themeClasses.green} text-white font-bold py-2 px-4 rounded hover:opacity-90 focus:outline-none focus:shadow-outline disabled:opacity-50`}
          >
            {loading ? t('loggingIn') : t('login')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t('noAccount')}{' '}
            <Link to="/register" className={`font-semibold ${themeClasses[theme]?.replace('bg-', 'text-') || 'text-green-800'} hover:underline`}>
              {t('register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login