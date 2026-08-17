import React, { useState, useEffect } from 'react'
import { sendInterest } from '../../../services/interestService'
import { addToShortlist, recordVisitor } from '../../../services/socialService'
import { getMatchScore } from '../../../services/matchService'
import { isAuthenticated } from '../../../services/authService'
import {
  unlockContact,
  getContactQuota,
  getContactUnlockStatus,
} from '../../../services/accountService'

export default function ProfileDetailScreen({ profile, onBack }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isShortlisted, setIsShortlisted] = useState(false)
  const [isInterestSent, setIsInterestSent] = useState(false)
  const [liveScore, setLiveScore] = useState(null)
  const [toast, setToast] = useState(null)
  const [revealedContact, setRevealedContact] = useState(null)
  const [contactQuota, setContactQuota] = useState(null)
  const [isUnlocking, setIsUnlocking] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const p = profile || {
    fullName: 'Priya Garg',
    name: 'Priya Garg',
    gender: 'Female',
    age: 26,
    height: "5'4\"",
    gotra: 'Garg',
    motherGotra: 'Bansal',
    dob: '1998-05-14',
    tob: '08:30 AM',
    pob: 'Jaipur, Rajasthan',
    complexion: 'Fair',
    manglik: 'Non-Manglik',
    qualification: 'M.Tech, Software Engineer',
    workingAt: 'TCS Digital',
    income: '15-20 LPA',
    hobbies: 'Classical Dance, Reading, Travelling',
    // Family
    grandfather: 'Late Sh. Ramcharan Garg',
    grandmother: 'Smt. Shanti Devi',
    father: 'Sh. Rameshwar Garg',
    fatherOccupation: 'Business',
    fatherOccupationDetails: 'Owner, Garg Textile Mills',
    mother: 'Smt. Sunita Garg',
    // Relatives
    brotherList: [{ name: 'Aman Garg', status: 'Married', spouseName: 'Pooja Garg', homePlace: 'Delhi' }],
    sisterList: [{ name: 'Neha Garg', status: 'Married', spouseName: 'Rahul Agrawal', homePlace: 'Indore' }],
    taujiList: [{ name: 'Sh. Suresh Garg', status: 'Married', spouseName: 'Smt. Anita Garg', homePlace: 'Jaipur' }],
    chachaList: [{ name: 'Sh. Dinesh Garg', status: 'Married', spouseName: 'Smt. Meena Garg', homePlace: 'Ahmedabad' }],
    buajiList: [{ name: 'Smt. Rekha Agrawal', status: 'Married', spouseName: 'Sh. Mohan Agrawal', homePlace: 'Udaipur' }],
    mamajiList: [{ name: 'Sh. Vijay Bansal', status: 'Married', spouseName: 'Smt. Geeta Bansal', homePlace: 'Kota' }],
    // Contact
    residentialAddress: '104, Agrasen Nagar, Gopalpura Bypass, Jaipur, Rajasthan',
    mobileNumber: '+91 98290 XXXXX',
    city: 'Jaipur, Rajasthan',
    matchScore: 95,
    verified: true,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
  }

  const targetId = p.profileId || p._id || p.id

  useEffect(() => {
    async function initProfileDetail() {
      if (!targetId || !isAuthenticated()) return

      try {
        recordVisitor(targetId).catch(() => {})
        const scoreRes = await getMatchScore(targetId)
        if (scoreRes?.totalScore) {
          setLiveScore(scoreRes)
        }
      } catch (err) {
        console.warn('Profile detail live score note:', err)
      }

      // A previously unlocked profile must not ask the user to pay again.
      try {
        const [statusRes, quotaRes] = await Promise.all([
          getContactUnlockStatus(targetId),
          getContactQuota(),
        ])
        setContactQuota(quotaRes || null)
        if (statusRes?.isUnlocked) {
          const res = await unlockContact(targetId)
          setRevealedContact(res?.contact || null)
        }
      } catch {
        // Contact gating is additive; failing to read it leaves the masked view.
      }
    }
    initProfileDetail()
  }, [targetId])

  const handleUnlockContact = async () => {
    if (!targetId) return

    if (!isAuthenticated()) {
      showToast('Please log in to view contact details.', 'info')
      return
    }

    setIsUnlocking(true)
    try {
      const res = await unlockContact(targetId)
      setRevealedContact(res?.contact || null)
      setContactQuota((prev) =>
        prev && !prev.unlimited ? { ...prev, remaining: res?.remainingUnlocks ?? prev.remaining } : prev
      )
      showToast(
        res?.viaConnection
          ? 'Contact details unlocked through your accepted interest.'
          : 'Contact details unlocked.',
        'success'
      )
    } catch (err) {
      showToast(err?.message || 'Could not unlock contact details.', 'info')
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleShortlist = async () => {
    setIsShortlisted(prev => !prev)
    if (isAuthenticated() && targetId) {
      try {
        await addToShortlist(targetId)
        showToast('Profile added to shortlist', 'success')
      } catch (err) {
        showToast(err.message || 'Shortlisted', 'info')
      }
    } else {
      showToast(`Shortlisted ${displayName}`, 'success')
    }
  }

  const handleExpressInterest = async () => {
    setIsInterestSent(true)
    if (isAuthenticated() && targetId) {
      try {
        await sendInterest(targetId, 'Hello, I liked your profile and would like to connect.')
        showToast(`Express Interest sent to ${displayName}!`, 'success')
      } catch (err) {
        showToast(err.message || 'Interest already expressed', 'info')
      }
    } else {
      showToast(`Express Interest sent to ${displayName}'s family!`, 'success')
    }
  }

  const displayName = p.fullName || p.name || 'Candidate Profile'
  const displayGotra = p.gotra || 'Agarwal'
  const displayMotherGotra = p.motherGotra || p.subGotra || 'Bansal'
  const displayHeight = p.height || "5'4\""
  const displayCity = p.city || p.pob || 'Rajasthan'
  const profileImgSrc = p.image || p.profilePicture

  const handleShare = async () => {
    const shareData = {
      title: `${displayName} - Agrawal Biodata Profile`,
      text: `Check out the biodata profile of ${displayName} (${displayGotra} Gotra, ${displayCity}) on Agrawal Biodata!`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err)
        }
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href)
      alert('Profile link copied to clipboard!')
    } else {
      alert(`Share link for ${displayName}: ${window.location.href}`)
    }
  }

  return (
    <div className="bg-[#fbf9f5] text-[#1b1c1a] font-body min-h-screen pb-24 select-none">
      {/* Navigation Sub-Header */}
      <div className="bg-[#fdfcf9] border-b border-amber-200/60 px-4 py-2 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold text-[#570013] hover:opacity-80 transition"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Back</span>
        </button>
        <span className="font-display font-bold text-sm text-[#570013]">
          Complete Biodata Profile
        </span>
        <button
          onClick={handleShare}
          className="text-[#570013] p-1.5 rounded-full hover:bg-amber-100/60 active:scale-95 transition flex items-center justify-center"
          title="Share Biodata Profile"
        >
          <span className="material-symbols-outlined text-[20px]">share</span>
        </button>
      </div>

      {/* Fullscreen Image Preview Modal */}
      {isPreviewOpen && (
        <div 
          onClick={() => setIsPreviewOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          {/* Modal Close Button */}
          <div className="absolute top-4 right-4 flex items-center gap-2 text-white z-10">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition flex items-center justify-center shadow-md"
              title="Close"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* Full Image Display */}
          <div className="w-full h-full flex items-center justify-center p-2">
            {profileImgSrc ? (
              <img
                src={profileImgSrc}
                alt={displayName}
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              />
            ) : (
              <div className="w-48 h-48 rounded-full bg-white/10 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-6xl">person</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-3.5 pt-3.5 space-y-3.5">
        {/* Candidate Hero Card */}
        <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-md relative overflow-hidden">
          <div className="flex flex-row items-center gap-4">
            {/* Clickable Profile Picture */}
            <div
              onClick={() => {
                if (profileImgSrc) {
                  setIsPreviewOpen(true)
                  setZoomScale(1)
                }
              }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-[3px] border-amber-300 shadow-md flex-shrink-0 bg-amber-50 flex items-center justify-center cursor-pointer hover:opacity-90 hover:scale-[1.02] transition-all group relative"
              title="Click to view & zoom image"
            >
              {profileImgSrc ? (
                <>
                  <img src={profileImgSrc} alt={displayName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-[22px]">zoom_in</span>
                  </div>
                </>
              ) : (
                <span className="material-symbols-outlined text-[#775a19] text-5xl">person</span>
              )}
            </div>

            <div className="text-left flex-grow min-w-0">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#570013] text-[#ffdea5] text-[10px] font-bold rounded-full mb-1 shadow-2xs">
                <span className="material-symbols-outlined text-[12px]">star</span>
                <span>{p.matchScore || 95}% Match Score</span>
              </div>

              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#570013] flex items-center justify-start gap-1.5 mb-0.5 leading-tight tracking-tight">
                <span className="truncate">{displayName}</span>
                {p.verified && (
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]" title="Verified Agarwal Profile">
                    verified
                  </span>
                )}
              </h1>

              <p className="text-[11px] font-semibold text-slate-700 mb-1 leading-snug">
                {displayGotra} Gotra • {p.age ? `${p.age} yrs` : ''} • {displayHeight}
              </p>

              <p className="text-[10px] text-slate-500 flex items-center justify-start gap-0.5 font-medium">
                <span className="material-symbols-outlined text-[13px] text-[#775a19]">location_on</span>
                <span>{displayCity}</span>
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 1: Personal Details */}
        <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-xs space-y-3">
          <h2 className="font-display text-sm font-bold text-[#570013] flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
            <span className="material-symbols-outlined text-[#775a19] text-[18px]">person</span>
            <span>Personal Details</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Full Name</span>
              <span className="font-bold text-slate-800">{displayName}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Gender</span>
              <span className="font-bold text-slate-800">{p.gender || 'Female'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Paternal Gotra</span>
              <span className="font-bold text-[#570013]">{displayGotra}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Height</span>
              <span className="font-bold text-slate-800">{displayHeight}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Complexion</span>
              <span className="font-bold text-slate-800">{p.complexion || 'Fair'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Hobbies</span>
              <span className="font-bold text-slate-800">{p.hobbies || 'Music, Reading'}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: Kundali & Horoscope Details */}
        <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-xs space-y-3">
          <h2 className="font-display text-sm font-bold text-[#570013] flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
            <span className="material-symbols-outlined text-[#775a19] text-[18px]">auto_awesome</span>
            <span>Kundali & Birth Details</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Date of Birth</span>
              <span className="font-bold text-slate-800">{p.dob || '14 May 1998'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Time of Birth</span>
              <span className="font-bold text-slate-800">{p.tob || '08:30 AM'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Place of Birth</span>
              <span className="font-bold text-slate-800">{p.pob || 'Jaipur, Rajasthan'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Manglik Status</span>
              <span className="font-bold text-[#570013]">{p.manglik || 'Non-Manglik'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Paternal Gotra</span>
              <span className="font-bold text-slate-800">{displayGotra}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Maternal Gotra</span>
              <span className="font-bold text-[#775a19]">{displayMotherGotra}</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: Education & Profession */}
        <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-xs space-y-3">
          <h2 className="font-display text-sm font-bold text-[#570013] flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
            <span className="material-symbols-outlined text-[#775a19] text-[18px]">work</span>
            <span>Education & Profession</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Highest Qualification</span>
              <span className="font-bold text-slate-800">{p.qualification || 'M.Tech'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Working At</span>
              <span className="font-bold text-slate-800">{p.workingAt || 'TCS'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Annual Income</span>
              <span className="font-bold text-emerald-700">{p.income || '12-15 LPA'}</span>
            </div>
          </div>
        </div>

        {/* SECTION 4: Family Details & Background */}
        <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-xs space-y-3">
          <h2 className="font-display text-sm font-bold text-[#570013] flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
            <span className="material-symbols-outlined text-[#775a19] text-[18px]">family_history</span>
            <span>Family Background</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Grandfather</span>
              <span className="font-bold text-slate-800">{p.grandfather || 'Late Sh. Ramcharan Garg'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Grandmother</span>
              <span className="font-bold text-slate-800">{p.grandmother || 'Smt. Shanti Devi'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Father</span>
              <span className="font-bold text-slate-800">{p.father || 'Sh. Rameshwar Garg'}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Father's Occupation</span>
              <span className="font-bold text-slate-800">{p.fatherOccupation || 'Business'} {p.fatherOccupationDetails ? `(${p.fatherOccupationDetails})` : ''}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Mother</span>
              <span className="font-bold text-slate-800">{p.mother || 'Smt. Sunita Garg'}</span>
            </div>

          </div>
        </div>

        {/* SECTION 5: Siblings & Relatives (Tauji, Chacha, Buaji, Brother, Sister) */}
        <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-xs space-y-3">
          <h2 className="font-display text-sm font-bold text-[#570013] flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
            <span className="material-symbols-outlined text-[#775a19] text-[18px]">group</span>
            <span>Siblings & Paternal Relatives</span>
          </h2>

          <div className="space-y-2.5 text-[11px]">
            {/* Brothers */}
            {p.brotherList && p.brotherList.length > 0 && (
              <div className="bg-[#fbf9f5] border border-amber-100 rounded-md p-2.5">
                <span className="font-bold text-[#570013] block mb-1 uppercase text-[10px]">Brother(s)</span>
                {p.brotherList.map((b, i) => (
                  <p key={i} className="text-slate-700">
                    <span className="font-semibold">{b.name || `Brother ${i+1}`}</span> ({b.status}) {b.status === 'Married' ? `- Wife: ${b.spouseName} (${b.homePlace})` : ''}
                  </p>
                ))}
              </div>
            )}

            {/* Sisters */}
            {p.sisterList && p.sisterList.length > 0 && (
              <div className="bg-[#fbf9f5] border border-amber-100 rounded-md p-2.5">
                <span className="font-bold text-[#570013] block mb-1 uppercase text-[10px]">Sister(s)</span>
                {p.sisterList.map((s, i) => (
                  <p key={i} className="text-slate-700">
                    <span className="font-semibold">{s.name || `Sister ${i+1}`}</span> ({s.status}) {s.status === 'Married' ? `- Husband: ${s.spouseName} (${s.homePlace})` : ''}
                  </p>
                ))}
              </div>
            )}

            {/* Tauji */}
            {p.taujiList && p.taujiList.length > 0 && (
              <div className="bg-[#fbf9f5] border border-amber-100 rounded-md p-2.5">
                <span className="font-bold text-[#570013] block mb-1 uppercase text-[10px]">Tauji (Elder Uncle)</span>
                {p.taujiList.map((t, i) => (
                  <p key={i} className="text-slate-700">
                    <span className="font-semibold">{t.name || `Tauji ${i+1}`}</span> ({t.status}) {t.status === 'Married' ? `- Taiji: ${t.spouseName} (${t.homePlace})` : ''}
                  </p>
                ))}
              </div>
            )}

            {/* Chacha */}
            {p.chachaList && p.chachaList.length > 0 && (
              <div className="bg-[#fbf9f5] border border-amber-100 rounded-md p-2.5">
                <span className="font-bold text-[#570013] block mb-1 uppercase text-[10px]">Chacha (Uncle)</span>
                {p.chachaList.map((c, i) => (
                  <p key={i} className="text-slate-700">
                    <span className="font-semibold">{c.name || `Chacha ${i+1}`}</span> ({c.status}) {c.status === 'Married' ? `- Chachi: ${c.spouseName} (${c.homePlace})` : ''}
                  </p>
                ))}
              </div>
            )}

            {/* Buaji */}
            {p.buajiList && p.buajiList.length > 0 && (
              <div className="bg-[#fbf9f5] border border-amber-100 rounded-md p-2.5">
                <span className="font-bold text-[#570013] block mb-1 uppercase text-[10px]">Bua Ji (Paternal Aunt)</span>
                {p.buajiList.map((bu, i) => (
                  <p key={i} className="text-slate-700">
                    <span className="font-semibold">{bu.name || `Buaji ${i+1}`}</span> ({bu.status}) {bu.status === 'Married' ? `- Phupha Ji: ${bu.spouseName} (${bu.homePlace})` : ''}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 6: Maternal Family (Mama Ji) */}
        <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-xs space-y-3">
          <h2 className="font-display text-sm font-bold text-[#570013] flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
            <span className="material-symbols-outlined text-[#775a19] text-[18px]">person_3</span>
            <span>Maternal Family (Mama Ji Details)</span>
          </h2>

          <div className="space-y-2 text-[11px]">
            {p.mamajiList && p.mamajiList.length > 0 ? (
              p.mamajiList.map((m, i) => (
                <div key={i} className="bg-[#fbf9f5] border border-amber-100 rounded-md p-2.5">
                  <p className="font-semibold text-slate-800">{m.name || `Mama Ji ${i+1}`} ({m.status})</p>
                  {m.status === 'Married' && (
                    <p className="text-slate-600 mt-0.5">
                      Mami Ji: <span className="font-medium text-slate-800">{m.spouseName}</span> • Home Place: <span className="font-medium text-slate-800">{m.homePlace}</span>
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-slate-500 italic">No maternal uncle details provided</p>
            )}
          </div>
        </div>

        {/* SECTION 7: Residential Information */}
        <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-xs space-y-3">
          <h2 className="font-display text-sm font-bold text-[#570013] flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
            <span className="material-symbols-outlined text-[#775a19] text-[18px]">home</span>
            <span>Residential Information</span>
          </h2>

          <div className="text-[11px] space-y-2">
            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Residential Address</span>
              <span className="font-bold text-slate-800 leading-snug block mt-0.5">
                {revealedContact?.residentialAddress || p.residentialAddress || 'Protected'}
              </span>
            </div>

            <div>
              <span className="text-gray-400 font-medium block text-[10px] uppercase">Mobile Number</span>
              <span className="font-bold text-slate-800 leading-snug block mt-0.5">
                {revealedContact?.mobileNumber || p.mobileNumber || 'Protected'}
              </span>
            </div>

            {(revealedContact?.email || p.email) && (
              <div>
                <span className="text-gray-400 font-medium block text-[10px] uppercase">Email Address</span>
                <span className="font-bold text-slate-800 leading-snug block mt-0.5">
                  {revealedContact?.email || p.email}
                </span>
              </div>
            )}

            {/* Contact details are masked until unlocked. An unlock is spent
                once per profile, or granted free by an accepted interest. */}
            {!revealedContact && (p.phoneMasked || p.addressMasked) && (
              <div className="pt-2 border-t border-amber-100 mt-2">
                <button
                  onClick={handleUnlockContact}
                  disabled={isUnlocking}
                  className="w-full py-2.5 rounded-md bg-[#570013] hover:bg-[#72001a] text-white font-bold text-[11px] shadow transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[15px]">lock_open</span>
                  <span>{isUnlocking ? 'Unlocking...' : 'View Contact Details'}</span>
                </button>
                {contactQuota && !contactQuota.unlimited && (
                  <p className="text-[10px] text-slate-400 font-semibold text-center mt-1.5">
                    {contactQuota.remaining} contact view
                    {contactQuota.remaining === 1 ? '' : 's'} remaining on your plan
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-amber-200 py-2.5 px-4 shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center gap-2.5">
          <button
            onClick={handleShortlist}
            className={`px-3.5 py-2.5 rounded-md border text-[11px] font-bold transition flex items-center justify-center shadow-xs active:scale-95 cursor-pointer ${
              isShortlisted 
                ? 'bg-amber-100 border-[#775a19] text-[#570013]' 
                : 'border-amber-300 text-[#775a19] hover:bg-amber-50'
            }`}
            title="Shortlist Profile"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isShortlisted ? 'bookmark_added' : 'bookmark'}
            </span>
          </button>
          <button
            onClick={handleExpressInterest}
            disabled={isInterestSent}
            className={`flex-1 py-2.5 rounded-md font-bold text-[12px] transition shadow text-center flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
              isInterestSent 
                ? 'bg-emerald-700 text-white cursor-default' 
                : 'bg-[#570013] text-[#ffdea5] hover:bg-[#800020]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isInterestSent ? 'check_circle' : 'favorite'}
            </span>
            <span>{isInterestSent ? 'Interest Expressed' : 'Express Interest'}</span>
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed bottom-16 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold animate-fade-in ${
          toast.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : toast.type === 'info'
            ? 'bg-blue-50 border-blue-200 text-blue-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span className="material-symbols-outlined text-lg">
            {toast.type === 'error' ? 'error' : toast.type === 'info' ? 'info' : 'check_circle'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
