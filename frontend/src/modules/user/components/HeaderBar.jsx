import React from 'react'
import ProfileSwitcher from './ProfileSwitcher'

export default function HeaderBar({ isExport = false }) {
  return (
    <header className={`w-full bg-gradient-to-r from-[#45000f] via-[#5c0015] to-[#3a000c] text-white border-b border-[#c69a3d]/40 ${isExport ? 'px-6 py-5 gap-5' : 'px-3.5 py-2.5 sm:px-5 gap-3'} flex items-center justify-between relative z-30 shadow-[0_4px_16px_rgba(45,0,10,0.18)]`}>
      {/* Decorative top gold hairline */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ffd580] to-transparent opacity-90" />
      
      {/* Subtle background golden glow & light accent */}
      <div className="absolute -top-12 -left-8 w-40 h-28 bg-[#ffd580]/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-32 h-20 bg-rose-500/15 rounded-full blur-xl pointer-events-none" />

      {/* Left Logo + Organization Title */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1 relative z-10">
        <div className={`relative shrink-0 ${isExport ? 'w-20 h-20' : 'w-11 h-11 sm:w-12 sm:h-12'} rounded-full p-[2px] bg-gradient-to-tr from-[#ffe6a7] via-[#c69a3d] to-[#ffe6a7] shadow-[0_2px_8px_rgba(0,0,0,0.25)] flex items-center justify-center`}>
          <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center">
            <img
              src="/Logo (2).png"
              alt="Agarwal Biodata Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Header Text */}
        <div className="flex flex-col justify-center min-w-0">
          <h2 className={`${isExport ? 'text-[22px]' : 'text-[12.5px] sm:text-[14px]'} leading-tight font-extrabold text-[#fff5e1] font-display tracking-tight text-balance drop-shadow-xs`}>
            महाराजा अग्रसेन एवं माँ माधवी बायोडाटा प्रकल्प
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f6cb68] shrink-0 shadow-2xs" />
            <p className={`${isExport ? 'text-[14px]' : 'text-[9.5px] sm:text-[10.5px]'} leading-tight text-[#f3d289] font-medium tracking-tight truncate`}>
              दक्षिणी पश्चिमी राजस्थान अग्रवाल सम्मेलन द्वारा संचालित
            </p>
          </div>
        </div>
      </div>

      {/* Which candidate this account is currently operating as. Hidden on the
          export layout, which is rendered for print rather than interaction. */}
      {!isExport && (
        <div className="relative z-10">
          <ProfileSwitcher theme="dark" />
        </div>
      )}
    </header>
  )
}
