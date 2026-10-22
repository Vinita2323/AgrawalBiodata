import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useActiveProfile } from '../../../context/ActiveProfileContext'
import { logout } from '../../../services/authService'
import { ProfileAvatar } from './ProfileSwitcher'

const MENU_ITEMS = [
  { label: 'My Profile', icon: 'person', to: '/profile' },
  { label: 'Notifications', icon: 'notifications', to: '/notifications' },
  { label: 'Partner Preferences', icon: 'tune', to: '/preferences' },
  { label: 'Settings', icon: 'settings', to: '/settings' },
  { label: 'Help & Support', icon: 'help', to: '/help-support' },
]

export default function HeaderBar({ isExport = false }) {
  const navigate = useNavigate()
  const { profiles, activeProfile, activeProfileId, switchProfile } = useActiveProfile()
  const [isOpen, setIsOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (!isOpen) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  // The menu is about the signed-in account's profiles, so it has no place on
  // the pre-login screens or the print layout.
  const showMenu = !isExport && Boolean(activeProfile)

  const go = (to) => {
    setIsOpen(false)
    navigate(to)
  }

  const handleSwitch = async (profileId) => {
    if (profileId === activeProfileId) return
    setBusyId(profileId)
    try {
      await switchProfile(profileId)
      setIsOpen(false)
      // Land on the dashboard so the newly active candidate's matches, chats
      // and interests are all reloaded from a clean screen.
      navigate('/home')
    } catch {
      // The provider surfaces the failure and restores the previous profile.
    } finally {
      setBusyId(null)
    }
  }

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
    localStorage.removeItem('userProfile')
    navigate('/welcome', { replace: true })
  }

  return (
    <header className={`w-full bg-transparent text-[#45000f] border-b-2 border-[#c69a3d] ${isExport ? 'px-6 py-5 gap-5' : 'px-3.5 py-2.5 sm:px-5 gap-3'} flex items-center justify-between relative z-30`}>
      {/* Left: hamburger for profile things */}
      <div className="w-10 shrink-0">
        {showMenu && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-10 h-10 -ml-1.5 rounded-full flex items-center justify-center text-[#570013] hover:bg-amber-100/60 active:scale-95 transition cursor-pointer"
            aria-label="Open profile menu"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
          >
            <span className="material-symbols-outlined text-[26px]">menu</span>
          </button>
        )}
      </div>

      {/* Right: Logo */}
      <div className={`relative shrink-0 ${isExport ? 'w-20 h-20' : 'w-11 h-11 sm:w-12 sm:h-12'} rounded-full p-[2px] bg-gradient-to-tr from-[#ffe6a7] via-[#c69a3d] to-[#ffe6a7] shadow-[0_2px_8px_rgba(0,0,0,0.25)] flex items-center justify-center`}>
        <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center">
          <img
            src="/Logo (2).png"
            alt="Agarwal Biodata Logo"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {showMenu && isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-center">
          <div className="relative w-full max-w-[480px] lg:max-w-none h-full">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />

            <aside
              role="dialog"
              aria-label="Profile menu"
              className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-[#fbf9f5] shadow-2xl flex flex-col border-r-2 border-[#c69a3d]"
            >
              {/* Active profile */}
              <div className="px-4 pt-5 pb-4 border-b border-[#e8d5b5] flex items-center gap-3">
                <ProfileAvatar profile={activeProfile} size="w-12 h-12" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-[#570013] truncate">{activeProfile.fullName}</p>
                  {activeProfile.profileId && (
                    <p className="text-[11px] font-medium text-slate-500 truncate">{activeProfile.profileId}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-amber-100/60 transition cursor-pointer shrink-0"
                  aria-label="Close menu"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Switch profile */}
                {profiles.length > 1 && (
                  <div className="py-2 border-b border-[#e8d5b5]">
                    <p className="px-4 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      My Profiles
                    </p>
                    <ul>
                      {profiles.map((profile) => {
                        const id = profile.id || profile._id
                        const isActive = id === activeProfileId
                        return (
                          <li key={id}>
                            <button
                              type="button"
                              disabled={Boolean(busyId)}
                              onClick={() => handleSwitch(id)}
                              className={`w-full flex items-center gap-2.5 px-4 py-2 text-left transition disabled:opacity-60 cursor-pointer ${
                                isActive ? 'bg-amber-50/80' : 'hover:bg-amber-50/50'
                              }`}
                            >
                              <ProfileAvatar profile={profile} size="w-8 h-8" />
                              <span className="text-xs font-bold text-slate-900 truncate flex-1">{profile.fullName}</span>
                              {busyId === id ? (
                                <span className="w-4 h-4 border-2 border-[#570013] border-t-transparent rounded-full animate-spin shrink-0" />
                              ) : (
                                isActive && (
                                  <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">check_circle</span>
                                )
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                <div className="py-1">
                  {MENU_ITEMS.map((item) => (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => go(item.to)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-50/60 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px] text-[#775a19]">{item.icon}</span>
                      <span className="text-[13px] font-semibold text-slate-800">{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="py-1 border-t border-[#e8d5b5]">
                  <button
                    type="button"
                    onClick={() => go('/profiles/new')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-50/60 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px] text-[#570013]">add_circle</span>
                    <span className="text-[13px] font-bold text-[#570013]">Add new profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => go('/profiles')}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-50/60 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px] text-slate-500">manage_accounts</span>
                    <span className="text-[13px] font-semibold text-slate-700">Manage profiles</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-[#e8d5b5]">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-rose-50/60 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px] text-red-600">logout</span>
                  <span className="text-[13px] font-semibold text-red-600">Logout</span>
                </button>
              </div>
            </aside>
          </div>
        </div>,
        document.body
      )}
    </header>
  )
}
