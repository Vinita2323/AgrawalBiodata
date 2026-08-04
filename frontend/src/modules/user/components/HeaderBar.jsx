import React from 'react'

export default function HeaderBar({ isExport = false }) {
  return (
    <header className={`w-full bg-[#fdfcf9] border-b border-amber-200/60 ${isExport ? 'px-6 py-5 gap-5' : 'px-3 py-2.5 gap-2.5'} flex items-center relative z-30 shadow-sm`}>
      {/* Left Logo */}
      <div className={`relative shrink-0 ${isExport ? 'w-20 h-20' : 'w-13 h-13'} rounded-full p-0.5 bg-gradient-to-br from-amber-300 via-amber-100 to-amber-400 shadow-sm flex items-center justify-center overflow-hidden`}>
        <img
          src="/Logo (2).png"
          alt="Agarwal Biodata Logo"
          className="w-full h-full object-contain rounded-full bg-white p-0.5"
        />
      </div>

      {/* Header Text */}
      <div className="flex flex-col justify-center min-w-0 pt-0.5">
        <h2 className={`${isExport ? 'text-[22px]' : 'text-[13px]'} leading-[1.35] font-bold text-[#570013] font-display tracking-tight text-balance`}>
          महाराजा अग्रसेन एवं माँ माधवी बायोडाटा प्रकल्प
        </h2>
        <p className={`${isExport ? 'text-[14px] mt-1' : 'text-[10px] mt-0.5'} leading-[1.3] text-[#775a19] font-medium tracking-tight`}>
          ( दक्षिणी पश्चिमी राजस्थान अग्रवाल सम्मेलन द्वारा संचालित )
        </p>
      </div>
    </header>
  )
}
