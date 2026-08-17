import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { adminDataService } from '../services/adminDataService'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    let verifications = []
    let complaints = []
    let payments = []

    try {
      ;[verifications, complaints, payments] = await Promise.all([
        adminDataService.getVerifications({ status: 'Pending' }),
        adminDataService.getComplaints(),
        adminDataService.getPayments(),
      ])
    } catch {
      setNotifications([])
      return
    }

    const list = []

    // 1. Pending Verifications
    verifications.forEach((v) => {
      list.push({
        id: `NOTIF-VER-${v.id}`,
        title: `Profile Verification Request (${v.userName})`,
        message: `${v.userName} submitted ${v.documentType || 'identity'} proof for verification.`,
        date: v.submittedAt || 'Recent',
        icon: 'verified_user',
        iconBg: 'bg-amber-100 text-[#570013]',
        link: `/admin/profile-verification/${v.id}`,
        isRead: false
      })
    })

    // 2. User Reports
    complaints.forEach((c) => {
      list.push({
        id: `NOTIF-REP-${c.id}`,
        title: `User Report Filed (${c.category})`,
        message: `Report ${c.id} filed by ${c.reporterUserName} against profile ${c.reportedProfileName}.`,
        date: c.createdDate || 'Recent',
        icon: 'report_problem',
        iconBg: 'bg-red-100 text-red-800',
        link: `/admin/complaints`,
        isRead: false
      })
    })

    // 3. Payment Alerts
    payments.forEach((p) => {
      list.push({
        id: `NOTIF-PAY-${p.id}`,
        title: `Payment Received (₹${(p.amount || 0).toLocaleString('en-IN')})`,
        message: `Transaction ${p.transactionId} for ${p.planName} by ${p.userName}.`,
        date: p.createdDate || 'Recent',
        icon: 'payments',
        iconBg: 'bg-emerald-100 text-emerald-800',
        link: `/admin/payments`,
        isRead: true
      })
    })

    setNotifications(list)
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setToastMsg('All notifications marked as read!')
    setTimeout(() => setToastMsg(''), 3000)
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <AdminLayout title="Notifications">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-2xs">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-4xl">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#570013] flex items-center gap-2">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-[#570013] text-amber-100 rounded-full text-xs font-extrabold">
                {unreadCount} New
              </span>
            )}
          </h2>
          <p className="text-xs text-[#775a19] font-medium mt-0.5">
            Recent updates on profile verifications, reports, and payments.
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="px-3.5 py-2 bg-white border border-amber-900/20 hover:bg-amber-50 text-[#570013] font-bold rounded-md text-xs flex items-center gap-2 shadow-2xs transition-all self-start sm:self-auto active:scale-95"
        >
          <span className="material-symbols-outlined text-base">done_all</span>
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="bg-white rounded-lg border border-amber-900/15 shadow-xs overflow-hidden divide-y divide-amber-900/10 max-w-4xl">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-[#775a19] font-semibold">
            <span className="material-symbols-outlined text-4xl text-stone-300 block mb-2">notifications_off</span>
            <span>No notifications available.</span>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 hover:bg-amber-50/50 transition-colors flex items-center justify-between gap-4 ${
                !item.isRead ? 'bg-amber-50/20' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${item.iconBg} flex items-center justify-center shrink-0 shadow-2xs`}>
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-xs text-stone-900">{item.title}</h4>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#570013] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-stone-600 font-medium mt-0.5">{item.message}</p>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">{item.date}</p>
                </div>
              </div>

              <Link
                to={item.link}
                className="px-3 py-1 bg-amber-100/80 hover:bg-amber-200 text-[#570013] border border-amber-300/80 rounded-md text-xs font-bold shrink-0 transition-all active:scale-95"
              >
                Inspect
              </Link>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  )
}
