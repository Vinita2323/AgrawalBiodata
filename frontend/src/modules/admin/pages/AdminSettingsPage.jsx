import React, { useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function AdminSettingsPage() {
  const { adminUser } = useAdminAuth()

  // State
  const [name, setName] = useState(adminUser?.name || 'Super Administrator')
  const [email, setEmail] = useState(adminUser?.email || 'admin@matrimonyhub.com')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Notifications
  const [notifyVerifications, setNotifyVerifications] = useState(true)
  const [notifyComplaints, setNotifyComplaints] = useState(true)
  const [notifyPayments, setNotifyPayments] = useState(true)

  const [toastMsg, setToastMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleUpdateProfile = (e) => {
    e.preventDefault()
    setToastMsg('Account profile details updated successfully!')
    setTimeout(() => setToastMsg(''), 3500)
  }

  const handleChangePassword = (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match.')
      return
    }
    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.')
      return
    }
    setToastMsg('Password changed successfully!')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setToastMsg(''), 3500)
  }

  const handleSavePreferences = (e) => {
    e.preventDefault()
    setToastMsg('System notification preferences saved!')
    setTimeout(() => setToastMsg(''), 3500)
  }

  return (
    <AdminLayout title="Account Settings">
      {/* Toast & Error Alerts */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-2xs">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-300 rounded-md text-xs text-red-900 font-bold flex items-center gap-2 shadow-2xs">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-extrabold text-[#570013]">
          Admin Account Settings
        </h2>
        <p className="text-xs text-[#775a19] font-medium mt-0.5">
          Manage administrator profile credentials, security passwords, and system notification preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* 1. Admin Profile Card */}
        <form onSubmit={handleUpdateProfile} className="bg-white rounded-lg p-5 border border-amber-900/15 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-amber-900/10 pb-3">
            <span className="material-symbols-outlined text-xl text-[#570013]">manage_accounts</span>
            <div>
              <h3 className="font-bold text-sm text-[#570013]">Profile Credentials</h3>
              <p className="text-xs text-stone-500 font-medium">Administrator account info</p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-2">
            <img
              src={adminUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'}
              alt="Admin Avatar"
              className="w-14 h-14 rounded-full object-cover border-2 border-amber-400/50 shadow-xs"
            />
            <div>
              <p className="font-extrabold text-sm text-stone-900">{name}</p>
              <span className="px-2 py-0.5 bg-amber-100 text-[#570013] border border-amber-300 rounded-md text-[11px] font-extrabold inline-block mt-1">
                {adminUser?.role || 'Super Administrator'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-amber-900/20 rounded-md text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-amber-900/20 rounded-md text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#570013] text-amber-100 font-extrabold text-xs rounded-md shadow-sm hover:bg-[#42000e] transition-all active:scale-95"
          >
            Save Profile Info
          </button>
        </form>

        {/* 2. Security & Password Change */}
        <form onSubmit={handleChangePassword} className="bg-white rounded-lg p-5 border border-amber-900/15 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-amber-900/10 pb-3">
            <span className="material-symbols-outlined text-xl text-[#570013]">lock_reset</span>
            <div>
              <h3 className="font-bold text-sm text-[#570013]">Password & Security</h3>
              <p className="text-xs text-stone-500 font-medium">Update admin login password</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-stone-50 border border-amber-900/20 rounded-md text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 bg-stone-50 border border-amber-900/20 rounded-md text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3 py-2 bg-stone-50 border border-amber-900/20 rounded-md text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#570013] text-amber-100 font-extrabold text-xs rounded-md shadow-sm hover:bg-[#42000e] transition-all active:scale-95"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* 3. Notification Preferences */}
      <form onSubmit={handleSavePreferences} className="bg-white rounded-lg p-5 border border-amber-900/15 shadow-xs space-y-4 max-w-4xl">
        <div className="flex items-center gap-3 border-b border-amber-900/10 pb-3">
          <span className="material-symbols-outlined text-xl text-[#570013]">notifications_active</span>
          <div>
            <h3 className="font-bold text-sm text-[#570013]">Notification Preferences</h3>
            <p className="text-xs text-stone-500 font-medium">Control live alerts for admin activities</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-amber-50/40 border border-amber-900/15 rounded-md cursor-pointer hover:bg-amber-50/70 transition-colors">
            <div>
              <p className="text-xs font-extrabold text-stone-900">Profile Verification Alerts</p>
              <p className="text-[11px] text-stone-500 font-medium">Notify when new Aadhaar/Passport proof is uploaded</p>
            </div>
            <input
              type="checkbox"
              checked={notifyVerifications}
              onChange={(e) => setNotifyVerifications(e.target.checked)}
              className="w-4 h-4 accent-[#570013] rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-amber-50/40 border border-amber-900/15 rounded-md cursor-pointer hover:bg-amber-50/70 transition-colors">
            <div>
              <p className="text-xs font-extrabold text-stone-900">User Report Flags</p>
              <p className="text-[11px] text-stone-500 font-medium">Notify when user files fake profile or abuse complaints</p>
            </div>
            <input
              type="checkbox"
              checked={notifyComplaints}
              onChange={(e) => setNotifyComplaints(e.target.checked)}
              className="w-4 h-4 accent-[#570013] rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-amber-50/40 border border-amber-900/15 rounded-md cursor-pointer hover:bg-amber-50/70 transition-colors">
            <div>
              <p className="text-xs font-extrabold text-stone-900">Subscription Payment Receipts</p>
              <p className="text-[11px] text-stone-500 font-medium">Notify when membership payment is successfully processed</p>
            </div>
            <input
              type="checkbox"
              checked={notifyPayments}
              onChange={(e) => setNotifyPayments(e.target.checked)}
              className="w-4 h-4 accent-[#570013] rounded cursor-pointer"
            />
          </label>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-[#570013] text-amber-100 font-extrabold text-xs rounded-md shadow-sm hover:bg-[#42000e] transition-all active:scale-95"
        >
          Save Preferences
        </button>
      </form>
    </AdminLayout>
  )
}
