import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function AdminLoginPage() {
  const { login, isAuthenticated } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('admin@matrimonyhub.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const from = location.state?.from?.pathname || '/admin/dashboard'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const res = await login(email, password)
    setIsLoading(false)
    if (res.success) {
      navigate(from, { replace: true })
    } else {
      setError(res.error || 'Invalid credentials. Please try again.')
    }
  }

  const handleFillDemo = (type) => {
    if (type === 'superadmin') {
      setEmail('admin@matrimonyhub.com')
      setPassword('admin123')
    } else {
      setEmail('moderator@matrimonyhub.com')
      setPassword('admin123')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#42000e] via-[#570013] to-[#1b1c1a] flex items-center justify-center p-4 selection:bg-[#775a19] selection:text-white font-body">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-amber-900/20">
        {/* Header Branding */}
        <div className="bg-white p-8 text-center border-b border-amber-900/15 relative">
          <img
            src="/Logo (2).png"
            alt="Agrawal Biodata Logo"
            className="h-20 w-auto object-contain mx-auto mb-3"
          />
          <h1 className="font-display text-xl font-extrabold text-[#570013] tracking-wide">
            Agarwal Biodata
          </h1>
          <p className="text-xs text-[#775a19] mt-1 uppercase tracking-widest font-bold">
            Admin Management Portal
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Admin Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-stone-400 text-lg">
                mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@matrimonyhub.com"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#775a19]/40 focus:border-[#775a19] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-stone-400 text-lg">
                lock
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#775a19]/40 focus:border-[#775a19] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-[#570013] to-[#800020] hover:from-[#42000e] hover:to-[#570013] text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Admin Portal</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
