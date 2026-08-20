import React from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../../../services/authService'
import { useActiveProfile } from '../../../context/ActiveProfileContext'

/** sessionStorage key marking a signup that has just completed. */
const SIGNUP_FLAG = 'justSignedUp'

/**
 * Records that the account was created moments ago.
 *
 * sessionStorage rather than state so the welcome screen survives a refresh,
 * and rather than localStorage so it dies with the tab and can never be
 * mistaken for a later sign-in.
 */
export function markJustSignedUp() {
  try {
    sessionStorage.setItem(SIGNUP_FLAG, '1')
  } catch {
    // Private-mode storage failures are not worth blocking signup over.
  }
}

/** Clears the marker once the welcome screen has served its purpose. */
export function clearJustSignedUp() {
  try {
    sessionStorage.removeItem(SIGNUP_FLAG)
  } catch {
    // Ignore
  }
}

function hasJustSignedUp() {
  try {
    return sessionStorage.getItem(SIGNUP_FLAG) === '1'
  } catch {
    return false
  }
}

/**
 * Restricts a screen to the moments right after registration.
 *
 * "Your account has been created" is only true once. Reaching it any other way
 * - the back button, a bookmarked URL, a restored tab, or a refresh long after
 * the fact - tells a returning member to set up a profile they already have,
 * which is what made logging in look broken. Anyone arriving without the
 * signup marker is sent where they actually belong.
 */
export default function SignupOnlyRoute({ children }) {
  const { profiles, isLoading } = useActiveProfile()

  // Order matters: a signed-out visitor is turned away regardless of any
  // marker left behind in the tab.
  if (!isAuthenticated()) {
    return <Navigate to="/welcome" replace />
  }

  if (hasJustSignedUp()) {
    return children
  }

  // Wait for the profile list before choosing, otherwise a slow load would
  // bounce an established member into onboarding.
  if (isLoading && profiles.length === 0) {
    return null
  }

  return <Navigate to={profiles.length > 0 ? '/home' : '/profile-completion-dashboard'} replace />
}
