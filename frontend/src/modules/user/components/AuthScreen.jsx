import React, { useState } from 'react'

export default function AuthScreen({ onBack, onSuccess }) {
  const [authTab, setAuthTab] = useState('mobile') // 'mobile' | 'email'
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (authTab === 'mobile' && !otpSent) {
      if (mobile.length >= 10) {
        setOtpSent(true)
      }
    } else {
      if (onSuccess) onSuccess()
    }
  }

  return (
    <div className="bg-[#fbf9f5] min-h-screen text-slate-800 font-body flex flex-col justify-between p-5 relative select-none">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between w-full pt-1 pb-3">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100/80 active:scale-95 transition text-slate-800"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined text-2xl block">arrow_back</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="w-full max-w-sm mx-auto my-auto flex flex-col items-center">
        {/* Logo Badge */}
        <div className="w-28 h-28 rounded-full border-2 border-amber-200/80 p-1 bg-white shadow-md flex items-center justify-center mb-4">
          <img src="/Logo (2).png" alt="Vows of Elegance Logo" className="w-full h-full object-contain rounded-full" />
        </div>

        {/* Header Text */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-1 text-center">
          Welcome Back
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium mb-6 text-center">
          Login to continue your journey
        </p>

        {/* Login Method Tabs */}
        <div className="w-full border-b border-gray-200 flex mb-6">
          <button
            type="button"
            onClick={() => { setAuthTab('mobile'); setOtpSent(false) }}
            className={`flex-1 py-2.5 text-xs md:text-sm font-semibold transition-all relative ${
              authTab === 'mobile'
                ? 'text-[#570013] font-bold border-b-2 border-[#570013]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Login with Mobile
          </button>
          <button
            type="button"
            onClick={() => setAuthTab('email')}
            className={`flex-1 py-2.5 text-xs md:text-sm font-semibold transition-all relative ${
              authTab === 'email'
                ? 'text-[#570013] font-bold border-b-2 border-[#570013]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Login with Email
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full">
          {authTab === 'mobile' ? (
            <div className="space-y-4 mb-6">
              <div>
                <div className="w-full border border-gray-300 rounded-2xl p-3.5 flex items-center gap-3 bg-white focus-within:border-[#570013] focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition">
                  <div className="flex items-center gap-1.5 pr-2 border-r border-gray-200 text-sm font-semibold text-slate-700">
                    <span className="text-base">🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {otpSent && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Enter OTP Code</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="1 2 3 4"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full p-3.5 rounded-2xl border border-gray-300 text-center tracking-widest text-lg font-bold text-slate-900 bg-white focus:border-[#570013] focus:outline-none shadow-sm"
                    required
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <div className="w-full border border-gray-300 rounded-2xl p-3.5 flex items-center gap-3 bg-white focus-within:border-[#570013] focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition">
                <span className="material-symbols-outlined text-gray-400 text-xl">mail</span>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none placeholder-gray-400"
                  required
                />
              </div>
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-2xl bg-[#570013] hover:bg-[#72001a] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all mb-8"
          >
            <span>{otpSent ? 'Verify & Login' : 'Send OTP'}</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </form>

        {/* Or Continue With Divider */}
        <div className="w-full relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <span className="relative bg-[#fbf9f5] px-3 text-xs text-gray-400 font-medium">
            Or continue with
          </span>
        </div>

        {/* Social Login Options */}
        <div className="grid grid-cols-3 gap-3.5 w-full mb-8">
          {/* Google Button */}
          <button
            type="button"
            onClick={onSuccess}
            className="flex items-center justify-center p-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:bg-gray-50 active:scale-95 transition"
            aria-label="Login with Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </button>

          {/* Apple Button */}
          <button
            type="button"
            onClick={onSuccess}
            className="flex items-center justify-center p-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:bg-gray-50 active:scale-95 transition"
            aria-label="Login with Apple"
          >
            <svg className="w-5 h-5 fill-slate-900" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.35c.66-.8 1.11-1.92.99-3.04-.96.04-2.13.64-2.81 1.44-.61.71-1.14 1.86-.99 2.97 1.07.08 2.16-.56 2.81-1.37z" />
            </svg>
          </button>

          {/* Facebook Button */}
          <button
            type="button"
            onClick={onSuccess}
            className="flex items-center justify-center p-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:bg-gray-50 active:scale-95 transition"
            aria-label="Login with Facebook"
          >
            <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>
        </div>
      </main>

      {/* Footer Registration Link */}
      <footer className="w-full text-center py-2 text-xs text-slate-500 font-medium">
        <span>New to Matrimony Hub? </span>
        <button
          onClick={() => { setAuthTab('mobile'); setOtpSent(false) }}
          className="font-bold text-[#570013] hover:underline"
        >
          Create Account
        </button>
      </footer>
    </div>
  )
}
