import React, { useState } from 'react'

export default function DashboardScreen({ onSelectProfile, onBack }) {
  const [selectedGotra, setSelectedGotra] = useState('All')
  const [selectedManglik, setSelectedManglik] = useState('All')

  const gotras = ['All', 'Bansal', 'Garg', 'Goyal', 'Kansal', 'Jindal', 'Mittal', 'Singhal']

  const matches = [
    {
      id: 'P101',
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
    },
    {
      id: 'P102',
      name: 'Rohan Bansal',
      age: 28,
      height: "5'11\"",
      gotra: 'Bansal',
      subGotra: 'Goyal',
      education: 'MBA, Product Lead at Fintech',
      city: 'Mumbai, MH',
      manglik: 'Non-Manglik',
      matchScore: 92,
      verified: true,
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'P103',
      name: 'Priya Goyal',
      age: 25,
      height: "5'4\"",
      gotra: 'Goyal',
      subGotra: 'Jindal',
      education: 'Chartered Accountant (CA)',
      city: 'Delhi NCR',
      manglik: 'Anshik Manglik',
      matchScore: 94,
      verified: true,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'P104',
      name: 'Aman Singhal',
      age: 29,
      height: "6'0\"",
      gotra: 'Singhal',
      subGotra: 'Kansal',
      education: 'MD Internal Medicine',
      city: 'Jaipur, RJ',
      manglik: 'Non-Manglik',
      matchScore: 90,
      verified: true,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    },
  ]

  const filteredMatches = matches.filter((m) => {
    if (selectedGotra !== 'All' && m.gotra !== selectedGotra) return false
    if (selectedManglik !== 'All' && m.manglik !== selectedManglik) return false
    return true
  })

  return (
    <div className="bg-[#fbf9f5] text-[#1b1c1a] font-body min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fbf9f5]/90 backdrop-blur-md border-b border-amber-200/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-[#570013] md:hidden">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <img src="/Logo (2).png" alt="Vows of Elegance" className="h-8 sm:h-9 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-amber-100 border border-amber-300 text-[#570013] text-xs font-bold rounded-full">
              Verified Agrawal Sanctum
            </span>
            <div className="w-9 h-9 rounded-full bg-[#570013] text-[#ffdea5] flex items-center justify-center font-bold text-xs border-2 border-amber-300">
              AB
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-4xl font-bold text-[#570013] mb-1">
            Royal Matches & Agrawal Biodata
          </h1>
          <p className="text-xs md:text-sm text-gray-600">
            Handpicked profiles aligned by Gotra, horoscope harmony, and noble family status.
          </p>
        </div>

        {/* Quick Gotra Filter Tabs */}
        <div className="mb-8 overflow-x-auto pb-2 flex gap-2 scrollbar-none">
          <span className="text-xs font-bold text-gray-500 flex items-center pr-2">Gotra:</span>
          {gotras.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGotra(g)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
                selectedGotra === g
                  ? 'bg-[#570013] text-[#ffdea5] shadow-md'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-amber-50'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Matches Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredMatches.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-3xl border border-amber-200/80 p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row gap-5 relative overflow-hidden group"
            >
              {/* Candidate Image */}
              <div className="w-full sm:w-40 h-48 rounded-2xl overflow-hidden relative flex-shrink-0 bg-gray-100">
                <img
                  src={m.image}
                  alt={m.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 bg-[#570013] text-[#ffdea5] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                  <span className="material-symbols-outlined text-xs">star</span>
                  <span>{m.matchScore}% Match</span>
                </div>
              </div>

              {/* Candidate Info */}
              <div className="flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-display text-xl font-bold text-[#570013] flex items-center gap-1.5">
                      <span>{m.name}</span>
                      {m.verified && (
                        <span className="material-symbols-outlined text-emerald-600 text-base" title="Verified Family">
                          verified
                        </span>
                      )}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-[#775a19]">
                      {m.gotra} Gotra
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mb-3">
                    {m.age} yrs • {m.height} • {m.city}
                  </p>

                  <div className="space-y-1 text-xs text-gray-700 mb-4">
                    <p className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#775a19]">school</span>
                      <span>{m.education}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#775a19]">diversity_2</span>
                      <span>Mother Gotra: {m.subGotra}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#775a19]">auto_awesome</span>
                      <span>{m.manglik}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => onSelectProfile(m)}
                    className="flex-1 py-2.5 rounded-xl bg-[#570013] text-[#ffdea5] font-bold text-xs hover:bg-[#800020] transition shadow-md text-center"
                  >
                    View Biodata
                  </button>
                  <button
                    onClick={() => alert(`Interest Expressed to ${m.name}`)}
                    className="p-2.5 rounded-xl border border-amber-300 text-[#775a19] hover:bg-amber-50 transition"
                    title="Express Interest"
                  >
                    <span className="material-symbols-outlined text-base">favorite</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
