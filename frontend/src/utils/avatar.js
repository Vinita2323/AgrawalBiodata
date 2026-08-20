/**
 * Avatar fallback helpers
 * Agrawal Matrimony Platform
 *
 * A candidate photo can be missing for ordinary reasons - the member never
 * uploaded one, or the file behind a stored path is gone. Neither should show
 * the browser's broken-image icon on a matrimonial profile, so every avatar
 * falls back to a neutral placeholder drawn inline.
 */

/**
 * Neutral person silhouette in the platform's palette, inlined as a data URI so
 * it can never itself 404.
 */
export const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
      <rect width="128" height="128" fill="#f3ece0"/>
      <circle cx="64" cy="48" r="22" fill="#c9b48f"/>
      <path d="M20 122c0-24 20-38 44-38s44 14 44 38z" fill="#c9b48f"/>
    </svg>`
  )

/**
 * Swaps a failed image for the placeholder.
 *
 * Clearing onerror first matters: if the fallback ever failed to decode the
 * handler would fire again on its own replacement and loop forever.
 *
 * @param {React.SyntheticEvent<HTMLImageElement>} e
 */
export function handleAvatarError(e) {
  const img = e?.currentTarget
  if (!img || img.dataset.fallbackApplied === '1') return
  img.dataset.fallbackApplied = '1'
  img.onerror = null
  img.src = FALLBACK_AVATAR
}

/**
 * Resolved photo URL, or the placeholder when there is nothing to show.
 * @param {string} url
 */
export function avatarSrc(url) {
  return url || FALLBACK_AVATAR
}
