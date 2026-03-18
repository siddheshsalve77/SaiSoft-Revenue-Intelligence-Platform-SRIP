import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useThemeStore, useAuthStore } from './store'

// Pages
import LandingPage  from './pages/LandingPage'
import LoginPage    from './pages/LoginPage'
import Dashboard    from './pages/Dashboard'
import Employees    from './pages/Employees'
import Transactions from './pages/Transactions'
import Products     from './pages/Products'
import Clients      from './pages/Clients'
import Reports      from './pages/Reports'
import ActivityLog  from './pages/ActivityLog'
import LiveFeed     from './pages/LiveFeed'
import CEOSummary   from './pages/CEOSummary'
import AlertSettings from './pages/AlertSettings'

// Layout
import AppLayout from './components/AppLayout'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { theme, initTheme } = useThemeStore()

  useEffect(() => {
    // Always enforce light theme — ignore any old persisted value
    initTheme()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"      element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — wrapped in AppLayout (sidebar + navbar) */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index              element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard"   element={<Dashboard />} />
          <Route path="employees"   element={<Employees />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="products"    element={<Products />} />
          <Route path="clients"     element={<Clients />} />
          <Route path="reports"     element={<Reports />} />
          <Route path="activity"    element={<ActivityLog />} />
          <Route path="live-feed"   element={<LiveFeed />} />
          <Route path="ceo-summary" element={<CEOSummary />} />
          <Route path="settings"    element={<AlertSettings />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
