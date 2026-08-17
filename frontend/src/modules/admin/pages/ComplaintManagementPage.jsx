import React, { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { adminDataService } from '../services/adminDataService'

export default function ComplaintManagementPage() {
  const [activeTab, setActiveTab] = useState('Complaints') // 'Complaints' | 'BlockHistory'
  const [complaints, setComplaints] = useState([])
  const [blockHistory, setBlockHistory] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [actionSuccess, setActionSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const [c, bh] = await Promise.all([
        adminDataService.getComplaints(),
        adminDataService.getBlockHistory(),
      ])
      setComplaints(c)
      setBlockHistory(bh)
    } catch (err) {
      setErrorMsg(err?.message || 'Could not load reports and blocks.')
    } finally {
      setIsLoading(false)
    }
  }

  // Maps the UI's action buttons onto the resolution actions the API accepts.
  const RESOLUTION_BY_ACTION = {
    suspend: { action: 'User Suspended', label: 'Reported User Suspended' },
    warn: { action: 'Warning Sent', label: 'Formal Warning Notice Issued' },
    dismiss: { action: 'Dismissed', label: 'Complaint Reviewed & Dismissed' },
  }

  const handleResolveAction = async (complaintId, actionType) => {
    const resolution = RESOLUTION_BY_ACTION[actionType] || RESOLUTION_BY_ACTION.dismiss

    setIsMutating(true)
    setErrorMsg('')
    try {
      // "User Suspended" also suspends the reported account server-side.
      await adminDataService.resolveComplaint(complaintId, resolution.action, resolution.label)
      await loadData()
      setSelectedComplaint(null)
      setActionSuccess(`Action recorded: ${resolution.label}`)
      setTimeout(() => setActionSuccess(''), 4000)
    } catch (err) {
      setErrorMsg(err?.message || 'Could not record this moderation action.')
    } finally {
      setIsMutating(false)
    }
  }

  const filteredComplaints = complaints.filter((item) => {
    return categoryFilter === 'All' || String(item.category).toLowerCase() === categoryFilter.toLowerCase()
  })

  return (
    <AdminLayout title="Reports & Blocks">
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-red-500 font-bold shrink-0">
            ✕
          </button>
        </div>
      )}

      {/* Toast */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-2xs">
          <span className="material-symbols-outlined text-sm">gavel</span>
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#570013]">
            User Reports & Block History
          </h2>
          <p className="text-xs text-[#775a19] font-medium mt-0.5">
            Inspect user reports for fake profiles, abuse, harassment, or spam, and view member block logs.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 bg-white border border-amber-900/20 hover:bg-amber-50 text-[#570013] font-bold rounded-md text-xs flex items-center gap-2 shadow-2xs transition-all self-start sm:self-auto active:scale-95"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* TABS: REPORTS & BLOCKS */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setActiveTab('Complaints')}
          className={`px-3.5 py-2 rounded-md font-extrabold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'Complaints'
              ? 'bg-[#570013] text-amber-100 shadow-xs'
              : 'bg-amber-50/70 text-[#775a19] hover:bg-amber-100/70 border border-amber-200/60'
          }`}
        >
          <span className="material-symbols-outlined text-base">report_problem</span>
          <span>Reports ({complaints.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('BlockHistory')}
          className={`px-3.5 py-2 rounded-md font-extrabold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'BlockHistory'
              ? 'bg-[#570013] text-amber-100 shadow-xs'
              : 'bg-amber-50/70 text-[#775a19] hover:bg-amber-100/70 border border-amber-200/60'
          }`}
        >
          <span className="material-symbols-outlined text-base">block</span>
          <span>Blocks ({blockHistory.length})</span>
        </button>
      </div>

      {/* TAB 1: REPORTS */}
      {activeTab === 'Complaints' && (
        <div className="space-y-4">

          {/* REPORTS TABLE */}
          <div className="bg-white rounded-lg border border-amber-900/15 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#570013] text-amber-100 border-b border-amber-900/40 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-4.5">Report ID</th>
                    <th className="py-4 px-4.5">Category</th>
                    <th className="py-4 px-4.5">Reported Profile</th>
                    <th className="py-4 px-4.5">Reported By</th>
                    <th className="py-4 px-4.5">Date</th>
                    <th className="py-4 px-4.5">Status</th>
                    <th className="py-4 px-4.5 text-right">Moderation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 text-sm">
                  {filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-[#775a19] font-semibold">
                        {isLoading ? 'Loading reports...' : 'No complaints recorded for this category.'}
                      </td>
                    </tr>
                  ) : (
                    filteredComplaints.map((item) => (
                      <tr key={item.id} className="hover:bg-amber-50/60 transition-colors">
                        <td className="py-4 px-4.5 font-mono font-extrabold text-[#570013] text-sm">{item.id}</td>
                        <td className="py-4 px-4.5">
                          <span className="px-2.5 py-1 bg-red-50 text-red-800 font-extrabold rounded-md text-xs border border-red-300 shadow-2xs">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-4 px-4.5 font-extrabold text-stone-900 text-sm">{item.reportedProfileName}</td>
                        <td className="py-4 px-4.5 font-bold text-stone-800 text-xs">{item.reporterUserName}</td>
                        <td className="py-4 px-4.5 text-stone-700 font-mono font-bold text-xs">{item.createdDate}</td>
                        <td className="py-4 px-4.5">
                          <span
                            className={`px-3 py-1 rounded-md text-xs font-extrabold shadow-2xs border ${
                              item.status === 'Resolved'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-900 border-amber-300'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 px-4.5 text-right">
                          <button
                            onClick={() => setSelectedComplaint(item)}
                            className="px-3.5 py-1.5 bg-[#570013] hover:bg-[#42000e] text-amber-100 text-xs font-extrabold rounded-md shadow-xs transition-all active:scale-95"
                          >
                            Inspect & Act
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BLOCK HISTORY */}
      {activeTab === 'BlockHistory' && (
        <div className="bg-white rounded-lg border border-amber-900/15 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#570013] text-amber-100 border-b border-amber-900/40 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-4.5">Block Record ID</th>
                  <th className="py-4 px-4.5">Blocked By Member</th>
                  <th className="py-4 px-4.5">Blocked Profile</th>
                  <th className="py-4 px-4.5">Reason Recorded</th>
                  <th className="py-4 px-4.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10 text-sm">
                {blockHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/60 transition-colors">
                    <td className="py-4 px-4.5 font-mono font-extrabold text-[#570013] text-sm">{item.id}</td>
                    <td className="py-4 px-4.5 font-extrabold text-stone-900 text-sm">{item.blockedByName}</td>
                    <td className="py-4 px-4.5 font-extrabold text-[#570013] text-sm">{item.blockedProfileName}</td>
                    <td className="py-4 px-4.5 text-stone-800 font-bold text-xs">{item.reason}</td>
                    <td className="py-4 px-4.5 text-stone-700 font-mono font-bold text-xs">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPLAINT INSPECTION & ACTION MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-scale-fade">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl relative border border-amber-900/20">
            <div className="flex items-center justify-between border-b border-amber-900/10 pb-3">
              <h3 className="font-display font-extrabold text-lg text-[#570013]">
                Complaint Review: {selectedComplaint.id}
              </h3>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 hover:bg-amber-50 rounded-md text-stone-500"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-red-50/60 rounded-md border border-red-300 space-y-1">
                <span className="font-extrabold text-red-900 uppercase text-xs">
                  Category: {selectedComplaint.category}
                </span>
                <p className="font-bold text-stone-900 text-sm">{selectedComplaint.reason}</p>
                <p className="text-stone-700 font-medium text-xs">{selectedComplaint.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-amber-50/50 p-3.5 rounded-md border border-amber-200">
                <div>
                  <span className="text-stone-500 block text-xs font-medium">Reporter</span>
                  <span className="font-extrabold text-stone-900 text-sm">{selectedComplaint.reporterUserName}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-xs font-medium">Reported Profile</span>
                  <span className="font-extrabold text-[#570013] text-sm">{selectedComplaint.reportedProfileName}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2 border-t border-amber-900/10">
              <span className="text-xs font-extrabold text-[#570013] uppercase tracking-wider">
                Select Administrative Action:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleResolveAction(selectedComplaint.id, 'suspend')}
                  disabled={isMutating}
                  className="px-3.5 py-2 bg-red-700 text-white font-extrabold rounded-md hover:bg-red-800 text-xs shadow-xs active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Suspend User
                </button>
                <button
                  onClick={() => handleResolveAction(selectedComplaint.id, 'warn')}
                  disabled={isMutating}
                  className="px-3.5 py-2 bg-amber-600 text-white font-extrabold rounded-md hover:bg-amber-700 text-xs shadow-xs active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Issue Warning
                </button>
                <button
                  onClick={() => handleResolveAction(selectedComplaint.id, 'dismiss')}
                  disabled={isMutating}
                  className="px-3.5 py-2 bg-stone-200 text-stone-800 font-extrabold rounded-md hover:bg-stone-300 text-xs shadow-xs active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Dismiss Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
