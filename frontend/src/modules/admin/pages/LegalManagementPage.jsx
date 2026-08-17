import React, { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { adminDataService } from '../services/adminDataService'

export default function LegalManagementPage() {
  const [activeTab, setActiveTab] = useState('privacy') // 'privacy' | 'terms' | 'faqs'
  const [toastMsg, setToastMsg] = useState('')

  // Form States - Point-by-Point Lists
  const [privacyPoints, setPrivacyPoints] = useState([])
  const [termsPoints, setTermsPoints] = useState([])
  const [faqs, setFaqs] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    setIsLoading(true)
    setErrorMsg('')

    let data = null
    try {
      data = await adminDataService.getStaticContent()
    } catch (err) {
      setErrorMsg(err?.message || 'Could not load legal page content.')
    } finally {
      setIsLoading(false)
    }

    // Privacy Points Init
    if (data?.privacyPoints && Array.isArray(data.privacyPoints) && data.privacyPoints.length > 0) {
      setPrivacyPoints(data.privacyPoints)
    } else if (data?.privacyPolicy) {
      // Split by newline or fallback
      const split = data.privacyPolicy.split('\n').map((s) => s.replace(/^[0-9]+\.\s*/, '').trim()).filter(Boolean)
      setPrivacyPoints(split.length > 0 ? split : getDefaultPrivacyPoints())
    } else {
      setPrivacyPoints(getDefaultPrivacyPoints())
    }

    // Terms Points Init
    if (data?.termsPoints && Array.isArray(data.termsPoints) && data.termsPoints.length > 0) {
      setTermsPoints(data.termsPoints)
    } else if (data?.termsOfService) {
      const split = data.termsOfService.split('\n').map((s) => s.replace(/^[0-9]+\.\s*/, '').trim()).filter(Boolean)
      setTermsPoints(split.length > 0 ? split : getDefaultTermsPoints())
    } else {
      setTermsPoints(getDefaultTermsPoints())
    }

    // FAQs Init
    setFaqs(
      data?.faqs && Array.isArray(data.faqs) && data.faqs.length > 0
        ? data.faqs
        : getDefaultFaqs()
    )
  }

  function getDefaultPrivacyPoints() {
    return [
      'Agrawal Biodata values your privacy and strictly safeguards all member biodatas, photos, and identity proof documents using end-to-end encryption.',
      'Your personal contact number and residential address are kept confidential and are never disclosed to non-connected members without your explicit permission.',
      'Government identity documents (Aadhaar/Passport) uploaded for verification are reviewed exclusively by authorized administration personnel and are never publicly displayed.',
      'Members retain full ownership of their profile data and can update or request deletion of their matrimonial profile at any time.'
    ]
  }

  function getDefaultTermsPoints() {
    return [
      'By creating an account on Agrawal Biodata, you agree to provide genuine personal, educational, gotra, and family credentials.',
      'Misrepresentation of identity, gotra, age, or marital status will lead to immediate account suspension and potential legal reporting.',
      'Members must maintain dignified, respectful communication and refrain from any form of harassment, spamming, or fraudulent activity.',
      'Agrawal Biodata reserves the right to review reported accounts and take administrative moderation action including warnings or permanent account termination.'
    ]
  }

  function getDefaultFaqs() {
    return [
      {
        id: 'FAQ-101',
        question: 'How do I create a matrimony profile on Agrawal Biodata?',
        answer:
          'Register your account using your mobile number or email address, select whether you are creating the profile for yourself or a family member, and fill in the required gotra and personal details.'
      },
      {
        id: 'FAQ-102',
        question: 'How are gotras verified on the platform?',
        answer:
          'Our automated system cross-verifies self and mother gotras against community gotra rules to ensure authentic match pairings and prevent same-gotra match recommendations.'
      },
      {
        id: 'FAQ-103',
        question: 'What is the profile verification badge?',
        answer:
          'Profiles that submit genuine government ID proof (Aadhaar/Passport) and professional credentials receive a Verified Badge for increased trust and higher match visibility.'
      }
    ]
  }

  // --- PRIVACY HANDLERS ---
  const handleAddPrivacyPoint = () => {
    setPrivacyPoints([...privacyPoints, ''])
  }

  const handlePrivacyPointChange = (index, value) => {
    const updated = [...privacyPoints]
    updated[index] = value
    setPrivacyPoints(updated)
  }

  const handleRemovePrivacyPoint = (index) => {
    if (privacyPoints.length <= 1) return
    const updated = privacyPoints.filter((_, idx) => idx !== index)
    setPrivacyPoints(updated)
  }

  // Each save writes only its own CMS page; the numbered-line format is what
  // loadContent splits back into editable points.
  const handleSavePrivacy = async (e) => {
    e.preventDefault()
    const cleaned = privacyPoints.map((p) => p.trim()).filter(Boolean)
    const formattedString = cleaned.map((p, i) => `${i + 1}. ${p}`).join('\n')

    setIsSaving(true)
    setErrorMsg('')
    try {
      await adminDataService.saveStaticContent({ privacyPolicy: formattedString })
      setToastMsg('Privacy Policy points saved successfully! Updated live on user portal.')
      setTimeout(() => setToastMsg(''), 3500)
    } catch (err) {
      setErrorMsg(err?.message || 'Could not save the Privacy Policy.')
    } finally {
      setIsSaving(false)
    }
  }

  // --- TERMS HANDLERS ---
  const handleAddTermsPoint = () => {
    setTermsPoints([...termsPoints, ''])
  }

  const handleTermsPointChange = (index, value) => {
    const updated = [...termsPoints]
    updated[index] = value
    setTermsPoints(updated)
  }

  const handleRemoveTermsPoint = (index) => {
    if (termsPoints.length <= 1) return
    const updated = termsPoints.filter((_, idx) => idx !== index)
    setTermsPoints(updated)
  }

  const handleSaveTerms = async (e) => {
    e.preventDefault()
    const cleaned = termsPoints.map((p) => p.trim()).filter(Boolean)
    const formattedString = cleaned.map((p, i) => `${i + 1}. ${p}`).join('\n')

    setIsSaving(true)
    setErrorMsg('')
    try {
      await adminDataService.saveStaticContent({ termsOfService: formattedString })
      setToastMsg('Terms & Conditions points saved successfully! Updated live on user portal.')
      setTimeout(() => setToastMsg(''), 3500)
    } catch (err) {
      setErrorMsg(err?.message || 'Could not save the Terms & Conditions.')
    } finally {
      setIsSaving(false)
    }
  }

  // --- FAQ HANDLERS ---
  const handleAddFaq = () => {
    const newId = `FAQ-${Date.now().toString().slice(-4)}`
    setFaqs([...faqs, { id: newId, question: '', answer: '' }])
  }

  const handleFaqChange = (index, field, value) => {
    const updated = [...faqs]
    updated[index][field] = value
    setFaqs(updated)
  }

  const handleRemoveFaq = (index) => {
    if (faqs.length <= 1) return
    const updated = faqs.filter((_, idx) => idx !== index)
    setFaqs(updated)
  }

  const handleSaveFaqs = async (e) => {
    e.preventDefault()
    const cleanedFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim())

    setIsSaving(true)
    setErrorMsg('')
    try {
      await adminDataService.saveStaticContent({ faqs: cleanedFaqs })
      setToastMsg('FAQ questions list updated successfully!')
      setTimeout(() => setToastMsg(''), 3500)
    } catch (err) {
      setErrorMsg(err?.message || 'Could not save the FAQ list.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdminLayout title="Legal & Policy Pages">
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-red-500 font-bold shrink-0">
            âœ•
          </button>
        </div>
      )}

      {isLoading && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 font-bold">
          Loading legal page content...
        </div>
      )}

      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-2xs">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#570013]">
            Legal, Policy & FAQ Content Configurator
          </h2>
          <p className="text-xs text-[#775a19] font-medium mt-0.5">
            Manage point-by-point Privacy Policy, Terms & Conditions, and Frequently Asked Questions (FAQs).
          </p>
        </div>

        <button
          onClick={loadContent}
          className="px-3.5 py-2 bg-white border border-amber-900/20 hover:bg-amber-50 text-[#570013] font-bold rounded-md text-xs flex items-center gap-2 shadow-2xs transition-all self-start sm:self-auto active:scale-95"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          <span>Reset Content</span>
        </button>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-3.5 py-2 rounded-md font-extrabold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'privacy'
              ? 'bg-[#570013] text-amber-100 shadow-xs'
              : 'bg-amber-50/70 text-[#775a19] hover:bg-amber-100/70 border border-amber-200/60'
          }`}
        >
          <span className="material-symbols-outlined text-base">policy</span>
          <span>Privacy Policy ({privacyPoints.length} Points)</span>
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`px-3.5 py-2 rounded-md font-extrabold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'terms'
              ? 'bg-[#570013] text-amber-100 shadow-xs'
              : 'bg-amber-50/70 text-[#775a19] hover:bg-amber-100/70 border border-amber-200/60'
          }`}
        >
          <span className="material-symbols-outlined text-base">gavel</span>
          <span>Terms & Conditions ({termsPoints.length} Points)</span>
        </button>

        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-3.5 py-2 rounded-md font-extrabold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'faqs'
              ? 'bg-[#570013] text-amber-100 shadow-xs'
              : 'bg-amber-50/70 text-[#775a19] hover:bg-amber-100/70 border border-amber-200/60'
          }`}
        >
          <span className="material-symbols-outlined text-base">quiz</span>
          <span>FAQs ({faqs.length})</span>
        </button>
      </div>

      {/* TAB 1: PRIVACY POLICY - POINT BY POINT */}
      {activeTab === 'privacy' && (
        <form onSubmit={handleSavePrivacy} className="bg-white rounded-lg p-5 border border-amber-900/15 shadow-xs space-y-4 max-w-4xl">
          <div className="flex items-center justify-between border-b border-amber-900/10 pb-3">
            <div>
              <h3 className="font-display font-extrabold text-base text-[#570013]">
                Privacy Policy Points (Line by Line)
              </h3>
              <p className="text-xs text-[#775a19] font-medium">
                Each point will be displayed as a clear numbered policy point on the user portal.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddPrivacyPoint}
                className="px-3 py-2 bg-amber-100 text-[#570013] border border-amber-300 font-extrabold text-xs rounded-md flex items-center gap-1 hover:bg-amber-200 transition-all shadow-2xs active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add Policy Point</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-[#570013] text-amber-100 font-extrabold text-xs rounded-md shadow-md hover:bg-[#42000e] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Save Privacy Policy
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {privacyPoints.map((point, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2.5 bg-amber-50/40 border border-amber-900/15 rounded-md">
                <span className="w-6 h-6 rounded-full bg-[#570013] text-amber-100 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {idx + 1}
                </span>

                <textarea
                  rows="2"
                  required
                  value={point}
                  onChange={(e) => handlePrivacyPointChange(idx, e.target.value)}
                  placeholder={`Privacy Policy Point #${idx + 1}...`}
                  className="flex-1 p-2 bg-white border border-amber-900/20 rounded-md text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40 leading-snug"
                />

                {privacyPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePrivacyPoint(idx)}
                    className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-all shrink-0 mt-0.5"
                    title="Remove point"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </form>
      )}

      {/* TAB 2: TERMS & CONDITIONS - POINT BY POINT */}
      {activeTab === 'terms' && (
        <form onSubmit={handleSaveTerms} className="bg-white rounded-lg p-5 border border-amber-900/15 shadow-xs space-y-4 max-w-4xl">
          <div className="flex items-center justify-between border-b border-amber-900/10 pb-3">
            <div>
              <h3 className="font-display font-extrabold text-base text-[#570013]">
                Terms & Conditions Points (Line by Line)
              </h3>
              <p className="text-xs text-[#775a19] font-medium">
                Each point will be displayed as a numbered legal term on the user portal.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddTermsPoint}
                className="px-3 py-2 bg-amber-100 text-[#570013] border border-amber-300 font-extrabold text-xs rounded-md flex items-center gap-1 hover:bg-amber-200 transition-all shadow-2xs active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add Terms Point</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-[#570013] text-amber-100 font-extrabold text-xs rounded-md shadow-md hover:bg-[#42000e] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Save Terms & Conditions
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {termsPoints.map((point, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2.5 bg-amber-50/40 border border-amber-900/15 rounded-md">
                <span className="w-6 h-6 rounded-full bg-[#570013] text-amber-100 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {idx + 1}
                </span>

                <textarea
                  rows="2"
                  required
                  value={point}
                  onChange={(e) => handleTermsPointChange(idx, e.target.value)}
                  placeholder={`Terms & Conditions Point #${idx + 1}...`}
                  className="flex-1 p-2 bg-white border border-amber-900/20 rounded-md text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40 leading-snug"
                />

                {termsPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTermsPoint(idx)}
                    className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-all shrink-0 mt-0.5"
                    title="Remove point"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </form>
      )}

      {/* TAB 3: FAQs */}
      {activeTab === 'faqs' && (
        <form onSubmit={handleSaveFaqs} className="bg-white rounded-lg p-5 border border-amber-900/15 shadow-xs space-y-4 max-w-4xl">
          <div className="flex items-center justify-between border-b border-amber-900/10 pb-3">
            <div>
              <h3 className="font-display font-extrabold text-base text-[#570013]">
                Frequently Asked Questions List
              </h3>
              <p className="text-xs text-[#775a19] font-medium">
                Create and edit Q&A entries displayed on the user Help & FAQ page.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddFaq}
                className="px-3 py-2 bg-amber-100 text-[#570013] border border-amber-300 font-extrabold text-xs rounded-md flex items-center gap-1 hover:bg-amber-200 transition-all shadow-2xs active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add FAQ Question</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-[#570013] text-amber-100 font-extrabold text-xs rounded-md shadow-md hover:bg-[#42000e] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Save All FAQs
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={faq.id || idx}
                className="p-4 bg-amber-50/40 border border-amber-900/15 rounded-md space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#570013]">
                    FAQ Question #{idx + 1}
                  </span>
                  {faqs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(idx)}
                      className="p-1 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-all"
                      title="Remove question"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    required
                    value={faq.question}
                    onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                    placeholder="e.g. How do I edit my profile biodata?"
                    className="w-full px-3 py-2 bg-white border border-amber-900/20 rounded-md text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Answer
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={faq.answer}
                    onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                    placeholder="Provide a helpful, clear response for users..."
                    className="w-full p-3 bg-white border border-amber-900/20 rounded-md text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40 leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        </form>
      )}
    </AdminLayout>
  )
}
