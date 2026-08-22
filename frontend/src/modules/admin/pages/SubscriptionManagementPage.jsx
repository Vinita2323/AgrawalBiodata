import React, { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { adminDataService } from '../services/adminDataService'
import { useAdminAuth } from '../context/AdminAuthContext'

const describeLimit = (value, unit) => {
  const num = Number(value)
  if (num === -1) return `Unlimited ${unit}`
  return `${num} ${unit}`
}

export default function SubscriptionManagementPage() {
  // Plan pricing is a Super Admin responsibility; the API rejects writes from
  // other roles, so the edit controls are hidden rather than left to 403.
  const { role } = useAdminAuth()
  const canManagePlans = role === 'Super Admin'

  const [plans, setPlans] = useState([])
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [toastMsg, setToastMsg] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  // Identity
  const [name, setName] = useState('')
  const [nameHindi, setNameHindi] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [badge, setBadge] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [status, setStatus] = useState('Active')

  // Pricing
  const [price, setPrice] = useState('')
  const [quarterlyPrice, setQuarterlyPrice] = useState('')
  const [yearlyPrice, setYearlyPrice] = useState('')
  const [discountPercent, setDiscountPercent] = useState('0')

  // Entitlements
  const [contactViewLimit, setContactViewLimit] = useState('0')
  const [contactViewUnlimited, setContactViewUnlimited] = useState(false)
  const [interestSendLimit, setInterestSendLimit] = useState('10')
  const [interestSendUnlimited, setInterestSendUnlimited] = useState(false)
  const [dailyMatchLimit, setDailyMatchLimit] = useState('5')
  const [dailyMatchUnlimited, setDailyMatchUnlimited] = useState(false)
  const [verifiedPriority, setVerifiedPriority] = useState(false)
  const [chatAccess, setChatAccess] = useState(false)
  const [relationshipManager, setRelationshipManager] = useState(false)
  const [profileBoost, setProfileBoost] = useState(false)

  const [benefitsList, setBenefitsList] = useState([''])

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      setPlans(await adminDataService.getSubscriptions())
    } catch (err) {
      setErrorMsg(err?.message || 'Could not load subscription plans.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingPlan(null)
    setFieldErrors({})
    setName('')
    setNameHindi('')
    setTagline('')
    setDescription('')
    setBadge('Popular')
    setSortOrder('0')
    setStatus('Active')
    setPrice('999')
    setQuarterlyPrice('2499')
    setYearlyPrice('9999')
    setDiscountPercent('0')
    setContactViewLimit('0')
    setContactViewUnlimited(false)
    setInterestSendLimit('10')
    setInterestSendUnlimited(false)
    setDailyMatchLimit('5')
    setDailyMatchUnlimited(false)
    setVerifiedPriority(false)
    setChatAccess(false)
    setRelationshipManager(false)
    setProfileBoost(false)
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
    setFieldErrors({})
    setName(plan.name)
    setNameHindi(plan.nameHindi || '')
    setTagline(plan.tagline || '')
    setDescription(plan.description || '')
    setBadge(plan.badge || '')
    setSortOrder(String(plan.sortOrder ?? 0))
    setStatus(plan.status)
    setPrice(String(plan.price))
    setQuarterlyPrice(String(plan.quarterlyPrice ?? 0))
    setYearlyPrice(String(plan.yearlyPrice || plan.price * 12))
    setDiscountPercent(String(plan.discountPercent ?? 0))

    const cvl = plan.contactViewLimit ?? 0
    setContactViewUnlimited(cvl === -1)
    setContactViewLimit(cvl === -1 ? '' : String(cvl))

    const isl = plan.interestSendLimit ?? 10
    setInterestSendUnlimited(isl === -1)
    setInterestSendLimit(isl === -1 ? '' : String(isl))

    const dml = plan.dailyMatchLimit ?? 5
    setDailyMatchUnlimited(dml === -1)
    setDailyMatchLimit(dml === -1 ? '' : String(dml))

    setVerifiedPriority(Boolean(plan.verifiedPriority))
    setChatAccess(Boolean(plan.chatAccess))
    setRelationshipManager(Boolean(plan.relationshipManager))
    setProfileBoost(Boolean(plan.profileBoost))
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

  const validate = () => {
    const errors = {}

    if (!name.trim()) errors.name = 'Plan name is required.'
    if (price === '' || Number(price) < 0) errors.price = 'Enter a valid monthly price.'
    if (yearlyPrice === '' || Number(yearlyPrice) < 0) errors.yearlyPrice = 'Enter a valid yearly price.'
    if (quarterlyPrice !== '' && Number(quarterlyPrice) < 0) errors.quarterlyPrice = 'Quarterly price cannot be negative.'

    const discountNum = Number(discountPercent)
    if (discountPercent !== '' && (Number.isNaN(discountNum) || discountNum < 0 || discountNum > 100)) {
      errors.discountPercent = 'Discount must be between 0 and 100.'
    }

    if (!contactViewUnlimited && (contactViewLimit === '' || Number(contactViewLimit) < 0)) {
      errors.contactViewLimit = 'Enter a non-negative number, or mark unlimited.'
    }
    if (!interestSendUnlimited && (interestSendLimit === '' || Number(interestSendLimit) < 0)) {
      errors.interestSendLimit = 'Enter a non-negative number, or mark unlimited.'
    }
    if (!dailyMatchUnlimited && (dailyMatchLimit === '' || Number(dailyMatchLimit) < 0)) {
      errors.dailyMatchLimit = 'Enter a non-negative number, or mark unlimited.'
    }

    return errors
  }

  const handleSavePlan = async (e) => {
    e.preventDefault()

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    const cleanedBenefits = benefitsList.map((b) => b.trim()).filter(Boolean)

    const planObj = {
      id: editingPlan?.id,
      name: name.trim(),
      nameHindi: nameHindi.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      badge: badge.trim(),
      sortOrder: Number(sortOrder) || 0,
      price: Number(price),
      quarterlyPrice: Number(quarterlyPrice) || 0,
      yearlyPrice: Number(yearlyPrice) || Number(price) * 12,
      discountPercent: Number(discountPercent) || 0,
      currency: 'INR',
      status,
      benefits: cleanedBenefits.length > 0 ? cleanedBenefits : ['Standard Membership Benefits'],
      contactViewLimit: contactViewUnlimited ? -1 : Number(contactViewLimit),
      interestSendLimit: interestSendUnlimited ? -1 : Number(interestSendLimit),
      dailyMatchLimit: dailyMatchUnlimited ? -1 : Number(dailyMatchLimit),
      verifiedPriority,
      chatAccess,
      relationshipManager,
      profileBoost,
    }

    setIsSaving(true)
    setErrorMsg('')
    try {
      await adminDataService.saveSubscriptionPlan(planObj)
      await loadPlans()
      setShowPlanModal(false)
      setToastMsg('Subscription plan saved successfully! Updated configuration live on customer portal.')
      setTimeout(() => setToastMsg(''), 4000)
    } catch (err) {
      setErrorMsg(err?.message || 'Could not save this subscription plan.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan?')) return

    setIsSaving(true)
    setErrorMsg('')
    try {
      await adminDataService.deleteSubscriptionPlan(planId)
      await loadPlans()
      setToastMsg('Subscription plan removed.')
      setTimeout(() => setToastMsg(''), 3000)
    } catch (err) {
      setErrorMsg(err?.message || 'Could not delete this subscription plan.')
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass = "w-full px-3 py-2 bg-stone-50 border border-amber-900/20 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
  const errorInputClass = "w-full px-3 py-2 bg-red-50 border border-red-300 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-300"
  const fieldError = (key) => fieldErrors[key] && (
    <p className="text-[10px] text-red-700 font-bold mt-1">{fieldErrors[key]}</p>
  )

  return (
    <AdminLayout title="Subscription Management">
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

      {!canManagePlans && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-md text-xs text-amber-900 font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">lock</span>
          <span>Plan pricing is read-only for your role. Only a Super Admin can create or edit plans.</span>
        </div>
      )}

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
          disabled={!canManagePlans}
          className="px-4 py-2.5 bg-[#570013] hover:bg-[#42000e] text-amber-100 font-extrabold rounded-md text-xs flex items-center gap-2 shadow-md transition-all self-start sm:self-auto active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Create New Plan</span>
        </button>
      </div>

      {/* PLANS CARDS GRID */}
      {isLoading && (
        <div className="text-center py-12 text-[#775a19] font-semibold text-sm">
          Loading subscription plans...
        </div>
      )}

      {!isLoading && plans.length === 0 && (
        <div className="text-center py-12 text-[#775a19] font-semibold text-sm">
          <span className="material-symbols-outlined text-4xl text-stone-300 block mb-2">workspace_premium</span>
          No subscription plans configured yet.
        </div>
      )}

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
                  {plan.badge || 'Plan'}
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
                {plan.tagline && (
                  <p className="text-xs text-[#775a19] font-bold mt-0.5">{plan.tagline}</p>
                )}
              </div>

              <div className="flex items-baseline gap-1 bg-amber-50/50 p-2 rounded-md border border-amber-200/60">
                <span className="font-display text-2xl font-extrabold text-[#570013]">
                  ₹{plan.price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-stone-600 font-bold">/ month</span>
              </div>

              {/* Entitlements strip */}
              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                <span className="px-2 py-1 bg-stone-100 text-stone-700 rounded-md border border-stone-200">
                  {describeLimit(plan.dailyMatchLimit, 'profiles/day')}
                </span>
                <span className="px-2 py-1 bg-stone-100 text-stone-700 rounded-md border border-stone-200">
                  {describeLimit(plan.contactViewLimit, 'contacts')}
                </span>
                <span className="px-2 py-1 bg-stone-100 text-stone-700 rounded-md border border-stone-200">
                  {describeLimit(plan.interestSendLimit, 'interests')}
                </span>
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
                  disabled={!canManagePlans || isSaving}
                  className="p-1.5 text-[#570013] hover:bg-amber-100/70 border border-amber-200 rounded-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Edit Plan"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  disabled={!canManagePlans || isSaving}
                  className="p-1.5 text-red-700 hover:bg-red-50 border border-red-200 rounded-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh] border border-amber-900/20">
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

            <form onSubmit={handleSavePlan} className="space-y-5 text-xs">
              {/* IDENTITY */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-[#570013] uppercase tracking-wider text-[11px]">Identity</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Plan Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Gold"
                      className={fieldErrors.name ? errorInputClass : inputClass}
                    />
                    {fieldError('name')}
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Plan Name (Hindi)</label>
                    <input
                      type="text"
                      value={nameHindi}
                      onChange={(e) => setNameHindi(e.target.value)}
                      placeholder="e.g. गोल्ड"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Badge Tag</label>
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      placeholder="e.g. Popular, Best Value, VIP"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Tagline</label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="Short marketing line"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Plan Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className={inputClass}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block font-bold text-stone-800 mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Longer plan description shown on the membership page"
                      rows={2}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* PRICING */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-[#570013] uppercase tracking-wider text-[11px]">Pricing</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Monthly Price (INR)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="999"
                      className={fieldErrors.price ? errorInputClass : inputClass}
                    />
                    {fieldError('price')}
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Quarterly Price (INR)</label>
                    <input
                      type="number"
                      min="0"
                      value={quarterlyPrice}
                      onChange={(e) => setQuarterlyPrice(e.target.value)}
                      placeholder="2499"
                      className={fieldErrors.quarterlyPrice ? errorInputClass : inputClass}
                    />
                    {fieldError('quarterlyPrice')}
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Yearly Price (INR)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={yearlyPrice}
                      onChange={(e) => setYearlyPrice(e.target.value)}
                      placeholder="9999"
                      className={fieldErrors.yearlyPrice ? errorInputClass : inputClass}
                    />
                    {fieldError('yearlyPrice')}
                    {yearlyPrice !== '' && !Number.isNaN(Number(yearlyPrice)) && (
                      <p className="text-[10px] text-[#775a19] font-bold mt-1">
                        ≈ ₹{Math.round(Number(yearlyPrice) / 12).toLocaleString('en-IN')} / month effective
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      placeholder="0"
                      className={fieldErrors.discountPercent ? errorInputClass : inputClass}
                    />
                    {fieldError('discountPercent')}
                  </div>
                </div>
              </div>

              {/* ENTITLEMENTS */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-[#570013] uppercase tracking-wider text-[11px]">Entitlements</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Profiles Viewable / Day</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        disabled={dailyMatchUnlimited}
                        value={dailyMatchLimit}
                        onChange={(e) => setDailyMatchLimit(e.target.value)}
                        placeholder="25"
                        className={`${fieldErrors.dailyMatchLimit ? errorInputClass : inputClass} disabled:opacity-40`}
                      />
                      <label className="flex items-center gap-1 text-[10px] font-bold text-stone-700 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={dailyMatchUnlimited}
                          onChange={(e) => setDailyMatchUnlimited(e.target.checked)}
                        />
                        Unlimited
                      </label>
                    </div>
                    {fieldError('dailyMatchLimit')}
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Contact Views</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        disabled={contactViewUnlimited}
                        value={contactViewLimit}
                        onChange={(e) => setContactViewLimit(e.target.value)}
                        placeholder="50"
                        className={`${fieldErrors.contactViewLimit ? errorInputClass : inputClass} disabled:opacity-40`}
                      />
                      <label className="flex items-center gap-1 text-[10px] font-bold text-stone-700 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={contactViewUnlimited}
                          onChange={(e) => setContactViewUnlimited(e.target.checked)}
                        />
                        Unlimited
                      </label>
                    </div>
                    {fieldError('contactViewLimit')}
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Interests Sendable</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        disabled={interestSendUnlimited}
                        value={interestSendLimit}
                        onChange={(e) => setInterestSendLimit(e.target.value)}
                        placeholder="10"
                        className={`${fieldErrors.interestSendLimit ? errorInputClass : inputClass} disabled:opacity-40`}
                      />
                      <label className="flex items-center gap-1 text-[10px] font-bold text-stone-700 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={interestSendUnlimited}
                          onChange={(e) => setInterestSendUnlimited(e.target.checked)}
                        />
                        Unlimited
                      </label>
                    </div>
                    {fieldError('interestSendLimit')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-2 text-stone-800 font-bold">
                    <input type="checkbox" checked={verifiedPriority} onChange={(e) => setVerifiedPriority(e.target.checked)} />
                    Verified Priority Placement
                  </label>
                  <label className="flex items-center gap-2 text-stone-800 font-bold">
                    <input type="checkbox" checked={chatAccess} onChange={(e) => setChatAccess(e.target.checked)} />
                    Chat Access
                  </label>
                  <label className="flex items-center gap-2 text-stone-800 font-bold">
                    <input type="checkbox" checked={relationshipManager} onChange={(e) => setRelationshipManager(e.target.checked)} />
                    Relationship Manager
                  </label>
                  <label className="flex items-center gap-2 text-stone-800 font-bold">
                    <input type="checkbox" checked={profileBoost} onChange={(e) => setProfileBoost(e.target.checked)} />
                    Profile Boost
                  </label>
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
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#570013] text-amber-100 font-extrabold rounded-md shadow-md hover:bg-[#42000e] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Subscription Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
