import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function TermsOfServiceScreen({ onBack }) {
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
            Terms of Service
          </span>
          <div className="w-8"></div>
        </div>
      </header>
      <div className="p-5 max-w-4xl mx-auto w-full prose prose-sm prose-amber">
        <p className="text-sm text-slate-600 mb-4">Last updated: August 2026</p>
        <h2 className="text-lg font-bold text-slate-800 mb-2 mt-6">1. Acceptance of Terms</h2>
        <p className="text-sm text-slate-600 mb-4">By accessing and using Agarwal Samaj Matrimony, you agree to be bound by these Terms of Service.</p>
        
        <h2 className="text-lg font-bold text-slate-800 mb-2 mt-6">2. Eligibility</h2>
        <p className="text-sm text-slate-600 mb-4">You must be of legal marriageable age in India (18 years for women, 21 years for men) to use this platform.</p>

        <h2 className="text-lg font-bold text-slate-800 mb-2 mt-6">3. User Content</h2>
        <p className="text-sm text-slate-600 mb-4">You are responsible for the accuracy of the information provided in your biodata. Any false information may lead to account termination.</p>
      </div>
    </div>
  )
}
