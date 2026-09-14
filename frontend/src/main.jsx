import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/**
 * Errors that escape React entirely - a rejected promise nobody awaited, a
 * listener that threw. These cannot blank the screen on their own, but they
 * used to vanish silently, which made the Play "does not load" report
 * impossible to trace. Logged, never swallowed.
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('[app] unhandled promise rejection:', event.reason)
})

window.addEventListener('error', (event) => {
  // Resource failures (a script or stylesheet that 404s) are handled by the
  // boot guard in index.html; this branch is only for real script errors.
  if (event.target && event.target !== window) return
  console.error('[app] uncaught error:', event.error || event.message)
})

const container = document.getElementById('root')

/**
 * If the container is missing the bundle has been loaded into the wrong page.
 * Leaving the boot overlay's failure state up is better than throwing into a
 * void, which is what produced a permanently blank screen.
 */
if (!container) {
  console.error('[app] #root is missing - cannot mount.')
} else {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

  // Two frames: the first lets React commit the initial tree, the second lets
  // it paint. Removing the overlay any earlier shows a flash of empty page.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (typeof window.__appBooted === 'function') window.__appBooted()
    })
  })
}
