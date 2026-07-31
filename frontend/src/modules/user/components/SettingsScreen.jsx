import React from 'react'

export default function SettingsScreen({ onBack, onLogout }) {
  const mainSettings = [
    { id: 'account', label: 'Account Settings', icon: 'person' },
    { id: 'privacy', label: 'Privacy Settings', icon: 'security' },
    { id: 'notification', label: 'Notification Settings', icon: 'notifications' },
    { id: 'password', label: 'Change Password', icon: 'lock' },
    { id: 'blocked', label: 'Blocked Users', icon: 'block' },
  ]

  const secondarySettings = [
    { id: 'help', label: 'Help & Support', icon: 'help' },
    { id: 'about', label: 'About Matrimony Hub', icon: 'info' },
  ]

  return (
    <div className="bg-[#fcfaf7] text-slate-800 min-h-screen flex flex-col justify-between p-4 selection:bg-[#775a19] select-none">
      <div>
        {/* Header Bar */}
        <div className="flex items-center gap-1 mb-4 pt-1">
          <button
            onClick={onBack}
            className="p-0.5 rounded-full hover:bg-amber-50 active:scale-95 transition text-[#570013] -ml-1"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-2xl block">arrow_back</span>
          </button>
          <h1 className="text-lg font-display font-extrabold text-[#570013] flex-1">Settings</h1>
        </div>

        {/* Group 1 Settings Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          {mainSettings.map((item, idx) => (
            <button
              key={item.id}
              className={`w-full px-4 py-3.5 flex items-center justify-between hover:bg-amber-50/30 transition text-left active:scale-[0.99] ${
                idx !== mainSettings.length - 1 ? 'border-b border-gray-100/80' : ''
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className="material-symbols-outlined text-xl text-slate-500">{item.icon}</span>
                <span className="text-xs font-semibold text-slate-800">{item.label}</span>
              </div>
              <span className="material-symbols-outlined text-lg text-slate-400">chevron_right</span>
            </button>
          ))}
        </div>

        {/* Group 2 Settings Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          {secondarySettings.map((item, idx) => (
            <button
              key={item.id}
              className={`w-full px-4 py-3.5 flex items-center justify-between hover:bg-amber-50/30 transition text-left active:scale-[0.99] ${
                idx !== secondarySettings.length - 1 ? 'border-b border-gray-100/80' : ''
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className="material-symbols-outlined text-xl text-slate-500">{item.icon}</span>
                <span className="text-xs font-semibold text-slate-800">{item.label}</span>
              </div>
              <span className="material-symbols-outlined text-lg text-slate-400">chevron_right</span>
            </button>
          ))}
        </div>

        {/* Group 3 Logout Card */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <button
            onClick={onLogout}
            className="w-full px-4 py-3.5 flex items-center gap-3.5 hover:bg-red-50/50 transition text-left active:scale-[0.99] text-red-600"
          >
            <span className="material-symbols-outlined text-xl text-red-600">logout</span>
            <span className="text-xs font-extrabold text-red-600">Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}
