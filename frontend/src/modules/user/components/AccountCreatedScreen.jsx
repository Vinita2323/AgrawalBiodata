import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function AccountCreatedScreen({ onStartSetup }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="bg-[#fbf9f5] min-h-screen text-slate-800 font-body flex flex-col justify-between p-5 relative select-none">
      {/* Top Traditional Accent Line */}
      <div className="fixed top-0 left-0 w-full z-50 indian-border-top" />

      {/* Main Success Container */}
      <main className="w-full max-w-sm mx-auto my-auto flex flex-col items-center text-center py-6">
        {/* Animated Logo Circle Container */}
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-full bg-white text-[#570013] flex items-center justify-center shadow-xl border-4 border-amber-200/80 animate-scale-fade overflow-hidden p-2">
            <img
              src="/Logo (2).png"
              alt="Agarwal Biodata Logo"
              className="w-full h-full object-contain scale-95"
            />
          </div>
        </div>

        {/* Success Message */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-[#775a19] text-xs font-bold mb-3 border border-amber-300/60">
          <span className="material-symbols-outlined text-base">auto_awesome</span>
          <span>Account Verified</span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#570013] tracking-tight mb-2">
          Welcome to Matrimony Hub
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-xs mb-8">
          Your account has been created successfully. Let's set up your profile to help you find your perfect life partner.
        </p>

        {/* Feature Highlights */}
        <div className="w-full bg-white rounded-lg p-4 border border-amber-200/70 shadow-sm space-y-3 mb-8 text-left">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
              ✓
            </span>
            <span className="text-xs font-semibold text-slate-800">
              100% Free registration & verified profiles
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
              ✓
            </span>
            <span className="text-xs font-semibold text-slate-800">
              Privacy protected & multi-level permission control
            </span>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onStartSetup || (() => navigate('/profile-completion-dashboard', { state: location.state }))}
          className="w-full py-4 px-6 rounded-md bg-[#570013] hover:bg-[#72001a] text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span>Start Profile Setup</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-2 text-[11px] text-slate-400 font-medium">
        Need help? Contact our support team anytime.
      </footer>
    </div>
  )
}
