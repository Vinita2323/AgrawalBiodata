import React, { useState, useEffect } from 'react'
import { createOrder, verifyPayment, demoCompletePayment, getPlans } from '../../../services/paymentService'
import { isAuthenticated, getStoredUser } from '../../../services/authService'
import { loadRazorpayCheckout, openRazorpayCheckout } from '../../../services/razorpay'

const CYCLE_LABEL = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

/**
 * Resolves the payable amount for a plan and billing cycle, mirroring the
 * backend calculation in paymentService.createOrder so the summary shown here
 * matches the amount Razorpay actually charges.
 */
function resolvePrice(plan, billingCycle) {
  if (!plan) return 0
  if (billingCycle === 'yearly') return plan.yearlyPrice || 0
  if (billingCycle === 'quarterly') {
    return plan.quarterlyPrice || Math.round((plan.monthlyPrice || 0) * 3 * 0.9)
  }
  return plan.monthlyPrice || 0
}

export default function PaymentScreen({
  onBack,
  onPaymentComplete,
  planId: planIdProp,
  billingCycle: billingCycleProp = 'monthly',
}) {
  const [plan, setPlan] = useState(null)
  const [isLoadingPlan, setIsLoadingPlan] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  // Set once create-order comes back in demo mode (no real payment gateway
  // configured yet) - shows Simulate Success/Failure buttons instead of the
  // real Razorpay checkout.
  const [demoOrderId, setDemoOrderId] = useState(null)

  const billingCycle = billingCycleProp

  // Load the selected plan (or the first paid plan when none was passed through)
  useEffect(() => {
    let cancelled = false

    async function loadPlan() {
      setIsLoadingPlan(true)
      try {
        const res = await getPlans()
        const list = res?.plans || []
        const chosen =
          list.find((p) => p.id === planIdProp || p._id === planIdProp || p.planId === planIdProp) ||
          list.find((p) => (p.monthlyPrice || 0) > 0) ||
          list[0] ||
          null

        if (!cancelled) {
          setPlan(chosen)
          if (!chosen) setErrorMsg('No subscription plans are available right now.')
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err?.message || 'Could not load plan details. Please try again.')
        }
      } finally {
        if (!cancelled) setIsLoadingPlan(false)
      }
    }

    loadPlan()
    return () => {
      cancelled = true
    }
  }, [planIdProp])

  // Warm the Checkout script so the modal opens without a delay on tap
  useEffect(() => {
    loadRazorpayCheckout()
  }, [])

  const amount = resolvePrice(plan, billingCycle)

  const handlePayment = async () => {
    setErrorMsg('')

    if (!isAuthenticated()) {
      setErrorMsg('Please log in before purchasing a membership.')
      return
    }
    if (!plan) {
      setErrorMsg('No plan selected.')
      return
    }

    setIsProcessing(true)

    try {
      // 1. Create the order server-side (authoritative amount + Razorpay key)
      const orderRes = await createOrder(plan.id || plan._id || plan.planId, billingCycle)
      if (!orderRes?.orderId) {
        throw new Error('Could not initiate the payment order. Please try again.')
      }

      // No real payment gateway configured yet - let the demo buttons handle it.
      if (orderRes.demoMode) {
        setIsProcessing(false)
        setDemoOrderId(orderRes.orderId)
        return
      }

      if (!orderRes?.keyId) {
        throw new Error('Could not initiate the payment order. Please try again.')
      }

      // 2. Open the hosted Checkout and collect the real signature
      const ready = await loadRazorpayCheckout()
      if (!ready) {
        throw new Error('Payment gateway failed to load. Please check your connection and try again.')
      }

      const storedUser = getStoredUser()
      const result = await openRazorpayCheckout({
        keyId: orderRes.keyId,
        orderId: orderRes.orderId,
        amount: orderRes.amount,
        currency: orderRes.currency || 'INR',
        description: `${plan.name} - ${CYCLE_LABEL[billingCycle] || billingCycle}`,
        prefill: {
          name: storedUser?.name || '',
          email: storedUser?.email || '',
          contact: storedUser?.mobile || '',
        },
      })

      // 3. Verify server-side. Only a verified signature activates the plan.
      await verifyPayment({
        orderId: result.orderId || orderRes.orderId,
        paymentId: result.paymentId,
        signature: result.signature,
      })

      setIsProcessing(false)
      setPaymentSuccess(true)
      setTimeout(() => {
        if (onPaymentComplete) onPaymentComplete(plan)
      }, 1500)
    } catch (err) {
      setIsProcessing(false)

      if (err?.code === 'CHECKOUT_DISMISSED') {
        setErrorMsg('Payment cancelled. You have not been charged.')
        return
      }
      setErrorMsg(err?.message || 'Payment could not be completed. Please try again.')
    }
  }

  const handleDemoOutcome = async (outcome) => {
    if (!demoOrderId) return
    setErrorMsg('')
    setIsProcessing(true)

    try {
      const res = await demoCompletePayment(demoOrderId, outcome)

      if (outcome === 'success' && res?.subscription) {
        setIsProcessing(false)
        setDemoOrderId(null)
        setPaymentSuccess(true)
        setTimeout(() => {
          if (onPaymentComplete) onPaymentComplete(plan)
        }, 1500)
      } else {
        setIsProcessing(false)
        setDemoOrderId(null)
        setErrorMsg('Simulated payment failed. You have not been charged.')
      }
    } catch (err) {
      setIsProcessing(false)
      setDemoOrderId(null)
      setErrorMsg(err?.message || 'Could not simulate the payment. Please try again.')
    }
  }

  if (paymentSuccess) {
    return (
      <div className="bg-[#fbf9f5] min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-4 animate-bounce shadow-lg shadow-emerald-500/30">
          <span className="material-symbols-outlined text-4xl">check</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#570013] mb-2">Payment Successful!</h2>
        <p className="text-slate-600 font-medium mb-6">
          Your {plan?.name || 'Premium'} plan is now active.
        </p>
        <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="bg-[#fbf9f5] text-[#1b1c1a] font-body min-h-screen flex flex-col selection:bg-[#775a19] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#fbf9f5]/90 backdrop-blur-md border-b border-amber-200/60 shadow-sm mb-5">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <button
            onClick={onBack}
            disabled={isProcessing}
            className={`flex items-center gap-1 text-xs font-bold text-[#570013] hover:opacity-80 transition p-1 -ml-1 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <span className="font-display font-bold text-[15px] text-[#570013]">
            Secure Checkout
          </span>
          <div className="w-8"></div>
        </div>
      </header>

      <main className="flex-1 px-4 max-w-xl mx-auto w-full pb-24 relative">
        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center rounded-md">
            <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin mb-3"></div>
            <p className="text-[#570013] font-bold">Processing Payment...</p>
            <p className="text-xs text-slate-500">Please do not close this window</p>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 font-bold flex items-start gap-2 relative z-10">
            <span className="material-symbols-outlined text-sm mt-0.5">error</span>
            <span className="flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-red-500 font-bold shrink-0">
              ✕
            </button>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-md p-4 shadow-sm border border-amber-200/60 mb-6 relative z-10">
          <h2 className="font-display font-bold text-[#570013] mb-3 border-b border-amber-100 pb-2">
            Order Summary
          </h2>

          {isLoadingPlan ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-amber-100/70 rounded w-2/3"></div>
              <div className="h-4 bg-amber-100/70 rounded w-1/3"></div>
            </div>
          ) : plan ? (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-800">
                  {plan.name} ({CYCLE_LABEL[billingCycle] || billingCycle})
                </span>
                <span className="text-sm font-bold text-[#570013]">
                  ₹{amount.toLocaleString('en-IN')}
                </span>
              </div>

              {plan.features?.length > 0 && (
                <ul className="text-[11px] text-slate-600 font-medium space-y-1 mb-3">
                  {plan.features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[13px] text-emerald-600">
                        check_circle
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex justify-between items-center border-t border-dashed border-amber-200 pt-3">
                <span className="text-sm font-bold text-slate-900">Total Amount</span>
                <span className="text-lg font-black text-[#570013]">
                  ₹{amount.toLocaleString('en-IN')}
                </span>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 font-semibold">Plan details unavailable.</p>
          )}
        </div>

        {/* Payment Method Note */}
        <div className="bg-white rounded-md p-4 shadow-sm border border-amber-200/60 relative z-10">
          <h2 className="font-display font-bold text-[#570013] mb-2">Payment Method</h2>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            You will be redirected to Razorpay's secure checkout, where you can pay by UPI, credit
            or debit card, net banking, or wallet.
          </p>
          <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-slate-500">
            <span className="material-symbols-outlined text-[14px] text-emerald-600">lock</span>
            <span>256-bit encrypted • PCI-DSS compliant</span>
          </div>
        </div>
      </main>

      {/* Bottom Fixed Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-amber-200 py-3 px-4 shadow-2xl">
        <div className="max-w-xl mx-auto">
          {demoOrderId ? (
            <>
              <p className="text-[10px] font-bold text-amber-700 text-center mb-2 uppercase tracking-wide">
                Demo Mode &mdash; no real payment gateway configured yet
              </p>
              <div className="flex gap-2">
                <button
                  disabled={isProcessing}
                  onClick={() => handleDemoOutcome('success')}
                  className={`flex-1 py-3.5 rounded-md font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 ${
                    isProcessing
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span>Simulate Success</span>
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => handleDemoOutcome('failed')}
                  className={`flex-1 py-3.5 rounded-md font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 ${
                    isProcessing
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">cancel</span>
                  <span>Simulate Failure</span>
                </button>
              </div>
            </>
          ) : (
            <button
              disabled={isProcessing || isLoadingPlan || !plan}
              onClick={handlePayment}
              className={`w-full py-3.5 rounded-md font-bold text-sm transition shadow-lg text-center flex items-center justify-center gap-2 ${
                isProcessing || isLoadingPlan || !plan
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-[#570013] text-[#ffdea5] hover:bg-[#800020]'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">lock</span>
                  <span>
                    Pay Securely {plan ? `₹${amount.toLocaleString('en-IN')}` : ''}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
