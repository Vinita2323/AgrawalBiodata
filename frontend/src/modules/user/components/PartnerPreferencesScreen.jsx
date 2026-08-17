import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getPartnerPreferences,
  updatePartnerPreferences,
} from '../../../services/accountService'
import { isAuthenticated } from '../../../services/authService'

const MARITAL_STATUSES = ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce']
const MANGLIK_OPTIONS = ['', 'Non-Manglik', 'Manglik', 'Anshik Manglik', "Don't Know"]
const DIETS = ['Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Jain', 'Vegan']
const EDUCATION_LEVELS = ['Graduate', 'Post Graduate', 'Doctorate', 'Diploma', 'Professional']
const GOTRAS = [
  'Garg', 'Goyal', 'Bansal', 'Bindal', 'Mittal', 'Singhal', 'Jindal', 'Tingal', 'Tayal',
  'Airan', 'Dharan', 'Madhukul', 'Goyan', 'Kuchhal', 'Kansal', 'Nangal', 'Mangal', 'Bhandal',
]

/** Height presets in cm, labelled in the feet/inches members actually use. */
const HEIGHTS = [
  { cm: 137, label: "4'6\"" }, { cm: 145, label: "4'9\"" }, { cm: 152, label: "5'0\"" },
  { cm: 157, label: "5'2\"" }, { cm: 163, label: "5'4\"" }, { cm: 168, label: "5'6\"" },
  { cm: 173, label: "5'8\"" }, { cm: 178, label: "5'10\"" }, { cm: 183, label: "6'0\"" },
  { cm: 190, label: "6'3\"" },
]

const EMPTY = {
  minAge: null,
  maxAge: null,
  minHeightCm: null,
  maxHeightCm: null,
  maritalStatus: [],
  manglik: '',
  educationLevels: [],
  occupations: [],
  minIncomeLakh: null,
  cities: [],
  states: [],
  diet: [],
  excludeGotras: [],
  verifiedOnly: false,
}

/** Multi-select rendered as toggleable chips. */
function ChipGroup({ label, options, selected, onToggle, hint }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      {hint && <p className="text-[10px] text-slate-400 font-medium mb-2">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isOn = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition active:scale-95 ${
                isOn
                  ? 'bg-[#570013] text-white border-[#570013]'
                  : 'bg-white text-slate-600 border-amber-200 hover:border-[#570013]'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Comma-separated free-text list (cities, states, occupations). */
function ListInput({ label, placeholder, values, onChange }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={values.join(', ')}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean)
          )
        }
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40"
      />
      <p className="text-[10px] text-slate-400 font-medium mt-1">Separate multiple values with commas</p>
    </div>
  )
}

