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
    <div className="bg-[#fbf9f5] text-[#1b1c1a] font-body min-h-screen pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#fbf9f5]/90 backdrop-blur-md border-b border-amber-200/60 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-bold text-[#570013] hover:opacity-80 transition"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Back to Matches</span>
          </button>
          <span className="font-display font-bold text-lg text-[#570013]">
            Biodata Profile
          </span>
          <button
            onClick={() => alert(`Share profile link for ${p.name}`)}
            className="text-[#570013]"
            title="Share Biodata"
          >
            <span className="material-symbols-outlined text-xl">share</span>
          </button>
        </div>
      </header>

      {/* Profile Main Container */}
      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* Candidate Hero Card */}
        <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-amber-300 shadow-md flex-shrink-0 bg-gray-100">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
            </div>

            <div className="text-center sm:text-left flex-grow">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#570013] text-[#ffdea5] text-xs font-bold rounded-full mb-2">
                <span className="material-symbols-outlined text-sm">star</span>
                <span>{p.matchScore}% Match Score</span>
              </div>

              <h1 className="font-display text-3xl font-bold text-[#570013] flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span>{p.name}</span>
                {p.verified && (
                  <span className="material-symbols-outlined text-emerald-600 text-xl" title="Verified Agrawal Family">
                    verified
                  </span>
                )}
              </h1>

              <p className="text-sm font-semibold text-gray-700 mb-2">
                {p.gotra} Gotra • {p.age} yrs • {p.height}
              </p>

              <p className="text-xs text-gray-500 flex items-center justify-center sm:justify-start gap-1">
                <span className="material-symbols-outlined text-sm text-[#775a19]">location_on</span>
                <span>{p.city}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Kundali & Horoscope Card */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-6 shadow-sm">
          <h2 className="font-display text-xl font-bold text-[#570013] mb-4 flex items-center gap-2 border-b border-amber-100 pb-2">
            <span className="material-symbols-outlined text-[#775a19]">auto_awesome</span>
            <span>Horoscope & Kundali Harmony</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200">
              <span className="block text-[10px] text-gray-500 uppercase font-bold">Guna Milan</span>
              <span className="text-lg font-bold text-[#570013]">32 / 36</span>
            </div>
            <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200">
              <span className="block text-[10px] text-gray-500 uppercase font-bold">Manglik Status</span>
              <span className="text-sm font-bold text-[#570013]">{p.manglik}</span>
            </div>
            <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200">
              <span className="block text-[10px] text-gray-500 uppercase font-bold">Paternal Gotra</span>
              <span className="text-sm font-bold text-[#570013]">{p.gotra}</span>
            </div>
            <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200">
              <span className="block text-[10px] text-gray-500 uppercase font-bold">Maternal Gotra</span>
              <span className="text-sm font-bold text-[#570013]">{p.subGotra}</span>
            </div>
          </div>
        </div>

        {/* Ancestral & Family Background */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-6 shadow-sm">
          <h2 className="font-display text-xl font-bold text-[#570013] mb-4 flex items-center gap-2 border-b border-amber-100 pb-2">
            <span className="material-symbols-outlined text-[#775a19]">family_history</span>
            <span>Family & Ancestral Background</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-gray-700 block mb-0.5">Father's Profession:</span>
              <p className="text-gray-600">Owner, Agrawal Textiles & Trading Co.</p>
            </div>
            <div>
              <span className="font-bold text-gray-700 block mb-0.5">Mother's Background:</span>
              <p className="text-gray-600">Homemaker (Belongs to Bansal Gotra)</p>
            </div>
            <div>
              <span className="font-bold text-gray-700 block mb-0.5">Siblings:</span>
              <p className="text-gray-600">1 Younger Brother (Chartered Accountant)</p>
            </div>
            <div>
              <span className="font-bold text-gray-700 block mb-0.5">Ancestral Roots:</span>
              <p className="text-gray-600">Agroha / Hisar, Haryana</p>
            </div>
          </div>
        </div>

        {/* Education & Profession */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-6 shadow-sm">
          <h2 className="font-display text-xl font-bold text-[#570013] mb-4 flex items-center gap-2 border-b border-amber-100 pb-2">
            <span className="material-symbols-outlined text-[#775a19]">work</span>
            <span>Education & Stature</span>
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-base text-[#570013]">school</span>
              <div>
                <span className="font-bold text-gray-800 block">Highest Qualification</span>
                <p className="text-gray-600">{p.education}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-base text-[#570013]">business_center</span>
              <div>
                <span className="font-bold text-gray-800 block">Current Profession & Income</span>
                <p className="text-gray-600">Senior Product Manager at MNC (28+ LPA)</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-amber-200 py-3 px-4 shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button
            onClick={() => alert(`Shortlisted ${p.name}`)}
            className="px-4 py-3 rounded-xl border border-amber-300 text-[#775a19] font-bold text-xs hover:bg-amber-50 transition flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">bookmark</span>
            <span>Shortlist</span>
          </button>
          <button
            onClick={() => alert(`Express Interest sent to ${p.name}'s family!`)}
            className="flex-1 py-3 rounded-xl bg-[#570013] text-[#ffdea5] font-bold text-xs hover:bg-[#800020] transition shadow-lg text-center flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">favorite</span>
            <span>Express Interest & Request Contact</span>
          </button>
        </div>
      </div>
    </div>
  )
}
