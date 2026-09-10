import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { UserFlowPage } from './modules/user'
import AdminRoutes from './modules/admin/routes/AdminRoutes'
import ChildSafetyPage from './pages/ChildSafetyPage'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/child-safety" element={<ChildSafetyPage />} />
        <Route path="/*" element={<UserFlowPage />} />
      </Routes>
    </Router>
  )
}