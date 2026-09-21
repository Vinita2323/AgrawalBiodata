import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthenticated } from '../../../services/authService'
import api from '../../../services/api'

export default function TermsOfServiceScreen({ onBack }) {
  const navigate = useNavigate()
  const [cmsPage, setCmsPage] = useState(null)
  const [activeSection, setActiveSection] = useState('acceptance')

  useEffect(() => {
    let isMounted = true
    api.get('/cms/pages/terms-of-service')
      .then((res) => {
        if (isMounted && res?.page) {
          setCmsPage(res.page)
        }
      })
      .catch(() => {
        // Fallback to embedded comprehensive legal text
      })
    return () => { isMounted = false }
  }, [])

  const handleGoBack = () => {
    if (onBack) {
      onBack()
    } else if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(isAuthenticated() ? '/home' : '/welcome')
    }
  }

  const scrollToSection = (id) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="bg-[#fbf9f5] min-h-screen text-[#1b1c1a] font-body flex flex-col selection:bg-[#775a19] selection:text-white pb-16">
      
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#fdfcf9]/95 backdrop-blur-md border-b border-amber-200/70 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1.5 text-xs font-bold text-[#570013] hover:bg-amber-100/60 p-2 rounded-full transition cursor-pointer active:scale-95"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          
          <div className="flex flex-col items-center text-center">
            <span className="font-display font-bold text-base sm:text-lg text-[#570013] tracking-tight">
              Terms & Conditions
            </span>
            <span className="text-[10px] text-[#775a19] font-medium hidden sm:inline">
              सेवा की शर्तें • User Agreement
            </span>
          </div>

          <div className="w-9 flex justify-end">
            <button
              onClick={() => navigate(isAuthenticated() ? '/home' : '/welcome')}
              className="p-1.5 text-slate-500 hover:text-[#570013] transition rounded-full hover:bg-amber-50"
              title="Home"
            >
              <span className="material-symbols-outlined text-xl">home</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-amber-100/50 via-[#fbf9f5] to-[#fbf9f5] border-b border-amber-200/40 px-4 pt-6 pb-8">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300/80 text-[#775a19] text-[11px] font-bold shadow-2xs">
            <span className="material-symbols-outlined text-sm">gavel</span>
            <span>Legally Binding Agreement</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#570013] tracking-tight">
            Terms of Service & Community Rules
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully before accessing or creating a profile on the Maharaja Agrasen & Maa Madhavi Biodata Prakalp platform.
          </p>

          <p className="text-[11px] text-slate-400 font-medium">
            Last Updated: September 2026 • Governing Laws of India
          </p>

          {/* Quick Pillars Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 max-w-3xl mx-auto text-left">
            <div className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
              <span className="material-symbols-outlined text-[#570013] text-lg mb-1 block">group</span>
              <h4 className="text-[11px] font-bold text-[#570013]">Agrawal Samaj</h4>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Exclusively for Agrawal/Vaishya community</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
              <span className="material-symbols-outlined text-[#570013] text-lg mb-1 block">rule</span>
              <h4 className="text-[11px] font-bold text-[#570013]">Legal Marriage Age</h4>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">18+ for Females, 21+ for Males</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
              <span className="material-symbols-outlined text-[#570013] text-lg mb-1 block">favorite</span>
              <h4 className="text-[11px] font-bold text-[#570013]">Matrimony Only</h4>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Zero tolerance for casual dating / fraud</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
              <span className="material-symbols-outlined text-[#570013] text-lg mb-1 block">verified</span>
              <h4 className="text-[11px] font-bold text-[#570013]">Authentic Data</h4>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Accurate Gotra & educational details</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="max-w-4xl mx-auto px-4 py-8 w-full flex-1">
        
        {/* Quick Nav Anchor Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none text-xs font-semibold">
          {[
            { id: 'acceptance', label: '1. Acceptance' },
            { id: 'eligibility', label: '2. Eligibility' },
            { id: 'conduct', label: '3. Code of Conduct' },
            { id: 'gotra', label: '4. Gotra & Profile Truth' },
            { id: 'safety', label: '5. Zero Harassment' },
            { id: 'disclaimer', label: '6. Verification Disclaimer' },
            { id: 'subscriptions', label: '7. Plans & Quotas' },
            { id: 'jurisdiction', label: '8. Legal Jurisdiction' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`px-3 py-1.5 rounded-full border transition shrink-0 cursor-pointer ${
                activeSection === item.id
                  ? 'bg-[#570013] text-white border-[#570013]'
                  : 'bg-white text-slate-700 border-amber-200/80 hover:bg-amber-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Dynamic CMS Notice if active */}
        {cmsPage?.content && (
          <div className="bg-amber-50/80 border border-amber-300/80 rounded-xl p-4 mb-6 text-xs text-slate-800 leading-relaxed">
            <div className="font-bold text-[#570013] mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">campaign</span>
              <span>{cmsPage.title || 'Official Terms Notice'}</span>
            </div>
            <p>{cmsPage.content}</p>
          </div>
        )}

        <div className="space-y-8 text-slate-700 text-xs sm:text-sm leading-relaxed bg-white rounded-2xl border border-amber-200/60 p-5 sm:p-8 shadow-xs">
          
          {/* Section 1 */}
          <section id="acceptance" className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#775a19] text-xl">handshake</span>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#570013]">
                1. Acceptance of Agreement
              </h2>
            </div>
            <p>
              By accessing, browsing, registering on, or using the <strong>Maharaja Agrasen & Maa Madhavi Biodata Prakalp</strong> platform (available via web and mobile application), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not access or use the platform.
            </p>
          </section>

          <hr className="border-amber-100" />

          {/* Section 2 */}
          <section id="eligibility" className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#775a19] text-xl">how_to_reg</span>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#570013]">
                2. Mandatory Eligibility Criteria
              </h2>
            </div>
            <p className="mb-2">
              To create an account or register candidate biodata, you must strictly satisfy all of the following:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong className="text-slate-800">Community Heritage:</strong> The candidate must belong to the Agrawal / Vaishya community upholding the cultural legacy of Maharaja Agrasen.
              </li>
              <li>
                <strong className="text-slate-800">Legal Marriageable Age:</strong> Under the Prohibition of Child Marriage Act and Indian civil law, the candidate must be at least <strong>18 years of age</strong> (if female) or <strong>21 years of age</strong> (if male) at the time of registration.
              </li>
              <li>
                <strong className="text-slate-800">Legal Marital Capacity:</strong> The candidate must be legally eligible to marry (Unmarried, Divorced with legal decree, or Widowed).
              </li>
              <li>
                <strong className="text-slate-800">Sole Matrimonial Purpose:</strong> The platform is designed exclusively for seeking genuine, lawful matrimonial alliances. It is strictly not a dating, friendship, commercial, or escort service.
              </li>
            </ul>
          </section>

          <hr className="border-amber-100" />

          {/* Section 3 */}
          <section id="conduct" className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#775a19] text-xl">diversity_3</span>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#570013]">
                3. Code of Conduct & Prohibited Activities
              </h2>
            </div>
            <p className="mb-3">
              Members are expected to treat all families and candidates with utmost dignity, respect, and traditional values. You expressly agree that you will NOT:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-rose-900">
                <strong>🚫 Financial Solicitation:</strong> Solicit money, loans, gifts, investments, or travel expenses from any other member.
              </div>
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-rose-900">
                <strong>🚫 Dowry Demands:</strong> Make any direct or indirect demands for dowry, which is strictly illegal under the Dowry Prohibition Act, 1961.
              </div>
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-rose-900">
                <strong>🚫 Data Scraping / Harvesting:</strong> Copy, scrape, screenshot, screenshot-distribute, or republish member biodatas or photographs outside the app.
              </div>
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-rose-900">
                <strong>🚫 Commercial Exploitation:</strong> Use member information for matrimonial agency brokering, marketing, or spamming.
              </div>
            </div>
          </section>

          <hr className="border-amber-100" />

          {/* Section 4 */}
          <section id="gotra" className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#775a19] text-xl">family_history</span>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#570013]">
                4. Gotra Integrity & Accuracy of Biodata
              </h2>
            </div>
            <p className="mb-2">
              In honoring the 18 Gotras established by Maharaja Agrasen, Gotra details form an essential part of matrimonial matching:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                You represent and warrant that the paternal Gotra and maternal Gotra entered are authentic.
              </li>
              <li>
                Our platform automatically applies Gotra exogamy validation (preventing Sagotra matches) to uphold community norms.
              </li>
              <li>
                Intentionally entering false educational credentials, income levels, marital status, or photographs constitutes fraud and will result in immediate permanent account termination and forfeiture of any fees.
              </li>
            </ul>
          </section>

          <hr className="border-amber-100" />

          {/* Section 5 */}
          <section id="safety" className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-rose-700 text-xl">block</span>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#570013]">
                5. Zero Tolerance for Harassment & Fraud
              </h2>
            </div>
            <p className="mb-2">
              The safety of our members, especially female candidates, is our paramount priority:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                Any member reported for vulgarity, abusive language, inappropriate messaging, or persistent stalking will be suspended immediately.
              </li>
              <li>
                Members can block any individual at any time using the <strong>Block Profile</strong> feature, which instantly ceases all mutual visibility and communication.
              </li>
              <li>
                Complaints submitted via <strong>Report User</strong> are reviewed within 24 hours by administrative moderators.
              </li>
            </ul>
          </section>

          <hr className="border-amber-100" />

          {/* Section 6 */}
          <section id="disclaimer" className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-700 text-xl">warning</span>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#570013]">
                6. Family Due Diligence & Platform Disclaimer
              </h2>
            </div>
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-300 text-xs text-slate-700 space-y-2">
              <h3 className="font-bold text-[#570013] text-sm">
                Important Advisory for Families:
              </h3>
              <p>
                While the platform conducts automated checks and admin document verification (Verified Badge), Agarwal Biodata acts solely as a technological facilitator connecting families within the community.
              </p>
              <p className="font-semibold text-slate-800">
                Families are strongly advised to independently verify all candidate credentials, character, employment, residential address, family background, and medical fitness through traditional community references before solemnizing any matrimonial alliance.
              </p>
            </div>
          </section>

          <hr className="border-amber-100" />

          {/* Section 7 */}
          <section id="subscriptions" className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#775a19] text-xl">card_membership</span>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#570013]">
                7. Membership Plans, Contact Quotas & Fair Usage
              </h2>
            </div>
            <p className="mb-2">
              Registration and basic matchmaking are provided to community members. Premium memberships (Gold, Platinum, Diamond) offer enhanced discovery and contact unlock quotas:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Contact unlock quotas are subject to fair usage and non-transferability.</li>
              <li>Unlocked contacts may be used solely for personal matrimonial communication.</li>
              <li>Refunds are governed by our Refund Policy; completed contact unlocks or active plan periods are non-refundable.</li>
            </ul>
          </section>

          <hr className="border-amber-100" />

          {/* Section 8 */}
          <section id="jurisdiction" className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#775a19] text-xl">account_balance</span>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#570013]">
                8. Governing Law & Dispute Resolution
              </h2>
            </div>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with the use of this service shall be subject to the exclusive jurisdiction of the competent civil courts situated in Rajasthan, India.
            </p>
          </section>

        </div>

        {/* Footer Return Action */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-amber-200/60 text-xs">
          <button
            onClick={handleGoBack}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#570013] text-white font-bold hover:bg-[#72001a] transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Return to Previous Page</span>
          </button>

          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <button
              onClick={() => navigate('/privacy')}
              className="hover:text-[#570013] hover:underline transition"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => navigate('/child-safety')}
              className="hover:text-[#570013] hover:underline transition"
            >
              Child Safety
            </button>
          </div>
        </div>

      </main>

    </div>
  )
}
