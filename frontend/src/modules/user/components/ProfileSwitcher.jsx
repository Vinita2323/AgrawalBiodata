import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveProfile } from '../../../context/ActiveProfileContext'
import { resolveAssetUrl } from '../../../services/api'

/**
 * How a profile relates to the account holder, e.g. "Son", "Daughter".
 * 'Self' is the account holder's own biodata and needs no label.
 */
function relationLabel(profile) {
  const relation = profile?.profileFor
  if (!relation || relation === 'Self' || relation === 'Myself') return ''
  return relation
}

function initialsOf(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

/** Round avatar falling back to initials when a profile has no photo. */
function ProfileAvatar({ profile, size = 'w-9 h-9' }) {
  const src = profile?.profilePicture ? resolveAssetUrl(profile.profilePicture) : ''

  if (src) {
    return (
      <img
        src={src}
        alt={profile?.fullName || 'Profile'}
        className={`${size} rounded-full object-cover border border-amber-300/70 shrink-0`}
      />
    )
  }

  return (
    <span
      className={`${size} rounded-full bg-[#570013] text-white text-[11px] font-bold flex items-center justify-center border border-amber-300/70 shrink-0`}
    >
      {initialsOf(profile?.fullName)}
    </span>
  )
}

/**
 * Switches which candidate the account is operating as.
 *
 * Renders nothing until the account actually has a profile, since the header
 * is also shown on the pre-login screens.
 */
export default function ProfileSwitcher() {
  const navigate = useNavigate()
  const { profiles, activeProfile, activeProfileId, switchProfile } = useActiveProfile()
  const [isOpen, setIsOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const containerRef = useRef(null)

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!isOpen) return undefined

    const onPointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  if (!activeProfile) return null

  const handleSelect = async (profileId) => {
    if (profileId === activeProfileId) {
      setIsOpen(false)
      return
    }

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

  const activeRelation = relationLabel(activeProfile)

  return (
    <div className="relative shrink-0 ml-auto" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-full border border-amber-300/70 bg-white hover:bg-amber-50/70 active:scale-95 transition shadow-sm max-w-[132px]"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Active profile: ${activeProfile.fullName}. Switch profile`}
      >
        <ProfileAvatar profile={activeProfile} size="w-7 h-7" />
        <span className="flex flex-col items-start min-w-0 leading-tight">
          <span className="text-[11px] font-bold text-slate-900 truncate max-w-[64px]">
            {activeProfile.fullName}
          </span>
          {activeRelation && (
            <span className="text-[9px] font-semibold text-[#775a19] truncate max-w-[64px]">
              {activeRelation}
            </span>
          )}
        </span>
        <span className="material-symbols-outlined text-[16px] text-slate-500 shrink-0">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] w-60 bg-white rounded-lg border border-amber-200/80 shadow-xl overflow-hidden z-50"
        >
          <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            My Profiles
          </p>

          <ul className="max-h-64 overflow-y-auto">
            {profiles.map((profile) => {
              const id = profile.id || profile._id
              const isActive = id === activeProfileId
              const relation = relationLabel(profile)

              return (
                <li key={id}>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={Boolean(busyId)}
                    onClick={() => handleSelect(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition disabled:opacity-60 ${
                      isActive ? 'bg-amber-50/80' : 'hover:bg-gray-50'
                    }`}
                  >
                    <ProfileAvatar profile={profile} size="w-8 h-8" />
                    <span className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {profile.fullName}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 truncate">
                        {relation ? `${relation} · ` : ''}
                        {profile.profileId}
                      </span>
                    </span>
                    {busyId === id ? (
                      <span className="w-4 h-4 border-2 border-[#570013] border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      isActive && (
                        <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">
                          check_circle
                        </span>
                      )
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="border-t border-gray-100">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false)
                navigate('/profiles/new')
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition"
            >
              <span className="material-symbols-outlined text-[18px] text-[#570013]">add_circle</span>
              <span className="text-xs font-bold text-[#570013]">Add new profile</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false)
                navigate('/profiles')
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition border-t border-gray-100"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-500">settings</span>
              <span className="text-xs font-semibold text-slate-700">Manage profiles</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
