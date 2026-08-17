import React, { createContext, useContext, useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

const AdminAuthContext = createContext()

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_session')
      const parsed = saved ? JSON.parse(saved) : null
      // A session without a token cannot authenticate any request, so treat it
      // as logged out rather than rendering a shell that 401s on every call.
      return parsed?.token ? parsed : null
    } catch {
      return null
    }
  })

  /**
   * Authenticates against the backend only. There is deliberately no local
   * credential fallback: one would hand out a Super Admin session to anyone
   * who can make the API request fail.
   */
  const login = async (email, password) => {
    try {
      const { adminLogin } = await import('../../../services/adminService')
      const res = await adminLogin(email, password)

      if (!res?.token || !res?.admin) {
        return { success: false, error: 'Invalid admin credentials.' }
      }

      const userObj = {
        id: res.admin.id || res.admin._id,
        name: res.admin.name || 'Administrator',
        email: res.admin.email || email,
        role: res.admin.role || 'Moderator',
        token: res.token,
        avatar: res.admin.avatar || '',
        loginTime: new Date().toISOString(),
      }

      setAdminUser(userObj)
      localStorage.setItem('admin_session', JSON.stringify(userObj))
      return { success: true }
    } catch (err) {
      if (err?.status === 0) {
        return {
          success: false,
          error: 'Cannot reach the server. Check your connection and try again.',
        }
      }
      return {
        success: false,
        error: err?.message || 'Invalid admin credentials.',
      }
    }
  }

  const logout = () => {
    setAdminUser(null)
    localStorage.removeItem('admin_session')
    localStorage.removeItem('adminToken')
    localStorage.removeItem('admin_token')
  }

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAuthenticated: !!adminUser?.token,
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
