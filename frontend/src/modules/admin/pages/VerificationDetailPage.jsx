import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { adminDataService } from '../services/adminDataService'

export default function VerificationDetailPage() {
  const { verificationId } = useParams()
  const navigate = useNavigate()

  const [req, setReq] = useState(null)
  const [activeDocModal, setActiveDocModal] = useState(null) // 'govt' | 'prof'
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReasonSelect, setRejectionReasonSelect] = useState('Blurred / Unreadable Document')
  const [customNotes, setCustomNotes] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  useEffect(() => {
    if (verificationId) {
      const found = adminDataService.getVerificationById(verificationId)
      setReq(found)
    }
  }, [verificationId])

  if (!req) {
    return (
      <AdminLayout title="Verification Details">
        <div className="bg-white rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto my-12 border border-stone-200">
          <span className="material-symbols-outlined text-4xl text-stone-300">find_in_page</span>
          <h3 className="font-display font-bold text-lg text-stone-800">Verification Request Not Found</h3>
          <p className="text-xs text-stone-500">The requested verification record does not exist.</p>
          <Link
            to="/admin/profile-verification"
            className="inline-block px-4 py-2 bg-[#570013] text-white font-semibold text-xs rounded-xl"
          >
            Back to Queue
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const handleApprove = () => {
    const updated = adminDataService.approveVerification(req.id)
    setReq(updated)
    setActionSuccess('Verification Approved! Verified Badge is now active on customer profile.')
  }

  const handleConfirmReject = () => {
    const fullReason = `${rejectionReasonSelect}${customNotes ? `: ${customNotes}` : ''}`
    const updated = adminDataService.rejectVerification(req.id, fullReason)
    setReq(updated)
    setShowRejectModal(false)
    setActionSuccess('Verification request rejected and notification recorded.')
  }

  return (
    <AdminLayout title={`Verification: ${req.id}`}>
      {/* SUCCESS TOAST ALERT */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess('')}
            className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-lg"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-amber-900/15 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/profile-verification')}
            className="p-2 hover:bg-amber-50 rounded-md text-stone-600 transition-colors"
            title="Back to Verification List"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-extrabold text-[#570013]">
                Verification Review: {req.profileName}
              </h2>
              <span
                className={`px-3 py-1 rounded-md text-xs font-extrabold border shadow-2xs ${
                  req.status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : req.status === 'Pending'
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-red-50 text-red-800 border-red-300'
                }`}
              >
                {req.status}
              </span>
            </div>
            <p className="text-xs text-[#775a19] font-mono font-bold mt-0.5">
              Request ID: {req.id} • Submitted: {req.submittedAt}
            </p>
          </div>
        </div>

        {/* DECISION ACTION BUTTONS */}
        {req.status === 'Pending' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRejectModal(true)}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 font-extrabold rounded-md text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
              <span>Reject Request</span>
            </button>

            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-[#570013] hover:bg-[#42000e] text-amber-100 font-extrabold rounded-md text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>Approve & Grant Verified Badge</span>
            </button>
          </div>
        )}
      </div>

      {/* VERIFICATION CHECKLIST REVIEW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Checklist */}
        <div className="bg-white rounded-lg p-5 border border-amber-900/15 shadow-xs space-y-4">
          <h3 className="font-display font-extrabold text-base text-[#570013] border-b border-stone-100 pb-3">
            Verification Requirements Status
          </h3>

          <div className="space-y-3 text-xs">
            {/* Mobile Verification */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-800 block">Mobile OTP Verification</span>
                <span className="text-[10px] font-mono text-stone-500">{req.mobile}</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">check</span>
                <span>Verified</span>
              </span>
            </div>

            {/* Email Verification */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-800 block">Email Verification</span>
                <span className="text-[10px] font-mono text-stone-500">{req.email}</span>
              </div>
              {req.emailVerified ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check</span>
                  <span>Verified</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-md">
                  Pending
                </span>
              )}
            </div>

            {/* Government ID */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-950 block">Government ID Document</span>
                <span className="text-[10px] font-semibold text-amber-800">{req.govtIdType}</span>
              </div>
              <button
                onClick={() => setActiveDocModal('govt')}
                className="px-2.5 py-1 bg-[#775a19] text-white text-[10px] font-bold rounded-lg hover:bg-[#5e4713]"
              >
                View Document
              </button>
            </div>

            {/* Professional Document */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-950 block">Professional Document</span>
                <span className="text-[10px] font-semibold text-amber-800">{req.profDocType}</span>
              </div>
              {req.profDocUrl ? (
                <button
                  onClick={() => setActiveDocModal('prof')}
                  className="px-2.5 py-1 bg-[#775a19] text-white text-[10px] font-bold rounded-lg hover:bg-[#5e4713]"
                >
                  View Document
                </button>
              ) : (
                <span className="text-[10px] text-stone-400 font-semibold">N/A</span>
              )}
            </div>
          </div>
        </div>

        {/* Candidate Profile Details & Document Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Overview Card */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-base text-stone-900 border-b border-stone-100 pb-3">
              Candidate Profile Information
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-stone-400 block text-[10px]">Candidate Full Name</span>
                <span className="font-bold text-stone-800">{req.profileName}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">Account Holder</span>
                <span className="font-bold text-stone-800">{req.userName}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">Associated Profile ID</span>
                <span className="font-bold text-stone-800 font-mono">{req.profileId}</span>
              </div>
            </div>

            {req.rejectionReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                <span className="font-bold block">Rejection Note Recorded:</span>
                <p>{req.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Inline Document Preview Box */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-display font-bold text-base text-stone-900">
                Submitted Document Preview ({req.govtIdType})
              </h3>
              <span className="text-xs text-[#775a19] font-bold">Encrypted Document Inspection</span>
            </div>

            <div className="bg-stone-100 rounded-xl overflow-hidden border border-stone-200 p-2 flex justify-center max-h-96">
              <img
                src={req.govtIdDocUrl}
                alt="Government ID Proof"
                className="max-h-88 object-contain rounded-lg shadow-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {activeDocModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-scale-fade">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-display font-bold text-base text-stone-900">
                Document Viewer - {activeDocModal === 'govt' ? req.govtIdType : req.profDocType}
              </h3>
              <button
                onClick={() => setActiveDocModal(null)}
                className="p-1 hover:bg-stone-100 rounded-lg text-stone-500"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="bg-stone-900 rounded-xl p-4 flex justify-center max-h-[70vh] overflow-auto">
              <img
                src={activeDocModal === 'govt' ? req.govtIdDocUrl : req.profDocUrl}
                alt="Document proof"
                className="max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON WORKFLOW MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-scale-fade">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">gavel</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-stone-900">
                  Reject Verification Request
                </h3>
                <p className="text-xs text-stone-500">Provide structured rejection grounds</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Select Rejection Category</label>
                <select
                  value={rejectionReasonSelect}
                  onChange={(e) => setRejectionReasonSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/40"
                >
                  <option value="Blurred / Unreadable Document">Blurred / Unreadable Document</option>
                  <option value="Name Mismatch on Identity Record">Name Mismatch on Identity Record</option>
                  <option value="Expired Identity Proof">Expired Identity Proof</option>
                  <option value="Invalid Professional Degree/Certificate">Invalid Professional Degree/Certificate</option>
                  <option value="Fraudulent Document Image">Fraudulent Document Image</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Additional Moderator Remarks</label>
                <textarea
                  rows="3"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Enter details for candidate guidance..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
