import React from 'react'

/**
 * Stops one broken component from blanking the entire app.
 *
 * React unmounts the whole tree when a render throws, which left `#root` empty
 * over the dark page background - no message, no retry, nothing to tap. To a
 * Play reviewer that is indistinguishable from an app that never opened, and it
 * is what the Broken Functionality rejection describes.
 *
 * `variant="app"` is the outermost net and offers a full reload. `variant="screen"`
 * sits inside the router so a single screen can fail while the header and
 * navigation stay usable.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    // Kept as console output rather than a reporting service: there is no error
    // tracker wired up yet, and a silent catch would make this class the reason
    // a future bug is impossible to find.
    console.error('[ErrorBoundary] a component tree failed to render:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ error: null })
  }

  handleReload = () => {
    try {
      window.location.assign('/')
    } catch {
      window.location.reload()
    }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const isScreen = this.props.variant === 'screen'

    return (
      <div className="min-h-screen w-full bg-[#fbf9f5] flex flex-col items-center justify-center px-6 py-12 text-center font-body">
        <div className="w-16 h-16 rounded-full bg-[#570013]/10 flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-[32px] text-[#570013]">error</span>
        </div>

        <h1 className="font-display text-xl font-bold text-[#570013] mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-[#775a19] max-w-xs leading-relaxed mb-7">
          {isScreen
            ? 'This page could not be displayed. You can go back and try again.'
            : 'The app ran into an unexpected problem. Reloading usually fixes it.'}
        </p>

        <div className="flex flex-col gap-3 w-full max-w-[260px]">
          <button
            type="button"
            onClick={isScreen ? this.handleRetry : this.handleReload}
            className="w-full py-3 rounded-full bg-[#570013] text-white text-sm font-bold shadow-lg active:scale-[0.98] transition-transform"
          >
            {isScreen ? 'Try again' : 'Reload the app'}
          </button>

          {isScreen && (
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-3 rounded-full border border-[#775a19]/30 text-[#775a19] text-sm font-bold active:scale-[0.98] transition-transform"
            >
              Go to home
            </button>
          )}
        </div>

        {/* Surfaced only in development - production users get the message above. */}
        {import.meta.env?.DEV && (
          <pre className="mt-8 max-w-full overflow-x-auto text-left text-[11px] leading-relaxed text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {String(error?.stack || error?.message || error)}
          </pre>
        )}
      </div>
    )
  }
}
