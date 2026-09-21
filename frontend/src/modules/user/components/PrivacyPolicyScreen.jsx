import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthenticated } from '../../../services/authService'
import api from '../../../services/api'

export default function PrivacyPolicyScreen({ onBack }) {
  const navigate = useNavigate()
  const [cmsPage, setCmsPage] = useState(null)
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    let isMounted = true
    api.get('/cms/pages/privacy-policy')
      .then((res) => {
        if (isMounted && res?.page) {
          setCmsPage(res.page)
        }
      })
      .catch(() => {
        // Fallback gracefully to embedded comprehensive legal text
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
              Privacy Policy
            </span>
            <span className="text-[10px] text-[#775a19] font-medium hidden sm:inline">
              गोपनीयता नीति • Agarwal Samaj Matrimony
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

      {/* Hero Banner with Trust Highlights */}
      <div className="bg-gradient-to-b from-amber-100/50 via-[#fbf9f5] to-[#fbf9f5] border-b border-amber-200/40 px-4 pt-6 pb-8">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold shadow-2xs">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span>DPDP Act 2023 & IT Act Compliant</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#570013] tracking-tight">
            Privacy Policy & Data Protection
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Maharaja Agrasen & Maa Madhavi Biodata Prakalp (operated by Dakshin Paschimi Rajasthan Agrawal Sammelan) is committed to safeguarding your family's personal biodata and dignity.
          </p>

          <p className="text-[11px] text-slate-400 font-medium">
            Last Updated: September 2026 • Official Legal Document
          </p>

          {/* Quick Pillars Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 max-w-3xl mx-auto text-left">
            <div className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
              <span className="material-symbols-outlined text-amber-700 text-lg mb-1 block">lock</span>
              <h4 className="text-[11px] font-bold text-[#570013]">Bank-Grade Security</h4>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">TLS/AES encrypted data storage</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
              <span className="material-symbols-outlined text-amber-700 text-lg mb-1 block">phone_disabled</span>
              <h4 className="text-[11px] font-bold text-[#570013]">Protected Numbers</h4>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Never visible to guests or search engines</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
              <span className="material-symbols-outlined text-amber-700 text-lg mb-1 block">badge</span>
              <h4 className="text-[11px] font-bold text-[#570013]">Confidential KYC</h4>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">ID proofs used only for verification</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
              <span className="material-symbols-outlined text-amber-700 text-lg mb-1 block">delete_forever</span>
              <h4 className="text-[11px] font-bold text-[#570013]">Full Deletion Right</h4>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Self-service account & data deletion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="max-w-4xl mx-auto px-4 py-8 w-full flex-1">
        
        {/* Quick Nav Anchor Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none text-xs font-semibold">
          {[
            { id: 'collection', label: '1. Data Collection' },
            { id: 'usage', label: '2. Data Usage' },
            { id: 'contact-masking', label: '3. Contact Privacy' },
            { id: 'photos', label: '4. Photo Protection' },
            { id: 'kyc', label: '5. KYC Documents' },
            { id: 'deletion', label: '6. Account Deletion' },
            { id: 'grievance', label: '7. Grievance Officer' },
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
              <span>{cmsPage.title || 'Official Community Statement'}</span>
            </div>
            <p>{cmsPage.content}</p>
          </div>
        )}

        <div className="space-y-8 text-slate-700 text-xs sm:text-sm leading-relaxed bg-white rounded-2xl border border-amber-200/60 p-5 sm:p-8 shadow-xs">
          
          {/* Section 1 */}
          <section id="collection" className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#775a19] text-xl">folder_shared</span>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#570013]">
                1. Information We Collect
              </h2>
            </div>
            <p className="mb-3">
              To deliver authentic matrimonial matchmaking tailored to the Agrawal Samaj, we collect only the information necessary to facilitate respectful matrimonial alliances:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong className="text-slate-800">Candidate Identity & Gotra Details:</strong> Full name, gender, date and time of birth, place of birth, marital status, height, physical attributes, and authentic Gotra information (both paternal Gotra and maternal Gotra) for Gotra exogamy validation.
              </li>
              <li>
                <strong className="text-slate-800">Family Background & Heritage:</strong> Father's name and occupation, mother's name and gotra, grandfather/grandmother names, parental address, sibling details, maternal uncle (Mamaji) details.
              </li>
              <li>
                <strong className="text-slate-800">Education & Professional Background:</strong> Highest qualification, college/university, profession, annual income bracket, current city and work location.
              </li>
              <li>
                <strong className="text-slate-800">Astrological & Horoscope Data:</strong> Manglik status (Manglik, Anshik, Non-Manglik, Don't Know), birth coordinates, and Kundli/horoscope chart if voluntarily uploaded.
              </li>
              <li>
                <strong className="text-slate-800">Contact Details:</strong> Mobile phone number and email address (verified through OTP), and residential address.
              </li>
              <li>
                <strong className="text-slate-800">Verification Documents (KYC):</strong> Government-issued identity proof (Aadhaar, Voter ID, Passport) voluntarily submitted for obtaining a community-verified badge.
              </li>
            </ul>
          </section>

          <hr className="border-amber-100" />

          {/* Section 2 */}
          <section id="usage" className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#775a19] text-xl">psychology</span>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#570013]">
                2. How We Use Your Data & Purpose Limitation
              </h2>
            </div>
            <p className="mb-3">
              Your personal information is collected strictly for lawful matrimonial matchmaking and community safety:
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-[#fbf9f5] rounded-xl border border-amber-200/50">
                <span className="font-bold text-[#570013]">✓ Gotra Compatibility Matching:</span> Calculating marriage suitability using established Agrawal exogamy rules (rejecting Sagotra matches to uphold sacred customs).
              </div>
              <div className="p-3 bg-[#fbf9f5] rounded-xl border border-amber-200/50">
                <span className="font-bold text-[#570013]">✓ Profile Discovery & Recommendation:</span> Displaying your biodata to compatible, verified members of the opposite gender within the Agarwal community.
              </div>
              <div className="p-3 bg-[#fbf9f5] rounded-xl border border-amber-200/50">
                <span className="font-bold text-[#570013]">✓ Fraud Prevention & Community Trust:</span> Screening against fake profiles, romance fraud, commercial solicitation, and underage accounts.
              </div>
            </div>
          </section>

          <hr className="border-amber-100" />

          {/* Section 3 */}
          <section id="contact-masking" className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#775a19] text-xl">shield</span>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#570013]">
                3. Contact Privacy & Multi-Level Masking Guarantees
              </h2>
            </div>
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 mb-3">
              <h3 className="font-bold text-[#570013] text-xs sm:text-sm mb-1">
                🔒 Non-Negotiable Privacy Commitment:
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Your personal mobile phone number is <strong>never disclosed publicly</strong> to unregistered guests, casual visitors, or search engines. Phone numbers are protected by server-side redaction and are visible only to verified matches who have received explicit consent.
              </p>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Guests who are not logged in receive masked contact records (`XXXXXX1234`).</li>
              <li>Address details remain completely confidential until mutual interest is accepted.</li>
              <li>You may withdraw interest or block any user at any moment to immediately revoke their access to your profile.</li>
            </ul>
          </section>

          <hr className="border-amber-100" />

          {/* Section 4 */}
          <section id="photos" className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#775a19] text-xl">photo_camera</span>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#570013]">
                4. Photo Protection & Watermarking
              </h2>
            </div>
            <p className="mb-2">
              We understand the sensitive nature of family and bridal photographs. Photographs uploaded to Agarwal Biodata:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Are served through secure, authenticated channels with right-click / direct saving restrictions.</li>
              <li>Can be set to restricted visibility (visible only to verified members).</li>
              <li>Are never used in public commercial advertising without your explicit written authorization.</li>
            </ul>
          </section>

          <hr className="border-amber-100" />

          {/* Section 5 */}
          <section id="kyc" className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#775a19] text-xl">encrypted</span>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#570013]">
                5. Government ID Proofs (KYC Verification)
              </h2>
            </div>
            <p className="mb-2">
              When you upload government identity documents for badge verification:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong>Strict Confidentiality:</strong> ID documents are strictly accessible by authorized compliance administrators only. They are <em>never</em> shared, displayed, or made downloadable to other members.
              </li>
              <li>
                <strong>Aadhaar Masking:</strong> In accordance with UIDAI regulations, members are encouraged to submit masked Aadhaar cards. We do not store biometric data.
              </li>
            </ul>
          </section>

          <hr className="border-amber-100" />

          {/* Section 6 */}
          <section id="deletion" className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-rose-700 text-xl">delete_sweep</span>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#570013]">
                6. Your Rights & Permanent Account Deletion
              </h2>
            </div>
            <p className="mb-3">
              You maintain complete ownership of your personal data. In compliance with the Digital Personal Data Protection Act:
            </p>
            <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-4 space-y-2">
              <h3 className="font-bold text-rose-900 text-xs sm:text-sm">
                Self-Service Account Deletion Feature:
              </h3>
              <p className="text-xs text-rose-800 leading-relaxed">
                You can delete your account and all associated matrimonial biodatas at any time directly within the application:
              </p>
              <ol className="list-decimal pl-5 text-xs text-rose-900 space-y-1 font-medium">
                <li>Go to <strong>Profile</strong> &rarr; <strong>Settings</strong></li>
                <li>Scroll to the bottom of the Settings page</li>
                <li>Tap <strong>Delete Account</strong> (located directly below the Logout button)</li>
                <li>Confirm by typing DELETE</li>
              </ol>
              <p className="text-[11px] text-rose-700 pt-1">
                Upon deletion, your candidate biodata, photos, and match records are permanently removed from active matchmaking discovery.
              </p>
            </div>
          </section>

          <hr className="border-amber-100" />

          {/* Section 7 */}
          <section id="grievance" className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#775a19] text-xl">support_agent</span>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#570013]">
                7. Grievance Redressal Officer & Contact
              </h2>
            </div>
            <p className="mb-3">
              In accordance with the Information Technology Act, 2000 and the Rules made thereunder, the contact details of the Grievance Redressal Officer for Agarwal Biodata are provided below:
            </p>
            <div className="bg-[#fbf9f5] border border-amber-200 rounded-xl p-4 text-xs space-y-1.5 text-slate-800">
              <div className="font-bold text-[#570013] text-sm">
                Dakshin Paschimi Rajasthan Agrawal Sammelan
              </div>
              <div><strong>Project:</strong> Maharaja Agrasen & Maa Madhavi Biodata Prakalp</div>
              <div><strong>Designation:</strong> Grievance Redressal Officer</div>
              <div><strong>Email:</strong> <a href="mailto:privacy@agarwalbiodata.com" className="text-[#570013] font-bold hover:underline">privacy@agarwalbiodata.com</a></div>
              <div><strong>Support Helpline:</strong> +91 98765 43210 (10:00 AM - 6:00 PM IST)</div>
              <div><strong>Address:</strong> Agrawal Samaj Bhavan, Rajasthan, India</div>
            </div>
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
              onClick={() => navigate('/terms')}
              className="hover:text-[#570013] hover:underline transition"
            >
              Terms & Conditions
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
