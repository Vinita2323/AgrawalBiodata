import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminDataService } from '../services/adminDataService'

export default function HeaderSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [allProfiles, setAllProfiles] = useState([])
  const [filteredProfiles, setFilteredProfiles] = useState([])

  // Popular search tags matching user request & screenshots
  const popularTags = [
    'Software Engineer',
    'MBA',
    'Doctor',
    'CA',
    'Jaipur',
    'Delhi',
    'Agarwal',
    'Marwari',
    'Architect',
    'Lawyer',
    'Data Scientist',
    'UI/UX Designer',
  ]

  const categoryProfessions = [
    'Software Engineer',
    'MBA',
    'Doctor',
    'CA',
    'Architect',
    'Data Scientist',
    'Lawyer',
    'UI/UX Designer',
    'Accountant',
    'Finance Manager',
  ]

  const categoryLocations = ['Jaipur', 'Delhi', 'Indore', 'Kota', 'Chandigarh', 'Surat', 'Mumbai']
  const categoryGotras = ['Agarwal', 'Marwari', 'Garg', 'Bansal', 'Goyal', 'Singhal', 'Mittal', 'Kansal']

  useEffect(() => {
    if (isOpen) {
      // Focus search input on modal open
      setTimeout(() => inputRef.current?.focus(), 100)
      loadData()
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const loadData = async () => {
    let users = []
    try {
      users = await adminDataService.getUsers()
    } catch {
      // Search falls back to an empty result set rather than breaking the header.
      setAllProfiles([])
      setFilteredProfiles([])
      return
    }

    const profilesList = []

    users.forEach((user) => {
      if (user.profiles && Array.isArray(user.profiles)) {
        user.profiles.forEach((prof) => {
          profilesList.push({
            ...prof,
            userId: user.id,
            parentName: user.name,
            parentEmail: user.email,
            parentMobile: user.mobile,
            accountStatus: user.accountStatus,
            verificationStatus: user.verificationStatus,
            subscriptionPlan: user.subscriptionPlan,
          })
        })
      }
    })

    setAllProfiles(profilesList)
    setFilteredProfiles(profilesList)
  }

  useEffect(() => {
    let result = allProfiles

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter((p) => {
        const nameMatch = p.fullName?.toLowerCase().includes(term) || false
        const qualMatch = p.qualification?.toLowerCase().includes(term) || false
        const workMatch = p.workingAt?.toLowerCase().includes(term) || false
        const pobMatch = p.pob?.toLowerCase().includes(term) || false
        const addrMatch = p.residentialAddress?.toLowerCase().includes(term) || false
        const gotraMatch = p.gotra?.toLowerCase().includes(term) || false
        const motherGotraMatch = p.motherGotra?.toLowerCase().includes(term) || false
        const parentMatch = p.parentName?.toLowerCase().includes(term) || false

        // Match community keywords
        const isAgarwal = term === 'agarwal' || term === 'agrawal'
        const isMarwari = term === 'marwari'

        if (isAgarwal || isMarwari) {
          return true
        }

        return (
          nameMatch ||
          qualMatch ||
          workMatch ||
          pobMatch ||
          addrMatch ||
          gotraMatch ||
          motherGotraMatch ||
          parentMatch
        )
      })
    }

    if (activeCategory !== 'All') {
      if (activeCategory === 'Professions') {
        result = result.filter((p) =>
          categoryProfessions.some((prof) =>
            p.qualification?.toLowerCase().includes(prof.toLowerCase())
          )
        )
      } else if (activeCategory === 'Locations') {
        result = result.filter((p) =>
          categoryLocations.some(
            (loc) =>
              p.pob?.toLowerCase().includes(loc.toLowerCase()) ||
              p.residentialAddress?.toLowerCase().includes(loc.toLowerCase())
          )
        )
      } else if (activeCategory === 'Gotras') {
        result = result.filter((p) =>
          categoryGotras.some(
            (g) =>
              p.gotra?.toLowerCase().includes(g.toLowerCase()) ||
              p.motherGotra?.toLowerCase().includes(g.toLowerCase())
          )
        )
      }
    }

    setFilteredProfiles(result)
  }, [searchTerm, activeCategory, allProfiles])

  if (!isOpen) return null

  const handleTagClick = (tag) => {
    setSearchTerm(tag)
  }

  const handleSelectPerson = (profile) => {
    onClose()
    navigate(`/admin/users/${profile.userId}`)
  }

  const handleViewAllInManagement = () => {
    onClose()
    navigate(`/admin/users?search=${encodeURIComponent(searchTerm)}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 px-3 sm:px-4 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-200">
      {/* Click backdrop to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col max-h-[85vh] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Header Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-100 bg-[#fdfcf9]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-[#570013] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-xl">search</span>
              </div>
              <div>
                <h3 className="font-display font-extrabold text-base text-[#570013]">
                  Search Profiles & Professions
                </h3>
                <p className="text-xs text-[#775a19]">
                  Find brides, grooms, or candidates by profession, location, or gotra
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-stone-400 text-xl pointer-events-none">
              search
            </span>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search e.g. Software Engineer, Doctor, CA, Jaipur, Delhi, Garg..."
              className="w-full pl-11 pr-10 py-3 bg-white border border-amber-900/20 focus:border-[#570013] focus:ring-2 focus:ring-[#570013]/10 rounded-xl text-sm font-medium text-stone-800 placeholder-stone-400 shadow-xs outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Popular Searches Section (Matching User Screenshot 2) */}
        <div className="p-4 sm:p-5 border-b border-stone-100 bg-amber-50/30">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-600 text-lg">local_fire_department</span>
              <span className="font-bold text-xs uppercase tracking-wider text-[#570013]">
                Popular Searches
              </span>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs text-amber-700 font-semibold hover:underline cursor-pointer"
              >
                Reset Search
              </button>
            )}
          </div>

          {/* Interactive Tag Chips */}
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => {
              const isSelected = searchTerm.toLowerCase() === tag.toLowerCase()
              return (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-[#570013] text-white border-[#570013] ring-2 ring-[#570013]/20 scale-105'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-amber-400 hover:bg-amber-50/60 hover:text-[#570013]'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* Category Filters Bar */}
        <div className="px-5 py-2.5 bg-stone-50 border-b border-stone-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mr-1 shrink-0">
            Category:
          </span>
          {['All', 'Professions', 'Locations', 'Gotras'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                activeCategory === cat
                  ? 'bg-amber-100 text-[#570013] font-bold'
                  : 'text-stone-600 hover:bg-stone-200/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 mb-1">
            <span>
              {searchTerm
                ? `Results for "${searchTerm}"`
                : activeCategory !== 'All'
                ? `${activeCategory} Profiles`
                : 'All Available Profiles'}
            </span>
            <span className="bg-amber-100 text-[#570013] px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              {filteredProfiles.length} Profiles Found
            </span>
          </div>

          {filteredProfiles.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-stone-300">
                person_search
              </span>
              <p className="text-sm font-semibold text-stone-700">
                No matching profiles found for "{searchTerm}"
              </p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try clicking on popular search options above like Software Engineer, Doctor, CA, Jaipur or Delhi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProfiles.map((person) => (
                <div
                  key={person.profileId}
                  onClick={() => handleSelectPerson(person)}
                  className="p-3.5 bg-white rounded-xl border border-stone-200 hover:border-amber-500/60 hover:shadow-md transition-all cursor-pointer flex gap-3 group"
                >
                  <img
                    src={person.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                    alt={person.fullName}
                    className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-sm text-[#570013] truncate group-hover:text-amber-700 transition-colors">
                        {person.fullName}
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-semibold shrink-0">
                        {person.age} Yrs • {person.gender}
                      </span>
                    </div>

                    {/* Profession & Qualification */}
                    <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-amber-900 truncate">
                      <span className="material-symbols-outlined text-sm text-amber-700 shrink-0">
                        work
                      </span>
                      <span className="truncate">{person.qualification || 'Profession Not Specified'}</span>
                    </div>

                    {/* Company / Working at */}
                    {person.workingAt && (
                      <p className="text-[11px] text-stone-500 truncate ml-5">
                        at {person.workingAt}
                      </p>
                    )}

                    {/* Location & Gotra */}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-600 font-medium">
                      <span className="flex items-center gap-0.5 truncate">
                        <span className="material-symbols-outlined text-xs text-stone-400">
                          location_on
                        </span>
                        {person.pob || 'Rajasthan'}
                      </span>
                      <span className="px-1.5 py-0.2 bg-amber-50 text-[#775a19] rounded font-bold shrink-0">
                        Gotra: {person.gotra || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
          <p className="text-xs text-stone-500 font-medium hidden sm:block">
            Click on any candidate card to view full profile details.
          </p>
          <button
            onClick={handleViewAllInManagement}
            className="w-full sm:w-auto px-4 py-2 bg-[#570013] hover:bg-[#42000e] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ml-auto shadow-xs cursor-pointer"
          >
            <span>View All Results in User Management</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

      </div>
    </div>
  )
}
