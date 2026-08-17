import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../../services/notificationService'
import { isAuthenticated } from '../../../services/authService'

const PUSH_TOGGLES = [
  {
    key: 'newMatchAlerts',
    label: 'New Matches',
    description: 'Get notified when we find new profiles matching your preferences.',
  },
  {
    key: 'interestAlerts',
    label: 'Interests Received',
    description: 'Alerts when someone sends you an interest or accepts yours.',
  },
  {
    key: 'messageAlerts',
    label: 'New Messages',
    description: 'Alerts when a connected member sends you a message.',
  },
]

const EMAIL_TOGGLES = [
  {
    key: 'weeklyDigestEmail',
    label: 'Weekly Match Digest (Email)',
    description: 'A weekly summary of the best profiles tailored to your criteria.',
  },
  {
    key: 'promotionalEmails',
    label: 'Promotions & Offers',
    description: 'Occasional emails or SMS about premium plan discounts and events.',
  },
]

function Toggle({ checked, disabled, onChange }) {
  return (
    <label className={`relative inline-flex items-center shrink-0 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#570013]"></div>
    </label>
  )
}

export default function NotificationSettingsScreen({ onBack }) {
  const navigate = useNavigate()

  const [preferences, setPreferences] = useState({
    newMatchAlerts: true,
    interestAlerts: true,
    messageAlerts: true,
    weeklyDigestEmail: true,
    promotionalEmails: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [savingKey, setSavingKey] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!isAuthenticated()) {
        setIsLoading(false)
        setErrorMsg('Please log in to manage your notification settings.')
        return
      }

      try {
        const res = await getNotificationPreferences()
        if (!cancelled && res?.preferences) {
          setPreferences((prev) => ({ ...prev, ...res.preferences }))
        }
      } catch (err) {
        if (!cancelled) setErrorMsg(err?.message || 'Could not load your notification settings.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Each toggle saves immediately and rolls back if the request fails, so the
  // switch never shows a state the server did not accept.
  const handleToggle = async (key, value) => {
    const previous = preferences[key]
    setPreferences((prev) => ({ ...prev, [key]: value }))
    setSavingKey(key)
    setErrorMsg('')

    try {
      await updateNotificationPreferences({ [key]: value })
      setToastMsg('Preference saved')
      setTimeout(() => setToastMsg(''), 2000)
    } catch (err) {
      setPreferences((prev) => ({ ...prev, [key]: previous }))
      setErrorMsg(err?.message || 'Could not save that preference.')
    } finally {
      setSavingKey(null)
    }
  }

  const handleGoBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

  const renderSection = (heading, toggles) => (
    <section>
      <h2 className="text-xs font-bold text-[#570013] uppercase tracking-wider mb-3 ml-1">{heading}</h2>
      <div className="bg-white rounded-xl border border-amber-200/80 shadow-2xs divide-y divide-gray-100">
        {toggles.map((item) => (
          <div key={item.key} className="p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-slate-800 mb-0.5">{item.label}</div>
              <div className="text-[11px] text-gray-500 leading-relaxed">{item.description}</div>
            </div>
            <Toggle
              checked={Boolean(preferences[item.key])}
              disabled={isLoading || savingKey === item.key}
              onChange={(value) => handleToggle(item.key, value)}
            />
          </div>
        ))}
      </div>
    </section>
  )

  return (
    <div className="bg-[#fbf9f5] min-h-screen text-[#1b1c1a] font-body flex flex-col pb-12">
      <header className="sticky top-0 z-40 bg-[#fbf9f5]/95 backdrop-blur-md border-b border-amber-200/60 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1 text-xs font-bold text-[#570013] hover:opacity-80 transition p-1 -ml-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <span className="font-display font-bold text-[15px] text-[#570013]">
            Notification Settings
          </span>
          <div className="w-8"></div>
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto w-full space-y-6">
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-red-500 font-bold shrink-0">
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

        {isLoading && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-bold">
            Loading your settings...
          </div>
        )}

        {renderSection('Push Notifications', PUSH_TOGGLES)}
        {renderSection('Email & SMS', EMAIL_TOGGLES)}
      </div>
    </div>
  )
}
