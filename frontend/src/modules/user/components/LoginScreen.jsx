import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginScreen({ onBack, onSendOtp }) {
  const navigate = useNavigate()
  const [mobile, setMobile] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mobile.length >= 10) {
      if (onSendOtp) {
        onSendOtp(mobile)
      } else {
        navigate('/otp-verification', { state: { mobile, isNewUser: false } })
      }
    }
  }

  return (
    <div className="bg-[#fbf9f5] min-h-screen text-slate-800 font-body flex flex-col justify-between p-5 relative select-none">
      {/* Top Header with Back Arrow */}
      <div className="flex items-center justify-between w-full pt-1 pb-3">
        <button
          onClick={onBack || (() => navigate('/welcome'))}
          className="p-2 rounded-full hover:bg-gray-100/80 active:scale-95 transition text-slate-800"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined text-2xl block">arrow_back</span>
        </button>
      </div>

      {/* Main Form Content */}
      <main className="w-full max-w-sm mx-auto my-auto flex flex-col items-center">
        {/* Logo Badge */}
        <div className="w-24 h-24 rounded-full border-2 border-amber-200/80 p-1 bg-white shadow-md flex items-center justify-center mb-4">
          <img
            src="/Logo (2).png"
            alt="Matrimony Hub Logo"
            className="w-full h-full object-contain rounded-full"
          />
        </div>

        {/* Header Text */}
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1 text-center">
          Member Login
        </h1>
        <p className="text-xs text-slate-500 font-medium mb-8 text-center">
          Enter your mobile number to receive a secure OTP
        </p>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Mobile Number
            </label>
            <div className="w-full border border-gray-300 rounded-2xl p-3.5 flex items-center gap-3 bg-white focus-within:border-[#570013] focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition">
              <div className="flex items-center gap-1.5 pr-2 border-r border-gray-200 text-sm font-semibold text-slate-700">
                <span className="text-base">🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                type="tel"
                maxLength={10}
                placeholder="98765 43210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none placeholder-gray-400"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={mobile.length < 10}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#570013] hover:bg-[#72001a] disabled:bg-gray-300 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all mb-6"
          >
            <span>Send OTP</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </form>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/60">
          <span className="material-symbols-outlined text-sm">lock</span>
          <span>Password-free 100% Secure OTP Login</span>
        </div>
      </main>

      {/* Footer Registration Link */}
      <footer className="w-full text-center py-2 text-xs text-slate-500 font-medium">
        <span>Don't have an account? </span>
        <button
          onClick={() => navigate('/create-account')}
          className="font-bold text-[#570013] hover:underline"
        >
          Create Account
        </button>
      </footer>
    </div>
  )
}
