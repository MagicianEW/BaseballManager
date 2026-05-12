import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Teams from './pages/Teams'
import Players from './pages/Players'
import Games from './pages/Games'
import Stats from './pages/Stats'
import GameLive from './pages/GameLive'
import Squads from './pages/Squads'

/**
 * 主应用组件
 *
 * 提供全局状态管理和路由配置
 */
function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100">
          {/* 导航栏 */}
          <nav className="bg-green-800 text-white shadow-lg">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-8">
                  <h1 className="text-xl font-bold">⚾ 棒球球队管理系统</h1>
                  <div className="flex gap-6">
                    <NavLink to="/">球队</NavLink>
                    <NavLink to="/squads">梯队</NavLink>
                    <NavLink to="/players">球员</NavLink>
                    <NavLink to="/games">比赛</NavLink>
                    <NavLink to="/stats">统计</NavLink>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* 主内容区 */}
          <main className="container mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<Teams />} />
              <Route path="/squads" element={<Squads />} />
              <Route path="/players" element={<Players />} />
              <Route path="/games" element={<Games />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/game/:id" element={<GameLive />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
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

export default App