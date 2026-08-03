import React, { useState } from 'react'

export default function OnboardingScreen({ onFinish, onBack }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    profileFor: 'Self',
    gender: 'Groom',
    fullName: '',
    dob: '',
    gotra: 'Bansal',
    subGotra: 'Garg',
    education: 'B.Tech / M.Tech',
    occupation: 'Software Engineer',
    city: 'Mumbai',
    manglik: 'Non-Manglik',
  })

  const steps = [
    {
      title: 'Verified Agarwal Heritage',
      subtitle: 'Connecting esteemed Agarwal families worldwide with privacy & dignity.',
      icon: 'verified',
    },
    {
      title: '18 Agarwal Gotra Filter',
      subtitle: 'Find exact Gotra and maternal Gotra matches for traditional alignment.',
      icon: 'diversity_2',
    },
    {
      title: 'Astrological & Horoscope Harmony',
      subtitle: 'Detailed Kundali matching including Guna Milan, Nadi, and Manglik checks.',
      icon: 'star',
    },
    {
      title: 'Noble Family Backgrounds',
      subtitle: 'Comprehensive biodata entries detailing family business, values, and location.',
      icon: 'family_history',
    },
  ]

  const gotraOptions = [
    'Bansal', 'Garg', 'Goyal', 'Kushal', 'Kansal', 'Singhal', 
    'Jindal', 'Tingal', 'Airan', 'Dharan', 'Madhukul', 'Bindal', 
    'Mittal', 'Tayal', 'Bhandal', 'Nangal', 'Mangal', 'Goyan'
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onFinish()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else {
      onBack()
    }
  }

  return (
    <div className="bg-[#fbf9f5] text-[#1b1c1a] font-body min-h-screen flex flex-col justify-between p-4 md:p-8">
      {/* Top Bar */}
      <header className="flex justify-between items-center max-w-4xl mx-auto w-full py-4">
        <button
          onClick={handlePrev}
          className="flex items-center gap-1 text-xs font-bold text-[#570013] hover:opacity-80 transition"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Back</span>
        </button>
        <img src="/Logo (2).png" alt="Vows of Elegance" className="h-7 sm:h-8 w-auto object-contain" />
        <button
          onClick={onFinish}
          className="text-xs font-bold text-gray-500 hover:text-[#570013] transition"
        >
          Skip
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto w-full my-auto bg-white p-6 md:p-10 rounded-lg border border-amber-200/80 shadow-xl">
        {/* Step Indicator */}
        <div className="flex justify-center items-center gap-2 mb-8">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'w-8 bg-[#570013]' : 'w-2 bg-amber-200'
              }`}
            />
          ))}
        </div>

        {/* Step Icon & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-[#570013] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">{steps[currentStep].icon}</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[#570013] mb-2">
            {steps[currentStep].title}
          </h2>
          <p className="text-xs md:text-sm text-gray-600 max-w-md mx-auto">
            {steps[currentStep].subtitle}
          </p>
        </div>

        {/* Form Fields according to Step */}
        <div className="space-y-4 mb-8">
          {currentStep === 0 && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Creating Profile For</label>
                <select
                  value={formData.profileFor}
                  onChange={(e) => setFormData({ ...formData, profileFor: e.target.value })}
                  className="w-full p-3 rounded-md border border-gray-300 text-sm focus:border-[#570013]"
                >
                  <option>Self</option>
                  <option>Son</option>
                  <option>Daughter</option>
                  <option>Brother</option>
                  <option>Sister</option>
                  <option>Relative</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Agarwal"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-3 rounded-md border border-gray-300 text-sm focus:border-[#570013]"
                />
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Paternal Gotra (Self/Father)</label>
                <select
                  value={formData.gotra}
                  onChange={(e) => setFormData({ ...formData, gotra: e.target.value })}
                  className="w-full p-3 rounded-md border border-gray-300 text-sm"
                >
                  {gotraOptions.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Maternal Gotra (Mother)</label>
                <select
                  value={formData.subGotra}
                  onChange={(e) => setFormData({ ...formData, subGotra: e.target.value })}
                  className="w-full p-3 rounded-md border border-gray-300 text-sm"
                >
                  {gotraOptions.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Manglik Status</label>
                <select
                  value={formData.manglik}
                  onChange={(e) => setFormData({ ...formData, manglik: e.target.value })}
                  className="w-full p-3 rounded-md border border-gray-300 text-sm"
                >
                  <option>Non-Manglik</option>
                  <option>Anshik Manglik</option>
                  <option>Manglik</option>
                  <option>Don't Know</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Current City / Residence</label>
                <input
                  type="text"
                  placeholder="e.g. Indore, MP"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-3 rounded-md border border-gray-300 text-sm"
                />
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Highest Qualification</label>
                <input
                  type="text"
                  placeholder="e.g. MBA, B.Tech, CA, MBBS"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  className="w-full p-3 rounded-md border border-gray-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Occupation / Business</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Product Manager / Business Owner"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="w-full p-3 rounded-md border border-gray-300 text-sm"
                />
              </div>
            </>
          )}
        </div>

        {/* Next / Finish Button */}
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-md bg-[#570013] text-[#ffdea5] font-bold text-sm hover:bg-[#800020] active:scale-98 transition shadow-lg flex items-center justify-center gap-2"
        >
          <span>{currentStep === steps.length - 1 ? 'Complete Biodata Setup' : 'Continue'}</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </main>

      <footer className="text-center py-4 text-xs text-gray-500">
        Step {currentStep + 1} of {steps.length} — Agarwal Biodata Onboarding
      </footer>
    </div>
  )
}
