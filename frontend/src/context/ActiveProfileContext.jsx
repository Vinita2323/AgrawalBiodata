import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getUserProfiles, switchActiveProfile as switchActiveProfileApi } from '../services/profileService'
import { getActiveProfileId, setActiveProfileId } from '../services/api'
import { isAuthenticated } from '../services/authService'

/**
 * Every candidate profile on the signed-in account, and which one the app is
 * currently acting as.
 *
 * An account can run several profiles - the motivating case is a parent
 * operating biodata for both a son and a daughter. Interests, chats, matches
 * and notifications all belong to a single candidate, so the rest of the app
 * reads the active profile from here and refetches whenever it changes.
 */
const ActiveProfileContext = createContext(null)

export function ActiveProfileProvider({ children }) {
  const location = useLocation()
  const [profiles, setProfiles] = useState([])
  const [activeProfileId, setActiveId] = useState(() => getActiveProfileId())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const profileIdOf = (profile) => (profile ? profile.id || profile._id : null)

  /**
   * Reloads the account's profiles. The server is authoritative about which is
   * active, but a locally chosen profile wins if it is still present, so a
   * refresh does not undo a switch the user just made.
   */
  const refreshProfiles = useCallback(async () => {
    if (!isAuthenticated()) {
      setProfiles([])
      return []
    }

    setIsLoading(true)
    setError('')
    try {
      const data = await getUserProfiles()
      const list = data?.profiles || []
      setProfiles(list)

      setActiveId((current) => {
        const stillExists = current && list.some((p) => profileIdOf(p) === current)
        const next = stillExists
          ? current
          : data?.activeProfileId || profileIdOf(list[0]) || null
        setActiveProfileId(next)
        return next
      })

      return list
    } catch (err) {
      // A signed-in user with no profile yet is an expected state, not a fault.
      setError(err?.message || 'Could not load your profiles')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Loads the profile list once the account has one.
   *
   * Keyed on navigation because this provider is mounted above the login
   * screens and never remounts on sign-in: without this the switcher would
   * stay empty until a full page reload. Once a profile is loaded the guard
   * stops any further fetching.
   */
  useEffect(() => {
    if (profiles.length > 0 || isLoading) return
    refreshProfiles()
  }, [location.pathname, profiles.length, isLoading, refreshProfiles])

  /**
   * Makes another profile current. The header is updated before the network
   * call so any request racing the switch already carries the new profile, and
   * the choice is rolled back if the server rejects it.
   */
  const switchProfile = useCallback(
    async (profileId) => {
      if (!profileId || profileId === activeProfileId) return null

      const previous = activeProfileId
      setActiveId(profileId)
      setActiveProfileId(profileId)

      try {
        const data = await switchActiveProfileApi(profileId)
        await refreshProfiles()
        return data
      } catch (err) {
        setActiveId(previous)
        setActiveProfileId(previous)
        setError(err?.message || 'Could not switch profile')
        throw err
      }
    },
    [activeProfileId, refreshProfiles]
  )

  const activeProfile = useMemo(
    () => profiles.find((p) => profileIdOf(p) === activeProfileId) || profiles[0] || null,
    [profiles, activeProfileId]
  )

  const value = useMemo(
    () => ({
      profiles,
      activeProfile,
      activeProfileId,
      hasMultipleProfiles: profiles.length > 1,
      isLoading,
      error,
      switchProfile,
      refreshProfiles
    }),
    [profiles, activeProfile, activeProfileId, isLoading, error, switchProfile, refreshProfiles]
  )

  return <ActiveProfileContext.Provider value={value}>{children}</ActiveProfileContext.Provider>
}

/**
 * Reads the active-profile store. Returns a safe empty shape outside the
 * provider so components can be rendered in isolation.
 */
export function useActiveProfile() {
  return (
    useContext(ActiveProfileContext) || {
      profiles: [],
      activeProfile: null,
      activeProfileId: null,
      hasMultipleProfiles: false,
      isLoading: false,
      error: '',
      switchProfile: async () => null,
      refreshProfiles: async () => []
    }
  )
}

export default ActiveProfileContext
