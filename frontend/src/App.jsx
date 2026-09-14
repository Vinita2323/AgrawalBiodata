import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { UserFlowPage } from './modules/user'
import ErrorBoundary from './components/ErrorBoundary'
import RouteFallback from './components/RouteFallback'
import OfflineBanner from './components/OfflineBanner'

// The admin panel is a separate application that no member ever opens. Loading
// it eagerly put all 15 admin pages into the bundle every visitor downloads
// before the first screen could paint.
const AdminRoutes = lazy(() => import('./modules/admin/routes/AdminRoutes'))

export default function App() {
  return (
    <ErrorBoundary variant="app">
      <Router>
        <OfflineBanner />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/admin/*" element={<AdminRoutes />} />
            <Route path="/*" element={<UserFlowPage />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  )
}
