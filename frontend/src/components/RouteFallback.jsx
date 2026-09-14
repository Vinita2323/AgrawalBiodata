import React from 'react'

/**
 * Shown while a lazily-loaded route is still downloading.
 *
 * Deliberately branded rather than blank: on a slow connection this is the
 * screen someone stares at, and an empty page is what makes an app look like it
 * failed to open.
 */
export default function RouteFallback() {
  return (
    <div className="min-h-screen w-full bg-[#fbf9f5] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-[3px] border-[#570013]/15 border-t-[#570013] animate-spin" />
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#775a19]">Loading</p>
    </div>
  )
}
