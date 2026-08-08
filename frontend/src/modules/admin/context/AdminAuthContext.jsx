import React, { createContext, useContext, useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

const AdminAuthContext = createContext()

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_session')
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      return null
    }
  })

  const login = (email, password) => {
    // Validates admin credentials
    if (email === 'admin@matrimonyhub.com' && password === 'admin123') {
      const userObj = {
        id: 'ADM-001',
        name: 'Super Administrator',
        email,
        role: 'Super Admin',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        loginTime: new Date().toISOString(),
      }
      setAdminUser(userObj)
      localStorage.setItem('admin_session', JSON.stringify(userObj))
      return { success: true }
    } else if (email === 'moderator@matrimonyhub.com' && password === 'admin123') {
      const userObj = {
        id: 'ADM-002',
        name: 'Community Moderator',
        email,
        role: 'Moderator',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        loginTime: new Date().toISOString(),
      }
      setAdminUser(userObj)
      localStorage.setItem('admin_session', JSON.stringify(userObj))
      return { success: true }
    }
    return { success: false, error: 'Invalid admin credentials.' }
  }

  const logout = () => {
    setAdminUser(null)
    localStorage.removeItem('admin_session')
  }

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAuthenticated: !!adminUser,
        role: adminUser?.role || 'Guest',
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}

export function AdminProtectedRoute({ children }) {
  const { isAuthenticated } = useAdminAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return children
}
