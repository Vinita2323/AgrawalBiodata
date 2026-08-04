import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HelpSupportScreen({ onBack }) {
  const navigate = useNavigate()
  const [openFaqIndex, setOpenFaqIndex] = useState(0)

  const faqs = [
    {
      question: 'How do I create and complete my Biodata profile?',
      answer: 'Go to your Profile tab and click on "Complete Now" or "Edit Profile". Fill in your personal details, Kundali/astrological information, education, family background, and maternal Gotra across the 4 steps.',
    },
    {
      question: 'What are the 18 Agarwal Gotras supported for matching?',
      answer: 'Our platform exclusively supports all 18 authentic Agarwal Samaj Gotras: Garg, Goyal, Bansal, Bindal, Singhal, Jindal, Mittal, Tayal, Kansal, Kuchhal, Airan, Dharan, Mangal, Madhukul, Tingal, Nagal, Goyan, and Bhandal.',
    },
    {
      question: 'How can I download my profile as a PDF Biodata?',
      answer: 'Click on "View" or "Download" under "Your Bio Data" on the Home tab or click "Export PDF" on your My Profile page to download a neatly styled printable A4 Biodata document.',
    },
    {
      question: 'How do Premium Membership plans work?',
      answer: 'Premium plans give you unlimited interest requests, direct access to verified contact numbers, priority listing in candidate searches, and personalized matchmaking support.',
    },
    {
      question: 'Is my contact phone number hidden from public view?',
      answer: 'Yes! Your mobile number is kept private and secure. It is only shared when mutual interest is accepted or through verified premium access.',
    },
    {
      question: 'How do I contact customer support?',
      answer: 'You can call our dedicated support helpline at +91 98765 43210 or email us directly at support@agarwalbiodata.com available 24/7.',
    },
  ]

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  const handleGoBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="bg-[#fbf9f5] min-h-screen text-[#1b1c1a] font-body flex flex-col pb-12">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-[#fbf9f5]/95 backdrop-blur-md border-b border-amber-200/60 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1 text-xs font-bold text-[#570013] hover:opacity-80 transition p-1 -ml-1 cursor-pointer"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <span className="font-display font-bold text-[15px] text-[#570013]">
            Help & Support
          </span>
          <div className="w-8"></div>
        </div>
      </header>

      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-[#6e0b18] via-[#7d0d1c] to-[#50040f] text-white px-5 py-6 text-center relative overflow-hidden shadow-md">
        <div className="w-12 h-12 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center mx-auto mb-2">
          <span className="material-symbols-outlined text-2xl">support_agent</span>
        </div>
        <h1 className="font-display font-extrabold text-xl mb-1 text-amber-200">How can we help you?</h1>
        <p className="text-xs text-amber-100/80 max-w-xs mx-auto font-medium">
          Dedicated 24/7 Assistance & Frequently Asked Questions for Agarwal Samaj Matrimony
        </p>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto w-full">
        {/* Contact Support Cards */}
        <div>
          <h2 className="text-xs font-extrabold text-[#570013] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">headset_mic</span>
            Contact Support
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <a
              href="tel:+919876543210"
              className="flex items-center justify-between p-3.5 bg-white border border-amber-200/80 rounded-xl shadow-2xs hover:border-[#570013] hover:shadow-xs transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">call</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#570013] transition">Call Helpline</h3>
                  <p className="text-[11px] text-slate-500 font-semibold">+91 98765 43210</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400 group-hover:translate-x-0.5 transition">chevron_right</span>
            </a>

            <a
              href="mailto:support@agarwalbiodata.com"
              className="flex items-center justify-between p-3.5 bg-white border border-amber-200/80 rounded-xl shadow-2xs hover:border-[#570013] hover:shadow-xs transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">mail</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#570013] transition">Email Us</h3>
                  <p className="text-[11px] text-slate-500 font-semibold">support@agarwalbiodata.com</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400 group-hover:translate-x-0.5 transition">chevron_right</span>
            </a>
          </div>
        </div>

        {/* FAQs Accordion Section */}
        <div>
          <h2 className="text-xs font-extrabold text-[#570013] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">quiz</span>
            Frequently Asked Questions (FAQs)
          </h2>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div
                  key={idx}
                  className="bg-white border border-amber-200/80 rounded-xl overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-3.5 text-left flex items-center justify-between gap-3 bg-white hover:bg-amber-50/40 transition cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-800 leading-snug">
                      {faq.question}
                    </span>
                    <span
                      className={`material-symbols-outlined text-amber-800 text-lg transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-3.5 pb-3.5 pt-1 text-[11px] text-slate-600 font-medium leading-relaxed border-t border-amber-100 bg-amber-50/20">
                      {faq.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
