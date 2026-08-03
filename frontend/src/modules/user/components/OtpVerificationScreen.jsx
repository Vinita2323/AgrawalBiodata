import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function OtpVerificationScreen({ mobileNumber, isNewUser, onVerifySuccess, onChangeNumber }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  const targetMobile = mobileNumber || location.state?.mobile || '9876543210'
  const isNew = isNewUser ?? location.state?.isNewUser ?? true

  const [otp, setOtp] = useState(['1', '2', '3', '4', '5', '6']) // Pre-filled simulation
  const [timer, setTimer] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ]

  useEffect(() => {
    let interval = null
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
    } else {
      setCanResend(true)
    }
    return () => clearInterval(interval)
  }, [timer])

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setErrorMsg('')

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handleResend = () => {
    if (!canResend) return
    setTimer(30)
    setCanResend(false)
    setOtp(['1', '2', '3', '4', '5', '6'])
    setErrorMsg('')
  }

  const handleVerify = () => {
    const fullOtp = otp.join('')
    if (fullOtp.length < 6) {
      setErrorMsg('Please enter all 6 digits of the OTP')
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)

      setTimeout(() => {
        if (onVerifySuccess) {
          onVerifySuccess(location.state?.formData)
        } else if (isNew) {
          navigate('/account-created', { state: { formData: location.state?.formData } })
        } else {
          navigate('/home')
        }
      }, 1000)
    }, 1200)
  }

  return (
    <div className="bg-[#fbf9f5] min-h-screen text-slate-800 font-body flex flex-col justify-between p-5 relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between w-full pt-1 pb-3">
        <button
          onClick={onChangeNumber || (() => navigate(-1))}
          className="p-2 rounded-full hover:bg-gray-100/80 active:scale-95 transition text-slate-800"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined text-2xl block">arrow_back</span>
        </button>
        <span className="text-xs font-bold text-[#775a19] bg-amber-100/70 px-3 py-1 rounded-full border border-amber-300/60">
          Verification
        </span>
      </div>

      {/* Main Form */}
      <main className="w-full max-w-sm mx-auto my-auto flex flex-col items-center py-4">
        {isSuccess ? (
          <div className="flex flex-col items-center text-center animate-scale-fade my-8">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-lg">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">OTP Verified Successfully!</h2>
            <p className="text-xs text-slate-500 font-medium">Redirecting you to next step...</p>
          </div>
        ) : (
          <>
            {/* Header Title */}
            <div className="w-16 h-16 rounded-full bg-amber-100/80 text-[#570013] flex items-center justify-center mb-4 border border-amber-300/60 shadow-sm">
              <span className="material-symbols-outlined text-3xl">sms</span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1 text-center">
              Verify OTP
            </h1>
            <p className="text-xs text-slate-500 font-medium mb-1 text-center">
              We sent a 6-digit verification code to
            </p>
            <div className="flex items-center gap-1.5 mb-6 text-xs font-bold text-slate-900">
              <span>+91 {targetMobile}</span>
              <button
                onClick={onChangeNumber || (() => navigate(-1))}
                className="text-[#570013] underline font-semibold text-[11px] ml-1"
              >
                Change
              </button>
            </div>

            {/* 6 Digit OTP Inputs */}
            <div className="flex items-center justify-center gap-2 mb-6 w-full">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-11 h-12 text-center text-lg font-bold rounded-md border transition shadow-sm focus:outline-none ${
                    errorMsg
                      ? 'border-red-500 bg-red-50/50 text-red-600'
                      : digit
                      ? 'border-[#570013] bg-white text-slate-900'
                      : 'border-gray-300 bg-white text-slate-900 focus:border-[#570013]'
                  }`}
                />
              ))}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <p className="text-xs text-red-600 font-bold mb-4 text-center flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{errorMsg}</span>
              </p>
            )}

            {/* Timer & Resend OTP */}
            <div className="flex items-center justify-center text-xs font-semibold mb-8 text-slate-600">
              {canResend ? (
                <button
                  onClick={handleResend}
                  className="text-[#570013] font-bold underline hover:text-[#72001a]"
                >
                  Resend OTP Code
                </button>
              ) : (
                <span>
                  Resend OTP in <span className="text-[#570013] font-bold">00:{timer < 10 ? `0${timer}` : timer}</span>
                </span>
              )}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={isSubmitting || otp.some((d) => !d)}
              className="w-full py-3.5 px-6 rounded-md bg-[#570013] hover:bg-[#72001a] disabled:bg-gray-300 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify & Proceed</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </>
              )}
            </button>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-2 text-[11px] text-slate-400 font-medium">
        Didn't receive SMS? Check your signal or phone settings.
      </footer>
    </div>
  )
}