export default function PartnerPreferencesScreen({ onBack }) {
  const navigate = useNavigate()

  const [prefs, setPrefs] = useState(EMPTY)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!isAuthenticated()) {
        setIsLoading(false)
        setErrorMsg('Please log in to set your partner preferences.')
        return
      }

      try {
        const res = await getPartnerPreferences()
        if (!cancelled && res?.preferences) {
          setPrefs({ ...EMPTY, ...res.preferences })
        }
      } catch (err) {
        if (!cancelled) setErrorMsg(err?.message || 'Could not load your preferences.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const set = (key, value) => setPrefs((prev) => ({ ...prev, [key]: value }))

  const toggleIn = (key, option) =>
    setPrefs((prev) => ({
      ...prev,
      [key]: prev[key].includes(option)
        ? prev[key].filter((v) => v !== option)
        : [...prev[key], option],
    }))

  const handleSave = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (prefs.minAge && prefs.maxAge && prefs.minAge > prefs.maxAge) {
      setErrorMsg('Minimum age cannot be greater than maximum age.')
      return
    }
    if (prefs.minHeightCm && prefs.maxHeightCm && prefs.minHeightCm > prefs.maxHeightCm) {
      setErrorMsg('Minimum height cannot be greater than maximum height.')
      return
    }

    setIsSaving(true)
    try {
      await updatePartnerPreferences(prefs)
      setToastMsg('Preferences saved. Your matches will update to reflect them.')
      setTimeout(() => setToastMsg(''), 3500)
    } catch (err) {
      setErrorMsg(err?.message || 'Could not save your preferences.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearAll = async () => {
    setPrefs(EMPTY)
    setIsSaving(true)
    setErrorMsg('')
    try {
      await updatePartnerPreferences(EMPTY)
      setToastMsg('Preferences cleared. You will now see all matches.')
      setTimeout(() => setToastMsg(''), 3500)
    } catch (err) {
      setErrorMsg(err?.message || 'Could not clear your preferences.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGoBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

  const numberInput =
    'w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#775a19]/40'

  return (
    <div className="bg-[#fbf9f5] min-h-screen text-[#1b1c1a] font-body flex flex-col pb-28">
      <header className="sticky top-0 z-40 bg-[#fbf9f5]/95 backdrop-blur-md border-b border-amber-200/60 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1 text-xs font-bold text-[#570013] hover:opacity-80 transition p-1 -ml-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <span className="font-display font-bold text-[15px] text-[#570013]">Partner Preferences</span>
          <div className="w-8"></div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-[#6e0b18] via-[#7d0d1c] to-[#50040f] text-white px-5 py-5 text-center shadow-md">
        <p className="text-xs text-amber-100/90 max-w-sm mx-auto font-medium">
          Tell us what you are looking for. Your matches and daily recommendations are filtered by
          these preferences. Leave a field blank to keep it open.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-4 max-w-2xl mx-auto w-full space-y-5">
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMsg}</span>
            </div>
            <button type="button" onClick={() => setErrorMsg('')} className="text-red-500 font-bold shrink-0">
              ✕
            </button>
          </div>
        )}

        {toastMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{toastMsg}</span>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10 text-xs text-slate-400 font-semibold">
            Loading your preferences...
          </div>
        ) : (
          <>
            {/* Age & Height */}
            <section className="bg-white rounded-xl border border-amber-200/80 shadow-2xs p-4 space-y-4">
              <h2 className="text-xs font-bold text-[#570013] uppercase tracking-wider">Age &amp; Height</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Minimum Age</label>
                  <input
                    type="number"
                    min="18"
                    max="80"
                    value={prefs.minAge ?? ''}
                    onChange={(e) => set('minAge', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Any"
                    className={numberInput}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Maximum Age</label>
                  <input
                    type="number"
                    min="18"
                    max="80"
                    value={prefs.maxAge ?? ''}
                    onChange={(e) => set('maxAge', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Any"
                    className={numberInput}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Minimum Height</label>
                  <select
                    value={prefs.minHeightCm ?? ''}
                    onChange={(e) => set('minHeightCm', e.target.value ? Number(e.target.value) : null)}
                    className={numberInput}
                  >
                    <option value="">Any</option>
                    {HEIGHTS.map((h) => (
                      <option key={h.cm} value={h.cm}>{h.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Maximum Height</label>
                  <select
                    value={prefs.maxHeightCm ?? ''}
                    onChange={(e) => set('maxHeightCm', e.target.value ? Number(e.target.value) : null)}
                    className={numberInput}
                  >
                    <option value="">Any</option>
                    {HEIGHTS.map((h) => (
                      <option key={h.cm} value={h.cm}>{h.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Community & horoscope */}
            <section className="bg-white rounded-xl border border-amber-200/80 shadow-2xs p-4 space-y-4">
              <h2 className="text-xs font-bold text-[#570013] uppercase tracking-wider">
                Community &amp; Horoscope
              </h2>

              <ChipGroup
                label="Marital Status"
                options={MARITAL_STATUSES}
                selected={prefs.maritalStatus}
                onToggle={(v) => toggleIn('maritalStatus', v)}
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Manglik Status</label>
                <select
                  value={prefs.manglik}
                  onChange={(e) => set('manglik', e.target.value)}
                  className={numberInput}
                >
                  {MANGLIK_OPTIONS.map((option) => (
                    <option key={option || 'any'} value={option}>
                      {option || 'Any'}
                    </option>
                  ))}
                </select>
              </div>

              <ChipGroup
                label="Exclude Gotras"
                hint="Sagotra matches are already excluded automatically. Add any further gotras to rule out."
                options={GOTRAS}
                selected={prefs.excludeGotras}
                onToggle={(v) => toggleIn('excludeGotras', v)}
              />
            </section>

            {/* Lifestyle */}
            <section className="bg-white rounded-xl border border-amber-200/80 shadow-2xs p-4 space-y-4">
              <h2 className="text-xs font-bold text-[#570013] uppercase tracking-wider">Lifestyle</h2>

              <ChipGroup
                label="Diet"
                options={DIETS}
                selected={prefs.diet}
                onToggle={(v) => toggleIn('diet', v)}
              />
            </section>

            {/* Education & career */}
            <section className="bg-white rounded-xl border border-amber-200/80 shadow-2xs p-4 space-y-4">
              <h2 className="text-xs font-bold text-[#570013] uppercase tracking-wider">
                Education &amp; Career
              </h2>

              <ChipGroup
                label="Education Level"
                options={EDUCATION_LEVELS}
                selected={prefs.educationLevels}
                onToggle={(v) => toggleIn('educationLevels', v)}
              />

              <ListInput
                label="Occupations"
                placeholder="Software Engineer, Doctor, CA"
                values={prefs.occupations}
                onChange={(v) => set('occupations', v)}
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Minimum Annual Income (in lakh)
                </label>
                <input
                  type="number"
                  min="0"
                  value={prefs.minIncomeLakh ?? ''}
                  onChange={(e) => set('minIncomeLakh', e.target.value ? Number(e.target.value) : null)}
                  placeholder="Any"
                  className={numberInput}
                />
              </div>
            </section>

            {/* Location */}
            <section className="bg-white rounded-xl border border-amber-200/80 shadow-2xs p-4 space-y-4">
              <h2 className="text-xs font-bold text-[#570013] uppercase tracking-wider">Location</h2>

              <ListInput
                label="Preferred Cities"
                placeholder="Jaipur, Delhi, Indore"
                values={prefs.cities}
                onChange={(v) => set('cities', v)}
              />

              <ListInput
                label="Preferred States"
                placeholder="Rajasthan, Delhi"
                values={prefs.states}
                onChange={(v) => set('states', v)}
              />
            </section>

            {/* Trust */}
            <section className="bg-white rounded-xl border border-amber-200/80 shadow-2xs p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-slate-800 mb-0.5">Verified Profiles Only</div>
                  <div className="text-[11px] text-gray-500 leading-relaxed">
                    Show only candidates whose identity documents have been verified.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={prefs.verifiedOnly}
                    onChange={(e) => set('verifiedOnly', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#570013]"></div>
                </label>
              </div>
            </section>

            <button
              type="button"
              onClick={handleClearAll}
              disabled={isSaving}
              className="w-full py-2.5 bg-white border border-amber-200 text-[#570013] font-bold rounded-lg text-xs active:scale-95 transition disabled:opacity-50"
            >
              Clear All Preferences
            </button>
          </>
        )}
      </form>

      {/* Fixed save bar */}
      {!isLoading && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-amber-200 py-3 px-4 shadow-2xl">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3.5 rounded-lg bg-[#570013] hover:bg-[#72001a] text-white font-bold text-sm shadow-lg active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
