import React, { useState } from 'react'

export default function AuthScreen({ onBack, onSuccess }) {
  const [tab, setTab] = useState('login')
  const [authMethod, setAuthMethod] = useState('mobile')
  const [mobile, setMobile] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSendOtp = (e) => {
    e.preventDefault()
    if (mobile.length >= 10) {
      setOtpSent(true)
    }
  }

  const handleVerify = (e) => {
    e.preventDefault()
    setIsSuccess(true)
    if (onSuccess) onSuccess()
  }

  return (
    <div className="bg-[#fbf9f5] text-[#1b1c1a] font-body min-h-screen flex flex-col justify-between p-4 md:p-8 relative">
      {/* Top Header */}
      <header className="flex justify-between items-center max-w-4xl mx-auto w-full py-4 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold text-[#570013] hover:opacity-80 transition"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Return Home</span>
        </button>
        <img src="/Logo (2).png" alt="Vows of Elegance" className="h-8 sm:h-9 w-auto object-contain" />
        <div className="w-12" />
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto w-full my-auto bg-white p-6 md:p-8 rounded-3xl border border-amber-200/80 shadow-2xl z-10">
        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#570013] mb-2">Welcome Back!</h2>
            <p className="text-xs text-gray-600 mb-6">
              Authentication successful. Redirecting to your verified Agrawal Biodata dashboard...
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="px-6 py-2.5 rounded-full bg-[#570013] text-[#ffdea5] text-xs font-bold shadow-md"
            >
              Continue to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Toggle Tabs */}
            <div className="flex bg-amber-50 p-1 rounded-2xl mb-6">
              <button
                onClick={() => setTab('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  tab === 'login' ? 'bg-[#570013] text-[#ffdea5] shadow-md' : 'text-gray-600'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab('signup')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  tab === 'signup' ? 'bg-[#570013] text-[#ffdea5] shadow-md' : 'text-gray-600'
                }`}
              >
                Register Biodata
              </button>
            </div>

            <div className="text-center mb-6">
              <h2 className="font-display text-2xl font-bold text-[#570013] mb-1">
                {tab === 'login' ? 'Agrawal Member Login' : 'Create Biodata Account'}
              </h2>
              <p className="text-xs text-gray-500">
                {tab === 'login' ? 'Enter your details to access verified matches' : 'Register to connect with noble Agrawal families'}
              </p>
            </div>

            {/* Auth Method Switch */}
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={() => { setAuthMethod('mobile'); setOtpSent(false) }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                  authMethod === 'mobile' ? 'bg-amber-100 text-[#570013] font-bold' : 'text-gray-500'
                }`}
              >
                Mobile OTP
              </button>
              <button
                onClick={() => setAuthMethod('email')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                  authMethod === 'email' ? 'bg-amber-100 text-[#570013] font-bold' : 'text-gray-500'
                }`}
              >
                Email & Password
              </button>
            </div>

            {/* Form */}
            {authMethod === 'mobile' ? (
              <form onSubmit={otpSent ? handleVerify : handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number</label>
                  <div className="flex rounded-xl border border-gray-300 overflow-hidden focus-within:border-[#570013]">
                    <span className="bg-gray-100 text-gray-600 px-3 py-3 text-xs font-semibold flex items-center">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full p-3 text-sm focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {otpSent && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Enter 4-Digit OTP</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="1 2 3 4"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-300 text-center tracking-widest text-lg font-bold focus:border-[#570013]"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#570013] text-[#ffdea5] font-bold text-sm hover:bg-[#800020] transition shadow-lg"
                >
                  {otpSent ? 'Verify & Continue' : 'Get OTP Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="member@agrawal.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:border-[#570013]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:border-[#570013]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#570013] text-[#ffdea5] font-bold text-sm hover:bg-[#800020] transition shadow-lg"
                >
                  {tab === 'login' ? 'Sign In' : 'Register Account'}
                </button>
              </form>
            )}

            {/* Social Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <span className="relative bg-white px-3 text-xs text-gray-400 font-semibold">
                Or Continue With
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsSuccess(true)}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-700 transition"
              >
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSuccess(true)}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-700 transition"
              >
                <span>WhatsApp</span>
              </button>
            </div>
          </>
        )}
      </main>

      <footer className="text-center py-4 text-xs text-gray-500 z-10">
        Secured with end-to-end encryption & privacy standards
      </footer>
    </div>
  )
}
