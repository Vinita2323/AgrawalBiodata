import React, { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { adminDataService } from '../services/adminDataService'

export default function AuditLogPage() {
  const [logs, setLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = () => {
    const data = adminDataService.getAuditLogs()
    setLogs(data)
  }

  const filtered = logs.filter((log) => {
    return (
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  return (
    <AdminLayout title="System Audit Trail">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-stone-900">
            Administrative Action Audit History
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Complete immutable audit log tracking every admin operation, verification approval, user suspension, and CMS modification.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="px-3.5 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          <span>Refresh Audit Stream</span>
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-sm">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit action, admin user, target profile or ID..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
          />
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Log ID</th>
                <th className="py-3.5 px-4">Action Performed</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">Admin User</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-stone-400">
                    No audit records match search query.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-800">{log.id}</td>
                    <td className="py-3.5 px-4 font-bold text-[#570013]">{log.action}</td>
                    <td className="py-3.5 px-4 font-semibold text-stone-800">{log.target}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-stone-900 block">{log.adminName}</span>
                      <span className="text-[10px] text-amber-800 font-medium">{log.adminRole}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-500 text-[11px]">{log.timestamp}</td>
                    <td className="py-3.5 px-4 text-stone-600 max-w-xs truncate">{log.details}</td>
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
