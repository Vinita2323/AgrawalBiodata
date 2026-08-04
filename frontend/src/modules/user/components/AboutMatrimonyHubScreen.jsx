import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function AboutMatrimonyHubScreen({ onBack }) {
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
            About Matrimony Hub
          </span>
          <div className="w-8"></div>
        </div>
      </header>
      <div className="p-4 max-w-4xl mx-auto w-full space-y-6">
        
        {/* App Info & Logo */}
        <div className="flex flex-col items-center justify-center text-center mt-4 mb-6">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-amber-200/60 mb-3 overflow-hidden">
            <img src="/Logo%20(2).png" alt="Logo" className="w-full h-full object-contain p-2" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100/f8f9fa/570013?text=Logo" }} />
          </div>
          <h2 className="font-display font-extrabold text-lg text-[#570013]">Agarwal Samaj Matrimony</h2>
          <p className="text-[11px] text-gray-500 font-semibold mt-1">Version 1.0.0 (Build 42)</p>
        </div>

        {/* Mission Statement */}
        <section className="bg-white rounded-xl border border-amber-200/80 shadow-2xs p-5 text-center">
          <span className="material-symbols-outlined text-3xl text-amber-500 mb-2">favorite</span>
          <h3 className="text-sm font-bold text-slate-800 mb-2">Our Mission</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            To provide a trusted, secure, and modern platform for the Agarwal community to find their perfect life partners. We are dedicated to upholding our cultural values while embracing the convenience of technology.
          </p>
        </section>

        {/* Legal & Policies */}
        <section>
          <h3 className="text-xs font-bold text-[#570013] uppercase tracking-wider mb-3 ml-1">Legal & Policies</h3>
          <div className="bg-white rounded-xl border border-amber-200/80 shadow-2xs overflow-hidden">
            <button onClick={() => navigate('/terms')} className="w-full p-4 flex items-center justify-between border-b border-gray-100 hover:bg-amber-50/30 transition text-left">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">description</span>
                <span className="text-xs font-semibold text-slate-800">Terms of Service</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 text-sm">open_in_new</span>
            </button>
            <button onClick={() => navigate('/privacy')} className="w-full p-4 flex items-center justify-between border-b border-gray-100 hover:bg-amber-50/30 transition text-left">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">policy</span>
                <span className="text-xs font-semibold text-slate-800">Privacy Policy</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 text-sm">open_in_new</span>
            </button>
            <button onClick={() => navigate('/guidelines')} className="w-full p-4 flex items-center justify-between hover:bg-amber-50/30 transition text-left">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">gavel</span>
                <span className="text-xs font-semibold text-slate-800">Community Guidelines</span>
              </div>
              <span className="material-symbols-outlined text-gray-400 text-sm">open_in_new</span>
            </button>
          </div>
        </section>



        <div className="text-center pt-4 pb-2">
          <p className="text-[10px] text-gray-400">© 2026 Agarwal Samaj Matrimony.</p>
          <p className="text-[10px] text-gray-400">All rights reserved.</p>
        </div>

      </div>
    </div>
  )
}
