import React, { useEffect, useState } from 'react'

/**
 * Tells the user when the device has lost its connection.
 *
 * Without this, going offline just made every action fail quietly - requests
 * timing out one by one with no explanation - which reads as a broken app
 * rather than a missing network. Reconnection is acknowledged briefly so the
 * banner does not simply vanish and leave people wondering.
 */
export default function OfflineBanner() {
  // `navigator.onLine` is missing in some WebViews; assume online rather than
  // accusing a perfectly connected device of being offline.
  const [isOnline, setIsOnline] = useState(
    () => (typeof navigator === 'undefined' || navigator.onLine !== false)
  )
  const [showRestored, setShowRestored] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowRestored(true)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setShowRestored(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!showRestored) return undefined
    const timer = setTimeout(() => setShowRestored(false), 3000)
    return () => clearTimeout(timer)
  }, [showRestored])

  if (isOnline && !showRestored) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 inset-x-0 z-[9998] px-4 py-2 text-center text-xs font-bold text-white ${
        isOnline ? 'bg-emerald-600' : 'bg-[#570013]'
      }`}
    >
      {isOnline ? 'Back online' : 'No internet connection'}
    </div>
  )
}
