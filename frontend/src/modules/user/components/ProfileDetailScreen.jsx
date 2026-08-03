import React from 'react'

export default function ProfileDetailScreen({ profile, onBack }) {
  const p = profile || {
    name: 'Aditi Garg',
    age: 26,
    height: "5'5\"",
    gotra: 'Garg',
    subGotra: 'Bansal',
    education: 'M.Tech, Software Architect',
    city: 'Indore, MP',
    manglik: 'Non-Manglik',
    matchScore: 96,
    verified: true,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
  }

  return (
    <div className="bg-[#fbf9f5] text-[#1b1c1a] font-body min-h-screen pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#fbf9f5]/90 backdrop-blur-md border-b border-amber-200/60 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-bold text-[#570013] hover:opacity-80 transition"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Back</span>
          </button>
          <span className="font-display font-bold text-[15px] text-[#570013]">
            Biodata Profile
          </span>
          <button
            onClick={() => alert(`Share profile link for ${p.name}`)}
            className="text-[#570013]"
            title="Share Biodata"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
          </button>
        </div>
      </header>

      {/* Profile Main Container */}
      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-3.5">
        {/* Candidate Hero Card */}
        <div className="bg-white rounded-[20px] border border-amber-200/80 p-4 shadow-xl relative overflow-hidden">
          <div className="flex flex-row items-center gap-4">
            <div className="w-[88px] h-[88px] sm:w-28 sm:h-28 rounded-full overflow-hidden border-[3px] border-amber-300 shadow-md flex-shrink-0 bg-gray-100">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
            </div>

            <div className="text-left flex-grow">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#570013] text-[#ffdea5] text-[10px] font-bold rounded-full mb-1.5 shadow-sm">
                <span className="material-symbols-outlined text-[12px]">star</span>
                <span>{p.matchScore}% Match Score</span>
              </div>

              <h1 className="font-display text-[22px] font-bold text-[#570013] flex items-center justify-start gap-1.5 mb-0.5 leading-tight tracking-tight">
                <span className="truncate">{p.name}</span>
                {p.verified && (
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]" title="Verified Agarwal Family">
                    verified
                  </span>
                )}
              </h1>

              <p className="text-[11px] font-semibold text-gray-700 mb-1 leading-snug">
                {p.gotra} Gotra • {p.age} yrs • {p.height}
              </p>

              <p className="text-[10px] text-gray-500 flex items-center justify-start gap-0.5">
                <span className="material-symbols-outlined text-[12px] text-[#775a19]">location_on</span>
                <span>{p.city}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Kundali & Horoscope Card */}
        <div className="bg-white rounded-md border border-amber-200/80 p-4 shadow-sm">
          <h2 className="font-display text-[15px] font-bold text-[#570013] mb-3 flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
            <span className="material-symbols-outlined text-[#775a19] text-[18px]">auto_awesome</span>
            <span>Horoscope & Kundali</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="bg-amber-50/80 p-2.5 rounded-[10px] border border-amber-200">
              <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-tight">Guna Milan</span>
              <span className="text-[15px] font-bold text-[#570013] leading-tight">32 / 36</span>
            </div>
            <div className="bg-amber-50/80 p-2.5 rounded-[10px] border border-amber-200">
              <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-tight">Manglik</span>
              <span className="text-xs font-bold text-[#570013] leading-tight">{p.manglik}</span>
            </div>
            <div className="bg-amber-50/80 p-2.5 rounded-[10px] border border-amber-200">
              <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-tight">Paternal Gotra</span>
              <span className="text-xs font-bold text-[#570013] leading-tight">{p.gotra}</span>
            </div>
            <div className="bg-amber-50/80 p-2.5 rounded-[10px] border border-amber-200">
              <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-tight">Maternal Gotra</span>
              <span className="text-xs font-bold text-[#570013] leading-tight">{p.subGotra}</span>
            </div>
          </div>
        </div>

        {/* Ancestral & Family Background */}
        <div className="bg-white rounded-md border border-amber-200/80 p-4 shadow-sm">
          <h2 className="font-display text-[15px] font-bold text-[#570013] mb-3 flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
            <span className="material-symbols-outlined text-[#775a19] text-[18px]">family_history</span>
            <span>Family Background</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="font-bold text-gray-700 block mb-0.5">Father's Profession:</span>
              <p className="text-gray-600 leading-snug">Owner, Agarwal Textiles</p>
            </div>
            <div>
              <span className="font-bold text-gray-700 block mb-0.5">Mother's Background:</span>
              <p className="text-gray-600 leading-snug">Homemaker (Bansal Gotra)</p>
            </div>
            <div>
              <span className="font-bold text-gray-700 block mb-0.5">Siblings:</span>
              <p className="text-gray-600 leading-snug">1 Younger Brother (CA)</p>
            </div>
            <div>
              <span className="font-bold text-gray-700 block mb-0.5">Ancestral Roots:</span>
              <p className="text-gray-600 leading-snug">Agroha / Hisar</p>
            </div>
          </div>
        </div>

        {/* Education & Profession */}
        <div className="bg-white rounded-md border border-amber-200/80 p-4 shadow-sm">
          <h2 className="font-display text-[15px] font-bold text-[#570013] mb-3 flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
            <span className="material-symbols-outlined text-[#775a19] text-[18px]">work</span>
            <span>Education & Profession</span>
          </h2>
          <div className="space-y-2.5 text-[11px]">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[15px] text-[#570013] mt-0.5">school</span>
              <div>
                <span className="font-bold text-gray-800 block leading-tight">Highest Qualification</span>
                <p className="text-gray-600 leading-snug">{p.education}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[15px] text-[#570013] mt-0.5">business_center</span>
              <div>
                <span className="font-bold text-gray-800 block leading-tight">Current Profession</span>
                <p className="text-gray-600 leading-snug">Senior Product Manager (28+ LPA)</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-amber-200 py-2.5 px-4 shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center gap-2.5">
          <button
            onClick={() => alert(`Shortlisted ${p.name}`)}
            className="px-3.5 py-2.5 rounded-md border border-amber-300 text-[#775a19] font-bold text-[11px] hover:bg-amber-50 transition flex items-center justify-center shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">bookmark</span>
          </button>
          <button
            onClick={() => alert(`Express Interest sent to ${p.name}'s family!`)}
            className="flex-1 py-2.5 rounded-md bg-[#570013] text-[#ffdea5] font-bold text-[12px] hover:bg-[#800020] transition shadow text-center flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">favorite</span>
            <span>Express Interest</span>
          </button>
        </div>
      </div>
    </div>
  )
}
