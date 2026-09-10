import React, { useState } from 'react'

export default function BlockModal({ isOpen, onClose, targetId, displayName, onSubmitBlock }) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const categories = [
    'Inappropriate Behavior',
    'Spam/Fake Profile',
    'Harassment',
    'Not Interested',
    'Child Safety Concern',
    'Other'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason) return

    setIsSubmitting(true)
    try {
      await onSubmitBlock({ reason })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-amber-100">
          <h2 className="font-display font-bold text-[#570013] flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600">block</span>
            Block {displayName}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto">
          <p className="text-sm text-slate-600 mb-4">
            Are you sure you want to block <strong>{displayName}</strong>? They will no longer be able to view your profile, send you interests, or message you.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#570013] mb-1">
                Reason for Blocking <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-sm p-2 border border-amber-200 rounded-lg bg-amber-50/30 focus:outline-none focus:border-amber-400"
              >
                <option value="" disabled>Select a reason...</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-amber-100 flex justify-end gap-3 bg-slate-50 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? 'Blocking...' : 'Block User'}
          </button>
        </div>
      </div>
    </div>
  )
}
