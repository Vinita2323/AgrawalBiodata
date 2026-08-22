import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { adminDataService } from '../services/adminDataService'

export default function UserDetailPage() {
  const { userId } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('Overview') // 'Overview' | 'Profiles' | 'Verification' | 'Subscription' | 'Payments' | 'Activity'
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0)

  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!userId) return
      setIsLoading(true)
      setErrorMsg('')
      try {
        const found = await adminDataService.getUserById(userId)
        if (!cancelled) setUser(found)
      } catch (err) {
        if (!cancelled) setErrorMsg(err?.message || 'Could not load this user account.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const handleStatusChange = async (newStatus) => {
    setIsMutating(true)
    setErrorMsg('')
    try {
      await adminDataService.updateUserStatus(user.id, newStatus)
      setUser({ ...user, accountStatus: newStatus })
    } catch (err) {
      setErrorMsg(err?.message || 'Could not update the account status.')
    } finally {
      setIsMutating(false)
    }
  }

  const handleToggleFeatured = async (profile) => {
    const next = !profile.isFeatured

    setIsMutating(true)
    setErrorMsg('')
    try {
      await adminDataService.toggleProfileFeatured(user.id, profile._id, next)
      setUser((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) =>
          String(p._id) === String(profile._id) ? { ...p, isFeatured: next } : p
        ),
      }))
    } catch (err) {
      setErrorMsg(err?.message || 'Could not change the featured placement.')
    } finally {
      setIsMutating(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout title="User Details">
        <div className="bg-white rounded-2xl p-12 text-center max-w-md mx-auto my-12 border border-stone-200">
          <div className="w-8 h-8 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-stone-500 font-semibold">Loading user account...</p>
        </div>
      </AdminLayout>
    )
  }

  if (!user) {
    return (
      <AdminLayout title="User Details">
        <div className="bg-white rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto my-12 border border-stone-200">
          <span className="material-symbols-outlined text-4xl text-stone-300">person_off</span>
          <h3 className="font-display font-bold text-lg text-stone-800">User Account Not Found</h3>
          <p className="text-xs text-stone-500">
            {errorMsg || 'The requested user ID does not exist in the database.'}
          </p>
          <Link
            to="/admin/users"
            className="inline-block px-4 py-2 bg-[#570013] text-white font-semibold text-xs rounded-xl"
          >
            Back to User List
          </Link>
        </div>
      </AdminLayout>
    )
  }

  // getUserById returns the account together with its candidate profiles,
  // payments and KYC submissions, so no extra round-trips are needed here.
  const profiles = user.profiles || []
  const currentProfile = profiles[selectedProfileIndex] || profiles[0] || {}
  const allPayments = user.payments || []
  const verifications = user.verifications || []

  return (
    <AdminLayout title={`User: ${user.name}`}>
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-bold flex items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-red-500 font-bold shrink-0">
            ✕
          </button>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-2 hover:bg-stone-100 rounded-xl text-stone-500 transition-colors"
            title="Back to Users"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-stone-900">{user.name}</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  user.accountStatus === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {user.accountStatus}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              Account ID: {user.id} • Registered: {user.createdDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user.accountStatus === 'Active' ? (
            <button
              onClick={() => handleStatusChange('Suspended')}
              disabled={isMutating}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">block</span>
              <span>{isMutating ? 'Working...' : 'Suspend Account'}</span>
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('Active')}
              disabled={isMutating}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{isMutating ? 'Working...' : 'Activate Account'}</span>
            </button>
          )}
        </div>
      </div>



      {/* DETAIL NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto scrollbar-none pb-1 print:hidden">
        {['Overview', 'Biodata', 'Verification', 'Subscription', 'Payment History'].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-[#570013] text-amber-100 shadow-md'
                  : 'bg-white text-stone-700 hover:bg-amber-50/70 border border-stone-200'
              }`}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {/* Candidate selector. An account can run biodata for more than one
          person - typically a parent with a son and a daughter - and each
          has its own document, so moderation needs to page between them.
          Hidden from print so the exported PDF stays a clean biodata. */}
      {profiles.length > 1 && (
        <div className="bg-white p-4 rounded-lg border border-amber-900/15 shadow-xs print:hidden">
          <p className="text-xs font-extrabold text-[#570013] uppercase tracking-wide mb-2.5">
            {profiles.length} candidate profiles on this account
          </p>
          <div className="flex flex-wrap gap-2">
            {profiles.map((p, index) => (
              <button
                key={p._id || p.profileId || index}
                onClick={() => setSelectedProfileIndex(index)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-all text-left ${
                  index === selectedProfileIndex
                    ? 'bg-[#570013] text-amber-100 border-[#570013] shadow-md'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-amber-50/70'
                }`}
              >
                <span className="block">{p.fullName || '(unnamed)'}</span>
                <span
                  className={`block text-[10px] font-semibold mt-0.5 ${
                    index === selectedProfileIndex ? 'text-amber-200/90' : 'text-stone-500'
                  }`}
                >
                  {p.profileFor && p.profileFor !== 'Self' ? p.profileFor : 'Self'}
                  {p.profileId ? ` · ${p.profileId}` : ''}
                  {p.isActive ? ' · active' : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT PANELS */}

      {/* TAB 1: OVERVIEW & USER INFO */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Primary Information */}
          <div className="bg-white rounded-lg p-5 border border-stone-200/80 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-base text-[#570013] border-b border-stone-100 pb-3">
              User Account Credentials
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-stone-400 block font-medium">Full Account Holder Name</span>
                <span className="font-bold text-stone-800 text-sm">{user.name}</span>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Mobile Number</span>
                <span className="font-semibold text-stone-800">{user.mobile}</span>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Email Address</span>
                <span className="font-semibold text-stone-800">{user.email}</span>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Registration Date</span>
                <span className="font-semibold text-stone-800">{user.createdDate}</span>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Last Login / Activity</span>
                <span className="font-semibold text-stone-800">{user.lastActive}</span>
              </div>
              <div>
                <span className="text-stone-400 block font-medium">Verification Status</span>
                <span className="font-bold text-amber-800">{user.verificationStatus}</span>
              </div>
            </div>
          </div>

          {/* Selected Matrimonial Profile Card */}
          <div className="lg:col-span-2 bg-white rounded-lg p-5 border border-stone-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md">
                  {currentProfile.profileFor && currentProfile.profileFor !== 'Self'
                    ? `Matrimonial Profile · ${currentProfile.profileFor}`
                    : 'Matrimonial Profile'}
                  {currentProfile.isActive ? ' · Active' : ''}
                </span>
                <h3 className="font-display font-bold text-lg text-stone-900 mt-1">
                  {currentProfile.fullName} ({currentProfile.profileId})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {currentProfile.verified && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    Verified Badge Granted
                  </span>
                )}

                {/* Featured placement promotes this profile in discovery. */}
                <button
                  onClick={() => handleToggleFeatured(currentProfile)}
                  disabled={isMutating || !currentProfile._id}
                  className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 border transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    currentProfile.isFeatured
                      ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                      : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
                  }`}
                  title={currentProfile.isFeatured ? 'Remove from featured' : 'Add to featured'}
                >
                  <span className="material-symbols-outlined text-sm">
                    {currentProfile.isFeatured ? 'star' : 'star_outline'}
                  </span>
                  {currentProfile.isFeatured ? 'Featured' : 'Feature Profile'}
                </button>
              </div>
            </div>

            {/* Profile Detail Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <img
                  src={currentProfile.image}
                  alt={currentProfile.fullName}
                  className="w-full h-56 rounded-xl object-cover border border-stone-200 shadow-xs"
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                  <span className="text-stone-400 block text-[10px]">Gender & Age</span>
                  <span className="font-bold text-stone-800">{currentProfile.gender}, {currentProfile.age} yrs</span>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                  <span className="text-stone-400 block text-[10px]">Height & Complexion</span>
                  <span className="font-bold text-stone-800">{currentProfile.height}, {currentProfile.complexion}</span>
                </div>
                <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                  <span className="text-amber-800 block text-[10px] font-bold">Self Gotra</span>
                  <span className="font-bold text-stone-900">{currentProfile.gotra}</span>
                </div>
                <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                  <span className="text-amber-800 block text-[10px] font-bold">Mother's Gotra</span>
                  <span className="font-bold text-stone-900">{currentProfile.motherGotra}</span>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                  <span className="text-stone-400 block text-[10px]">Qualification</span>
                  <span className="font-bold text-stone-800">{currentProfile.qualification}</span>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                  <span className="text-stone-400 block text-[10px]">Working At & Income</span>
                  <span className="font-bold text-stone-800">{currentProfile.workingAt} ({currentProfile.income})</span>
                </div>
                <div className="col-span-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                  <span className="text-stone-400 block text-[10px]">Residential Address</span>
                  <span className="font-medium text-stone-800">{currentProfile.residentialAddress}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPREHENSIVE BIODATA VIEW & PDF DOWNLOAD */}
      {activeTab === 'Biodata' && (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-amber-900/15 shadow-xs print:hidden">
            <div>
              <h3 className="font-display font-bold text-base text-[#570013]">
                Official Candidate Biodata Document
              </h3>
              <p className="text-xs text-[#775a19] font-medium">
                Official format matching the platform PDF export template.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-[#570013] hover:bg-[#42000e] text-amber-100 font-extrabold rounded-md text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Download / Print Biodata (PDF)</span>
            </button>
          </div>

          {/* Printable Biodata Document Card */}
          <div className="bg-white border border-stone-200 shadow-sm max-w-4xl mx-auto p-6 md:p-10 space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 text-stone-900">
            {/* Top Logo & Organization Header */}
            <div className="flex items-center gap-4 border-b border-amber-900/20 pb-3">
              <img
                src="/Logo (2).png"
                alt="Agrawal Biodata Logo"
                className="h-16 w-auto object-contain shrink-0"
              />
              <div className="flex flex-col text-left">
                <h1 className="font-bold text-lg md:text-xl text-[#570013] font-display leading-tight">
                  महाराजा अग्रसेन एवं माँ माधवी बायोडाटा प्रकल्प
                </h1>
                <p className="text-xs text-[#775a19] font-semibold mt-0.5">
                  ( दक्षिणी पश्चिमी राजस्थान अग्रवाल सम्मेलन द्वारा संचालित )
                </p>
              </div>
            </div>

            {/* BIO DATA Header Bar */}
            <div className="bg-[#f5eee6] border-y border-amber-900/10 px-4 py-2 text-left">
              <h2 className="font-bold text-base text-[#570013] tracking-wider uppercase font-display">
                BIO DATA
              </h2>
            </div>

            {/* SECTION 1: PERSONAL INFORMATION */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-[#570013] uppercase tracking-wide border-b border-[#570013]/20 pb-1.5 font-display">
                PERSONAL INFORMATION
              </h3>
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Full Name</span>
                  <span className="font-bold text-stone-900 col-span-2 capitalize">{currentProfile.fullName || user.name}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Gender</span>
                  <span className="font-bold text-stone-900 col-span-2">{currentProfile.gender || 'Female'}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Gotra</span>
                  <span className="font-bold text-stone-900 col-span-2">{currentProfile.gotra || 'Goyal'} (Goyal)</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Date of Birth</span>
                  <span className="font-bold text-stone-900 col-span-2">{currentProfile.dob || '2021-10-11'}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Height</span>
                  <span className="font-bold text-stone-900 col-span-2">{currentProfile.height || '5,8'}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Complexion</span>
                  <span className="font-bold text-stone-900 col-span-2 capitalize">{currentProfile.complexion || 'fair'}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Manglik</span>
                  <span className="font-bold text-stone-900 col-span-2">{currentProfile.manglik || 'Yes'}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Qualification</span>
                  <span className="font-bold text-stone-900 col-span-2">{currentProfile.qualification || 'B.tech'}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Income</span>
                  <span className="font-bold text-stone-900 col-span-2">{currentProfile.income || '3'}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Working At</span>
                  <span className="font-bold text-stone-900 col-span-2">{currentProfile.workingAt || 'appzeto'}</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: FAMILY DETAILS */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-sm text-[#570013] uppercase tracking-wide border-b border-[#570013]/20 pb-1.5 font-display">
                FAMILY DETAILS
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Grandfather</span>
                  <span className="font-bold text-stone-900 col-span-2">{currentProfile.grandfather || 'kisan'}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Grandmother</span>
                  <span className="font-bold text-stone-900 col-span-2">{currentProfile.grandmother || 'kisori'}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Father</span>
                  <span className="font-bold text-stone-900 col-span-2">{currentProfile.father || 'mahesh'}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Mother</span>
                  <span className="font-bold text-stone-900 col-span-2">{currentProfile.mother || 'meheshwari'}</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Brothers</span>
                  <div className="col-span-2">
                    <p className="font-bold text-stone-900">vishnu (Married)</p>
                    <p className="text-stone-500 text-[11px]">Wife: vishni (indore)</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Sisters</span>
                  <div className="col-span-2">
                    <p className="font-bold text-stone-900">bhavya (Unmarried)</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Tauji</span>
                  <div className="col-span-2">
                    <p className="font-bold text-stone-900">rajesh (Married)</p>
                    <p className="text-stone-500 text-[11px]">Taiji: rajni (indore)</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Chacha</span>
                  <div className="col-span-2">
                    <p className="font-bold text-stone-900">mukesh (Married)</p>
                    <p className="text-stone-500 text-[11px]">Chachi: mahima (indore)</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Bua Ji</span>
                  <span className="font-bold text-stone-900 col-span-2">-</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: MATERNAL DETAILS */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-sm text-[#570013] uppercase tracking-wide border-b border-[#570013]/20 pb-1.5 font-display">
                MATERNAL DETAILS
              </h3>
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <span className="text-stone-500 font-medium col-span-1">Mama Ji</span>
                  <div className="col-span-2">
                    <p className="font-bold text-stone-900">suresh (Married)</p>
                    <p className="text-stone-500 text-[11px]">Mami Ji: rekha (indore)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VERIFICATION REQUESTS */}
      {activeTab === 'Verification' && (
        <div className="bg-white rounded-lg p-5 border border-amber-900/15 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-[#570013]">
                Profile Verification Records & Documents
              </h3>
              <p className="text-xs text-[#775a19] font-medium">
                Government Identity Proof & Mobile Verification details for this candidate profile.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-xs rounded-md inline-flex items-center gap-1.5 shadow-2xs">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span>Verified Account</span>
            </span>
          </div>

          {verifications.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">
              No verification requests recorded for this user.
            </p>
          ) : (
            <div className="space-y-3">
              {verifications.map((v) => (
                <div
                  key={v.id}
                  className="p-4 border border-amber-200/80 rounded-lg bg-amber-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-[#570013] font-mono">{v.id}</span>
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md shadow-2xs ${
                          v.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : v.status === 'Pending'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-red-100 text-red-900 border border-red-300'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 font-medium">
                      Identity Proof: <span className="font-bold text-[#570013]">{v.govtIdType || 'Government ID'}</span> ({v.govtIdStatus || 'Verified'})
                    </p>
                    <p className="text-xs text-stone-600">
                      Mobile & Email: <span className="font-semibold text-stone-800">Phone Verified ({v.mobile})</span>
                    </p>
                    <p className="text-[10px] text-[#775a19] font-semibold">Submitted: {v.submittedAt}</p>
                  </div>

                  <Link
                    to={`/admin/profile-verification/${v.id}`}
                    className="px-4 py-2 bg-[#570013] hover:bg-[#42000e] text-amber-100 text-xs font-bold rounded-md shadow-xs flex items-center gap-1.5 transition-all self-end sm:self-auto"
                  >
                    <span className="material-symbols-outlined text-sm">find_in_page</span>
                    <span>Inspect Documents</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUBSCRIPTION & PLAN DETAILS */}
      {activeTab === 'Subscription' && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-stone-900">
            Subscription Plan Status
          </h3>

          <div className="p-5 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#775a19] uppercase tracking-wider">
                Current Active Tier
              </span>
              <h4 className="font-display text-2xl font-bold text-stone-900 mt-1">
                {user.subscriptionPlan}
              </h4>
              <p className="text-xs text-stone-600 mt-1">
                Status: <span className="font-semibold text-emerald-700">{user.subscriptionStatus}</span>
              </p>
              <p className="text-xs text-stone-600 mt-1">
                Profile views today:{' '}
                <span className="font-semibold text-stone-900">
                  {user.dailyMatchLimit === -1
                    ? `${user.profilesViewedToday} viewed (Unlimited plan)`
                    : `${user.profilesViewedToday} / ${user.dailyMatchLimit || 'plan default'}`}
                </span>
              </p>
            </div>

            <Link
              to="/admin/subscriptions"
              className="px-4 py-2 bg-[#775a19] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#5e4713]"
            >
              Manage Plans
            </Link>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENT HISTORY */}
      {activeTab === 'Payment History' && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-stone-900">
            Payment Transactions History
          </h3>

          {allPayments.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">
              No transactions recorded for this user.
            </p>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase">
                  <th className="pb-2">Transaction ID</th>
                  <th className="pb-2">Plan</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Gateway</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {allPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-stone-50">
                    <td className="py-3 font-mono font-bold text-stone-800">{pay.transactionId}</td>
                    <td className="py-3 font-medium text-stone-700">{pay.planName}</td>
                    <td className="py-3 font-bold text-stone-900">₹{pay.amount}</td>
                    <td className="py-3 text-stone-600">{pay.paymentMethod}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          pay.paymentStatus === 'Success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {pay.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 text-stone-500 font-mono">{pay.createdDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
