import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveProfile } from '../../../context/ActiveProfileContext'
import { deleteProfile } from '../../../services/profileService'
import { resolveAssetUrl } from '../../../services/api'

function relationLabel(profile) {
  const relation = profile?.profileFor
  if (!relation || relation === 'Self' || relation === 'Myself') return 'Myself'
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

/**
 * Lists every candidate profile on the account, with switch, add and delete.
 *
 * The account holder here is typically a parent running biodata for more than
 * one child, so each row leads with who the profile is for.
 */
export default function ManageProfilesScreen({ onBack }) {
  const navigate = useNavigate()
  const { profiles, activeProfileId, switchProfile, refreshProfiles, isLoading } = useActiveProfile()
  const [busyId, setBusyId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSwitch = async (profileId) => {
    if (profileId === activeProfileId) return
    setBusyId(profileId)
    setErrorMsg('')
    try {
      await switchProfile(profileId)
      navigate('/home')
    } catch (err) {
      setErrorMsg(err?.message || 'Could not switch profile')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (profileId) => {
    setBusyId(profileId)
    setErrorMsg('')
    try {
      await deleteProfile(profileId)
      const remaining = await refreshProfiles()
      setConfirmId(null)

      // With no biodata left there is nothing to manage; go straight to setup.
      if (remaining.length === 0) {
        navigate('/profile-completion-dashboard')
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Could not delete this profile')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="bg-[#fbf9f5] min-h-screen text-slate-800 font-body flex flex-col p-5 lg:max-w-2xl lg:mx-auto lg:w-full select-none">
      {/* Header */}
      <div className="flex items-center gap-2 w-full pt-1 pb-4">
        <button
          onClick={onBack || (() => navigate('/profile'))}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100/80 active:scale-95 transition text-slate-800"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined text-2xl block">arrow_back</span>
        </button>
        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">My Profiles</h1>
      </div>

      <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">
        Manage every biodata on this account. Matches, interests and chats are kept
        separate for each profile.
      </p>

      {errorMsg && (
        <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-rose-500 shrink-0">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading && profiles.length === 0 ? (
        <div className="flex justify-center py-10">
          <span className="w-7 h-7 border-2 border-[#570013] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ul className="space-y-3 flex-1">
          {profiles.map((profile) => {
            const id = profile.id || profile._id
            const isActive = id === activeProfileId
            const src = profile.profilePicture ? resolveAssetUrl(profile.profilePicture) : ''

            return (
              <li
                key={id}
                className={`bg-white rounded-lg border p-3.5 shadow-sm transition ${
                  isActive ? 'border-[#570013]/50 ring-1 ring-[#570013]/20' : 'border-amber-200/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  {src ? (
                    <img
                      src={src}
                      alt={profile.fullName}
                      className="w-12 h-12 rounded-full object-cover border border-amber-300/70 shrink-0"
                    />
                  ) : (
                    <span className="w-12 h-12 rounded-full bg-[#570013] text-white text-sm font-bold flex items-center justify-center border border-amber-300/70 shrink-0">
                      {initialsOf(profile.fullName)}
                    </span>
                  )}

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {profile.fullName}
                      </span>
                      {isActive && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full shrink-0">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 truncate">
                      {relationLabel(profile)} · {profile.profileId}
                    </span>
                    <span className="text-[11px] font-semibold text-[#775a19] mt-0.5">
                      {profile.completionPercentage || 0}% complete
                    </span>
                  </div>
                </div>

                {confirmId === id ? (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-slate-700 mb-2">
                      Delete {profile.fullName}? This removes the biodata and its matches
                      permanently.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(id)}
                        disabled={busyId === id}
                        className="flex-1 py-2 rounded-md bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 text-white text-xs font-bold transition active:scale-98"
                      >
                        {busyId === id ? 'Deleting…' : 'Yes, delete'}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="flex-1 py-2 rounded-md border border-gray-300 text-slate-700 text-xs font-bold hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                    {!isActive && (
                      <button
                        onClick={() => handleSwitch(id)}
                        disabled={Boolean(busyId)}
                        className="flex-1 py-2 rounded-md bg-[#570013] hover:bg-[#72001a] disabled:bg-gray-300 text-white text-xs font-bold transition active:scale-98 flex items-center justify-center gap-1.5"
                      >
                        {busyId === id ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[15px]">swap_horiz</span>
                            <span>Switch to this</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmId(id)}
                      disabled={Boolean(busyId)}
                      className={`${isActive ? 'flex-1' : ''} py-2 px-3 rounded-md border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition disabled:opacity-50`}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <button
        onClick={() => navigate('/profiles/new')}
        className="w-full mt-5 py-3.5 px-6 rounded-md border-2 border-dashed border-[#570013]/40 text-[#570013] font-bold text-sm hover:bg-amber-50/60 flex items-center justify-center gap-2 active:scale-98 transition"
      >
        <span className="material-symbols-outlined text-lg">add_circle</span>
        <span>Add another profile</span>
      </button>
    </div>
  )
}
