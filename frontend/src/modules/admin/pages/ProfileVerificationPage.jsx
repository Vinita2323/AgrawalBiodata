import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { adminDataService } from '../services/adminDataService'

export default function ProfileVerificationPage() {
  const [searchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || 'All'

  const [verifications, setVerifications] = useState([])
  const [statusTab, setStatusTab] = useState(initialStatus) // 'All' | 'Pending' | 'Approved' | 'Rejected'
  const [docTypeFilter, setDocTypeFilter] = useState('All') // 'All' | 'Government ID' | 'Professional'
  const [searchTerm, setSearchTerm] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    loadVerifications()
  }, [])

  const loadVerifications = async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      setVerifications(await adminDataService.getVerifications())
    } catch (err) {
      setErrorMsg(err?.message || 'Could not load the verification queue.')
    } finally {
      setIsLoading(false)
    }
  }

  const q = searchTerm.toLowerCase()
  const filtered = verifications.filter((v) => {
    const matchesTab = statusTab === 'All' || String(v.status).toLowerCase() === statusTab.toLowerCase()
    const matchesDocType =
      docTypeFilter === 'All' ||
      (docTypeFilter === 'Government ID' ? v.govtIdType : v.profDocType)
    const matchesSearch =
      String(v.profileName).toLowerCase().includes(q) ||
      String(v.userName).toLowerCase().includes(q) ||
      String(v.id).toLowerCase().includes(q)

    return matchesTab && matchesDocType && matchesSearch
  })

  return (
    <AdminLayout title="Profile Verification Management">
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#570013]">
            Profile Verification Queue
          </h2>
          <p className="text-xs text-[#775a19] font-medium mt-0.5">
            Review identity proofs (Aadhaar/PAN/Passport) & professional document submissions to grant verified badges.
          </p>
        </div>

        <button
          onClick={loadVerifications}
          className="px-3.5 py-2 bg-white border border-amber-900/20 hover:bg-amber-50 text-[#570013] font-bold rounded-md text-xs flex items-center gap-2 shadow-2xs transition-all self-start sm:self-auto active:scale-95"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* VERIFICATION TABS & FILTERS */}
      <div className="bg-white rounded-lg p-4 border border-amber-900/15 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-amber-900/10 pb-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => {
              const count =
                tab === 'All'
                  ? verifications.length
                  : verifications.filter((v) => v.status.toLowerCase() === tab.toLowerCase()).length

              return (
                <button
                  key={tab}
                  onClick={() => setStatusTab(tab)}
                  className={`px-3.5 py-2 rounded-md text-xs font-extrabold transition-all flex items-center gap-2 ${
                    statusTab.toLowerCase() === tab.toLowerCase()
                      ? 'bg-[#570013] text-amber-100 shadow-xs'
                      : 'bg-amber-50/70 text-[#775a19] hover:bg-amber-100/70 border border-amber-200/60'
                  }`}
                >
                  <span>{tab} Requests</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      statusTab.toLowerCase() === tab.toLowerCase()
                        ? 'bg-amber-400 text-[#570013]'
                        : 'bg-amber-200/80 text-[#570013]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#775a19] text-base">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search request ID, candidate profile name or account user..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-amber-900/20 rounded-md text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40 placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* VERIFICATIONS TABLE */}
      <div className="bg-white rounded-lg border border-amber-900/15 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#570013] text-amber-100 border-b border-amber-900/40 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-4.5">Request ID</th>
                <th className="py-4 px-4.5">Candidate Profile</th>
                <th className="py-4 px-4.5">User Account</th>
                <th className="py-4 px-4.5">Document Type</th>
                <th className="py-4 px-4.5">Submission Date</th>
                <th className="py-4 px-4.5">Status</th>
                <th className="py-4 px-4.5 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-[#775a19] font-semibold">
                    {isLoading
                      ? 'Loading verification queue...'
                      : 'No verification requests match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/60 transition-colors">
                    <td className="py-4 px-4.5 font-mono font-bold text-xs text-[#570013]">{item.id}</td>
                    <td className="py-4 px-4.5">
                      <p className="font-bold text-base text-[#570013]">{item.profileName}</p>
                      <p className="text-xs font-mono text-[#775a19] font-bold mt-0.5">{item.profileId}</p>
                    </td>
                    <td className="py-4 px-4.5">
                      <p className="font-bold text-sm text-stone-900">{item.userName}</p>
                      <p className="text-xs text-stone-600 font-medium mt-0.5">{item.mobile}</p>
                    </td>
                    <td className="py-4 px-4.5">
                      <span className="px-3 py-1 bg-amber-100/80 text-[#570013] border border-amber-300 font-extrabold rounded-md text-xs inline-flex items-center gap-1.5 shadow-2xs">
                        <span className="material-symbols-outlined text-sm">badge</span>
                        <span>{item.govtIdType}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4.5 text-stone-700 font-mono text-xs font-semibold">
                      {item.submittedAt}
                    </td>
                    <td className="py-4 px-4.5">
                      <span
                        className={`px-3 py-1 rounded-md text-xs font-extrabold inline-flex items-center gap-1.5 border shadow-2xs ${
                          item.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : item.status === 'Pending'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-red-50 text-red-800 border-red-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4.5 text-right">
                      <Link
                        to={`/admin/profile-verification/${item.id}`}
                        className="px-3.5 py-1.5 bg-[#570013] hover:bg-[#42000e] text-amber-100 text-xs font-extrabold rounded-md inline-flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                      >
                        <span>Review</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
