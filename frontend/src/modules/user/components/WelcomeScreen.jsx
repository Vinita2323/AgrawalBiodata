import React, { useState } from 'react'

export default function WelcomeScreen({ onStartOnboarding, onStartAuth }) {
  const [lang, setLang] = useState('English')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <div className="bg-[#fbf9f5] text-[#1b1c1a] font-body min-h-screen flex flex-col relative">
      <div className="fixed top-0 left-0 w-full z-[60] indian-border-top" />

      {/* Header Navigation */}
      <header className="fixed top-0 w-full z-50 glass-header royal-shadow">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center min-w-0">
            <img src="/Logo (2).png" alt="Vows of Elegance" className="h-8 sm:h-10 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-gray-300 text-[#570013] text-xs font-semibold hover:bg-gray-100 transition"
              >
                <span className="material-symbols-outlined text-sm sm:text-base">language</span>
                <span className="text-[11px] sm:text-xs">{lang}</span>
                <span className="material-symbols-outlined text-sm sm:text-base">expand_more</span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                  {['English', 'Hindi', 'Marathi', 'Gujarati'].map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setDropdownOpen(false) }}
                      className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-amber-50 text-gray-700"
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onStartAuth}
              className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-[#570013] text-[#ffdea5] text-xs font-semibold hover:bg-[#800020] transition shadow-sm whitespace-nowrap"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-50/50 via-transparent to-[#fbf9f5]" />
          
          <div className="relative z-10 max-w-3xl mx-auto text-center py-16">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-amber-100/70 border border-amber-300/50 text-[#775a19] text-xs font-semibold">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              <span>100% Verified Agrawal Biodata Sanctum</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-extrabold text-[#570013] tracking-tight leading-tight mb-6">
              Where Sacred Traditions Meet Modern Elegance
            </h1>

            <p className="text-base md:text-lg text-gray-700 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Discover verified profiles rooted in Agrawal heritage, traditional Gotra matching, astrological compatibility, and noble family values.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onStartOnboarding}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#570013] text-[#ffdea5] font-bold text-sm hover:bg-[#800020] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <span>Begin Your Journey</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>

              <button
                onClick={onStartAuth}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white border-2 border-[#775a19]/30 text-[#775a19] font-bold text-sm hover:bg-amber-50 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Existing Member Login</span>
              </button>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-6">
          {[
            { icon: 'verified_user', title: 'Manual Verification', desc: 'Every profile and family detail is manually verified by our team.' },
            { icon: 'auto_awesome', title: 'Gotra & Horoscope Match', desc: 'Filter matches seamlessly by 18 Agrawal Gotras and horoscope details.' },
            { icon: 'lock', title: 'Strict Privacy Controls', desc: 'Your photos and contact numbers are protected with strict multi-layer permissions.' },
          ].map((f, idx) => (
            <div key={idx} className="bg-white p-6 rounded-md border border-amber-200/60 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-md bg-amber-100 text-[#570013] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">{f.icon}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-[#570013] mb-2">{f.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#570013] text-[#ffdea5]/80 text-center py-6 border-t border-amber-900/30 text-xs">
        <p>© 2026 Vows of Elegance — Agrawal Biodata Matrimonial Portal</p>
      </footer>
    </div>
  )
}
