import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { adminDataService } from '../services/adminDataService'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [pendingVerifications, setPendingVerifications] = useState([])
  const [recentAuditLogs, setRecentAuditLogs] = useState([])
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setErrorMsg('')
    try {
      const [kpis, users, verifications, logs] = await Promise.all([
        adminDataService.getDashboardMetrics(),
        adminDataService.getUsers({ limit: 5 }),
        adminDataService.getVerifications({ status: 'Pending', limit: 10 }),
        adminDataService.getAuditLogs({ limit: 4 }),
      ])

      setMetrics(kpis)
      setRecentUsers(users.slice(0, 5))
      setPendingVerifications(verifications.filter((v) => v.status === 'Pending'))
      setRecentAuditLogs(logs.slice(0, 4))
    } catch (err) {
      setErrorMsg(err?.message || 'Could not load dashboard data.')
    }
  }

  if (!metrics) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-sm">
          {errorMsg ? (
            <>
              <span className="material-symbols-outlined text-3xl text-red-400">error</span>
              <p className="text-red-700 font-bold">{errorMsg}</p>
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 bg-[#570013] text-amber-100 font-bold rounded-md text-xs"
              >
                Retry
              </button>
            </>
          ) : (
            <span className="text-stone-500">Loading operational dashboard data...</span>
          )}
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Dashboard Overview">
      {/* Welcome Banner */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{errorMsg}</span>
          </div>
          <button onClick={loadDashboardData} className="text-red-700 underline font-bold shrink-0">
            Retry
          </button>
        </div>
      )}

      <div className="bg-gradient-to-r from-[#570013] via-[#800020] to-[#775a19] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-semibold text-amber-200 uppercase tracking-wider">
            Matrimony Hub Operations
          </span>
          <h2 className="font-display text-2xl font-bold mt-2">
            Real-Time Platform Dashboard
          </h2>
          <p className="text-xs text-amber-100/90 mt-1 max-w-2xl leading-relaxed">
            Monitor user registrations, matrimonial profiles, verification requests, daily matches, revenue performance, and system moderation.
          </p>
        </div>
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* FRD KPI CARDS GRID (COMPACT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* 1. Total Registered Users */}
        <div className="bg-white rounded-xl p-3.5 border border-stone-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Total Users
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-[#570013] flex items-center justify-center">
              <span className="material-symbols-outlined text-base">group</span>
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="font-display text-xl font-bold text-stone-900">
              {metrics.totalUsers}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              +12%
            </span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 truncate">Total accounts created</p>
        </div>

        {/* 2. Active Users */}
        <div className="bg-white rounded-xl p-3.5 border border-stone-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Active Users
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">person_check</span>
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="font-display text-xl font-bold text-stone-900">
              {metrics.activeUsers}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {Math.round((metrics.activeUsers / (metrics.totalUsers || 1)) * 100)}%
            </span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 truncate">Verified & non-suspended</p>
        </div>

        {/* 3. Pending Verifications */}
        <div
          onClick={() => navigate('/admin/profile-verification?status=pending')}
          className="bg-white rounded-xl p-3.5 border border-amber-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer group hover:border-[#775a19]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              Pending Verify
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-[#775a19] flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-base">verified</span>
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="font-display text-xl font-bold text-amber-950">
              {metrics.pendingVerifications}
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <span>Action</span>
              <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
            </span>
          </div>
          <p className="text-[10px] text-amber-700/80 mt-1 truncate">Identity & doc review</p>
        </div>

        {/* 4. Daily Matches */}
        <div className="bg-white rounded-xl p-3.5 border border-stone-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Daily Matches
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">favorite</span>
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="font-display text-xl font-bold text-stone-900">
              {metrics.dailyMatches}
            </span>
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
              High
            </span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 truncate">Recommendations today</p>
        </div>

        {/* 5. Revenue Summary */}
        <div className="bg-white rounded-xl p-3.5 border border-stone-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Revenue
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#775a19] flex items-center justify-center">
              <span className="material-symbols-outlined text-base">payments</span>
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="font-display text-xl font-bold text-stone-900">
              ₹{metrics.revenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              Paid
            </span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 truncate">Gross subscription volume</p>
        </div>

        {/* 6. Active Subscriptions */}
        <div className="bg-white rounded-xl p-3.5 border border-stone-200/80 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Active Plans
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">card_membership</span>
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="font-display text-xl font-bold text-stone-900">
              {metrics.activeSubscriptions}
            </span>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
              Gold
            </span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 truncate">Paid active subscribers</p>
        </div>
      </div>

      {/* OPERATIONAL SUMMARIES SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registered Users Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-stone-900">
                Recent User Registrations
              </h3>
              <p className="text-xs text-stone-500">Latest accounts registered on platform</p>
            </div>
            <Link
              to="/admin/users"
              className="text-xs font-semibold text-[#775a19] hover:underline flex items-center gap-1"
            >
              <span>View All Users</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 px-4">Profiles</th>
                  <th className="pb-3 px-4">Verification</th>
                  <th className="pb-3 px-4">Plan</th>
                  <th className="pb-3 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#570013]/10 text-[#570013] font-bold flex items-center justify-center text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-stone-800">{user.name}</p>
                          <p className="text-[10px] text-stone-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-700 font-semibold rounded-md text-[11px]">
                        {user.profiles.length} Profile(s)
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.verificationStatus === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : user.verificationStatus === 'Pending'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {user.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-700">
                      {user.subscriptionPlan}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <Link
                        to={`/admin/users/${user.id}`}
                        className="p-1.5 text-stone-500 hover:text-[#570013] hover:bg-stone-100 rounded-lg inline-block transition-colors"
                        title="View User Details"
                      >
                        <span className="material-symbols-outlined text-base">visibility</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Verification Quick Queue */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-stone-900">
              Pending Verification Queue
            </h3>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
              {pendingVerifications.length} Pending
            </span>
          </div>

          <div className="space-y-3">
            {pendingVerifications.length === 0 ? (
              <div className="text-center py-8 text-xs text-stone-400">
                All verification requests resolved!
              </div>
            ) : (
              pendingVerifications.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border border-amber-200/60 rounded-xl bg-amber-50/40 hover:bg-amber-50 transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-stone-800 truncate">
                      {item.profileName}
                    </p>
                    <p className="text-[10px] text-stone-500 truncate">
                      User: {item.userName} ({item.govtIdType})
                    </p>
                  </div>
                  <Link
                    to={`/admin/profile-verification/${item.id}`}
                    className="px-2.5 py-1 bg-[#570013] hover:bg-[#42000e] text-white text-[11px] font-semibold rounded-lg shrink-0 transition-colors"
                  >
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AUDIT LOGS RECENT STREAM */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-stone-900">
              Recent Administrative Actions
            </h3>
            <p className="text-xs text-stone-500">Live operational audit trail</p>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-semibold text-[#775a19] hover:underline"
          >
            View Full Audit History
          </Link>
        </div>

        <div className="space-y-2">
          {recentAuditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex items-start justify-between gap-4 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-800">{log.action}</span>
                  <span className="px-2 py-0.5 bg-stone-200 text-stone-700 text-[10px] font-semibold rounded-md">
                    {log.target}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">{log.details}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-stone-400 font-mono block">
                  {log.timestamp}
                </span>
                <span className="text-[10px] font-bold text-[#775a19]">
                  {log.adminName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
