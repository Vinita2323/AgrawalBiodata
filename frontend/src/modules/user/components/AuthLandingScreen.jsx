import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function AuthLandingScreen({ onStartCreate, onStartLogin, onGuestBrowse }) {
  const navigate = useNavigate()

  return (
    <div className="bg-[#fdfcf9] text-slate-800 font-body min-h-screen flex flex-col justify-center p-5 relative select-none overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-200/40 via-amber-100/20 to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-gradient-to-tr from-[#570013]/10 to-transparent rounded-full blur-3xl -ml-20 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-t from-amber-50/80 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      {/* Top Traditional Accent Line */}
      <div className="absolute top-0 left-0 w-full z-50 h-[3px] bg-gradient-to-r from-transparent via-[#775a19]/40 to-transparent opacity-80" />

      {/* Header / Brand Logo & Name */}
      <header className="flex flex-col items-center text-center pt-8 pb-4 relative z-10">
        
        {/* Organization Name */}
        <div className="mb-6 flex flex-col items-center text-center px-4">
          <h2 className="text-lg sm:text-xl font-bold text-[#570013] mb-1 font-display leading-tight">
            महाराजा अग्रसेन एवं माँ माधवी बायोडाटा प्रकल्प
          </h2>
          <p className="text-[11px] sm:text-xs text-[#775a19] font-semibold max-w-[300px] leading-snug">
            ( दक्षिणी पश्चिमी राजस्थान अग्रवाल सम्मेलन द्वारा संचालित )
          </p>
        </div>

        {/* Modern Logo Presentation */}
        <div className="relative mb-8">
          {/* Outer glowing rings */}
          <div className="absolute -inset-6 bg-gradient-to-r from-amber-200/40 to-[#570013]/10 rounded-full blur-xl animate-pulse" />
          <div className="absolute -inset-1 bg-gradient-to-br from-amber-300 via-amber-100 to-amber-400 rounded-full animate-slow-rotate" />
          
          {/* Logo container with inner shadow for depth */}
          <div className="relative w-32 h-32 rounded-full p-1 bg-white shadow-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.08)] z-20 pointer-events-none" />
            <img
              src="/Logo (2).png"
              alt="Agarwal Biodata Logo"
              className="w-full h-full object-contain rounded-full relative z-10 scale-95"
            />
          </div>
        </div>

        {/* Modern Typography */}
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#570013] via-[#800020] to-[#570013] mb-3 drop-shadow-sm pb-1">
          Agarwal Biodata
        </h1>
        
        {/* Sleek Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-white border border-amber-200/60 shadow-sm mt-1">
          <span className="material-symbols-outlined text-[14px] text-amber-500">hotel_class</span>
          <p className="text-[10px] text-[#775a19] font-extrabold leading-tight uppercase tracking-[0.2em]">
            Find Your Perfect Life Partner
          </p>
        </div>
      </header>

      {/* Bottom Action Area */}
      <footer className="w-full max-w-sm mx-auto flex flex-col items-center gap-3.5 pb-4 relative z-10 mt-10">
        {/* Primary Action: Create Account */}
        <button
          onClick={onStartCreate || (() => navigate('/create-account'))}
          className="w-full py-4 px-6 rounded-md bg-[#570013] hover:bg-[#72001a] text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span>Create Account</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>

        {/* Secondary Action: Login */}
        <button
          onClick={onStartLogin || (() => navigate('/login'))}
          className="w-full py-3.5 px-6 rounded-md bg-white border border-gray-200 text-[#570013] font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
        >
          Already Registered? Login
        </button>



        {/* Bottom Policy Links */}
        <div className="flex items-center justify-center gap-3 mt-4 text-[10px] font-semibold text-slate-400">
          <a href="#privacy" className="hover:underline hover:text-slate-600 transition-colors">Privacy Policy</a>
          <span className="text-gray-300">•</span>
          <a href="#terms" className="hover:underline hover:text-slate-600 transition-colors">Terms & Conditions</a>
          <span className="text-gray-300">•</span>
          <a href="#help" className="hover:underline hover:text-slate-600 transition-colors">Help</a>
        </div>
      </footer>
    </div>
  )
}
