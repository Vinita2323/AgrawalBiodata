import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function PrivacyPolicyScreen({ onBack }) {
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
            Privacy Policy
          </span>
          <div className="w-8"></div>
        </div>
      </header>
      <div className="p-5 max-w-4xl mx-auto w-full prose prose-sm prose-amber">
        <p className="text-sm text-slate-600 mb-4">Last updated: August 2026</p>
        <h2 className="text-lg font-bold text-slate-800 mb-2 mt-6">1. Data Collection</h2>
        <p className="text-sm text-slate-600 mb-4">We collect personal information required for matchmaking, including contact details, family background, and astrological data.</p>
        
        <h2 className="text-lg font-bold text-slate-800 mb-2 mt-6">2. Data Usage</h2>
        <p className="text-sm text-slate-600 mb-4">Your data is strictly used to facilitate relevant matchmaking within the Agarwal Samaj community. We do not sell your data to third parties.</p>

        <h2 className="text-lg font-bold text-slate-800 mb-2 mt-6">3. Security</h2>
        <p className="text-sm text-slate-600 mb-4">We implement industry-standard security measures to protect your biodata. Your contact information is hidden from non-premium or unverified users.</p>
      </div>
    </div>
  )
}
