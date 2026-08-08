import React, { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { adminDataService } from '../services/adminDataService'

export default function SubscriptionManagementPage() {
  const [plans, setPlans] = useState([])
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [toastMsg, setToastMsg] = useState('')

  // Form State
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [durationDays, setDurationDays] = useState('30')
  const [durationType, setDurationType] = useState('1 Month')
  const [badge, setBadge] = useState('Popular')
  const [status, setStatus] = useState('Active')
  const [benefitsList, setBenefitsList] = useState([''])

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = () => {
    const data = adminDataService.getSubscriptions()
    setPlans(data)
  }

  const handleOpenCreate = () => {
    setEditingPlan(null)
    setName('')
    setPrice('999')
    setDurationDays('30')
    setDurationType('1 Month')
    setBadge('Popular')
    setStatus('Active')
    setBenefitsList([
      'Unlimited Profile Views',
      'Send Unlimited Direct Interest Requests',
      'Advanced Gotra & City Filters',
      'PDF Biodata Download'
    ])
    setShowPlanModal(true)
  }

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan)
    setName(plan.name)
    setPrice(plan.price)
    setDurationDays(plan.durationDays)
    setDurationType(plan.durationType)
    setBadge(plan.badge || 'Popular')
    setStatus(plan.status)
    setBenefitsList(plan.benefits && plan.benefits.length > 0 ? [...plan.benefits] : [''])
    setShowPlanModal(true)
  }

  const handleAddBenefit = () => {
    setBenefitsList([...benefitsList, ''])
  }

  const handleBenefitChange = (index, value) => {
    const updated = [...benefitsList]
    updated[index] = value
    setBenefitsList(updated)
  }

  const handleRemoveBenefit = (index) => {
    if (benefitsList.length <= 1) return
    const updated = benefitsList.filter((_, idx) => idx !== index)
    setBenefitsList(updated)
  }

  const handleSavePlan = (e) => {
    e.preventDefault()
    const cleanedBenefits = benefitsList.map((b) => b.trim()).filter(Boolean)

    const planObj = {
      id: editingPlan?.id,
      name,
      price: Number(price),
      currency: 'INR',
      durationDays: Number(durationDays),
      durationType,
      status,
      badge,
      benefits: cleanedBenefits.length > 0 ? cleanedBenefits : ['Standard Membership Benefits'],
      activeSubscribers: editingPlan?.activeSubscribers || 0,
      createdDate: editingPlan?.createdDate || new Date().toISOString().slice(0, 10),
    }

    adminDataService.saveSubscriptionPlan(planObj)
    loadPlans()
    setShowPlanModal(false)
    setToastMsg('Subscription plan saved successfully! Updated configuration live on customer portal.')
    setTimeout(() => setToastMsg(''), 4000)
  }

  const handleDeletePlan = (planId) => {
    if (window.confirm('Are you sure you want to delete this subscription plan?')) {
      adminDataService.deleteSubscriptionPlan(planId)
      loadPlans()
      setToastMsg('Subscription plan removed.')
      setTimeout(() => setToastMsg(''), 3000)
    }
  }

  return (
    <AdminLayout title="Subscription Management">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-2xs">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#570013]">
            Subscription & Membership Plan Configurator
          </h2>
          <p className="text-xs text-[#775a19] font-medium mt-0.5">
            Configure Free vs Gold tiers, manage pricing, set feature entitlements, and control active plan availability.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-[#570013] hover:bg-[#42000e] text-amber-100 font-extrabold rounded-md text-xs flex items-center gap-2 shadow-md transition-all self-start sm:self-auto active:scale-95"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Create New Plan</span>
        </button>
      </div>

      {/* PLANS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-lg border ${
              plan.status === 'Active' ? 'border-amber-900/20' : 'border-stone-300 opacity-60'
            } shadow-xs hover:shadow-md transition-all p-4.5 flex flex-col justify-between space-y-3.5`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-amber-100/80 text-[#570013] border border-amber-300 text-[10px] font-extrabold rounded-md uppercase tracking-wider shadow-2xs">
                  {plan.badge}
                </span>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md shadow-2xs border ${
                    plan.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-stone-100 text-stone-700 border-stone-300'
                  }`}
                >
                  {plan.status}
                </span>
              </div>

              <div>
                <h3 className="font-display text-lg font-extrabold text-[#570013]">{plan.name}</h3>
                <p className="text-xs text-[#775a19] font-bold mt-0.5">{plan.durationType}</p>
              </div>

              <div className="flex items-baseline gap-1 bg-amber-50/50 p-2 rounded-md border border-amber-200/60">
                <span className="font-display text-2xl font-extrabold text-[#570013]">
                  ₹{plan.price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-stone-600 font-bold">/ {plan.durationDays} days</span>
              </div>

              {/* Benefits Checklist */}
              <div className="space-y-1.5 pt-2 border-t border-amber-900/10 text-xs">
                <span className="text-[10px] font-extrabold text-[#775a19] uppercase tracking-wider block mb-1">
                  Included Entitlements:
                </span>
                {plan.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-stone-800 font-medium text-xs">
                    <span className="material-symbols-outlined text-sm text-emerald-700 shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan Footer Metrics & Actions */}
            <div className="pt-3 border-t border-amber-900/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-500 block font-medium">Active Subscribers</span>
                <span className="font-extrabold text-xs text-[#570013]">{plan.activeSubscribers} Users</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(plan)}
                  className="p-1.5 text-[#570013] hover:bg-amber-100/70 border border-amber-200 rounded-md transition-all active:scale-95"
                  title="Edit Plan"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="p-1.5 text-red-700 hover:bg-red-50 border border-red-200 rounded-md transition-all active:scale-95"
                  title="Delete Plan"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT PLAN MODAL */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-scale-fade">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh] border border-amber-900/20">
            <div className="flex items-center justify-between border-b border-amber-900/10 pb-3">
              <h3 className="font-display font-extrabold text-lg text-[#570013]">
                {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
              </h3>
              <button
                onClick={() => setShowPlanModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Gold Quarterly VIP"
                    className="w-full px-3 py-2 bg-stone-50 border border-amber-900/20 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Price (INR)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="2499"
                    className="w-full px-3 py-2 bg-stone-50 border border-amber-900/20 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Duration Tag</label>
                  <input
                    type="text"
                    required
                    value={durationType}
                    onChange={(e) => setDurationType(e.target.value)}
                    placeholder="e.g. 3 Months"
                    className="w-full px-3 py-2 bg-stone-50 border border-amber-900/20 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Duration Days</label>
                  <input
                    type="number"
                    required
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    placeholder="90"
                    className="w-full px-3 py-2 bg-stone-50 border border-amber-900/20 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Badge Tag</label>
                  <select
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-amber-900/20 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Popular">Popular</option>
                    <option value="Best Value">Best Value</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Plan Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-amber-900/20 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* DYNAMIC BENEFITS BUILDER */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block font-extrabold text-[#570013]">
                    Plan Entitlements / Benefits List
                  </label>
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="px-2.5 py-1 bg-amber-100/90 text-[#570013] border border-amber-300 font-extrabold text-[11px] rounded-md flex items-center gap-1 hover:bg-amber-200 transition-all shadow-2xs active:scale-95"
                  >
                    <span className="material-symbols-outlined text-xs">add</span>
                    <span>Add Benefit Line</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#775a19] font-medium">
                  Each benefit below will be shown with a checkmark on the pricing plan card.
                </p>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {benefitsList.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-emerald-700 shrink-0">
                        check_circle
                      </span>
                      <input
                        type="text"
                        required
                        value={benefit}
                        onChange={(e) => handleBenefitChange(idx, e.target.value)}
                        placeholder={`Benefit line #${idx + 1}`}
                        className="flex-1 px-3 py-1.5 bg-stone-50 border border-amber-900/20 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
                      />
                      {benefitsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBenefit(idx)}
                          className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-all shrink-0"
                          title="Remove line"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded-md font-bold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#570013] text-amber-100 font-extrabold rounded-md shadow-md hover:bg-[#42000e] active:scale-95 transition-all"
                >
                  Save Subscription Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
