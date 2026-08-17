import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { adminDataService } from '../services/adminDataService'

export default function UserManagementPage() {
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState('All')
  const [verificationFilter, setVerificationFilter] = useState('All')
  const [subscriptionFilter, setSubscriptionFilter] = useState('All')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  // Modal State for Action Confirmation
  const [activeModalUser, setActiveModalUser] = useState(null)
  const [modalAction, setModalAction] = useState(null) // 'suspend' | 'activate' | 'delete'

  // Toast notification state
  const [exportToast, setExportToast] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      setUsers(await adminDataService.getUsers())
    } catch (err) {
      setErrorMsg(err?.message || 'Could not load users.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (userId, newStatus) => {
    setIsMutating(true)
    setErrorMsg('')
    try {
      await adminDataService.updateUserStatus(userId, newStatus)
      await loadUsers()
      setActiveModalUser(null)
      setModalAction(null)
    } catch (err) {
      setErrorMsg(err?.message || 'Could not update the user status.')
    } finally {
      setIsMutating(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    setIsMutating(true)
    setErrorMsg('')
    try {
      await adminDataService.deleteUser(userId)
      await loadUsers()
      setActiveModalUser(null)
      setModalAction(null)
    } catch (err) {
      setErrorMsg(err?.message || 'Could not delete the user account.')
    } finally {
      setIsMutating(false)
    }
  }

  // Filtering & Search logic
  const q = searchTerm.toLowerCase()
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      String(user.name).toLowerCase().includes(q) ||
      String(user.email).toLowerCase().includes(q) ||
      String(user.mobile).includes(searchTerm) ||
      String(user.id).toLowerCase().includes(q)

    const matchesStatus =
      statusFilter === 'All' || user.accountStatus === statusFilter

    const matchesVerification =
      verificationFilter === 'All' || user.verificationStatus === verificationFilter

    const matchesSubscription =
      subscriptionFilter === 'All' ||
      (subscriptionFilter === 'Gold'
        ? !/^free/i.test(String(user.subscriptionPlan))
        : /^free/i.test(String(user.subscriptionPlan)))

    return matchesSearch && matchesStatus && matchesVerification && matchesSubscription
  })

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Direct CSV Export Users Report Logic
  const handleExportUsersReport = () => {
    const dataToExport = filteredUsers.length > 0 ? filteredUsers : users
    if (!dataToExport || dataToExport.length === 0) {
      alert('No user records available to export.')
      return
    }

    const dateStr = new Date().toISOString().split('T')[0]
    const headers = [
      'User ID',
      'User Name',
      'Contact Mobile',
      'Contact Email',
      'Biodata Profile Name',
      'Gender',
      'Verification Status',
      'Subscription Plan',
      'Subscription Status',
      'Account Status',
      'Registration Date',
      'Last Active',
      'Gotra',
      'Mother Gotra',
      'Qualification',
      'Occupation',
      'Income',
      'Location'
    ]

    const escapeCsv = (field) => {
      if (field === null || field === undefined) return '""'
      const val = String(field).replace(/"/g, '""')
      return `"${val}"`
    }

    const rows = dataToExport.map((user) => {
      const primaryProf = user.profiles && user.profiles[0] ? user.profiles[0] : {}
      return [
        escapeCsv(user.id),
        escapeCsv(user.name),
        escapeCsv(user.mobile),
        escapeCsv(user.email),
        escapeCsv(primaryProf.fullName || user.name || ''),
        escapeCsv(primaryProf.gender || 'General'),
        escapeCsv(user.verificationStatus),
        escapeCsv(user.subscriptionPlan),
        escapeCsv(user.subscriptionStatus),
        escapeCsv(user.accountStatus),
        escapeCsv(user.createdDate || ''),
        escapeCsv(user.lastActive || ''),
        escapeCsv(primaryProf.gotra || ''),
        escapeCsv(primaryProf.motherGotra || ''),
        escapeCsv(primaryProf.qualification || ''),
        escapeCsv(primaryProf.workingAt || ''),
        escapeCsv(primaryProf.income || ''),
        escapeCsv(primaryProf.pob || '')
      ].join(',')
    })

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Users_Report_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setExportToast(`Users report downloaded successfully (${dataToExport.length} user records).`)
    setTimeout(() => {
      setExportToast('')
    }, 4000)
  }

  return (
    <AdminLayout title="User Management">
      {errorMsg && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-red-500 font-bold shrink-0">
            ✕
          </button>
        </div>
      )}

      {/* Toast Notification Banner */}
      {exportToast && (
        <div className="mb-4 bg-emerald-900/90 text-emerald-100 border border-emerald-500/40 px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400">check_circle</span>
            <span>{exportToast}</span>
          </div>
          <button
            onClick={() => setExportToast('')}
            className="text-emerald-300 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#570013]">
            Registered Users Management
          </h2>
          <p className="text-sm text-[#775a19] font-medium mt-1">
            Manage registered accounts, view multiple matrimonial profiles, suspend/activate access, and inspect subscription details.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleExportUsersReport}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-emerald-50 font-bold rounded-lg text-sm flex items-center gap-2 shadow-xs border border-emerald-600/40 transition-colors cursor-pointer"
            title="Download Users Report"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span>Export Report</span>
          </button>

          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-[#570013] hover:bg-[#42000e] text-amber-100 font-bold rounded-lg text-sm flex items-center gap-2 shadow-xs border border-amber-500/30 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* FILTERS & SEARCH BAR */}
      <div className="bg-white rounded-lg p-4.5 border border-amber-900/15 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-3 text-[#775a19] text-base">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search by name, mobile, email or ID..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-amber-50/40 border border-amber-900/20 rounded-md text-sm text-[#570013] font-semibold focus:outline-none focus:ring-2 focus:ring-[#775a19]/40 focus:border-[#775a19] focus:bg-white"
            />
          </div>

          {/* Account Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-900/20 rounded-md text-sm text-[#570013] font-semibold focus:outline-none focus:ring-2 focus:ring-[#775a19]/40 focus:bg-white"
            >
              <option value="All">All Account Statuses</option>
              <option value="Active">Active Users Only</option>
              <option value="Suspended">Suspended Users Only</option>
            </select>
          </div>

          {/* Verification Status Filter */}
          <div>
            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-900/20 rounded-md text-sm text-[#570013] font-semibold focus:outline-none focus:ring-2 focus:ring-[#775a19]/40 focus:bg-white"
            >
              <option value="All">All Verification Statuses</option>
              <option value="Approved">Verified Profiles Only</option>
              <option value="Pending">Pending Verification</option>
              <option value="Rejected">Rejected Verification</option>
            </select>
          </div>

          {/* Subscription Filter */}
          <div>
            <select
              value={subscriptionFilter}
              onChange={(e) => {
                setSubscriptionFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3.5 py-2.5 bg-amber-50/40 border border-amber-900/20 rounded-md text-sm text-[#570013] font-semibold focus:outline-none focus:ring-2 focus:ring-[#775a19]/40 focus:bg-white"
            >
              <option value="All">All Subscription Tiers</option>
              <option value="Gold">Gold / Paid Plans</option>
              <option value="Free">Free Tier</option>
            </select>
          </div>
        </div>
      </div>

      {/* USER DATA TABLE */}
      <div className="bg-white rounded-lg border border-amber-900/15 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#570013] text-amber-100 border-b border-amber-900/40 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-4.5">User ID & Name</th>
                <th className="py-4 px-4.5">Contact Info</th>
                <th className="py-4 px-4.5">Biodata Profile</th>
                <th className="py-4 px-4.5">Verification</th>
                <th className="py-4 px-4.5">Subscription</th>
                <th className="py-4 px-4.5">Status</th>
                <th className="py-4 px-4.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 text-sm">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-[#775a19] font-semibold">
                    {isLoading ? 'Loading users...' : 'No matching users found for selected filters.'}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-amber-50/60 transition-colors">
                    {/* User ID & Name */}
                    <td className="py-4 px-4.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#775a19] to-[#916e20] text-white font-extrabold flex items-center justify-center text-base shrink-0 border border-amber-400/40 shadow-2xs">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <Link
                            to={`/admin/users/${user.id}`}
                            className="font-bold text-base text-[#570013] hover:text-[#775a19] transition-colors block"
                          >
                            {user.name}
                          </Link>
                          <p className="text-xs font-mono text-[#775a19] font-bold mt-0.5">{user.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-4 px-4.5">
                      <p className="font-bold text-sm text-stone-900">{user.mobile}</p>
                      <p className="text-xs text-stone-600 font-medium mt-0.5">{user.email}</p>
                    </td>

                    {/* Biodata Profile */}
                    <td className="py-4 px-4.5">
                      <p className="font-bold text-sm text-[#570013]">{user.profiles[0]?.fullName || user.name}</p>
                      <p className="text-xs text-stone-600 font-medium">{user.profiles[0]?.gender || 'General'}</p>
                    </td>

                    {/* Verification Status */}
                    <td className="py-4 px-4.5">
                      <span
                        className={`px-3 py-1 rounded-md text-xs font-extrabold inline-flex items-center gap-1.5 border shadow-2xs ${
                          user.verificationStatus === 'Approved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : user.verificationStatus === 'Pending'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-red-50 text-red-800 border-red-300'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {user.verificationStatus === 'Approved' ? 'check_circle' : 'pending'}
                        </span>
                        <span>{user.verificationStatus}</span>
                      </span>
                    </td>

                    {/* Subscription */}
                    <td className="py-4 px-4.5">
                      <p className="font-bold text-sm text-[#570013]">{user.subscriptionPlan}</p>
                      <span className="text-xs text-[#775a19] font-semibold">{user.subscriptionStatus}</span>
                    </td>

                    {/* Account Status */}
                    <td className="py-4 px-4.5">
                      <span
                        className={`px-3 py-1 rounded-md text-xs font-extrabold border ${
                          user.accountStatus === 'Active'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-red-100 text-red-900 border-red-300'
                        }`}
                      >
                        {user.accountStatus}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-4 px-4.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/users/${user.id}`}
                          className="p-2 text-[#570013] hover:bg-amber-100/70 rounded-md transition-colors"
                          title="View Complete User & Profiles Detail"
                        >
                          <span className="material-symbols-outlined text-xl">visibility</span>
                        </Link>

                        {user.accountStatus === 'Active' ? (
                          <button
                            onClick={() => {
                              setActiveModalUser(user)
                              setModalAction('suspend')
                            }}
                            className="p-2 text-[#775a19] hover:bg-amber-100/70 rounded-md transition-colors"
                            title="Suspend User Access"
                          >
                            <span className="material-symbols-outlined text-xl">block</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveModalUser(user)
                              setModalAction('activate')
                            }}
                            className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Activate User Account"
                          >
                            <span className="material-symbols-outlined text-xl">check_circle</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setActiveModalUser(user)
                            setModalAction('delete')
                          }}
                          className="p-2 text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete User Record"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="p-4 border-t border-amber-900/15 bg-amber-50/50 flex items-center justify-between text-sm text-[#570013] font-semibold">
          <span>
            Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length}{' '}
            users
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3.5 py-1.5 bg-white border border-amber-900/20 rounded-md font-bold text-xs sm:text-sm hover:bg-amber-100/60 text-[#570013] disabled:opacity-40"
            >
              Previous
            </button>

            <span className="px-3 font-extrabold text-[#570013]">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3.5 py-1.5 bg-white border border-amber-900/20 rounded-md font-bold text-xs sm:text-sm hover:bg-amber-100/60 text-[#570013] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION ACTION MODAL */}
      {activeModalUser && modalAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-scale-fade">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  modalAction === 'suspend'
                    ? 'bg-amber-100 text-amber-800'
                    : modalAction === 'activate'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                <span className="material-symbols-outlined">
                  {modalAction === 'suspend'
                    ? 'block'
                    : modalAction === 'activate'
                    ? 'check_circle'
                    : 'warning'}
                </span>
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-stone-900 capitalize">
                  {modalAction} User Account
                </h3>
                <p className="text-xs text-stone-500 font-medium">{activeModalUser.name}</p>
              </div>
            </div>

            <p className="text-sm text-stone-600 leading-relaxed">
              {modalAction === 'suspend' &&
                'Are you sure you want to suspend this user? Suspended users will not be able to log in or interact on the platform.'}
              {modalAction === 'activate' &&
                'Are you sure you want to activate this user account? The user will regain full platform permissions.'}
              {modalAction === 'delete' &&
                'Are you sure you want to delete this user record? This action will remove their account and associated matrimonial profiles.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setActiveModalUser(null)
                  setModalAction(null)
                }}
                className="px-4 py-2 border border-stone-300 rounded-md text-xs font-bold hover:bg-stone-50 text-stone-700"
              >
                Cancel
              </button>

              <button
                disabled={isMutating}
                onClick={() => {
                  if (modalAction === 'suspend') {
                    handleStatusChange(activeModalUser.id, 'Suspended')
                  } else if (modalAction === 'activate') {
                    handleStatusChange(activeModalUser.id, 'Active')
                  } else if (modalAction === 'delete') {
                    handleDeleteUser(activeModalUser.id)
                  }
                }}
                className={`px-4 py-2 text-white font-bold rounded-md text-xs shadow-md disabled:opacity-60 disabled:cursor-not-allowed ${
                  modalAction === 'suspend'
                    ? 'bg-amber-700 hover:bg-amber-800'
                    : modalAction === 'activate'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-red-700 hover:bg-red-800'
                }`}
              >
                {isMutating ? 'Working...' : `Confirm ${modalAction}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}


