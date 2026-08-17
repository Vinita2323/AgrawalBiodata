import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendOtp } from '../../../services/authService'

export default function CreateAccountScreen({ onBack, onCreateAccount }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    dob: '',
    mobile: '',
    email: '',
    createdFor: 'Myself',
    acceptTerms: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrorMsg('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.acceptTerms) return
    if (!formData.mobile || formData.mobile.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number')
      return
    }

    setIsLoading(true)
    setErrorMsg('')
    try {
      localStorage.setItem('registrationData', JSON.stringify(formData))
      await sendOtp(formData.mobile)
      if (onCreateAccount) {
        onCreateAccount(formData)
      } else {
        navigate('/otp-verification', { state: { mobile: formData.mobile, isNewUser: true, formData } })
      }
    } catch (err) {
      console.error('Send OTP error:', err)
      setErrorMsg(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen text-slate-800 font-body flex flex-col justify-between relative select-none">
      
      {/* Top Subtle Decorative Line */}
      <div className="absolute top-0 left-0 w-full z-50 h-1 bg-gradient-to-r from-transparent via-[#570013]/30 to-transparent" />

      {/* Header Bar */}
      <header className="px-4 pt-5 pb-1">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack || (() => navigate('/welcome'))}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-stone-200/80 hover:bg-stone-50 active:scale-95 transition text-[#570013] shadow-xs shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          
          <div className="px-3 py-1 rounded-full bg-[#570013]/8 border border-[#570013]/15 shrink-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#570013] uppercase tracking-wider whitespace-nowrap">
              Step 1 of 2
            </span>
          </div>
        </div>
        
        <h1 className="text-2xl font-display font-extrabold text-[#570013] tracking-tight mb-1">
          Create Account
        </h1>
        <p className="text-xs text-stone-600 font-medium leading-relaxed">
          Start your journey to find the perfect life partner.
        </p>
      </header>

      {/* Main Content Form inside Card */}
      <main className="flex-1 w-full px-4 py-2 flex flex-col justify-center">
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_4px_25px_rgba(87,0,19,0.06)] border border-amber-900/10">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Profile Created For */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Profile Created For
              </label>
              <div className="relative">
                <select
                  value={formData.createdFor}
                  onChange={(e) => handleChange('createdFor', e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-stone-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-stone-800 appearance-none focus:border-[#570013] focus:bg-white focus:ring-2 focus:ring-[#570013]/10 focus:outline-none shadow-xs pr-8 transition-all cursor-pointer"
                >
                  {['Myself', 'Son', 'Daughter', 'Brother', 'Sister', 'Relative', 'Friend'].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-stone-500 text-[18px] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  keyboard_arrow_down
                </span>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#570013]/10 shadow-xs transition-all">
                <span className="material-symbols-outlined text-stone-400 text-[18px] shrink-0">person</span>
                <input
                  type="text"
                  placeholder="Enter candidate's full name"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-stone-800 focus:outline-none placeholder:text-stone-400 placeholder:font-normal"
                  required
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Mobile Number
              </label>
              <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#570013]/10 shadow-xs transition-all">
                <div className="flex items-center gap-1 pr-2 border-r border-stone-200 text-xs font-bold text-stone-800 shrink-0">
                  <span className="text-sm leading-none">🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-transparent text-xs font-semibold text-stone-800 focus:outline-none placeholder:text-stone-400 placeholder:font-normal tracking-wide"
                  required
                />
              </div>
            </div>

            {/* Gender (Full Width Row) */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Gender
              </label>
              <div className="flex bg-[#FAF8F5] border border-stone-200 rounded-xl p-1 h-[44px] w-full">
                {['Male', 'Female'].map((g) => {
                  const isSelected = formData.gender === g
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleChange('gender', g)}
                      className={`flex-1 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-1.5 px-3 ${
                        isSelected
                          ? 'bg-[#570013] text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] shrink-0">
                        {g === 'Male' ? 'male' : 'female'}
                      </span>
                      <span>{g}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Date of Birth (Full Width Row) */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Date of Birth
              </label>
              <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl px-3 flex items-center gap-2.5 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#570013]/10 shadow-xs transition-all h-[44px] relative">
                <span className="material-symbols-outlined text-stone-400 text-[18px] shrink-0">calendar_today</span>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleChange('dob', e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Email Address <span className="text-rose-600 font-bold">*</span>
              </label>
              <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#570013]/10 shadow-xs transition-all">
                <span className="material-symbols-outlined text-stone-400 text-[18px] shrink-0">mail</span>
                <input
                  type="email"
                  placeholder="example@mail.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-stone-800 focus:outline-none placeholder:text-stone-400 placeholder:font-normal"
                  required
                />
              </div>
            </div>

            {/* Accept Terms Checkbox */}
            <div className="flex items-start gap-2.5 pt-0.5">
              <input
                type="checkbox"
                id="terms"
                checked={formData.acceptTerms}
                onChange={(e) => handleChange('acceptTerms', e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 rounded border-stone-300 text-[#570013] focus:ring-[#570013] cursor-pointer shrink-0 accent-[#570013]"
                required
              />
              <label htmlFor="terms" className="text-[10px] sm:text-[11px] text-stone-600 font-medium leading-tight cursor-pointer">
                By continuing, you agree to our{' '}
                <a href="#terms" className="text-[#570013] font-bold hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#privacy" className="text-[#570013] font-bold hover:underline">Privacy Policy</a>.
              </label>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-rose-500 shrink-0">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading || !formData.fullName || formData.mobile.length < 10 || !formData.dob || !formData.email || !formData.acceptTerms}
                className="w-full py-3 px-5 rounded-xl bg-[#570013] hover:bg-[#72001a] disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Sending OTP...' : 'Proceed to Verify'}</span>
                <span className="material-symbols-outlined text-[16px]">{isLoading ? 'sync' : 'arrow_forward'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-3 text-center">
        <p className="text-xs text-stone-500 font-medium">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-[#570013] font-bold hover:underline cursor-pointer">
            Login here
          </button>
        </p>
      </footer>
    </div>
  )
}

