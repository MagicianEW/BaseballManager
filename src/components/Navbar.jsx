import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { Link, useNavigate } from 'react-router-dom'
import AuthImage from './AuthImage'

/**
 * 导航栏组件
 *
 * 响应式说明：链接数量增加后，窄屏下菜单项会被逐字竖排挤爆。
 * 因此链接区允许横向滚动、链接本身不换行，用户名在窄屏隐藏。
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

  return (
    <nav className={`${themeClasses[theme] || themeClasses.green} text-white shadow-lg`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 h-16">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              {clubLogo && (
                <AuthImage src={clubLogo} alt="Club" className="w-9 h-9 object-contain" />
              )}
              <h1 className="text-lg font-bold whitespace-nowrap">
                {clubLogo ? '' : '⚾'} {clubLogo ? clubName : t('appName')}
              </h1>
            </div>
            {/* 链接区：窄屏可横向滚动，避免文字被逐字竖排 */}
            <div className="flex gap-1 overflow-x-auto min-w-0 scrollbar-none">
              <NavLink to="/">{t('teams')}</NavLink>
              <NavLink to="/squads">{t('squads')}</NavLink>
              <NavLink to="/players">{t('players')}</NavLink>
              <NavLink to="/games">{t('games')}</NavLink>
              <NavLink to="/stats">{t('stats')}</NavLink>
              <NavLink to="/help">{t('helpTitle')}</NavLink>
              {user.role === 'admin' && <NavLink to="/settings">{t('users')}</NavLink>}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm whitespace-nowrap hidden sm:inline">
              {user.username} ({t(user.role)})
            </span>
            <button
              onClick={handleLogout}
              className="bg-black/20 hover:bg-black/30 px-3 py-1 rounded text-sm whitespace-nowrap"
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
      className="text-white hover:text-green-200 transition-colors font-medium px-3 py-2 rounded-md hover:bg-black/15 whitespace-nowrap shrink-0"
    >
      {children}
    </Link>
  )
}

export { Navbar, NavLink }
export default Navbar
