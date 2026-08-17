import React, { useState, useEffect } from 'react'
import { getPlans, getCurrentSubscription } from '../../../services/paymentService'
import { isAuthenticated } from '../../../services/authService'

// Card treatments are cycled by position so any number of backend plans renders
// with the existing visual hierarchy.
const CARD_STYLES = [
  'bg-gradient-to-b from-[#fff3cd] via-[#fce49c] to-[#f7d070] border-amber-300 text-slate-900',
  'bg-gradient-to-b from-[#ffffff] via-[#f3f4f6] to-[#e5e7eb] border-gray-300 text-slate-900',
  'bg-gradient-to-b from-[#eff6ff] via-[#dbeafe] to-[#bfdbfe] border-blue-200 text-slate-900',
]

export default function MembershipScreen({ onBack, onSelectPlan }) {
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'yearly'
  const [plans, setPlans] = useState([])
  const [currentPlanId, setCurrentPlanId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setErrorMsg('')
      try {
        const res = await getPlans()
        if (!cancelled) {
          // Free tiers are the default state, not something to purchase.
          setPlans((res?.plans || []).filter((p) => (p.monthlyPrice || 0) > 0))
        }

        if (isAuthenticated()) {
          try {
            const sub = await getCurrentSubscription()
            if (!cancelled) {
              setCurrentPlanId(sub?.subscription?.planId || sub?.planId || null)
            }
          } catch {
            // An absent subscription is normal for free-tier users.
          }
        }
      } catch (err) {
        if (!cancelled) setErrorMsg(err?.message || 'Could not load membership plans.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const priceFor = (plan) => {
    if (billingCycle === 'yearly') {
      // Yearly plans are quoted per-month to keep the comparison honest.
      return Math.round((plan.yearlyPrice || 0) / 12)
    }
    return plan.monthlyPrice || 0
  }

  const hasYearlySaving = plans.some(
    (p) => p.yearlyPrice > 0 && p.yearlyPrice < (p.monthlyPrice || 0) * 12
  )

  return (
    <div className="bg-[#fbf9f5] text-[#1b1c1a] font-body min-h-screen flex flex-col justify-between pb-6 selection:bg-[#775a19] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#fbf9f5]/90 backdrop-blur-md border-b border-amber-200/60 shadow-sm mb-5">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-bold text-[#570013] hover:opacity-80 transition p-1 -ml-1"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <span className="font-display font-bold text-[15px] text-[#570013]">
            Membership Plans
          </span>
          <div className="w-12"></div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="text-center mb-6 px-4">
        <h2 className="font-display text-2xl font-extrabold tracking-tight mb-1.5 text-[#570013]">
          Premium Membership
        </h2>
        <p className="text-xs text-slate-600 font-medium">
          Get more visibility &amp; better matches
        </p>

        {/* Monthly / Yearly Billing Toggle */}
        <div className="mt-5 inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-amber-200/60">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-[#570013] text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-gray-50'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-[#570013] text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-gray-50'
            }`}
          >
            <span>Yearly</span>
            {hasYearlySaving && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-[#570013] text-[9px] font-extrabold shadow-sm">
                Save More
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Error State */}
      {errorMsg && (
        <div className="mx-4 mb-4 p-3.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Plan Cards */}
      <div className="w-full flex flex-col gap-6 px-4 pb-6 pt-2">
        {isLoading ? (
          [0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-full rounded-xl p-5 border border-amber-200/60 bg-white shadow-sm animate-pulse space-y-3"
            >
              <div className="h-5 bg-amber-100/70 rounded w-1/2"></div>
              <div className="h-8 bg-amber-100/70 rounded w-1/3"></div>
              <div className="h-3 bg-amber-100/70 rounded w-full"></div>
              <div className="h-3 bg-amber-100/70 rounded w-4/5"></div>
              <div className="h-10 bg-amber-100/70 rounded"></div>
            </div>
          ))
        ) : plans.length === 0 && !errorMsg ? (
          <div className="text-center py-12 text-slate-500 font-semibold text-sm">
            <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">
              workspace_premium
            </span>
            No membership plans are available right now.
          </div>
        ) : (
          plans.map((plan, idx) => {
            const planKey = plan.id || plan._id || plan.planId
            const isCurrent = currentPlanId && String(currentPlanId) === String(planKey)

            return (
              <div
                key={planKey}
                className={`w-full rounded-xl p-5 border shadow-md flex flex-col justify-between relative transition-all hover:shadow-lg ${
                  CARD_STYLES[idx % CARD_STYLES.length]
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#570013] text-amber-300 text-[10px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full border border-amber-400 shadow-xs whitespace-nowrap">
                    {plan.badge}
                  </span>
                )}

                <div>
                  <h3 className="font-display font-extrabold text-lg mb-1 text-slate-900">
                    {plan.name}
                  </h3>
                  {plan.tagline && (
                    <p className="text-[11px] font-semibold text-slate-600 mb-2">{plan.tagline}</p>
                  )}

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-[26px] font-black text-[#570013]">
                      ₹{priceFor(plan).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">/ Month</span>
                  </div>

                  <ul className="space-y-2.5 text-[11px] font-medium text-slate-800 mb-5">
                    {(plan.features || []).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#570013]/10 text-[#570013] font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  disabled={isCurrent}
                  onClick={() => onSelectPlan && onSelectPlan(plan, billingCycle)}
                  className={`w-full py-3 rounded-md font-bold text-xs shadow-md transition ${
                    isCurrent
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-[#570013] hover:bg-[#72001a] text-white active:scale-95'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : 'Choose Plan'}
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Trust Badges Footer */}
      <div className="pt-4 mt-auto pb-4 flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-500 text-center">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px] text-emerald-600">verified_user</span>
          <span>Secure Payment</span>
        </div>
        <span className="text-amber-200/60">|</span>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
          <span>100% Safe &amp; Secure</span>
        </div>
      </div>
    </div>
  )
}
