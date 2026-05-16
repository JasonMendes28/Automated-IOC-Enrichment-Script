import { Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Navbar from './components/Navbar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import UploadPage from './pages/UploadPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/upload': 'IOC Upload',
  '/analytics': 'Analytics',
  '/reports': 'Reports',
}

export default function App() {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'IOC Platform'

  return (
    <div className="flex min-h-screen relative z-10">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={title} />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center h-full text-center p-12">
                <div className="text-6xl mb-4">🛡️</div>
                <h2 className="font-display text-2xl font-bold text-cyber-text mb-2">404 — Page Not Found</h2>
                <p className="text-cyber-muted font-mono text-sm">The requested endpoint doesn't exist in this system.</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </div>
  )
}
