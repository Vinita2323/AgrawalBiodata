import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  submitVerification,
  getVerificationStatus,
} from '../../../services/verificationService'
import { isAuthenticated } from '../../../services/authService'

const DOCUMENT_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Passport',
  'Voter ID',
  'Driving License',
]

const MAX_FILE_BYTES = 5 * 1024 * 1024

const STATUS_STYLES = {
  Approved: {
    wrapper: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: 'verified',
    heading: 'Your profile is verified',
  },
  Pending: {
    wrapper: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: 'hourglass_top',
    heading: 'Verification under review',
  },
  Rejected: {
    wrapper: 'bg-red-50 border-red-200 text-red-800',
    icon: 'cancel',
    heading: 'Verification rejected',
  },
}

/** File picker tile that shows the selected file name and size. */
function FilePicker({ id, label, hint, file, onChange, required }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <label
        htmlFor={id}
        className="flex items-center gap-3 p-3 bg-white border border-dashed border-amber-300 rounded-xl cursor-pointer hover:border-[#570013] transition"
      >
        <span className="material-symbols-outlined text-2xl text-[#775a19]">upload_file</span>
        <div className="min-w-0 flex-1">
          {file ? (
            <>
              <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
              <p className="text-[10px] text-slate-500 font-semibold">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-slate-700">Tap to choose a file</p>
              <p className="text-[10px] text-slate-400 font-semibold">{hint}</p>
            </>
          )}
        </div>
        {file && <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>}
      </label>
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </div>
  )
}

export default function VerificationScreen({ onBack }) {
  const navigate = useNavigate()

  const [status, setStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0])
  const [documentNumber, setDocumentNumber] = useState('')
  const [idProof, setIdProof] = useState(null)
  const [professionProof, setProfessionProof] = useState(null)
  const [addressProof, setAddressProof] = useState(null)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    if (!isAuthenticated()) {
      setIsLoading(false)
      setErrorMsg('Please log in to submit verification documents.')
      return
    }

    setIsLoading(true)
    try {
      const res = await getVerificationStatus()
      setStatus(res || null)
    } catch (err) {
      setErrorMsg(err?.message || 'Could not load your verification status.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!idProof) {
      setErrorMsg('A government ID proof is required.')
      return
    }

    // Guard client-side too: the API rejects oversized uploads, but failing
    // here saves the user a slow upload that was never going to succeed.
    const oversized = [idProof, professionProof, addressProof]
      .filter(Boolean)
      .find((f) => f.size > MAX_FILE_BYTES)
    if (oversized) {
      setErrorMsg(`"${oversized.name}" is larger than the 5MB limit.`)
      return
    }

    const formData = new FormData()
    formData.append('documentType', documentType)
    if (documentNumber.trim()) formData.append('documentNumber', documentNumber.trim())
    formData.append('idProof', idProof)
    if (professionProof) formData.append('professionProof', professionProof)
    if (addressProof) formData.append('addressProof', addressProof)

    setIsSubmitting(true)
    try {
      await submitVerification(formData)
      setSuccessMsg('Documents submitted. Our team will review them shortly.')
      setIdProof(null)
      setProfessionProof(null)
      setAddressProof(null)
      setDocumentNumber('')
      await loadStatus()
    } catch (err) {
      setErrorMsg(err?.message || 'Could not submit your documents. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

  const currentStatus = status?.verificationStatus
  const statusStyle = STATUS_STYLES[currentStatus]
  const latest = status?.latestSubmission

  // An approved profile has nothing left to submit; a pending one should not
  // be able to queue duplicates.
  const canSubmit = currentStatus !== 'Approved' && currentStatus !== 'Pending'

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
          <span className="font-display font-bold text-[15px] text-[#570013]">Profile Verification</span>
          <div className="w-8"></div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-[#6e0b18] via-[#7d0d1c] to-[#50040f] text-white px-5 py-6 text-center shadow-md">
        <div className="w-12 h-12 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center mx-auto mb-2">
          <span className="material-symbols-outlined text-2xl">verified_user</span>
        </div>
        <h1 className="font-display font-extrabold text-xl mb-1 text-amber-200">Get Verified</h1>
        <p className="text-xs text-amber-100/80 max-w-xs mx-auto font-medium">
          Verified profiles earn a trust badge and appear higher in match results.
        </p>
      </div>

      <div className="p-4 max-w-2xl mx-auto w-full space-y-5">
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-red-500 font-bold shrink-0">
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10 text-xs text-slate-400 font-semibold">
            Loading verification status...
          </div>
        ) : (
          <>
            {/* Current status */}
            {statusStyle && (
              <div className={`p-4 rounded-xl border ${statusStyle.wrapper}`}>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-xl">{statusStyle.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold">{statusStyle.heading}</p>
                    {currentStatus === 'Rejected' && latest?.rejectionReason && (
                      <p className="text-[11px] font-semibold mt-1 leading-relaxed">
                        Reason: {latest.rejectionReason}
                      </p>
                    )}
                    {currentStatus === 'Pending' && (
                      <p className="text-[11px] font-semibold mt-1 leading-relaxed">
                        Submitted on{' '}
                        {latest?.submittedAt
                          ? new Date(latest.submittedAt).toLocaleDateString()
                          : 'recently'}
                        . Reviews usually complete within 48 hours.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submission form */}
            {canSubmit ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-white rounded-xl border border-amber-200/80 shadow-2xs p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Government ID Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
                    >
                      {DOCUMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Document Number
                    </label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="Optional, helps speed up review"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
                    />
                  </div>

                  <FilePicker
                    id="idProof"
                    label="Government ID Proof"
                    hint="JPG, PNG or PDF, up to 5MB"
                    file={idProof}
                    onChange={setIdProof}
                    required
                  />

                  <FilePicker
                    id="professionProof"
                    label="Profession / Education Proof"
                    hint="Offer letter, degree or council registration"
                    file={professionProof}
                    onChange={setProfessionProof}
                  />

                  <FilePicker
                    id="addressProof"
                    label="Address Proof"
                    hint="Utility bill or rental agreement"
                    file={addressProof}
                    onChange={setAddressProof}
                  />
                </div>

                <p className="text-[11px] text-slate-500 font-medium leading-relaxed px-1">
                  Your documents are reviewed only by authorised moderators and are never shown on
                  your public profile.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || !idProof}
                  className="w-full py-3.5 bg-[#570013] hover:bg-[#72001a] text-white font-bold rounded-lg text-sm shadow-lg active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Uploading...' : 'Submit for Verification'}
                </button>
              </form>
            ) : (
              currentStatus === 'Approved' && (
                <div className="text-center py-8 bg-white rounded-xl border border-amber-200/80">
                  <span className="material-symbols-outlined text-4xl text-emerald-500 block mb-2">
                    workspace_premium
                  </span>
                  <p className="text-sm font-bold text-slate-800">
                    Your verified badge is active
                  </p>
                  <p className="text-xs text-slate-400 mt-1 px-6">
                    Nothing more to do here. Your profile shows the verified badge to all members.
                  </p>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  )
}
