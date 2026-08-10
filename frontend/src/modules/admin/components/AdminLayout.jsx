import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import { adminDataService } from '../services/adminDataService'
import HeaderSearchModal from './HeaderSearchModal'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: 'dashboard',
  },
  {
    label: 'User Management',
    path: '/admin/users',
    icon: 'group',
  },
  {
    label: 'Profile Verification',
    path: '/admin/profile-verification',
    icon: 'verified_user',
    badgeKey: 'pendingVerifications',
  },
  {
    label: 'Match Management',
    path: '/admin/matches',
    icon: 'favorite',
  },
  {
    label: 'Subscription Management',
    path: '/admin/subscriptions',
    icon: 'card_membership',
  },
  {
    label: 'Payment Management',
    path: '/admin/payments',
    icon: 'payments',
  },
  {
    label: 'Reports & Blocks',
    path: '/admin/complaints',
    icon: 'report_problem',
    badgeKey: 'pendingComplaints',
  },
  {
    label: 'Policy & Legal Pages',
    path: '/admin/legal',
    icon: 'policy',
  },
]

export default function AdminLayout({ children, title = 'Admin Portal' }) {
  const { adminUser, logout } = useAdminAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [metrics, setMetrics] = useState({ pendingVerifications: 0, pendingComplaints: 0 })
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)

  useEffect(() => {
    const data = adminDataService.getDashboardMetrics()
    const complaints = adminDataService.getComplaints()
    const pendingComp = complaints.filter(c => c.status === 'Under Review' || c.status === 'Pending').length
    setMetrics({
      pendingVerifications: data.pendingVerifications,
      pendingComplaints: pendingComp,
    })
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  // Generate breadcrumb list
  const getBreadcrumbs = () => {
    const segments = location.pathname.split('/').filter(Boolean)
    if (segments.length <= 1) return [{ name: 'Dashboard', path: '/admin/dashboard' }]
    
    const crumbs = [{ name: 'Admin', path: '/admin/dashboard' }]
    let accumulatedPath = '/admin'

    segments.slice(1).forEach((segment) => {
      accumulatedPath += `/${segment}`
      let formatted = segment.replace(/-/g, ' ')
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1)
      crumbs.push({ name: formatted, path: accumulatedPath })
    })

    return crumbs
  }

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-[#1b1c1a] font-body flex flex-col md:flex-row">
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen bg-[#570013] text-white flex flex-col transition-all duration-300 shadow-xl print:hidden ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className={`h-20 border-b border-stone-200 bg-white flex items-center transition-all relative ${
          isCollapsed ? 'px-1 justify-center' : 'px-4 justify-between'
        }`}>
          {!isCollapsed ? (
            <div className="flex flex-col min-w-0">
              <span className="font-display font-extrabold text-base text-[#570013] tracking-wide leading-tight truncate">
                Agrawal Biodata
              </span>
              <span className="text-[10px] font-bold text-[#775a19] uppercase tracking-widest leading-tight mt-0.5">
                Admin Panel
              </span>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#570013] text-amber-200 font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
              AB
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex items-center justify-center transition-all ${
              isCollapsed
                ? 'absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-stone-300 shadow-md text-stone-600 hover:text-stone-900 hover:bg-amber-50 z-30'
                : 'p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100'
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <span className="material-symbols-outlined text-sm">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* Sidebar Menu Items */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1 scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            const badgeCount = item.badgeKey ? metrics[item.badgeKey] : 0

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#775a19] to-[#916e20] text-white shadow-md font-semibold'
                    : 'text-amber-100/80 hover:bg-white/10 hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <span className="material-symbols-outlined text-xl shrink-0">
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}
                {!isCollapsed && badgeCount > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-400 text-[#570013] rounded-full shadow-xs">
                    {badgeCount}
                  </span>
                )}
                {isCollapsed && badgeCount > 0 && (
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-full absolute top-2 right-2 border-2 border-[#570013]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-amber-900/40 bg-[#42000e]">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <Link
              to="/admin/settings"
              className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-90 transition-opacity cursor-pointer group"
              title="View Account Settings"
            >
              <img
                src={adminUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'}
                alt="Admin Avatar"
                className="w-9 h-9 rounded-full object-cover border border-amber-400/50 shrink-0 group-hover:border-amber-300 transition-all"
              />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-amber-200 transition-colors">
                    {adminUser?.name || 'Admin User'}
                  </p>
                  <p className="text-[10px] text-amber-300/80 truncate font-mono">
                    {adminUser?.role || 'Administrator'}
                  </p>
                </div>
              )}
            </Link>
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-amber-200/70 hover:text-red-300 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                title="Logout"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen print:bg-white print:p-0">
        {/* TOP NAVBAR */}
        <header className="h-16 md:h-20 bg-white border-b border-stone-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 shrink-0"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            {/* Logo + Official Hindi Header Title on Left */}
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/Logo (2).png"
                alt="Agrawal Biodata Logo"
                className="h-12 md:h-14 w-auto object-contain shrink-0"
              />
              <div className="flex flex-col text-left min-w-0">
                <h1 className="font-bold text-xs sm:text-sm md:text-base text-[#570013] tracking-wide font-display leading-tight truncate">
                  महाराजा अग्रसेन एवं माँ माधवी बायोडाटा प्रकल्प
                </h1>
                <p className="text-[9px] sm:text-[10px] md:text-[11px] text-[#775a19] font-semibold leading-tight mt-0.5 truncate">
                  ( दक्षिणी पश्चिमी राजस्थान अग्रवाल सम्मेलन द्वारा संचालित )
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">

            {/* Search Icon Trigger */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="relative p-2 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-[#570013] transition-colors cursor-pointer"
              title="Search Profiles & Professions"
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </button>

            {/* Notifications Bell */}
            <Link
              to="/admin/notifications"
              className="relative p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
              title="Notifications Center"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              {metrics.pendingVerifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                  {metrics.pendingVerifications}
                </span>
              )}
            </Link>

            {/* Platform Role Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-xs text-[#775a19] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Live</span>
            </div>

            {/* Quick Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <img
                  src={adminUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'}
                  alt="Admin"
                  className="w-8 h-8 rounded-full object-cover border border-amber-600/40"
                />
                <span className="material-symbols-outlined text-stone-400 text-base">
                  expand_more
                </span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg py-1 z-50 animate-scale-fade">
                  <div className="px-4 py-2 border-b border-stone-100">
                    <p className="text-xs font-bold text-stone-800">{adminUser?.name}</p>
                    <p className="text-[10px] text-stone-500 truncate">{adminUser?.email}</p>
                  </div>
                  <Link
                    to="/admin/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full text-left px-4 py-2.5 text-xs text-stone-800 hover:bg-amber-50 flex items-center gap-2 border-b border-stone-100 font-extrabold transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-[#775a19]">manage_accounts</span>
                    <span>Account Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Header Quick Search Modal */}
      <HeaderSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </div>
  )
}
