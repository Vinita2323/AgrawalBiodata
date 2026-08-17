import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  requestMobileChangeOtp,
  changeMobile,
  changeEmail,
  deactivateAccount,
  reactivateAccount,
  deleteAccount,
} from '../../../services/accountService'
import { getCurrentUser, isAuthenticated, logout } from '../../../services/authService'

export default function AccountSettingsScreen({ onBack }) {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [toastMsg, setToastMsg] = useState('')

  // Mobile change is a two-step flow: request a code to the new number, then
  // confirm it. Possession of the new number is what authorises the change.
  const [mobileStep, setMobileStep] = useState(null) // null | 'enter' | 'verify'
  const [newMobile, setNewMobile] = useState('')
  const [mobileOtp, setMobileOtp] = useState('')
  const [devOtpHint, setDevOtpHint] = useState('')

  const [emailStep, setEmailStep] = useState(false)
  const [newEmail, setNewEmail] = useState('')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!isAuthenticated()) {
        setIsLoading(false)
        setErrorMsg('Please log in to manage your account.')
        return
      }

      try {
        const res = await getCurrentUser()
        if (!cancelled) setUser(res?.user || null)
      } catch (err) {
        if (!cancelled) setErrorMsg(err?.message || 'Could not load your account details.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const showToast = (message) => {
    setToastMsg(message)
    setTimeout(() => setToastMsg(''), 3500)
  }

  const isDeactivated = user?.accountStatus === 'Deactivated'

  const handleRequestMobileOtp = async () => {
    setErrorMsg('')
    setIsSaving(true)
    try {
      const res = await requestMobileChangeOtp(newMobile)
      setDevOtpHint(res?.devOtp || '')
      setMobileStep('verify')
      showToast('Verification code sent to the new number.')
    } catch (err) {
      setErrorMsg(err?.message || 'Could not send the verification code.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmMobile = async () => {
    setErrorMsg('')
    setIsSaving(true)
    try {
      const res = await changeMobile(newMobile, mobileOtp)
      setUser((prev) => ({ ...prev, mobile: res?.mobile || newMobile }))
      setMobileStep(null)
      setNewMobile('')
      setMobileOtp('')
      setDevOtpHint('')
      showToast('Mobile number updated.')
    } catch (err) {
      setErrorMsg(err?.message || 'Could not update your mobile number.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangeEmail = async () => {
    setErrorMsg('')
    setIsSaving(true)
    try {
      const res = await changeEmail(newEmail)
      setUser((prev) => ({ ...prev, email: res?.email || newEmail }))
      setEmailStep(false)
      setNewEmail('')
      showToast('Email address updated.')
    } catch (err) {
      setErrorMsg(err?.message || 'Could not update your email address.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleDeactivate = async () => {
    setErrorMsg('')
    setIsSaving(true)
    try {
      if (isDeactivated) {
        await reactivateAccount()
        setUser((prev) => ({ ...prev, accountStatus: 'Active' }))
        showToast('Your profile is visible again.')
      } else {
        await deactivateAccount()
        setUser((prev) => ({ ...prev, accountStatus: 'Deactivated' }))
        showToast('Your profile is now hidden from searches and matches.')
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Could not change your profile visibility.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setErrorMsg('')
    setIsSaving(true)
    try {
      await deleteAccount()
      await logout()
      navigate('/welcome')
    } catch (err) {
      setErrorMsg(err?.message || 'Could not delete your account.')
      setIsSaving(false)
    }
  }

  const handleGoBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

  const inputClass =
    'w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40'

  return (
    <div className="bg-[#fbf9f5] min-h-screen text-[#1b1c1a] font-body flex flex-col pb-12">
      <header className="sticky top-0 z-40 bg-[#fbf9f5]/95 backdrop-blur-md border-b border-amber-200/60 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1 text-xs font-bold text-[#570013] hover:opacity-80 transition p-1 -ml-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <span className="font-display font-bold text-[15px] text-[#570013]">Account Settings</span>
          <div className="w-8"></div>
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto w-full space-y-6">
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-red-500 font-bold shrink-0">
              ✕
            </button>
          </div>
        )}

        {toastMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{toastMsg}</span>
          </div>
        )}

        {isLoading && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-bold">
            Loading your account...
          </div>
        )}

        {/* Contact Information */}
        <section>
          <h2 className="text-xs font-bold text-[#570013] uppercase tracking-wider mb-3 ml-1">
            Contact Information
          </h2>
          <div className="bg-white rounded-xl border border-amber-200/80 shadow-2xs overflow-hidden">
            {/* Phone */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-500 font-semibold mb-0.5">Phone Number</div>
                  <div className="text-sm font-bold text-slate-800">
                    {user?.mobile ? `+91 ${user.mobile}` : '—'}
                  </div>
                </div>
                <button
                  onClick={() => setMobileStep(mobileStep ? null : 'enter')}
                  disabled={isSaving}
                  className="text-xs font-bold text-[#570013] hover:underline active:scale-95 transition disabled:opacity-50"
                >
                  {mobileStep ? 'Cancel' : 'Change'}
                </button>
              </div>

              {mobileStep === 'enter' && (
                <div className="mt-3 space-y-2">
                  <input
                    type="tel"
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    placeholder="New 10-digit mobile number"
                    className={inputClass}
                  />
                  <button
                    onClick={handleRequestMobileOtp}
                    disabled={isSaving || newMobile.replace(/\D/g, '').length !== 10}
                    className="w-full py-2.5 bg-[#570013] text-white font-bold rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition"
                  >
                    {isSaving ? 'Sending...' : 'Send Verification Code'}
                  </button>
                </div>
              )}

              {mobileStep === 'verify' && (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-slate-500 font-medium">
                    Enter the 6-digit code sent to {newMobile}
                    {devOtpHint && <span className="text-amber-700 font-bold"> (dev: {devOtpHint})</span>}
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={mobileOtp}
                    onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code"
                    className={`${inputClass} tracking-[0.4em] text-center`}
                  />
                  <button
                    onClick={handleConfirmMobile}
                    disabled={isSaving || mobileOtp.length !== 6}
                    className="w-full py-2.5 bg-[#570013] text-white font-bold rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition"
                  >
                    {isSaving ? 'Verifying...' : 'Confirm New Number'}
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-500 font-semibold mb-0.5">Email Address</div>
                  <div className="text-sm font-bold text-slate-800">{user?.email || 'Not set'}</div>
                </div>
                <button
                  onClick={() => {
                    setEmailStep(!emailStep)
                    setNewEmail(user?.email || '')
                  }}
                  disabled={isSaving}
                  className="text-xs font-bold text-[#570013] hover:underline active:scale-95 transition disabled:opacity-50"
                >
                  {emailStep ? 'Cancel' : 'Change'}
                </button>
              </div>

              {emailStep && (
                <div className="mt-3 space-y-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="your.name@example.com"
                    className={inputClass}
                  />
                  <button
                    onClick={handleChangeEmail}
                    disabled={isSaving || !newEmail.includes('@')}
                    className="w-full py-2.5 bg-[#570013] text-white font-bold rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition"
                  >
                    {isSaving ? 'Saving...' : 'Save Email Address'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Profile Status */}
        <section>
          <h2 className="text-xs font-bold text-[#570013] uppercase tracking-wider mb-3 ml-1">
            Profile Status
          </h2>
          <div className="bg-white rounded-xl border border-amber-200/80 shadow-2xs p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-800 mb-1">Deactivate Profile</div>
                <div className="text-[11px] text-gray-500 leading-relaxed">
                  Temporarily hide your profile from all searches and matches. You can reactivate it
                  later by logging back in.
                </div>
                {isDeactivated && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md text-[10px] font-bold text-amber-900">
                    <span className="material-symbols-outlined text-[12px]">visibility_off</span>
                    Currently hidden
                  </div>
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isDeactivated}
                  disabled={isSaving || isLoading}
                  onChange={handleToggleDeactivate}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#570013]"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 ml-1">
            Danger Zone
          </h2>
          <div className="bg-white rounded-xl border border-red-200 shadow-2xs p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-red-600 mb-1">Delete Account</div>
                <div className="text-[11px] text-gray-500 leading-relaxed max-w-sm">
                  Permanently delete your account, candidate profiles, conversations and match
                  history. This action cannot be undone.
                </div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition rounded-lg text-xs font-bold shrink-0 active:scale-95 disabled:opacity-50"
              >
                Delete Account
              </button>
            </div>

            {showDeleteConfirm && (
              <div className="mt-4 pt-4 border-t border-red-100 space-y-2">
                <p className="text-[11px] font-bold text-red-700">
                  Type DELETE to confirm. This cannot be undone.
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm font-bold text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }}
                    className="flex-1 py-2 bg-white border border-gray-200 text-slate-700 font-bold rounded-lg text-xs active:scale-95 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isSaving || deleteConfirmText !== 'DELETE'}
                    className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition"
                  >
                    {isSaving ? 'Deleting...' : 'Permanently Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
