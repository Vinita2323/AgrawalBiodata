import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function BlockedUsersScreen({ onBack }) {
  const navigate = useNavigate()
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
          <span className="font-display font-bold text-[15px] text-[#570013]">
            Blocked Users
          </span>
          <div className="w-8"></div>
        </div>
      </header>
      <div className="p-5">
        <p className="text-sm text-slate-500">List of blocked users will appear here.</p>
      </div>
    </div>
  )
}
