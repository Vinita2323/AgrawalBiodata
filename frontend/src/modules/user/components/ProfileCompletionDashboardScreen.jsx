import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ProfileCompletionDashboardScreen({ onContinue, onSkip }) {
  const navigate = useNavigate()
  const [activeStepModal, setActiveStepModal] = useState(null)

  const profileSections = [
    { id: 'basic', label: 'Basic Information', completed: true, icon: 'person', time: '1 min' },
    { id: 'religion', label: 'Religion & Gotra', completed: false, icon: 'auto_awesome', time: '1 min' },
    { id: 'education', label: 'Education & Qualification', completed: false, icon: 'school', time: '1 min' },
    { id: 'career', label: 'Career & Occupation', completed: false, icon: 'work', time: '1 min' },
    { id: 'family', label: 'Family Details & Heritage', completed: false, icon: 'diversity_3', time: '2 min' },
    { id: 'lifestyle', label: 'Lifestyle & Habits', completed: false, icon: 'spa', time: '1 min' },
    { id: 'preferences', label: 'Partner Preferences', completed: false, icon: 'tune', time: '2 min' },
    { id: 'photos', label: 'Upload Photos & Biodata', completed: false, icon: 'add_a_photo', time: '1 min' },
    { id: 'verification', label: 'ID Verification Badge', completed: false, icon: 'verified_user', time: '1 min' },
  ]

  const completedCount = profileSections.filter((s) => s.completed).length
  const progressPercent = Math.round((completedCount / profileSections.length) * 100) || 10

  return (
    <div className="bg-[#fcfaf7] text-slate-800 font-body min-h-screen flex flex-col justify-between p-4 selection:bg-[#775a19] select-none">
      {/* Header Bar */}
      <div className="flex flex-col w-full pt-1 pb-3">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 rounded-full text-[#570013] hover:bg-amber-50 active:scale-95 transition flex items-center"
            aria-label="Go Back"
          >
            <span className="material-symbols-outlined text-2xl block">arrow_back</span>
          </button>
          
          <button
            onClick={onSkip || (() => navigate('/home'))}
            className="text-xs font-bold text-[#570013] hover:underline px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/60"
          >
            Skip For Now
          </button>
        </div>
        
        <div>
          <h1 className="text-[22px] font-display font-extrabold text-slate-900 leading-tight">
            Welcome Rahul 👋
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Let's complete your biodata profile</p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 space-y-4 my-2">
        {/* Progress Card */}
        <div className="bg-gradient-to-r from-[#570013] to-[#72001a] text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs text-amber-200 uppercase font-extrabold tracking-wider block mb-0.5">
                Profile Health
              </span>
              <h2 className="text-xl font-extrabold">{progressPercent}% Complete</h2>
            </div>
            <div className="w-14 h-14 rounded-full bg-white/15 border border-white/30 flex items-center justify-center font-bold text-amber-300 text-sm shadow-inner">
              {completedCount}/{profileSections.length}
            </div>
          </div>

          <p className="text-xs text-amber-100/90 leading-relaxed font-medium mb-4">
            Complete your profile to receive 5x better and more accurate matrimonial matches.
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className="bg-gradient-to-r from-amber-300 to-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-amber-200/90">
            <span>Estimated Time: 8–10 Minutes</span>
            <span>Step 1 of 9</span>
          </div>
        </div>

        {/* Profile Sections Checklist Card */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-2.5">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider px-1 mb-1">
            Profile Checklist
          </h3>

          {profileSections.map((sec) => (
            <div
              key={sec.id}
              onClick={() => setActiveStepModal(sec)}
              className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition active:scale-[0.99] ${
                sec.completed
                  ? 'bg-emerald-50/60 border-emerald-200/80 text-slate-800'
                  : 'bg-gray-50/70 border-gray-200/70 hover:bg-amber-50/40 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    sec.completed
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : 'bg-white border border-gray-300 text-gray-400'
                  }`}
                >
                  {sec.completed ? '✓' : '○'}
                </span>
                <div>
                  <h4 className="text-xs font-bold leading-tight">{sec.label}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">Est. {sec.time}</span>
                </div>
              </div>

              <span className="material-symbols-outlined text-lg text-slate-400">chevron_right</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer Buttons */}
      <footer className="w-full space-y-2 pt-2">
        <button
          onClick={onContinue || (() => navigate('/home'))}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#570013] hover:bg-[#72001a] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <span>Continue Profile Setup</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>

        <button
          onClick={onSkip || (() => navigate('/home'))}
          className="w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          Skip For Now
        </button>
      </footer>

      {/* Interactive Step Modal Simulation */}
      {activeStepModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-2xl animate-scale-fade flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-[#570013]">
                  {activeStepModal.icon}
                </span>
                <h3 className="font-bold text-sm text-slate-900">{activeStepModal.label}</h3>
              </div>
              <button
                onClick={() => setActiveStepModal(null)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <span className="material-symbols-outlined text-xl block">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 font-medium leading-relaxed shrink-0">
              Enter your details for <strong className="text-[#570013]">{activeStepModal.label}</strong> to complete this section.
            </p>

            <div className="space-y-3.5 mb-5 overflow-y-auto pr-2 -mr-2">
              {activeStepModal.id === 'basic' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-[#570013] uppercase tracking-wider mb-1">
                      Marital Status
                    </label>
                    <div className="relative">
                      <select className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-xl pl-3 pr-8 py-2.5 text-[12px] font-semibold text-slate-800 focus:border-[#570013] focus:ring-1 focus:ring-[#570013] focus:outline-none appearance-none">
                        <option>Never Married</option>
                        <option>Divorced</option>
                        <option>Widowed</option>
                        <option>Awaiting Divorce</option>
                      </select>
                      <span className="material-symbols-outlined text-[#775a19] text-[18px] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#570013] uppercase tracking-wider mb-1">
                      Height
                    </label>
                    <div className="relative">
                      <select className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-xl pl-3 pr-8 py-2.5 text-[12px] font-semibold text-slate-800 focus:border-[#570013] focus:ring-1 focus:ring-[#570013] focus:outline-none appearance-none">
                        <option>5' 4" (162 cm)</option>
                        <option>5' 5" (165 cm)</option>
                        <option>5' 6" (167 cm)</option>
                        <option>5' 7" (170 cm)</option>
                        <option>5' 8" (172 cm)</option>
                        <option>5' 9" (175 cm)</option>
                      </select>
                      <span className="material-symbols-outlined text-[#775a19] text-[18px] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#570013] uppercase tracking-wider mb-1">
                        Diet
                      </label>
                      <div className="relative">
                        <select className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-xl pl-2 pr-6 py-2.5 text-[11px] font-semibold text-slate-800 focus:border-[#570013] focus:ring-1 focus:ring-[#570013] focus:outline-none appearance-none">
                          <option>Vegetarian</option>
                          <option>Vegan</option>
                          <option>Jain</option>
                          <option>Non-Vegetarian</option>
                        </select>
                        <span className="material-symbols-outlined text-[#775a19] text-[16px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#570013] uppercase tracking-wider mb-1">
                        Physical Status
                      </label>
                      <div className="relative">
                        <select className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-xl pl-2 pr-6 py-2.5 text-[11px] font-semibold text-slate-800 focus:border-[#570013] focus:ring-1 focus:ring-[#570013] focus:outline-none appearance-none">
                          <option>Normal</option>
                          <option>Physically Challenged</option>
                        </select>
                        <span className="material-symbols-outlined text-[#775a19] text-[16px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder={`Enter details for ${activeStepModal.label}...`}
                    className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-xl px-3 py-2.5 text-[12px] font-semibold text-slate-800 focus:border-[#570013] focus:ring-1 focus:ring-[#570013] focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 font-medium px-1">
                    (More fields will dynamically load here for {activeStepModal.label})
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setActiveStepModal(null)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-xs font-bold text-slate-700 hover:bg-gray-50 active:scale-95 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  activeStepModal.completed = true
                  setActiveStepModal(null)
                }}
                className="flex-1 py-3 rounded-xl bg-[#570013] hover:bg-[#72001a] text-white text-xs font-bold shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <span>Save</span>
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
