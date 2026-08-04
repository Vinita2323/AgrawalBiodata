import React, { useState } from 'react'

export default function MembershipScreen({ onBack, onSelectPlan }) {
  const [billingCycle, setBillingCycle] = useState('Monthly') // 'Monthly' | 'Yearly'

  const plans = [
    {
      id: 'gold',
      name: 'Premium Gold',
      priceMonthly: '999',
      priceYearly: '799',
      cardStyle: 'bg-gradient-to-b from-[#fff3cd] via-[#fce49c] to-[#f7d070] border-amber-300 text-slate-900',
      headerBadge: 'Popular Choice',
      features: [
        'Unlimited Interests',
        'See Contact Details',
        'Priority Listing',
        'Advanced Filters',
      ],
    },
    {
      id: 'platinum',
      name: 'Premium Platinum',
      priceMonthly: '1999',
      priceYearly: '1599',
      cardStyle: 'bg-gradient-to-b from-[#ffffff] via-[#f3f4f6] to-[#e5e7eb] border-gray-300 text-slate-900',
      features: [
        'All Gold Features',
        'Direct Chat Access',
        'Profile Boost',
        'Personalised Match',
      ],
    },
    {
      id: 'diamond',
      name: 'Premium Diamond',
      priceMonthly: '2999',
      priceYearly: '2399',
      cardStyle: 'bg-gradient-to-b from-[#eff6ff] via-[#dbeafe] to-[#bfdbfe] border-blue-200 text-slate-900',
      features: [
        'All Platinum Features',
        'Relationship Manager',
        'Verified Badge',
        'Top Visibility',
      ],
    },
  ]

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
          Get more visibility & better matches
        </p>

        {/* Monthly / Yearly Billing Toggle */}
        <div className="mt-5 inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-amber-200/60">
          <button
            onClick={() => setBillingCycle('Monthly')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              billingCycle === 'Monthly'
                ? 'bg-[#570013] text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-gray-50'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('Yearly')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              billingCycle === 'Yearly'
                ? 'bg-[#570013] text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-gray-50'
            }`}
          >
            <span>Yearly</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-[#570013] text-[9px] font-extrabold shadow-sm">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Vertical Cards Stacked Layout (One Below Another in Rows) */}
      <div className="w-full flex flex-col gap-6 px-4 pb-6 pt-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`w-full rounded-xl p-5 border shadow-md flex flex-col justify-between ${plan.cardStyle} relative transition-all hover:shadow-lg`}
          >
            {plan.headerBadge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#570013] text-amber-300 text-[10px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full border border-amber-400 shadow-xs">
                {plan.headerBadge}
              </span>
            )}

            <div>
              <h3 className="font-display font-extrabold text-lg mb-1 text-slate-900">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-[26px] font-black text-[#570013]">
                  ₹{billingCycle === 'Yearly' ? plan.priceYearly : plan.priceMonthly}
                </span>
                <span className="text-xs font-semibold text-slate-600">/ Month</span>
              </div>

              <ul className="space-y-2.5 text-[11px] font-medium text-slate-800 mb-5">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#570013]/10 text-[#570013] font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan && onSelectPlan(plan)}
              className="w-full py-3 rounded-md bg-[#570013] hover:bg-[#72001a] text-white font-bold text-xs shadow-md active:scale-95 transition"
            >
              Choose Plan
            </button>
          </div>
        ))}
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
          <span>100% Safe & Secure</span>
        </div>
      </div>
    </div>
  )
}
