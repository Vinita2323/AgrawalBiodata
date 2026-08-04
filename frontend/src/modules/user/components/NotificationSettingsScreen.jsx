import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function NotificationSettingsScreen({ onBack }) {
  const navigate = useNavigate()
  const handleGoBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

  return (
    <div className="bg-[#fbf9f5] min-h-screen text-[#1b1c1a] font-body flex flex-col pb-12">
      <header className="sticky top-0 z-40 bg-[#fbf9f5]/95 backdrop-blur-md border-b border-amber-200/60 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1 text-xs font-bold text-[#570013] hover:opacity-80 transition p-1 -ml-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <span className="font-display font-bold text-[15px] text-[#570013]">
            Notification Settings
          </span>
          <div className="w-8"></div>
        </div>
      </header>
      <div className="p-4 max-w-4xl mx-auto w-full space-y-6">
        
        {/* Push Notifications */}
        <section>
          <h2 className="text-xs font-bold text-[#570013] uppercase tracking-wider mb-3 ml-1">Push Notifications</h2>
          <div className="bg-white rounded-xl border border-amber-200/80 shadow-2xs divide-y divide-gray-100">
            
            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-800 mb-0.5">New Matches</div>
                <div className="text-[11px] text-gray-500 leading-relaxed">Get notified when we find new profiles matching your preferences.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#570013]"></div>
              </label>
            </div>

            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-800 mb-0.5">Interests Received</div>
                <div className="text-[11px] text-gray-500 leading-relaxed">Alerts when someone sends you an interest or accepts yours.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#570013]"></div>
              </label>
            </div>

          </div>
        </section>

        {/* Email & SMS */}
        <section>
          <h2 className="text-xs font-bold text-[#570013] uppercase tracking-wider mb-3 ml-1">Email & SMS</h2>
          <div className="bg-white rounded-xl border border-amber-200/80 shadow-2xs divide-y divide-gray-100">
            
            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-800 mb-0.5">Weekly Match Digest (Email)</div>
                <div className="text-[11px] text-gray-500 leading-relaxed">A weekly summary of the best profiles tailored to your criteria.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#570013]"></div>
              </label>
            </div>

            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-800 mb-0.5">Promotions & Offers</div>
                <div className="text-[11px] text-gray-500 leading-relaxed">Occasional emails or SMS about premium plan discounts and events.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#570013]"></div>
              </label>
            </div>

          </div>
        </section>

      </div>
    </div>
  )
}
