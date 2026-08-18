import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getMyProfile, createProfile, updateProfile, uploadProfilePhoto } from '../../../services/profileService'
import { isAuthenticated } from '../../../services/authService'
import { useActiveProfile } from '../../../context/ActiveProfileContext'

/** Who an additional biodata is being created for. */
const PROFILE_FOR_OPTIONS = ['Son', 'Daughter', 'Brother', 'Sister', 'Relative', 'Friend', 'Self']

/**
 * The four-step biodata form.
 *
 * Serves two flows: completing the account's first profile during onboarding,
 * and adding a further candidate later (`isNewProfile`) - a parent running
 * biodata for a second child. In the latter the form starts blank rather than
 * loading the active profile, and asks who the biodata is for.
 */
export default function ProfileCompletionDashboardScreen({ onContinue, onSkip, isNewProfile = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState(1)
  const [isEditing, setIsEditing] = useState(false)
  const [currentProfileId, setCurrentProfileId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const { refreshProfiles, switchProfile } = useActiveProfile()

  const [formData, setFormData] = useState({
    profileFor: isNewProfile ? 'Son' : 'Self',
    fullName: '',
    gender: '',
    gotra: '',
    dob: '',
    tob: '',
    pob: '',
    height: '',
    complexion: '',
    manglik: '',
    qualification: '',
    hobbies: '',
    income: '',
    workingAt: '',
    // Step 2 fields
    grandfather: '',
    grandmother: '',
    father: '',
    fatherOccupation: '',
    fatherOccupationDetails: '',
    mother: '',
    motherGotra: '',
    brotherList: [{ name: '', status: 'Unmarried', spouseName: '', homePlace: '' }],
    sisterList: [{ name: '', status: 'Unmarried', spouseName: '', homePlace: '' }],
    taujiList: [{ name: '', status: 'Unmarried', spouseName: '', homePlace: '' }],
    chachaList: [{ name: '', status: 'Unmarried', spouseName: '', homePlace: '' }],
    buajiList: [{ name: '', status: 'Unmarried', spouseName: '', homePlace: '' }],
    // Step 3 fields
    mamaji: '',
    mamajiList: [{ name: '', status: 'Unmarried', spouseName: '', homePlace: '' }],
    residentialAddress: '',
    mobileNumber: '',
    email: '',
    // Step 4 fields
    profilePicture: null
  })

  // Scroll to top whenever step changes
  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTo(0, 0)
    document.body.scrollTo(0, 0)

    const containers = document.querySelectorAll('.overflow-y-auto, .overflow-auto')
    containers.forEach((el) => {
      el.scrollTop = 0
    })
  }, [step])

  // Load existing profile from MongoDB or prefill from registration data
  useEffect(() => {
    async function loadInitialData() {
      // Adding a further candidate starts from an empty form - prefilling from
      // the active profile would silently copy one child's biodata onto another.
      if (isNewProfile) return

      if (isAuthenticated()) {
        try {
          const res = await getMyProfile()
          if (res?.profile) {
            const p = res.profile
            setCurrentProfileId(p.profileId || p._id)
            setFormData((prev) => ({
              ...prev,
              fullName: p.fullName || prev.fullName,
              gender: p.gender || prev.gender,
              gotra: p.gotra || prev.gotra,
              dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : prev.dob,
              tob: p.tob || prev.tob,
              pob: p.pob || prev.pob,
              height: p.height || prev.height,
              complexion: p.complexion || prev.complexion,
              manglik: p.manglik || prev.manglik,
              qualification: p.qualification || prev.qualification,
              hobbies: Array.isArray(p.hobbies) ? p.hobbies.join(', ') : (p.hobbies || prev.hobbies),
              income: p.income || prev.income,
              workingAt: p.workingAt || prev.workingAt,
              grandfather: p.grandfather || prev.grandfather,
              grandmother: p.grandmother || prev.grandmother,
              father: p.father || prev.father,
              fatherOccupation: p.fatherOccupation || prev.fatherOccupation,
              fatherOccupationDetails: p.fatherOccupationDetails || prev.fatherOccupationDetails,
              mother: p.mother || prev.mother,
              motherGotra: p.motherGotra || prev.motherGotra,
              brotherList: (p.brotherList && p.brotherList.length > 0) ? p.brotherList : prev.brotherList,
              sisterList: (p.sisterList && p.sisterList.length > 0) ? p.sisterList : prev.sisterList,
              taujiList: (p.taujiList && p.taujiList.length > 0) ? p.taujiList : prev.taujiList,
              chachaList: (p.chachaList && p.chachaList.length > 0) ? p.chachaList : prev.chachaList,
              buajiList: (p.buajiList && p.buajiList.length > 0) ? p.buajiList : prev.buajiList,
              mamaji: p.mamaji || prev.mamaji,
              mamajiList: (p.mamajiList && p.mamajiList.length > 0) ? p.mamajiList : prev.mamajiList,
              residentialAddress: p.residentialAddress || prev.residentialAddress,
              mobileNumber: p.mobileNumber || prev.mobileNumber,
              email: p.email || prev.email,
              profilePicture: p.profilePicture || prev.profilePicture
            }))
            return
          }
        } catch (err) {
          console.warn('Initial profile load note:', err)
        }
      }

      const regData = location.state?.formData || JSON.parse(localStorage.getItem('registrationData') || '{}')
      if (regData && Object.keys(regData).length > 0) {
        setFormData((prev) => ({
          ...prev,
          fullName: regData.fullName || prev.fullName,
          gender: regData.gender || prev.gender,
          dob: regData.dob || prev.dob,
          mobileNumber: regData.mobile || prev.mobileNumber,
          email: regData.email || prev.email,
        }))
      }
    }

    loadInitialData()
  }, [location.state, isNewProfile])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const saveToBackend = async (dataToSave = formData, silent = false) => {
    setIsSaving(true)
    try {
      const payload = { ...dataToSave }
      
      // Convert hobbies to clean array
      if (typeof payload.hobbies === 'string') {
        payload.hobbies = payload.hobbies.split(',').map(h => h.trim()).filter(Boolean)
      }

      // Clean relative lists
      const cleanList = (list) => Array.isArray(list) ? list.filter(item => item && item.name && item.name.trim()) : []
      payload.brotherList = cleanList(payload.brotherList)
      payload.sisterList = cleanList(payload.sisterList)
      payload.taujiList = cleanList(payload.taujiList)
      payload.chachaList = cleanList(payload.chachaList)
      payload.buajiList = cleanList(payload.buajiList)
      payload.mamajiList = cleanList(payload.mamajiList)

      // Normalize Manglik to canonical enum ('Non-Manglik', 'Manglik', 'Anshik Manglik', "Don't Know")
      if (payload.manglik === 'No' || payload.manglik === 'Non-Manglik' || payload.manglik === 'non-manglik') {
        payload.manglik = 'Non-Manglik'
      } else if (payload.manglik === 'Yes' || payload.manglik === 'Manglik' || payload.manglik === 'manglik') {
        payload.manglik = 'Manglik'
      } else if (payload.manglik === 'Anshik' || payload.manglik === 'Anshik Manglik' || payload.manglik === 'Partial') {
        payload.manglik = 'Anshik Manglik'
      } else if (payload.manglik === "Don't Know" || payload.manglik === 'dont_know' || !payload.manglik) {
        payload.manglik = payload.manglik === "Don't Know" ? "Don't Know" : 'Non-Manglik'
      }

      let savedProfile
      if (currentProfileId) {
        const res = await updateProfile(currentProfileId, payload)
        savedProfile = res?.profile
      } else {
        const res = await createProfile(payload)
        savedProfile = res?.profile
        if (savedProfile) {
          setCurrentProfileId(savedProfile.profileId || savedProfile._id)

          // A newly added candidate becomes the one the account is operating
          // as, so the dashboard that follows shows the profile just created.
          const newId = savedProfile.id || savedProfile._id
          if (newId) {
            try {
              await switchProfile(newId)
            } catch {
              await refreshProfiles()
            }
          }
        }
      }

      localStorage.setItem('userProfile', JSON.stringify(payload))
      if (!silent) {
        showToast('Details saved to database successfully!', 'success')
      }
      return savedProfile
    } catch (err) {
      console.error('Save profile to database error:', err)
      localStorage.setItem('userProfile', JSON.stringify(dataToSave))
      if (!silent) {
        showToast(err.message || 'Saved locally. Backend connection pending.', 'info')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveProgress = () => {
    saveToBackend(formData)
  }

  const handleRelativeChange = (listName, index, field, value) => {
    setFormData((prev) => {
      const updatedList = [...(prev[listName] || [])]
      updatedList[index] = { ...updatedList[index], [field]: value }
      return { ...prev, [listName]: updatedList }
    })
  }

  const addRelativeItem = (listName) => {
    setFormData((prev) => ({
      ...prev,
      [listName]: [...(prev[listName] || []), { name: '', status: 'Unmarried', spouseName: '', homePlace: '' }]
    }))
  }

  const saveRelativeItem = (listName) => {
    saveToBackend(formData)
  }

  const removeRelativeItem = (listName, index) => {
    setFormData((prev) => {
      const currentList = prev[listName] || []
      if (currentList.length <= 1) {
        return {
          ...prev,
          [listName]: [{ name: '', status: 'Unmarried', spouseName: '', homePlace: '' }]
        }
      }
      return {
        ...prev,
        [listName]: currentList.filter((_, i) => i !== index)
      }
    })
  }

  return (
    <div className="bg-[#fbf9f5] min-h-screen text-slate-800 font-body flex flex-col relative select-none">
      
      {/* Top Traditional Accent Line */}
      <div className="absolute top-0 left-0 w-full z-50 h-1 bg-gradient-to-r from-transparent via-[#775a19]/50 to-transparent opacity-80" />

      {/* Header Area */}
      <div className="px-4 pt-3 pb-1 max-w-3xl w-full mx-auto">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Back button + Page Title side-by-side */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                if (step > 1) setStep(step - 1)
                else navigate(-1)
              }}
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-white border border-[#e6dfd1] hover:bg-amber-50 active:scale-95 transition text-[#570013] shadow-xs"
              aria-label="Go Back"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <h1 className="text-lg sm:text-xl font-display font-extrabold text-[#570013] tracking-tight truncate">
              {step === 1 ? 'Personal Details' : step === 2 ? 'Family Details' : step === 3 ? 'Maternal Family & Contact' : 'Upload Profile Picture'}
            </h1>
          </div>
          
          {/* Right: Icon-only Edit button & Compact Step Badge (1/4) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (isEditing) {
                  localStorage.setItem('userProfile', JSON.stringify(formData))
                  alert('Details saved successfully!')
                  setIsEditing(false)
                } else {
                  setIsEditing(true)
                }
              }}
              title={isEditing ? 'Save Details' : 'Edit Details'}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-all active:scale-95 border ${
                isEditing
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                  : 'bg-amber-100/80 hover:bg-amber-200 text-[#570013] border-[#775a19]/30'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isEditing ? 'save' : 'edit'}
              </span>
            </button>
            <div className="px-2.5 py-1 rounded-full bg-[#570013]/10 border border-[#570013]/15">
              <span className="text-[11px] font-extrabold text-[#570013] tracking-wider">
                {step}/4
              </span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-[#775a19] font-medium mt-1 mb-1 pl-10">
          {step === 1 
            ? 'Tell us about yourself to find your perfect match.'
            : step === 2 
            ? 'Tell us about your family background.' 
            : step === 3
            ? 'Provide contact and maternal family details.'
            : 'Add a clear photo to get better matches.'}
        </p>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pb-6">
        
        <div className="bg-white rounded-lg shadow-[0_8px_30px_rgba(87,0,19,0.04)] border border-[#e6dfd1]/60 p-5 relative overflow-hidden">
          {/* Subtle card background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-50 to-transparent rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          
          {step === 1 && (
            <form className="space-y-4 relative z-10">

              {/* Who this biodata is for. Only asked when adding a further
                  candidate - the first profile is assumed to be the account
                  holder's own until they say otherwise. */}
              {isNewProfile && (
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">
                    This profile is for
                  </label>
                  <div className="relative">
                    <select
                      name="profileFor"
                      value={formData.profileFor}
                      onChange={handleChange}
                      className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-md pl-3 pr-8 py-2 text-[12px] font-semibold text-slate-800 focus:border-[#570013] focus:bg-white focus:ring-1 focus:ring-[#570013] focus:outline-none appearance-none shadow-sm transition-all"
                    >
                      {PROFILE_FOR_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option === 'Self' ? 'Myself' : `My ${option}`}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined text-[#775a19] text-[18px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">
                    Matches, interests and chats are kept separate for each profile.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[#775a19] text-[18px]">person</span>
                    <input type="text" name="fullName" placeholder="Enter full name" value={formData.fullName} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Gender</label>
                  <div className="relative">
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-md pl-3 pr-8 py-2 text-[12px] font-semibold text-slate-800 focus:border-[#570013] focus:bg-white focus:ring-1 focus:ring-[#570013] focus:outline-none appearance-none shadow-sm transition-all">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <span className="material-symbols-outlined text-[#775a19] text-[18px] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gotra */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Gotra</label>
                  <div className="relative">
                    <select name="gotra" value={formData.gotra} onChange={handleChange} className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-md pl-3 pr-8 py-2 text-[12px] font-semibold text-slate-800 focus:border-[#570013] focus:bg-white focus:ring-1 focus:ring-[#570013] focus:outline-none appearance-none shadow-sm transition-all">
                      <option value="">Select Gotra</option>
                      <option value="गर्ग (Garg)">गर्ग (Garg)</option>
                      <option value="गोयल (Goyal)">गोयल (Goyal)</option>
                      <option value="बंसल (Bansal)">बंसल (Bansal)</option>
                      <option value="बिंदल (Bindal)">बिंदल (Bindal)</option>
                      <option value="सिंघल (Singhal)">सिंघल (Singhal)</option>
                      <option value="जिंदल (Jindal)">जिंदल (Jindal)</option>
                      <option value="मित्तल (Mittal)">मित्तल (Mittal)</option>
                      <option value="तायल (Tayal)">तायल (Tayal)</option>
                      <option value="कंसल (Kansal)">कंसल (Kansal)</option>
                      <option value="कुच्छल (Kuchhal)">कुच्छल (Kuchhal)</option>
                      <option value="ऐरन (Airan)">ऐरन (Airan)</option>
                      <option value="धारण (Dharan)">धारण (Dharan)</option>
                      <option value="मंगल (Mangal)">मंगल (Mangal)</option>
                      <option value="मधुकल (Madhukul)">मधुकल (Madhukul)</option>
                      <option value="तिंगल (Tingal)">तिंगल (Tingal)</option>
                      <option value="नागल (Nagal)">नागल (Nagal)</option>
                      <option value="गोयन (Goyan)">गोयन (Goyan)</option>
                      <option value="भंदल (Bhandal)">भंदल (Bhandal)</option>
                    </select>
                    <span className="material-symbols-outlined text-[#775a19] text-[18px] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Date of Birth</label>
                  <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[#775a19] text-[16px]">calendar_month</span>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full relative" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Time of Birth */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Time of Birth</label>
                  <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[#775a19] text-[16px]">schedule</span>
                    <input type="time" name="tob" value={formData.tob} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full relative" />
                  </div>
                </div>

                {/* Place of Birth */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Place of Birth</label>
                  <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[#775a19] text-[18px]">location_on</span>
                    <input type="text" name="pob" placeholder="City, State" value={formData.pob} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Height */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Height</label>
                  <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[#775a19] text-[18px]">height</span>
                    <input type="text" name="height" placeholder="e.g., 5'8&quot;" value={formData.height} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                  </div>
                </div>

                {/* Complexion */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Complexion</label>
                  <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[#775a19] text-[18px]">face</span>
                    <input type="text" name="complexion" placeholder="e.g., Fair, Wheatish" value={formData.complexion} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Manglik */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Manglik</label>
                  <div className="relative">
                    <select name="manglik" value={formData.manglik} onChange={handleChange} className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-md pl-3 pr-8 py-2 text-[12px] font-semibold text-slate-800 focus:border-[#570013] focus:bg-white focus:ring-1 focus:ring-[#570013] focus:outline-none appearance-none shadow-sm transition-all">
                      <option value="">Select Manglik Status</option>
                      <option value="Non-Manglik">Non-Manglik (No)</option>
                      <option value="Manglik">Manglik (Yes)</option>
                      <option value="Anshik Manglik">Anshik Manglik (Partial)</option>
                      <option value="Don't Know">Don't Know</option>
                    </select>
                    <span className="material-symbols-outlined text-[#775a19] text-[18px] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Qualification</label>
                <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                  <span className="material-symbols-outlined text-[#775a19] text-[18px]">school</span>
                  <input type="text" name="qualification" placeholder="Highest Qualification" value={formData.qualification} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                </div>
              </div>

              {/* Hobbies / Interests */}
              <div>
                <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Hobbies / Interests</label>
                <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                  <span className="material-symbols-outlined text-[#775a19] text-[18px]">interests</span>
                  <input type="text" name="hobbies" placeholder="e.g., Reading, Traveling" value={formData.hobbies} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Income */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Income</label>
                  <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[#775a19] text-[18px]">payments</span>
                    <input type="text" name="income" placeholder="e.g., 10 LPA" value={formData.income} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                  </div>
                </div>

                {/* Working At */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Working At</label>
                  <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[#775a19] text-[18px]">work</span>
                    <input type="text" name="workingAt" placeholder="Company Name" value={formData.workingAt} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-[#e6dfd1]/80 my-5"></div>

              <div className="flex justify-end pt-1">
                <button type="button" onClick={() => setStep(2)} className="bg-[#570013] hover:bg-[#72001a] text-white font-semibold text-xs px-4 py-2 rounded-md flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all w-full sm:w-auto tracking-wide">
                  <span>Next Step</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form className="space-y-4 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Grandfather */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Grandfather</label>
                  <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[#775a19] text-[18px]">elderly</span>
                    <input type="text" name="grandfather" placeholder="Grandfather's Name" value={formData.grandfather} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                  </div>
                </div>

                {/* Grandmother */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Grandmother</label>
                  <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[#775a19] text-[18px]">elderly_woman</span>
                    <input type="text" name="grandmother" placeholder="Grandmother's Name" value={formData.grandmother} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                  </div>
                </div>
              </div>

              <div className="w-full bg-amber-50 border-l-4 border-[#775a19] py-1.5 px-3 font-bold text-[#570013] text-sm my-2">
                Parents
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Father */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Father</label>
                  <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[#775a19] text-[18px]">man</span>
                    <input type="text" name="father" placeholder="Father's Name" value={formData.father} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                  </div>
                </div>

                {/* Father's Occupation */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Father's Occupation</label>
                  <div className="relative">
                    <select name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-md pl-3 pr-8 py-2 text-[12px] font-semibold text-slate-800 focus:border-[#570013] focus:bg-white focus:ring-1 focus:ring-[#570013] focus:outline-none appearance-none shadow-sm transition-all">
                      <option value="">Select Occupation</option>
                      <option value="Business">Business</option>
                      <option value="Private Job">Private Job</option>
                      <option value="Govt Job">Govt Job</option>
                      <option value="Retired">Retired</option>
                      <option value="Not Employed">Not Employed</option>
                    </select>
                    <span className="material-symbols-outlined text-[#775a19] text-[18px] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Father Occupation Details */}
              <div>
                <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Father Occupation Details</label>
                <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                  <span className="material-symbols-outlined text-[#775a19] text-[18px]">business_center</span>
                  <input type="text" name="fatherOccupationDetails" placeholder="Specific details (optional)" value={formData.fatherOccupationDetails} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Mother */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Mother's Name</label>
                  <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[#775a19] text-[18px]">woman</span>
                    <input type="text" name="mother" placeholder="Mother's Name" value={formData.mother} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                  </div>
                </div>
              </div>

              <div className="w-full bg-amber-50 border-l-4 border-[#775a19] py-1.5 px-3 font-bold text-[#570013] text-sm mt-4 mb-2">
                Siblings & Relatives
              </div>

              <div className="space-y-4">
                {/* Helper Section Render Function */}
                {[
                  { title: 'Brother(s)', listName: 'brotherList', icon: 'boy', spouseLabel: "Wife's Name", homeLabel: "Wife's Home Place / Sasural" },
                  { title: 'Sister(s)', listName: 'sisterList', icon: 'girl', spouseLabel: "Husband's Name", homeLabel: "Husband's Home Place / In-laws Place" },
                  { title: 'Tauji (Elder Uncle)', listName: 'taujiList', icon: 'escalator_warning', spouseLabel: "Taiji's Name", homeLabel: "Taiji's Home Place" },
                  { title: 'Chacha (Uncle)', listName: 'chachaList', icon: 'family_restroom', spouseLabel: "Chachi's Name", homeLabel: "Chachi's Home Place" },
                  { title: 'Bua Ji (Paternal Aunt)', listName: 'buajiList', icon: 'diversity_1', spouseLabel: "Phupha Ji's Name", homeLabel: "Phupha Ji's Home Place" },
                ].map((sec) => (
                  <div key={sec.listName} className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#e6dfd1]/60 pb-2">
                      <label className="text-[11px] font-bold text-[#570013] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#775a19] text-[18px]">{sec.icon}</span> {sec.title}
                      </label>
                      <button
                        type="button"
                        onClick={() => addRelativeItem(sec.listName)}
                        className="text-[11px] font-bold text-[#570013] hover:text-[#775a19] bg-white border border-[#e6dfd1] hover:border-[#775a19] px-2.5 py-1 rounded flex items-center gap-1 transition-all shadow-xs active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span> Add Another
                      </button>
                    </div>

                    {(formData[sec.listName] || []).map((item, idx) => (
                      <div key={idx} className="bg-white border border-[#e6dfd1] rounded-md p-3 space-y-2.5 relative shadow-xs">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            placeholder={`${sec.title.split(' ')[0]} ${idx + 1} Name / Details`}
                            value={item.name}
                            onChange={(e) => handleRelativeChange(sec.listName, idx, 'name', e.target.value)}
                            className="flex-1 min-w-0 bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 text-[12px] font-semibold text-slate-800 focus:outline-none focus:border-[#570013] focus:bg-white placeholder-slate-400"
                          />
                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              value={item.status}
                              onChange={(e) => handleRelativeChange(sec.listName, idx, 'status', e.target.value)}
                              className="flex-1 sm:flex-none text-[12px] font-semibold bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-2.5 py-2 text-slate-700 focus:outline-none focus:border-[#570013]"
                            >
                              <option value="Unmarried">Unmarried</option>
                              <option value="Married">Married</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => saveRelativeItem(sec.listName)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-2 rounded-md flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95 shrink-0 text-[11px] font-bold"
                              title="Save this entry"
                            >
                              <span className="material-symbols-outlined text-[16px]">check</span>
                              <span className="hidden sm:inline">Save</span>
                            </button>
                            {(formData[sec.listName] || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeRelativeItem(sec.listName, idx)}
                                className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 border border-transparent hover:border-red-200 transition-all shrink-0"
                                title="Delete entry"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {item.status === 'Married' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                            <input
                              type="text"
                              placeholder={sec.spouseLabel}
                              value={item.spouseName}
                              onChange={(e) => handleRelativeChange(sec.listName, idx, 'spouseName', e.target.value)}
                              className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 text-[12px] font-semibold text-slate-800 focus:outline-none focus:border-[#570013] focus:bg-white placeholder-slate-400"
                            />
                            <input
                              type="text"
                              placeholder={sec.homeLabel}
                              value={item.homePlace}
                              onChange={(e) => handleRelativeChange(sec.listName, idx, 'homePlace', e.target.value)}
                              className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 text-[12px] font-semibold text-slate-800 focus:outline-none focus:border-[#570013] focus:bg-white placeholder-slate-400"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="w-full h-px bg-[#e6dfd1]/80 my-5"></div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setStep(1)} className="bg-white border border-[#e6dfd1] hover:bg-gray-50 text-slate-600 font-semibold text-xs px-4 py-2 rounded-md flex items-center justify-center shadow-xs active:scale-95 transition-all w-full sm:w-auto tracking-wide">
                  Back
                </button>
                <button type="button" onClick={() => setStep(3)} className="bg-[#570013] hover:bg-[#72001a] text-white font-semibold text-xs px-4 py-2 rounded-md flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all w-full sm:w-auto tracking-wide">
                  <span>Next Step</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form className="space-y-4 relative z-10">
              <div className="w-full bg-amber-50 border-l-4 border-[#775a19] py-1.5 px-3 font-bold text-[#570013] text-sm mb-2">
                Maternal Details
              </div>

              {/* Mama Ji Dynamic Cards */}
              <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-[#e6dfd1]/60 pb-2">
                  <label className="text-[11px] font-bold text-[#570013] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#775a19] text-[18px]">person_3</span> Mama Ji (Maternal Uncle)
                  </label>
                  <button
                    type="button"
                    onClick={() => addRelativeItem('mamajiList')}
                    className="text-[11px] font-bold text-[#570013] hover:text-[#775a19] bg-white border border-[#e6dfd1] hover:border-[#775a19] px-2.5 py-1 rounded flex items-center gap-1 transition-all shadow-xs active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span> Add Another
                  </button>
                </div>

                {(formData.mamajiList || []).map((item, idx) => (
                  <div key={idx} className="bg-white border border-[#e6dfd1] rounded-md p-3 space-y-2.5 relative shadow-xs">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Mama Ji ${idx + 1} Name / Details`}
                        value={item.name}
                        onChange={(e) => handleRelativeChange('mamajiList', idx, 'name', e.target.value)}
                        className="flex-1 min-w-0 bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 text-[12px] font-semibold text-slate-800 focus:outline-none focus:border-[#570013] focus:bg-white placeholder-slate-400"
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={item.status}
                          onChange={(e) => handleRelativeChange('mamajiList', idx, 'status', e.target.value)}
                          className="flex-1 sm:flex-none text-[12px] font-semibold bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-2.5 py-2 text-slate-700 focus:outline-none focus:border-[#570013]"
                        >
                          <option value="Unmarried">Unmarried</option>
                          <option value="Married">Married</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => saveRelativeItem('mamajiList')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-2 rounded-md flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95 shrink-0 text-[11px] font-bold"
                          title="Save this entry"
                        >
                          <span className="material-symbols-outlined text-[16px]">check</span>
                          <span className="hidden sm:inline">Save</span>
                        </button>
                        {(formData.mamajiList || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRelativeItem('mamajiList', idx)}
                            className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 border border-transparent hover:border-red-200 transition-all shrink-0"
                            title="Delete entry"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {item.status === 'Married' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <input
                          type="text"
                          placeholder="Mami Ji's Name"
                          value={item.spouseName}
                          onChange={(e) => handleRelativeChange('mamajiList', idx, 'spouseName', e.target.value)}
                          className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 text-[12px] font-semibold text-slate-800 focus:outline-none focus:border-[#570013] focus:bg-white placeholder-slate-400"
                        />
                        <input
                          type="text"
                          placeholder="Mami Ji's Home Place"
                          value={item.homePlace}
                          onChange={(e) => handleRelativeChange('mamajiList', idx, 'homePlace', e.target.value)}
                          className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 text-[12px] font-semibold text-slate-800 focus:outline-none focus:border-[#570013] focus:bg-white placeholder-slate-400"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="w-full bg-amber-50 border-l-4 border-[#775a19] py-1.5 px-3 font-bold text-[#570013] text-sm mt-4 mb-2">
                Contact Information
              </div>

              {/* Residential Address */}
              <div>
                <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Residential Address</label>
                <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-start gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                  <span className="material-symbols-outlined text-[#775a19] text-[18px] mt-0.5">home</span>
                  <textarea name="residentialAddress" placeholder="Full Home Address" value={formData.residentialAddress} onChange={handleChange} rows={3} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400 resize-y" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mobile Number */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Mobile Number</label>
                  <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[#775a19] text-[18px]">call</span>
                    <input type="tel" name="mobileNumber" placeholder="+91 XXXXX XXXXX" value={formData.mobileNumber} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[#775a19] text-[18px]">mail</span>
                    <input type="email" name="email" placeholder="example@mail.com" value={formData.email} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-[#e6dfd1]/80 my-5"></div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setStep(2)} className="bg-white border border-[#e6dfd1] hover:bg-gray-50 text-slate-600 font-semibold text-xs px-4 py-2 rounded-md flex items-center justify-center shadow-xs active:scale-95 transition-all w-full sm:w-auto tracking-wide cursor-pointer">
                  Back
                </button>
                <button 
                  type="button" 
                  onClick={async () => {
                    await saveToBackend(formData, true);
                    setStep(4);
                  }} 
                  className="bg-[#570013] hover:bg-[#72001a] text-white font-semibold text-xs px-4 py-2 rounded-md flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all w-full sm:w-auto tracking-wide cursor-pointer"
                >
                  <span>{isSaving ? 'Saving...' : 'Next Step'}</span>
                  <span className="material-symbols-outlined text-[16px]">{isSaving ? 'sync' : 'arrow_forward'}</span>
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <form className="space-y-4 relative z-10" onSubmit={async (e) => { 
              e.preventDefault();
              setIsSaving(true);
              try {
                await saveToBackend(formData, true);
                showToast('Profile completed and saved to database successfully!', 'success');
                setTimeout(() => {
                  navigate('/home'); 
                }, 800);
              } catch (err) {
                console.error('Final profile save error:', err);
                navigate('/home');
              } finally {
                setIsSaving(false);
              }
            }}>
              <div className="w-full bg-amber-50 border-l-4 border-[#775a19] py-1.5 px-3 font-bold text-[#570013] text-sm mb-4">
                Profile Photo
              </div>

              <div className="flex flex-col items-center justify-center mt-6 mb-8">
                <label 
                  htmlFor="photo-upload" 
                  className="w-48 h-48 rounded-full border-2 border-dashed border-[#e6dfd1] bg-[#fbf9f5] flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-[#775a19] hover:shadow-md transition-all group overflow-hidden relative"
                >
                  {formData.profilePicture ? (
                    <div className="w-full h-full relative">
                      <img src={formData.profilePicture} alt="Profile Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white text-[24px] mb-1">edit</span>
                        <span className="text-white text-xs font-bold">Change Photo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-[#570013]/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[#570013] text-[24px]">add_a_photo</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700">Upload Photo</span>
                      <span className="text-[10px] text-slate-500 mt-1">JPG, PNG, max 5MB</span>
                    </div>
                  )}
                  
                  <input id="photo-upload" type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData((prev) => ({ ...prev, profilePicture: reader.result }));
                      };
                      reader.readAsDataURL(file);

                      try {
                        showToast('Uploading photo to database...', 'info');
                        const uploadRes = await uploadProfilePhoto(file, currentProfileId);
                        if (uploadRes?.profilePicture) {
                          setFormData((prev) => ({ ...prev, profilePicture: uploadRes.profilePicture }));
                          showToast('Profile photo saved to database!', 'success');
                        }
                      } catch (uploadErr) {
                        console.warn('Backend photo upload notice:', uploadErr);
                      }
                    }
                  }} />
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 flex gap-3 text-sm text-blue-800">
                <span className="material-symbols-outlined text-blue-500 shrink-0">tips_and_updates</span>
                <p className="text-[11px] leading-tight">Profiles with clear, front-facing photos get up to 5x more responses. Avoid sunglasses or heavy filters.</p>
              </div>

              <div className="w-full h-px bg-[#e6dfd1]/80 my-5"></div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setStep(3)} className="bg-white border border-[#e6dfd1] hover:bg-gray-50 text-slate-600 font-semibold text-xs px-4 py-2 rounded-md flex items-center justify-center shadow-xs active:scale-95 transition-all w-full sm:w-auto tracking-wide cursor-pointer">
                  Back
                </button>
                <button type="submit" disabled={isSaving} className="bg-[#570013] hover:bg-[#72001a] text-white font-semibold text-xs px-4 py-2 rounded-md flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all w-full sm:w-auto tracking-wide cursor-pointer disabled:opacity-75">
                  <span>{isSaving ? 'Saving to Database...' : 'Complete Profile'}</span>
                  <span className="material-symbols-outlined text-[16px]">{isSaving ? 'sync' : 'check_circle'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold transition-all ${
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
