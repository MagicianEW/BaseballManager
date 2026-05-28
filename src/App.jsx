import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import Teams from './pages/Teams'
import Players from './pages/Players'
import Games from './pages/Games'
import Stats from './pages/Stats'
import GameLive from './pages/GameLive'
import Squads from './pages/Squads'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'
import ErrorBoundary from './components/ErrorBoundary'
import RequireAuth from './components/RequireAuth'
import RequireAdmin from './components/RequireAdmin'
import RequireCoach from './components/RequireCoach'
import Navbar from './components/Navbar'

/**
 * 主应用组件
 */
function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <div className="min-h-screen bg-gray-100">
              <Navbar />
              <main className="container mx-auto px-4 py-6">
                <Routes>
                  {/* 公开路由 */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* 需要登录的路由 */}
                  <Route path="/" element={
                    <RequireAuth><Teams /></RequireAuth>
                  } />
                  <Route path="/squads" element={
                    <RequireAuth><Squads /></RequireAuth>
                  } />
                  <Route path="/players" element={
                    <RequireAuth><Players /></RequireAuth>
                  } />
                  <Route path="/games" element={
                    <RequireAuth><Games /></RequireAuth>
                  } />
                  <Route path="/stats" element={
                    <RequireAuth><Stats /></RequireAuth>
                  } />
                  <Route path="/game/:id" element={
                    <RequireAuth><GameLive /></RequireAuth>
                  } />

                  {/* 仅管理员 */}
                  <Route path="/settings" element={
                    <RequireAdmin><Settings /></RequireAdmin>
                  } />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </AppProvider>
  )
}

export default App