import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../utils/apiConfig'

/**
 * 导航栏组件
 */
function Navbar() {
  const { user, logout } = useAuth()
  const { clubLogo, clubName, t } = useApp()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  const theme = localStorage.getItem('theme') || 'green'
  const themeClasses = {
    green: 'bg-green-800 hover:bg-green-700',
    blue: 'bg-blue-800 hover:bg-blue-700',
    red: 'bg-red-800 hover:bg-red-700',
    purple: 'bg-purple-800 hover:bg-purple-700',
    orange: 'bg-orange-700 hover:bg-orange-600',
    yellow: 'bg-yellow-600 hover:bg-yellow-500',
    indigo: 'bg-indigo-800 hover:bg-indigo-700',
    cyan: 'bg-cyan-700 hover:bg-cyan-600',
  }

  const getLogoUrl = (logo) => {
    if (!logo) return null
    if (logo.startsWith('http')) return logo
    return `${API_BASE_URL}${logo}`
  }

  return (
    <nav className={`${themeClasses[theme] || themeClasses.green} text-white shadow-lg`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              {clubLogo && (
                <img src={getLogoUrl(clubLogo)} alt="Club" className="w-10 h-10 object-contain" />
              )}
              <h1 className="text-xl font-bold">{clubLogo ? '' : '⚾'} {t('appName')}</h1>
            </div>
            <div className="flex gap-6">
              <NavLink to="/">{t('teams')}</NavLink>
              <NavLink to="/squads">{t('squads')}</NavLink>
              <NavLink to="/players">{t('players')}</NavLink>
              <NavLink to="/games">{t('games')}</NavLink>
              <NavLink to="/stats">{t('stats')}</NavLink>
              {user.role === 'admin' && <NavLink to="/settings">{t('users')}</NavLink>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">
              {user.username} ({t(user.role)})
            </span>
            <button
              onClick={handleLogout}
              className="bg-green-700 hover:bg-green-600 px-3 py-1 rounded text-sm"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

/**
 * 导航链接组件
 */
function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-white hover:text-green-200 transition-colors font-medium px-3 py-2 rounded-md hover:bg-green-700"
    >
      {children}
    </Link>
  )
}

export { Navbar, NavLink }
export default Navbar