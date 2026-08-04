import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function AccountSettingsScreen({ onBack }) {
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
            Account Settings
          </span>
          <div className="w-8"></div>
        </div>
      </header>
      <div className="p-4 max-w-4xl mx-auto w-full space-y-6">
        
        {/* Contact Information */}
        <section>
          <h2 className="text-xs font-bold text-[#570013] uppercase tracking-wider mb-3 ml-1">Contact Information</h2>
          <div className="bg-white rounded-xl border border-amber-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
              <div>
                <div className="text-[10px] text-gray-500 font-semibold mb-0.5">Phone Number</div>
                <div className="text-sm font-bold text-slate-800">+91 9876543210</div>
              </div>
              <button className="text-xs font-bold text-[#570013] hover:underline active:scale-95 transition">Change</button>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-gray-500 font-semibold mb-0.5">Email Address</div>
                <div className="text-sm font-bold text-slate-800">user@example.com</div>
              </div>
              <button className="text-xs font-bold text-[#570013] hover:underline active:scale-95 transition">Change</button>
            </div>
          </div>
        </section>

        {/* Profile Status */}
        <section>
          <h2 className="text-xs font-bold text-[#570013] uppercase tracking-wider mb-3 ml-1">Profile Status</h2>
          <div className="bg-white rounded-xl border border-amber-200/80 shadow-2xs p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-800 mb-1">Deactivate Profile</div>
                <div className="text-[11px] text-gray-500 leading-relaxed">
                  Temporarily hide your profile from all searches and matches. You can reactivate it later by logging back in.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#570013]"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 ml-1">Danger Zone</h2>
          <div className="bg-white rounded-xl border border-red-200 shadow-2xs p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-red-600 mb-1">Delete Account</div>
                <div className="text-[11px] text-gray-500 leading-relaxed max-w-sm">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </div>
              </div>
              <button className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition rounded-lg text-xs font-bold shrink-0 active:scale-95">
                Delete Account
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
