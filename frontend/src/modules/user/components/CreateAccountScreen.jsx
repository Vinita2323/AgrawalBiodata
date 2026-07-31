import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.acceptTerms) return
    if (onCreateAccount) {
      onCreateAccount(formData)
    } else {
      navigate('/otp-verification', { state: { mobile: formData.mobile, isNewUser: true, formData } })
    }
  }

  return (
    <div className="bg-[#fbf9f5] min-h-screen text-slate-800 font-body flex flex-col relative select-none">
      
      {/* Top Traditional Accent Line */}
      <div className="absolute top-0 left-0 w-full z-50 h-1 bg-gradient-to-r from-transparent via-[#775a19]/50 to-transparent opacity-80" />

      {/* Header Area */}
      <div className="px-4 pt-4 pb-1">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack || (() => navigate('/welcome'))}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#e6dfd1] hover:bg-amber-50 active:scale-95 transition text-[#570013] shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          
          <div className="px-3 py-1 rounded-full bg-[#570013]/5 border border-[#570013]/10">
            <span className="text-[10px] font-bold text-[#570013] uppercase tracking-widest">
              Step 1 of 2
            </span>
          </div>
        </div>
        
        <h1 className="text-2xl font-display font-extrabold text-[#570013] tracking-tight mb-0.5">
          Create Account
        </h1>
        <p className="text-[11px] text-[#775a19] font-medium mb-1">
          Start your journey to find the perfect life partner.
        </p>
      </div>

      {/* Form Area */}
      <main className="flex-1 w-full max-w-sm mx-auto px-4 pb-4">
        
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(87,0,19,0.04)] border border-[#e6dfd1]/60 p-4 relative overflow-hidden">
          {/* Subtle card background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-50 to-transparent rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="space-y-3 relative z-10">
            
            {/* Profile Created For */}
            <div>
              <label className="block text-[10px] font-bold text-[#570013] uppercase tracking-wider mb-1">
                Profile Created For
              </label>
              <div className="relative">
                <select
                  value={formData.createdFor}
                  onChange={(e) => handleChange('createdFor', e.target.value)}
                  className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-2xl px-3 py-2.5 text-[12px] font-semibold text-slate-800 appearance-none focus:border-[#570013] focus:bg-white focus:ring-1 focus:ring-[#570013] focus:outline-none shadow-sm pr-10 transition-all"
                >
                  {['Myself', 'Son', 'Daughter', 'Brother', 'Sister', 'Relative', 'Friend'].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-[#775a19] text-[18px] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-[10px] font-bold text-[#570013] uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-2xl px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                <span className="material-symbols-outlined text-[#775a19] text-[18px]">person</span>
                <input
                  type="text"
                  placeholder="Enter candidate's full name"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400"
                  required
                />
              </div>
            </div>

            {/* Gender & DOB Row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-[#570013] uppercase tracking-wider mb-1">
                  Gender
                </label>
                <div className="flex bg-[#fbf9f5] border border-[#e6dfd1] rounded-2xl overflow-hidden shadow-sm p-0.5 h-[40px]">
                  {['Male', 'Female'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleChange('gender', g)}
                      className={`flex-1 text-[11px] font-bold transition rounded-[14px] flex items-center justify-center gap-1 min-w-0 px-1 ${
                        formData.gender === g
                          ? 'bg-[#570013] text-[#ffdea5] shadow-md'
                          : 'text-slate-500 hover:bg-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px] shrink-0">
                        {g === 'Male' ? 'male' : 'female'}
                      </span>
                      <span className="truncate">{g}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#570013] uppercase tracking-wider mb-1">
                  Date of Birth
                </label>
                <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-2xl px-2 flex items-center gap-1 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all h-[40px]">
                  <span className="material-symbols-outlined text-[#775a19] text-[15px] shrink-0 pl-0.5">calendar_month</span>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleChange('dob', e.target.value)}
                    className="w-full min-w-0 bg-transparent text-[11px] font-semibold text-slate-800 focus:outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-[10px] font-bold text-[#570013] uppercase tracking-wider mb-1">
                Mobile Number
              </label>
              <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-2xl px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                <div className="flex items-center gap-1 pr-2 border-r border-[#e6dfd1] text-[12px] font-extrabold text-[#570013]">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400 tracking-wide"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[10px] font-bold text-[#570013] uppercase tracking-wider mb-1">
                Email <span className="font-medium text-slate-400 normal-case tracking-normal">(Optional)</span>
              </label>
              <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-2xl px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                <span className="material-symbols-outlined text-[#775a19] text-[18px]">mail</span>
                <input
                  type="email"
                  placeholder="example@mail.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400"
                />
              </div>
            </div>

            {/* Accept Terms Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={formData.acceptTerms}
                onChange={(e) => handleChange('acceptTerms', e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 rounded text-[#570013] focus:ring-[#570013] border-[#e6dfd1]"
                required
              />
              <label htmlFor="terms" className="text-[11px] text-slate-600 font-medium leading-relaxed">
                By continuing, you agree to our{' '}
                <a href="#terms" className="text-[#570013] font-bold hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#privacy" className="text-[#570013] font-bold hover:underline">Privacy Policy</a>.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!formData.fullName || formData.mobile.length < 10 || !formData.dob || !formData.acceptTerms}
              className="w-full py-3 mt-2 rounded-2xl bg-[#570013] hover:bg-[#72001a] disabled:bg-[#e6dfd1] disabled:text-slate-400 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>Proceed to Verify</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-5">
          <p className="text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-[#570013] font-bold hover:underline">
              Login here
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
