import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { isAuthenticated } from '../../../services/authService'
import {
  registerFcmToken,
  onForegroundPush,
  showForegroundNotification,
} from '../../../services/pushNotificationService'

/**
 * Marks that this browser has already been shown the permission prompt, so a
 * member who dismissed it is not asked again on every single visit. Browsers
 * penalise repeated prompting, and nagging is what makes people block a site
 * outright.
 */
const ASKED_KEY = 'push_permission_asked'

/** Delay before prompting, so the request does not collide with the sign-in transition. */
const PROMPT_DELAY_MS = 4000

function hasAsked() {
  try {
    return localStorage.getItem(ASKED_KEY) === '1'
  } catch {
    return false
  }
}

function markAsked() {
  try {
    localStorage.setItem(ASKED_KEY, '1')
  } catch {
    // Private-mode storage failures should not block the prompt itself.
  }
}

/**
 * Owns browser push for the signed-in app: asks for permission once after
 * login, and renders pushes that arrive while the tab is focused.
 *
 * Renders nothing - it exists so this behaviour lives in one place rather than
 * being scattered through the dashboard.
 */
export default function PushNotificationManager() {
  const location = useLocation()

  // 1. Ask for permission shortly after the member lands in the app.
  useEffect(() => {
    if (!isAuthenticated()) return undefined
    if (typeof Notification === 'undefined') return undefined

    // 'denied' is deliberately skipped: the browser suppresses the prompt
    // anyway, and re-asking cannot change it. Only a genuine first-time
    // 'default' is worth interrupting someone for.
    if (Notification.permission !== 'default') return undefined
    if (hasAsked()) return undefined

    // The pre-login screens are the wrong moment to ask - there is no context
    // yet for why the site wants to notify them.
    const onboardingRoutes = ['/login', '/create-account', '/otp-verification', '/welcome', '/auth-landing']
    if (onboardingRoutes.includes(location.pathname)) return undefined

    const timer = setTimeout(() => {
      markAsked()
      registerFcmToken(true).catch(() => {
        // registerFcmToken already reports why it failed.
      })
    }, PROMPT_DELAY_MS)

    return () => clearTimeout(timer)
  }, [location.pathname])

  // 2. Show pushes that arrive while the tab has focus.
  useEffect(() => {
    if (!isAuthenticated()) return undefined

    let unsubscribe = () => {}
    let cancelled = false

    onForegroundPush((payload) => {
      showForegroundNotification(payload)
    })
      .then((off) => {
        if (cancelled) off()
        else unsubscribe = off
      })
      .catch(() => {})

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return null
}
