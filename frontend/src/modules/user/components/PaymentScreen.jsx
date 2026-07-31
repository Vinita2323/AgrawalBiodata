import React, { useState } from 'react'

export default function PaymentScreen({ onBack, onPaymentComplete }) {
  const [selectedMethod, setSelectedMethod] = useState('upi')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const handlePayment = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setPaymentSuccess(true)
      setTimeout(() => {
        if (onPaymentComplete) onPaymentComplete()
      }, 1500)
    }, 2000)
  }

  // If success, show success UI
  if (paymentSuccess) {
    return (
      <div className="bg-[#fbf9f5] min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-4 animate-bounce shadow-lg shadow-emerald-500/30">
          <span className="material-symbols-outlined text-4xl">check</span>
        </div>
        <h2 className="text-2xl font-extrabold text-[#570013] mb-2">Payment Successful!</h2>
        <p className="text-slate-600 font-medium mb-6">Your Premium Gold plan is now active.</p>
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
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center rounded-2xl">
            <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin mb-3"></div>
            <p className="text-[#570013] font-bold">Processing Payment...</p>
            <p className="text-xs text-slate-500">Please do not close this window</p>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200/60 mb-6 relative z-10">
          <h2 className="font-display font-bold text-[#570013] mb-3 border-b border-amber-100 pb-2">Order Summary</h2>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-800">Premium Gold (Yearly)</span>
            <span className="text-sm font-bold text-[#570013]">₹799</span>
          </div>
          <div className="flex justify-between items-center text-xs text-emerald-600 font-semibold mb-3">
            <span>Special Discount (20% Off)</span>
            <span>- ₹200</span>
          </div>
          <div className="flex justify-between items-center border-t border-dashed border-amber-200 pt-3">
            <span className="text-sm font-bold text-slate-900">Total Amount</span>
            <span className="text-lg font-black text-[#570013]">₹599</span>
          </div>
        </div>

        {/* Payment Methods */}
        <h2 className="font-display font-bold text-[#570013] mb-3 px-1 relative z-10">Select Payment Method</h2>
        <div className="space-y-3 relative z-10">
          {/* UPI Option */}
          <label className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${selectedMethod === 'upi' ? 'bg-amber-50/50 border-amber-400 shadow-md' : 'bg-white border-amber-200/50 shadow-sm'}`}>
            <input 
              type="radio" 
              name="payment_method" 
              value="upi"
              disabled={isProcessing}
              checked={selectedMethod === 'upi'} 
              onChange={() => setSelectedMethod('upi')}
              className="accent-[#570013] w-4 h-4"
            />
            <span className="material-symbols-outlined text-2xl text-[#775a19]">qr_code_scanner</span>
            <div className="flex-1">
              <span className="block font-bold text-sm text-slate-900">UPI / QR</span>
              <span className="block text-[10px] text-slate-500 font-semibold">Google Pay, PhonePe, Paytm</span>
            </div>
          </label>

          {/* Cards Option */}
          <label className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${selectedMethod === 'cards' ? 'bg-amber-50/50 border-amber-400 shadow-md' : 'bg-white border-amber-200/50 shadow-sm'}`}>
            <input 
              type="radio" 
              name="payment_method" 
              value="cards"
              disabled={isProcessing}
              checked={selectedMethod === 'cards'} 
              onChange={() => setSelectedMethod('cards')}
              className="accent-[#570013] w-4 h-4"
            />
            <span className="material-symbols-outlined text-2xl text-[#775a19]">credit_card</span>
            <div className="flex-1">
              <span className="block font-bold text-sm text-slate-900">Credit / Debit Card</span>
              <span className="block text-[10px] text-slate-500 font-semibold">Visa, MasterCard, RuPay</span>
            </div>
          </label>
        </div>
      </main>

      {/* Bottom Fixed Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-amber-200 py-3 px-4 shadow-2xl">
        <div className="max-w-xl mx-auto">
          <button
            disabled={isProcessing}
            onClick={handlePayment}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition shadow-lg text-center flex items-center justify-center gap-2 ${
              isProcessing 
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
                <span>Pay Securely ₹599</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
