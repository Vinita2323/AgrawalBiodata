import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../../services/authService'
import { deleteAccount } from '../../../services/accountService'
import safeStorage from '../../../utils/safeStorage'

export default function SettingsScreen({ onBack, onLogout }) {
  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') return
    setIsDeletingAccount(true)
    setDeleteError('')
    try {
      await deleteAccount()
      await logout()
      safeStorage.removeItem('userProfile')
      setShowDeleteModal(false)
      navigate('/welcome', { replace: true })
    } catch (err) {
      setDeleteError(err?.message || 'Failed to delete account. Please try again.')
      setIsDeletingAccount(false)
    }
  }

  const mainSettings = [
    { id: 'account', label: 'Account Settings', icon: 'person' },
    { id: 'preferences', label: 'Partner Preferences', icon: 'tune' },
    { id: 'notification', label: 'Notification Settings', icon: 'notifications' },
    { id: 'verification', label: 'Profile Verification', icon: 'verified_user' },
    { id: 'blocked', label: 'Blocked Users', icon: 'block' },
  ]

  const secondarySettings = [
    { id: 'help-support', label: 'Help & Support', icon: 'help' },
    { id: 'about', label: 'About Matrimony Hub', icon: 'info' },
  ]

  return (
    <div className="bg-[#fcfaf7] text-slate-800 min-h-screen flex flex-col justify-between p-4 lg:max-w-2xl lg:mx-auto lg:w-full selection:bg-[#775a19] select-none">
      <div>
        {/* Header Bar */}
        <div className="flex items-center gap-1 mb-4 pt-1">
          <button
            onClick={onBack}
            className="flex items-center justify-center p-1.5 -ml-1.5 rounded-full hover:bg-amber-100 text-[#570013] transition active:scale-95 cursor-pointer"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="font-display font-extrabold text-[22px] text-[#570013]">Settings</h1>
        </div>

        {/* Group 1 Settings Card */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden mb-4">
          {mainSettings.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => navigate(`/${item.id}`)}
              className={`w-full px-4 py-3.5 flex items-center justify-between hover:bg-amber-50/30 transition text-left active:scale-[0.99] ${
                idx !== mainSettings.length - 1 ? 'border-b border-gray-100/80' : ''
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className="material-symbols-outlined text-xl text-slate-500">{item.icon}</span>
                <span className="text-xs font-semibold text-slate-800">{item.label}</span>
              </div>
              <span className="material-symbols-outlined text-lg text-slate-400">chevron_right</span>
            </button>
          ))}
        </div>

        {/* Group 2 Settings Card */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden mb-6">
          {secondarySettings.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => navigate(`/${item.id}`)}
              className={`w-full px-4 py-3.5 flex items-center justify-between hover:bg-amber-50/30 transition text-left active:scale-[0.99] ${
                idx !== secondarySettings.length - 1 ? 'border-b border-gray-100/80' : ''
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className="material-symbols-outlined text-xl text-slate-500">{item.icon}</span>
                <span className="text-xs font-semibold text-slate-800">{item.label}</span>
              </div>
              <span className="material-symbols-outlined text-lg text-slate-400">chevron_right</span>
            </button>
          ))}
        </div>

        {/* Group 3 Logout Card */}
        <div className="bg-white rounded-md border border-red-100 shadow-sm overflow-hidden mb-2.5">
          <button
            onClick={async () => {
              try {
                await logout()
                safeStorage.removeItem('userProfile')
              } catch (e) {
                console.warn('Logout note:', e)
              }
              if (onLogout) onLogout()
              else navigate('/login')
            }}
            className="w-full px-4 py-3.5 flex items-center gap-3.5 hover:bg-red-50/50 transition text-left active:scale-[0.99] text-red-600 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl text-red-600">logout</span>
            <span className="text-xs font-extrabold text-red-600">Logout</span>
          </button>
        </div>

        {/* Delete Account Card */}
        <div className="bg-red-50/50 rounded-md border border-red-200/80 shadow-sm overflow-hidden">
          <button
            onClick={() => {
              setShowDeleteModal(true)
              setDeleteConfirmText('')
              setDeleteError('')
            }}
            className="w-full px-4 py-3 flex items-center gap-3.5 hover:bg-red-100/60 transition text-left active:scale-[0.99] text-red-700 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl text-red-600">delete_forever</span>
            <span className="text-xs font-bold text-red-700">Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-red-100 text-left relative">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Delete Account Permanently?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              This action <span className="font-bold text-red-600">cannot be undone</span>. All your candidate biodata, photos, saved matches, and conversations will be permanently erased.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3">
              <p className="text-[11px] font-semibold text-red-800 mb-1.5">
                Type <span className="font-extrabold underline tracking-wider">DELETE</span> below to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value)
                  setDeleteError('')
                }}
                placeholder="DELETE"
                className="w-full px-3 py-2 bg-white border border-red-300 rounded-md text-xs font-bold text-red-700 tracking-wider focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-gray-300 placeholder:font-normal"
                autoFocus
              />
            </div>

            {deleteError && (
              <p className="text-[11px] text-red-600 font-semibold mb-3">
                {deleteError}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                  setDeleteError('')
                }}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={isDeletingAccount || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isDeletingAccount ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Permanently Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
