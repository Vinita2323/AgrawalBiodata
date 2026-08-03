import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function ProfileCompletionDashboardScreen({ onContinue, onSkip }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState(1)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
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
    // Step 4 fields
    profilePicture: null
  })

  // Auto-fill from registration data (Create Account Screen)
  useEffect(() => {
    const regData = location.state?.formData || JSON.parse(localStorage.getItem('registrationData') || '{}')
    if (regData && Object.keys(regData).length > 0) {
      setFormData((prev) => ({
        ...prev,
        fullName: regData.fullName || prev.fullName,
        gender: regData.gender || prev.gender,
        dob: regData.dob || prev.dob,
        mobileNumber: regData.mobile || prev.mobileNumber,
      }))
    }
  }, [location.state])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSaveProgress = () => {
    localStorage.setItem('userProfile', JSON.stringify(formData))
    alert('Details saved successfully!')
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
    localStorage.setItem('userProfile', JSON.stringify(formData))
    alert('Relative details saved successfully!')
  }

  const removeRelativeItem = (listName, index) => {
    setFormData((prev) => {
      const currentList = prev[listName] || []
      if (currentList.length <= 1) {
        // Keep at least one empty item
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
      <div className="px-4 pt-4 pb-2 max-w-3xl w-full mx-auto">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => {
              if (step > 1) setStep(step - 1)
              else navigate(-1)
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#e6dfd1] hover:bg-amber-50 active:scale-95 transition text-[#570013] shadow-sm"
            aria-label="Go Back"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          
          <div className="flex items-center gap-2">
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
              className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 border ${
                isEditing
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                  : 'bg-amber-100 hover:bg-amber-200 text-[#570013] border-[#775a19]/30'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {isEditing ? 'save' : 'edit'}
              </span>
              <span>{isEditing ? 'Save Details' : 'Edit'}</span>
            </button>
            <div className="px-3 py-1 rounded-full bg-[#570013]/5 border border-[#570013]/10">
              <span className="text-[10px] font-bold text-[#570013] uppercase tracking-widest">
                Step {step} of 4
              </span>
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl font-display font-extrabold text-[#570013] tracking-tight mb-0.5 mt-2">
          {step === 1 ? 'Personal Details' : step === 2 ? 'Family Details' : step === 3 ? 'Maternal Family & Contact' : 'Upload Profile Picture'}
        </h1>
        <p className="text-[11px] text-[#775a19] font-medium mb-1">
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
                      <option value="">Select Yes/No</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
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
                <button type="button" onClick={() => setStep(2)} className="bg-[#570013] hover:bg-[#72001a] text-white font-bold text-sm px-6 py-2.5 rounded-md flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all w-full sm:w-auto">
                  <span>Next Step</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mother */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Mother's Name</label>
                  <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[#775a19] text-[18px]">woman</span>
                    <input type="text" name="mother" placeholder="Mother's Name" value={formData.mother} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                  </div>
                </div>

                {/* Mother Gotra */}
                <div>
                  <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Mother's Gotra</label>
                  <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all">
                    <span className="material-symbols-outlined text-[#775a19] text-[18px]">family_history</span>
                    <input type="text" name="motherGotra" placeholder="Mother's Gotra (Maternal Gotra)" value={formData.motherGotra} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
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
                      <div key={idx} className="bg-white border border-[#e6dfd1] rounded-md p-2.5 space-y-2 relative shadow-2xs">
                        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                          <input
                            type="text"
                            placeholder={`${sec.title.split(' ')[0]} ${idx + 1} Name / Details`}
                            value={item.name}
                            onChange={(e) => handleRelativeChange(sec.listName, idx, 'name', e.target.value)}
                            className="flex-1 min-w-[120px] bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-2.5 py-1.5 text-[12px] font-semibold text-slate-800 focus:outline-none focus:border-[#570013] focus:bg-white placeholder-slate-400"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <select
                              value={item.status}
                              onChange={(e) => handleRelativeChange(sec.listName, idx, 'status', e.target.value)}
                              className="text-[11px] font-semibold bg-[#fbf9f5] border border-[#e6dfd1] rounded px-1.5 py-1.5 text-slate-700 focus:outline-none focus:border-[#570013]"
                            >
                              <option value="Unmarried">Unmarried</option>
                              <option value="Married">Married</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => saveRelativeItem(sec.listName)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-md flex items-center justify-center shadow-xs transition-all active:scale-95 shrink-0"
                              title="Save this entry"
                            >
                              <span className="material-symbols-outlined text-[16px]">check</span>
                            </button>
                            {(formData[sec.listName] || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeRelativeItem(sec.listName, idx)}
                                className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-all shrink-0"
                                title="Delete entry"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {item.status === 'Married' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                            <input
                              type="text"
                              placeholder={sec.spouseLabel}
                              value={item.spouseName}
                              onChange={(e) => handleRelativeChange(sec.listName, idx, 'spouseName', e.target.value)}
                              className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-1.5 text-[12px] font-semibold text-slate-800 focus:outline-none focus:border-[#570013] focus:bg-white placeholder-slate-400"
                            />
                            <input
                              type="text"
                              placeholder={sec.homeLabel}
                              value={item.homePlace}
                              onChange={(e) => handleRelativeChange(sec.listName, idx, 'homePlace', e.target.value)}
                              className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-1.5 text-[12px] font-semibold text-slate-800 focus:outline-none focus:border-[#570013] focus:bg-white placeholder-slate-400"
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
                <button type="button" onClick={() => setStep(1)} className="bg-white border border-[#e6dfd1] hover:bg-gray-50 text-slate-600 font-bold text-sm px-6 py-2.5 rounded-md flex items-center justify-center shadow-sm active:scale-95 transition-all w-full sm:w-auto">
                  Back
                </button>
                <button type="button" onClick={() => setStep(3)} className="bg-[#570013] hover:bg-[#72001a] text-white font-bold text-sm px-6 py-2.5 rounded-md flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all w-full sm:w-auto">
                  <span>Next Step</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
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
                  <div key={idx} className="bg-white border border-[#e6dfd1] rounded-md p-2.5 space-y-2 relative shadow-2xs">
                    <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                      <input
                        type="text"
                        placeholder={`Mama Ji ${idx + 1} Name / Details`}
                        value={item.name}
                        onChange={(e) => handleRelativeChange('mamajiList', idx, 'name', e.target.value)}
                        className="flex-1 min-w-[120px] bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-2.5 py-1.5 text-[12px] font-semibold text-slate-800 focus:outline-none focus:border-[#570013] focus:bg-white placeholder-slate-400"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <select
                          value={item.status}
                          onChange={(e) => handleRelativeChange('mamajiList', idx, 'status', e.target.value)}
                          className="text-[11px] font-semibold bg-[#fbf9f5] border border-[#e6dfd1] rounded px-1.5 py-1.5 text-slate-700 focus:outline-none focus:border-[#570013]"
                        >
                          <option value="Unmarried">Unmarried</option>
                          <option value="Married">Married</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => saveRelativeItem('mamajiList')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-md flex items-center justify-center shadow-xs transition-all active:scale-95 shrink-0"
                          title="Save this entry"
                        >
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        </button>
                        {(formData.mamajiList || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRelativeItem('mamajiList', idx)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-all shrink-0"
                            title="Delete entry"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {item.status === 'Married' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <input
                          type="text"
                          placeholder="Mami Ji's Name"
                          value={item.spouseName}
                          onChange={(e) => handleRelativeChange('mamajiList', idx, 'spouseName', e.target.value)}
                          className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-1.5 text-[12px] font-semibold text-slate-800 focus:outline-none focus:border-[#570013] focus:bg-white placeholder-slate-400"
                        />
                        <input
                          type="text"
                          placeholder="Mami Ji's Home Place"
                          value={item.homePlace}
                          onChange={(e) => handleRelativeChange('mamajiList', idx, 'homePlace', e.target.value)}
                          className="w-full bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-1.5 text-[12px] font-semibold text-slate-800 focus:outline-none focus:border-[#570013] focus:bg-white placeholder-slate-400"
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

              {/* Mobile Number */}
              <div>
                <label className="block text-[11px] leading-normal font-bold text-[#570013] uppercase tracking-wider mb-1.5">Mobile Number</label>
                <div className="bg-[#fbf9f5] border border-[#e6dfd1] rounded-md px-3 py-2 flex items-center gap-2 focus-within:border-[#570013] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#570013] shadow-sm transition-all md:w-1/2">
                  <span className="material-symbols-outlined text-[#775a19] text-[18px]">call</span>
                  <input type="tel" name="mobileNumber" placeholder="+91 XXXXX XXXXX" value={formData.mobileNumber} onChange={handleChange} className="w-full bg-transparent text-[12px] font-semibold text-slate-800 focus:outline-none placeholder-slate-400" />
                </div>
              </div>

              <div className="w-full h-px bg-[#e6dfd1]/80 my-5"></div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setStep(2)} className="bg-white border border-[#e6dfd1] hover:bg-gray-50 text-slate-600 font-bold text-sm px-6 py-2.5 rounded-md flex items-center justify-center shadow-sm active:scale-95 transition-all w-full sm:w-auto">
                  Back
                </button>
                <button type="button" onClick={() => setStep(4)} className="bg-[#570013] hover:bg-[#72001a] text-white font-bold text-sm px-6 py-2.5 rounded-md flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all w-full sm:w-auto">
                  <span>Next Step</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <form className="space-y-4 relative z-10" onSubmit={(e) => { 
              e.preventDefault();
              const profileToSave = { ...formData };
              localStorage.setItem('userProfile', JSON.stringify(profileToSave));
              navigate('/home'); 
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
                  
                  <input id="photo-upload" type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({ ...formData, profilePicture: reader.result });
                      };
                      reader.readAsDataURL(file);
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
                <button type="button" onClick={() => setStep(3)} className="bg-white border border-[#e6dfd1] hover:bg-gray-50 text-slate-600 font-bold text-sm px-6 py-2.5 rounded-md flex items-center justify-center shadow-sm active:scale-95 transition-all w-full sm:w-auto">
                  Back
                </button>
                <button type="submit" className="bg-[#570013] hover:bg-[#72001a] text-white font-bold text-sm px-6 py-2.5 rounded-md flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all w-full sm:w-auto">
                  <span>Complete Profile</span>
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
