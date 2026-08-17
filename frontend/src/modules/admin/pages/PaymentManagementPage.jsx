import React, { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { adminDataService } from '../services/adminDataService'

export default function PaymentManagementPage() {
  const [payments, setPayments] = useState([])
  const [statusFilter, setStatusFilter] = useState('All') // 'All' | 'Success' | 'Failed'
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPayment, setSelectedPayment] = useState(null)

  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      setPayments(await adminDataService.getPayments())
    } catch (err) {
      setErrorMsg(err?.message || 'Could not load payment records.')
    } finally {
      setIsLoading(false)
    }
  }

  const q = searchTerm.toLowerCase()
  const filtered = payments.filter((p) => {
    const matchesStatus =
      statusFilter === 'All' || String(p.paymentStatus).toLowerCase() === statusFilter.toLowerCase()
    const matchesSearch =
      String(p.transactionId).toLowerCase().includes(q) ||
      String(p.userName).toLowerCase().includes(q) ||
      String(p.planName).toLowerCase().includes(q)

    return matchesStatus && matchesSearch
  })

  return (
    <AdminLayout title="Payment Management">
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
            Payment & Revenue Transactions
          </h2>
          <p className="text-xs text-[#775a19] font-medium mt-0.5">
            Monitor real payment gateway logs (Razorpay / UPI / Cards), transaction statuses, and invoice references.
          </p>
        </div>

        <button
          onClick={loadPayments}
          className="px-3.5 py-2 bg-white border border-amber-900/20 hover:bg-amber-50 text-[#570013] font-bold rounded-md text-xs flex items-center gap-2 shadow-2xs transition-all self-start sm:self-auto active:scale-95"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-lg p-4 border border-amber-900/15 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['All', 'Success', 'Failed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-md text-xs font-extrabold transition-all shadow-2xs ${
                statusFilter.toLowerCase() === st.toLowerCase()
                  ? 'bg-[#570013] text-amber-100 shadow-md'
                  : 'bg-amber-50/70 text-[#775a19] hover:bg-amber-100/70 border border-amber-200/60'
              }`}
            >
              {st} Transactions
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#775a19] text-base">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search txn ID, user or plan..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-amber-900/20 rounded-md text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
          />
        </div>
      </div>

      {/* TRANSACTIONS DATA TABLE */}
      <div className="bg-white rounded-lg border border-amber-900/15 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#570013] text-amber-100 border-b border-amber-900/40 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-4.5">Transaction ID</th>
                <th className="py-4 px-4.5">User Account</th>
                <th className="py-4 px-4.5">Subscription Plan</th>
                <th className="py-4 px-4.5">Amount</th>
                <th className="py-4 px-4.5">Gateway / Method</th>
                <th className="py-4 px-4.5">Status</th>
                <th className="py-4 px-4.5">Date</th>
                <th className="py-4 px-4.5 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-[#775a19] font-semibold">
                    {isLoading ? 'Loading transactions...' : 'No transactions match selected parameters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((pay) => (
                  <tr key={pay.id} className="hover:bg-amber-50/60 transition-colors">
                    <td className="py-3.5 px-4.5 font-mono font-semibold text-[#570013] text-xs">
                      {pay.transactionId}
                    </td>
                    <td className="py-3.5 px-4.5">
                      <p className="font-bold text-sm text-stone-900">{pay.userName}</p>
                      <p className="text-xs text-[#775a19] font-mono font-semibold mt-0.5">{pay.userId}</p>
                    </td>
                    <td className="py-3.5 px-4.5 font-bold text-sm text-[#570013]">
                      {pay.planName}
                    </td>
                    <td className="py-3.5 px-4.5 font-bold text-sm text-stone-900">
                      ₹{pay.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4.5 text-stone-700 font-medium text-xs">
                      {pay.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          pay.paymentStatus === 'Success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        {pay.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4.5 text-stone-500 font-mono text-xs">
                      {pay.createdDate}
                    </td>
                    <td className="py-3.5 px-4.5 text-right">
                      <button
                        onClick={() => setSelectedPayment(pay)}
                        className="p-1.5 text-[#570013] hover:bg-amber-100/70 rounded-md border border-amber-200/80 transition-all active:scale-95"
                        title="View Detailed Invoice"
                      >
                        <span className="material-symbols-outlined text-base">receipt_long</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRANSACTION DETAIL INVOICE MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-scale-fade">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl relative border border-amber-900/20">
            <div className="flex items-center justify-between border-b border-amber-900/10 pb-3">
              <h3 className="font-display font-extrabold text-lg text-[#570013]">
                Payment Invoice Breakdown
              </h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1 hover:bg-amber-50 rounded-md text-stone-500"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-amber-50/50 rounded-lg space-y-2 border border-amber-200">
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Transaction ID</span>
                  <span className="font-mono font-bold text-[#570013] text-xs">{selectedPayment.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Gateway Reference</span>
                  <span className="font-mono font-semibold text-stone-800 text-xs">{selectedPayment.gatewayRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">User Account</span>
                  <span className="font-bold text-stone-900 text-xs">{selectedPayment.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Plan Subscribed</span>
                  <span className="font-bold text-[#775a19] text-xs">{selectedPayment.planName}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-amber-200 text-base">
                  <span className="font-extrabold text-stone-900">Total Paid Amount</span>
                  <span className="font-extrabold text-[#570013]">₹{selectedPayment.amount}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 bg-[#570013] text-amber-100 text-xs font-extrabold rounded-md hover:bg-[#42000e] active:scale-95 transition-all shadow-md"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
