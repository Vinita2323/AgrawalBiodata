import React from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../../../services/authService'

/**
 * Restricts a screen to signed-out visitors.
 *
 * The auth landing, login, and create-account screens only make sense before
 * a session exists. Reaching one anyway - a bookmark, a shared link, a
 * restored tab - must not make an already-logged-in member log in again.
 */
export default function GuestOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/home" replace />
  }

  return children
}
