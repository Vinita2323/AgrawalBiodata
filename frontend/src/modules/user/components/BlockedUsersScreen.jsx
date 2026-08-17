import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBlockedUsers, unblockUser } from '../../../services/socialService'
import { isAuthenticated } from '../../../services/authService'
import { resolveAssetUrl } from '../../../services/api'

export default function BlockedUsersScreen({ onBack }) {
  const navigate = useNavigate()

  const [blocks, setBlocks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [unblockingId, setUnblockingId] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    if (!isAuthenticated()) {
      setIsLoading(false)
      setErrorMsg('Please log in to see your blocked list.')
      return
    }

    setIsLoading(true)
    setErrorMsg('')
    try {
      const res = await getBlockedUsers({ limit: 100 })
      setBlocks(res?.blocks || res?.items || [])
    } catch (err) {
      setErrorMsg(err?.message || 'Could not load your blocked list.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnblock = async (block) => {
    const targetId = block.blockedProfileId?._id || block.blockedProfileId
    if (!targetId) return

    setUnblockingId(block.id || block._id)
    setErrorMsg('')
    try {
      await unblockUser(targetId)
      setBlocks((prev) => prev.filter((b) => (b.id || b._id) !== (block.id || block._id)))
      setToastMsg('Profile unblocked.')
      setTimeout(() => setToastMsg(''), 2500)
    } catch (err) {
      setErrorMsg(err?.message || 'Could not unblock this profile.')
    } finally {
      setUnblockingId(null)
    }
  }

  const handleGoBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

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
          <span className="font-display font-bold text-[15px] text-[#570013]">Blocked Users</span>
          <div className="w-8"></div>
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto w-full space-y-4">
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

        {isLoading ? (
          <div className="text-center py-12 text-xs text-slate-400 font-semibold">
            Loading blocked profiles...
          </div>
        ) : blocks.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-xl border border-amber-200/80">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">block</span>
            <p className="text-sm font-semibold text-slate-700">No blocked profiles</p>
            <p className="text-xs text-slate-400 mt-1 px-6">
              Profiles you block stop appearing in your matches and cannot contact you.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-amber-200/80 shadow-2xs divide-y divide-gray-100 overflow-hidden">
            {blocks.map((block) => {
              const profile = block.blockedProfileId || {}
              const rowId = block.id || block._id
              return (
                <div key={rowId} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                      {profile.profilePicture ? (
                        <img
                          src={resolveAssetUrl(profile.profilePicture)}
                          alt={profile.fullName || 'Blocked profile'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-xl text-[#570013]">person</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {profile.fullName || 'Candidate'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium truncate">
                        {block.reason || 'Blocked'}
                        {block.createdAt && ` • ${new Date(block.createdAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnblock(block)}
                    disabled={unblockingId === rowId}
                    className="px-3.5 py-2 bg-white border border-[#570013] text-[#570013] font-bold rounded-lg text-xs shrink-0 hover:bg-amber-50 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {unblockingId === rowId ? 'Working...' : 'Unblock'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
