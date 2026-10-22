import React from 'react'

export default function HeaderBar({ isExport = false }) {
  return (
    <header className={`w-full bg-transparent text-[#45000f] border-b-2 border-[#c69a3d] ${isExport ? 'px-6 py-5 gap-5' : 'px-3.5 py-2.5 sm:px-5 gap-3'} flex items-center justify-between relative z-30`}>

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
      </div>
    </header>
  )
}
