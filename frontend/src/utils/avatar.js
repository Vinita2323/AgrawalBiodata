/**
 * Avatar fallback helpers & Mock Indian Profiles
 * Agrawal Matrimony Platform
 *
 * Provides curated mock images of Indian women for matrimonial profile previews
 * instead of empty silhouettes or broken placeholders.
 */

/**
 * Neutral person silhouette in the platform's palette.
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

// Curated collection of authentic, high-quality portrait photos of Indian women for matrimonial profiles
export const MOCK_INDIAN_GIRL_AVATARS = [
  'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600', // Traditional Indian attire, portrait
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600', // Elegant Indian portrait
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600', // Professional Indian woman
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600', // Confident warm smile
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=600', // Graceful Indian portrait
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=600', // Beautiful smiling headshot
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600', // Professional warm portrait
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600', // Natural smiling portrait
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600', // Traditional portrait
  'https://images.unsplash.com/photo-1597223557154-721c1cecc4b0?auto=format&fit=crop&q=80&w=600', // Charming smile
]

/**
 * Returns a stable mock photo of an Indian woman based on profile id or name.
 * @param {string|number} key
 */
export function getMockFemaleAvatar(key = '') {
  if (!key) {
    return MOCK_INDIAN_GIRL_AVATARS[0]
  }
  const str = String(key)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % MOCK_INDIAN_GIRL_AVATARS.length
  return MOCK_INDIAN_GIRL_AVATARS[index]
}

/**
 * Swaps a failed image for the fallback mock avatar.
 *
 * Clearing onerror first matters: if the fallback ever failed to decode the
 * handler would fire again on its own replacement and loop forever.
 *
 * @param {React.SyntheticEvent<HTMLImageElement>} e
 * @param {string} [customFallback]
 */
export function handleAvatarError(e, customFallback = null) {
  const img = e?.currentTarget
  if (!img || img.dataset.fallbackApplied === '1') return
  img.dataset.fallbackApplied = '1'
  img.onerror = null
  img.src = customFallback || getMockFemaleAvatar()
}

/**
 * Resolved photo URL, or a realistic mock Indian woman photo when there is nothing to show.
 * @param {string} url
 * @param {string|number} [fallbackKey]
 */
export function avatarSrc(url, fallbackKey = null) {
  if (url && typeof url === 'string' && url.trim() !== '') {
    return url
  }
  return getMockFemaleAvatar(fallbackKey)
}

/**
 * Curated realistic mock profiles of Agarwal women for "Today's Matches"
 * displayed on the Home page when live recommendations are loading or empty.
 */
export const DEFAULT_TODAY_MATCHES = [
  {
    id: 'PRF-MOCK-002',
    name: 'Priya Bansal',
    age: 25,
    height: "5'5\"",
    city: 'Jaipur, Rajasthan',
    profession: 'Chartered Accountant',
    gotra: 'Bansal',
    motherGotra: 'Mittal',
    education: 'CA, B.Com (Hons)',
    matchScore: 98,
    isPremium: true,
    image: MOCK_INDIAN_GIRL_AVATARS[0],
  },
  {
    id: 'PRF-MOCK-004',
    name: 'Dr. Sneha Mittal',
    age: 26,
    height: "5'6\"",
    city: 'Delhi, NCR',
    profession: 'Dermatologist (MD)',
    gotra: 'Mittal',
    motherGotra: 'Jindal',
    education: 'MBBS, MD (AIIMS)',
    matchScore: 95,
    isPremium: true,
    image: MOCK_INDIAN_GIRL_AVATARS[2],
  },
  {
    id: 'PRF-MOCK-006',
    name: 'Pooja Jindal',
    age: 24,
    height: "5'4\"",
    city: 'Noida, UP',
    profession: 'Senior UX Designer',
    gotra: 'Jindal',
    motherGotra: 'Tayal',
    education: 'B.Des NID',
    matchScore: 93,
    isPremium: false,
    image: MOCK_INDIAN_GIRL_AVATARS[3],
  },
  {
    id: 'PRF-MOCK-008',
    name: 'Anjali Tayal',
    age: 24,
    height: "5'3\"",
    city: 'Lucknow, UP',
    profession: 'Architect',
    gotra: 'Tayal',
    motherGotra: 'Airan',
    education: 'B.Arch SPA Delhi',
    matchScore: 91,
    isPremium: false,
    image: MOCK_INDIAN_GIRL_AVATARS[1],
  },
  {
    id: 'PRF-MOCK-010',
    name: 'Kirti Nangal',
    age: 25,
    height: "5'6\"",
    city: 'Chandigarh',
    profession: 'Software Engineer',
    gotra: 'Nangal',
    motherGotra: 'Garg',
    education: 'B.Tech CS',
    matchScore: 89,
    isPremium: true,
    image: MOCK_INDIAN_GIRL_AVATARS[4],
  },
  {
    id: 'PRF-MOCK-014',
    name: 'Meera Dharan',
    age: 24,
    height: "5'3\"",
    city: 'Bengaluru, KA',
    profession: 'Senior Product Analyst',
    gotra: 'Dharan',
    motherGotra: 'Kuchhal',
    education: 'B.E. Computer Science',
    matchScore: 87,
    isPremium: false,
    image: MOCK_INDIAN_GIRL_AVATARS[5],
  },
]
