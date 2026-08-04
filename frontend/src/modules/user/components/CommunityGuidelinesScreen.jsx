import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function CommunityGuidelinesScreen({ onBack }) {
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
            Community Guidelines
          </span>
          <div className="w-8"></div>
        </div>
      </header>
      <div className="p-5 max-w-4xl mx-auto w-full prose prose-sm prose-amber">
        <p className="text-sm text-slate-600 mb-4">Last updated: August 2026</p>
        <h2 className="text-lg font-bold text-slate-800 mb-2 mt-6">1. Respectful Interactions</h2>
        <p className="text-sm text-slate-600 mb-4">Members are expected to communicate respectfully. Harassment, abusive language, or inappropriate behavior will result in a permanent ban.</p>
        
        <h2 className="text-lg font-bold text-slate-800 mb-2 mt-6">2. Authenticity</h2>
        <p className="text-sm text-slate-600 mb-4">Profiles must represent real individuals seeking matrimony. Fake profiles, spam, or promotional accounts are strictly prohibited.</p>

        <h2 className="text-lg font-bold text-slate-800 mb-2 mt-6">3. Reporting</h2>
        <p className="text-sm text-slate-600 mb-4">If you encounter suspicious behavior, please report the user immediately using the in-app reporting tools or by contacting support.</p>
      </div>
    </div>
  )
}
