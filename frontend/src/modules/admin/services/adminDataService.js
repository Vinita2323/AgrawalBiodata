/**
 * Admin Data Service
 * Agrawal Matrimony Platform
 *
 * Async adapter over the REST API in `src/services/adminService.js`.
 *
 * This module used to be a localStorage fake database. It now talks to MongoDB
 * through the backend. The method names are preserved so the admin pages keep
 * their existing call sites, but every method is now async and must be awaited.
 *
 * Its second job is shape translation: the admin UI was built against a flat
 * denormalized record (`user.profiles[].fullName`, `verification.govtIdStatus`,
 * `staticContent.privacyPolicy`) while the API returns normalized documents.
 * The normalize* helpers below are the single place that mapping lives.
 */

import * as api from '../../../services/adminService'
import { resolveAssetUrl } from '../../../services/api'

/* ------------------------------------------------------------------ *
 * Normalizers: API document -> shape the admin pages already render
 * ------------------------------------------------------------------ */

const asArray = (value) => (Array.isArray(value) ? value : [])

/** Backend `paginate()` responds with { items, pagination }. */
const itemsOf = (res) => asArray(res?.items || res?.users || res?.data)

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toISOString().slice(0, 10)
}

function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toISOString().replace('T', ' ').slice(0, 16)
}

function relativeTime(value) {
  if (!value) return 'Unknown'
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return 'Unknown'

  const seconds = Math.floor((Date.now() - then) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

function ageFromDob(dob) {
  if (!dob) return null
  const born = new Date(dob)
  if (Number.isNaN(born.getTime())) return null
  return Math.floor((Date.now() - born.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function normalizeProfile(profile) {
  if (!profile) return null
  return {
    profileId: profile.profileId || profile.id || profile._id,
    _id: profile._id || profile.id,
    fullName: profile.fullName || '',
    // Who the biodata is for - "Son", "Daughter" and so on. An account can run
    // several candidates, so this is what tells them apart in the admin UI.
    profileFor: profile.profileFor === 'Myself' ? 'Self' : (profile.profileFor || 'Self'),
    isActive: Boolean(profile.isActive),
    completionPercentage: profile.completionPercentage || 0,
    gender: profile.gender || '',
    age: ageFromDob(profile.dob),
    height: profile.height || '',
    gotra: profile.gotra || '',
    motherGotra: profile.motherGotra || '',
    dob: formatDate(profile.dob),
    tob: profile.tob || '',
    pob: profile.pob || '',
    complexion: profile.complexion || '',
    manglik: profile.manglik || '',
    qualification: profile.qualification || '',
    workingAt: profile.workingAt || profile.occupation || '',
    income: profile.income || '',
    hobbies: profile.hobbies || '',
    residentialAddress: profile.residentialAddress || '',
    city: profile.city || '',
    state: profile.state || '',
    verified: Boolean(profile.verified),
    isFeatured: Boolean(profile.isFeatured),
    image: resolveAssetUrl(profile.profilePicture),
    matchScore: profile.matchScore || profile.completionPercentage || 0,
  }
}

function normalizeUser(user) {
  if (!user) return null
  const profiles = asArray(user.profiles).map(normalizeProfile).filter(Boolean)
  const active = normalizeProfile(user.activeProfileId)

  // The active profile is populated separately; keep it in the list exactly once.
  if (active && !profiles.some((p) => String(p._id) === String(active._id))) {
    profiles.unshift(active)
  }

  return {
    id: user.id || user._id,
    name: user.name || '',
    profileCount: profiles.length,
    mobile: user.mobile || '',
    email: user.email || '',
    gender: user.gender || '',
    accountStatus: user.accountStatus || 'Active',
    verificationStatus: user.verificationStatus || 'Unverified',
    subscriptionPlan: user.subscriptionPlan || 'Free',
    subscriptionPlanId: user.subscriptionPlanId || null,
    subscriptionStatus: user.subscriptionStatus || 'Free',
    subscriptionExpiresAt: formatDate(user.subscriptionExpiresAt),
    createdDate: formatDate(user.createdAt),
    lastActive: relativeTime(user.lastLoginAt || user.updatedAt),
    profiles,
    dailyMatchLimit: user.dailyMatchLimit ?? 0,
    // profilesViewedToday only reflects "today" once matchQuotaDate matches
    // the current date; a stale date means the counter hasn't rolled over yet.
    profilesViewedToday: user.matchQuotaDate === new Date().toISOString().slice(0, 10)
      ? asArray(user.profilesViewedToday).length
      : 0,
  }
}

/**
 * The verification UI shows two document columns (government ID and profession
 * proof) with independent statuses. The API stores one status per submission,
 * so both columns mirror it.
 */
function normalizeVerification(v) {
  if (!v) return null
  const user = typeof v.userId === 'object' && v.userId !== null ? v.userId : null
  const profile = typeof v.profileId === 'object' && v.profileId !== null ? v.profileId : null

  return {
    id: v.id || v._id,
    userId: user?.id || user?._id || v.userId || '',
    userName: user?.name || '',
    profileId: profile?.id || profile?._id || v.profileId || '',
    profileName: profile?.fullName || '',
    mobile: user?.mobile || '',
    email: user?.email || '',
    mobileVerified: Boolean(user?.mobile),
    emailVerified: Boolean(user?.email),
    documentType: v.documentType || '',
    documentNumber: v.documentNumber || '',
    govtIdStatus: v.status || 'Pending',
    govtIdType: v.documentType || '',
    govtIdDocUrl: resolveAssetUrl(v.idProofUrl),
    profDocStatus: v.professionProofUrl ? v.status || 'Pending' : 'Not Submitted',
    profDocType: v.professionProofUrl ? 'Profession Proof' : 'N/A',
    profDocUrl: resolveAssetUrl(v.professionProofUrl),
    addressProofUrl: resolveAssetUrl(v.addressProofUrl),
    status: v.status || 'Pending',
    submittedAt: formatDateTime(v.submittedAt || v.createdAt),
    approvedAt: v.status === 'Approved' ? formatDateTime(v.reviewedAt) : undefined,
    rejectedAt: v.status === 'Rejected' ? formatDateTime(v.reviewedAt) : undefined,
    rejectionReason: v.rejectionReason || '',
    reviewedByName: v.reviewedByName || '',
    adminNotes: v.adminNotes || '',
  }
}

function normalizePayment(p) {
  if (!p) return null
  const user = typeof p.userId === 'object' && p.userId !== null ? p.userId : null
  const plan = typeof p.planId === 'object' && p.planId !== null ? p.planId : null

  return {
    id: p.id || p._id,
    transactionId: p.paymentId || p.orderId || '',
    userId: user?.id || user?._id || p.userId || '',
    userName: user?.name || '',
    userEmail: user?.email || '',
    planName: plan?.name || p.planName || '',
    amount: p.amount || 0,
    paymentMethod: p.method || p.paymentMethod || 'Razorpay',
    paymentStatus: p.status || 'Created',
    gatewayRef: p.paymentId || '',
    billingCycle: p.billingCycle || '',
    createdDate: formatDateTime(p.createdAt),
  }
}

function normalizeComplaint(c) {
  if (!c) return null
  const reporter = typeof c.reporterUserId === 'object' && c.reporterUserId !== null ? c.reporterUserId : null
  const reported = typeof c.reportedUserId === 'object' && c.reportedUserId !== null ? c.reportedUserId : null
  const reportedProfile =
    typeof c.reportedProfileId === 'object' && c.reportedProfileId !== null ? c.reportedProfileId : null

  // The UI labels an open complaint "Under Review"; the API uses Pending/In Review.
  const status = c.status === 'Pending' || c.status === 'In Review' ? 'Under Review' : c.status

  return {
    id: c.id || c._id,
    complaintId: c.complaintId || '',
    category: c.category || 'Other',
    reportedProfileId: reportedProfile?.id || reportedProfile?._id || c.reportedProfileId || '',
    reportedProfileName: reportedProfile?.fullName || '',
    reportedUserId: reported?.id || reported?._id || c.reportedUserId || '',
    reporterUserId: reporter?.id || reporter?._id || c.reporterUserId || '',
    reporterUserName: reporter?.name || '',
    reason: c.reason || '',
    description: c.description || '',
    status,
    rawStatus: c.status,
    createdDate: formatDateTime(c.createdAt),
    assignedTo: c.resolvedByName || 'Admin Team',
    actionTaken: c.resolutionAction || '',
    adminNotes: c.adminNotes || '',
  }
}

function normalizeAuditLog(log) {
  if (!log) return null
  return {
    id: log.id || log._id,
    adminName: log.adminName || 'System',
    adminRole: log.adminRole || '',
    action: log.action || '',
    target: log.target || '',
    timestamp: formatDateTime(log.createdAt),
    details: log.details || '',
    ipAddress: log.ipAddress || '',
  }
}

function normalizePlan(plan) {
  if (!plan) return null
  return {
    id: plan.id || plan._id,
    planId: plan.planId || '',
    name: plan.name || '',
    nameHindi: plan.nameHindi || '',
    description: plan.description || '',
    tagline: plan.tagline || '',
    price: plan.monthlyPrice || 0,
    monthlyPrice: plan.monthlyPrice || 0,
    quarterlyPrice: plan.quarterlyPrice || 0,
    yearlyPrice: plan.yearlyPrice || 0,
    discountPercent: plan.discountPercent ?? 0,
    currency: 'INR',
    status: plan.isActive ? 'Active' : 'Inactive',
    badge: plan.badge || '',
    sortOrder: plan.sortOrder ?? 0,
    benefits: asArray(plan.features),
    contactViewLimit: plan.contactViewLimit ?? 0,
    interestSendLimit: plan.interestSendLimit ?? 0,
    dailyMatchLimit: plan.dailyMatchLimit ?? 5,
    verifiedPriority: Boolean(plan.verifiedPriority),
    chatAccess: Boolean(plan.chatAccess),
    relationshipManager: Boolean(plan.relationshipManager),
    profileBoost: Boolean(plan.profileBoost),
    activeSubscribers: plan.activeSubscribers || 0,
    createdDate: formatDate(plan.createdAt),
  }
}

function normalizeBanner(b) {
  if (!b) return null
  return {
    id: b.id || b._id,
    title: b.title || '',
    subtitle: b.subtitle || '',
    imageUrl: b.imageUrl || '',
    linkTarget: b.targetUrl || '',
    status: b.isActive ? 'Active' : 'Inactive',
    positionOrder: b.sortOrder || 0,
  }
}

/* ------------------------------------------------------------------ *
 * CMS static content: flat UI object <-> keyed API pages
 * ------------------------------------------------------------------ */

const CMS_KEY_BY_FIELD = {
  aboutUs: 'about-us',
  contactUs: 'contact-us',
  privacyPolicy: 'privacy-policy',
  termsOfService: 'terms-of-service',
  communityGuidelines: 'community-guidelines',
}

const CMS_TITLE_BY_KEY = {
  'about-us': 'About Agrawal Matrimony',
  'contact-us': 'Contact Support',
  'privacy-policy': 'Privacy Policy',
  'terms-of-service': 'Terms of Service',
  'community-guidelines': 'Community Guidelines',
  faqs: 'Frequently Asked Questions',
}

/* ------------------------------------------------------------------ *
 * Public service
 * ------------------------------------------------------------------ */

export const adminDataService = {
  /* ---------------------------- Users ---------------------------- */

  async getUsers(params = {}) {
    const res = await api.getUsers({ limit: 100, ...params })
    return itemsOf(res).map(normalizeUser).filter(Boolean)
  },

  async getUsersPaged(params = {}) {
    const res = await api.getUsers(params)
    return {
      users: itemsOf(res).map(normalizeUser).filter(Boolean),
      pagination: res?.pagination || null,
    }
  },

  async getUserById(userId) {
    const res = await api.getUserById(userId)
    const user = normalizeUser(res?.user || res)
    if (!user) return null

    // The detail page also renders this user's candidate profiles, payments and
    // KYC submissions, which the endpoint returns alongside the user document.
    if (asArray(res?.profiles).length > 0) {
      user.profiles = asArray(res.profiles).map(normalizeProfile).filter(Boolean)
    }
    user.payments = asArray(res?.payments).map(normalizePayment).filter(Boolean)
    user.verifications = asArray(res?.verifications).map(normalizeVerification).filter(Boolean)
    user.subscriptions = asArray(res?.subscriptions)

    return user
  },

  async updateUserStatus(userId, newStatus, reason = '') {
    const res = await api.updateUserStatus(userId, newStatus, reason)
    return normalizeUser(res?.user || res)
  },

  async deleteUser(userId, reason = 'Deleted by administrator') {
    await api.deleteUser(userId, reason)
    return true
  },

  async exportUsersCSV() {
    return api.exportUsersCSV()
  },

  /* ------------------------ Verifications ------------------------ */

  async getVerifications(params = {}) {
    const res = await api.getVerifications({ limit: 100, ...params })
    return itemsOf(res).map(normalizeVerification).filter(Boolean)
  },

  async getVerificationById(id) {
    const res = await api.getVerificationById(id)
    return normalizeVerification(res?.verification || res)
  },

  async approveVerification(id, notes = '') {
    const res = await api.approveVerification(id, notes)
    return normalizeVerification(res?.verification || res)
  },

  async rejectVerification(id, reason) {
    const res = await api.rejectVerification(id, reason, reason)
    return normalizeVerification(res?.verification || res)
  },

  /* -------------------------- Plans ------------------------------ */

  async getSubscriptions() {
    const res = await api.getPlans({ includeInactive: 'true' })
    return asArray(res?.plans).map(normalizePlan).filter(Boolean)
  },

  async saveSubscriptionPlan(plan) {
    const payload = {
      name: plan.name,
      nameHindi: plan.nameHindi || '',
      description: plan.description || '',
      tagline: plan.tagline || '',
      badge: plan.badge || '',
      monthlyPrice: Number(plan.price ?? plan.monthlyPrice ?? 0),
      quarterlyPrice: Number(plan.quarterlyPrice ?? 0),
      yearlyPrice: Number(plan.yearlyPrice ?? Number(plan.price ?? 0) * 12),
      discountPercent: Number(plan.discountPercent ?? 0),
      sortOrder: Number(plan.sortOrder ?? 0),
      features: asArray(plan.benefits),
      contactViewLimit: Number(plan.contactViewLimit ?? 0),
      interestSendLimit: Number(plan.interestSendLimit ?? 0),
      dailyMatchLimit: Number(plan.dailyMatchLimit ?? 5),
      verifiedPriority: Boolean(plan.verifiedPriority),
      chatAccess: Boolean(plan.chatAccess),
      relationshipManager: Boolean(plan.relationshipManager),
      profileBoost: Boolean(plan.profileBoost),
      isActive: plan.status !== 'Inactive',
    }

    const res = plan.id
      ? await api.updatePlan(plan.id, payload)
      : await api.createPlan(payload)

    return normalizePlan(res?.plan || res)
  },

  async deleteSubscriptionPlan(planId) {
    await api.deletePlan(planId)
    return true
  },

  async getSubscribers(params = {}) {
    const res = await api.getSubscriptions({ limit: 100, ...params })
    return itemsOf(res)
  },

  /* ------------------------- Payments ---------------------------- */

  async getPayments(params = {}) {
    const res = await api.getPayments({ limit: 100, ...params })
    return itemsOf(res).map(normalizePayment).filter(Boolean)
  },

  /* -------------------------- Banners ---------------------------- */

  async getBanners() {
    const res = await api.getBanners()
    return asArray(res?.banners).map(normalizeBanner).filter(Boolean)
  },

  async saveBanner(banner) {
    const payload = {
      title: banner.title,
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl,
      targetUrl: banner.linkTarget || '',
      isActive: banner.status !== 'Inactive',
      sortOrder: Number(banner.positionOrder || 0),
    }

    const res = banner.id
      ? await api.updateBanner(banner.id, payload)
      : await api.createBanner(payload)

    return normalizeBanner(res?.banner || res)
  },

  async deleteBanner(bannerId) {
    await api.deleteBanner(bannerId)
    return true
  },

  /* ----------------------- Static Content ------------------------ */

  /**
   * Collapses the keyed CMS pages into the flat object the content and legal
   * pages bind their textareas to.
   */
  async getStaticContent() {
    const res = await api.getCMSPages()
    const pages = asArray(res?.pages)
    const byKey = Object.fromEntries(pages.map((p) => [p.key, p]))

    const content = {}
    Object.entries(CMS_KEY_BY_FIELD).forEach(([field, key]) => {
      content[field] = byKey[key]?.content || ''
    })

    // FAQs are stored as structured points rather than free text.
    content.faqs = asArray(byKey.faqs?.points).map((p) => ({
      question: p.title || p.question || '',
      answer: p.description || p.answer || '',
    }))

    return content
  },

  /**
   * Writes back only the fields that changed. Each CMS page is a separate
   * document, so this fans out to one PUT per touched key.
   */
  async saveStaticContent(contentObj) {
    const writes = []

    Object.entries(CMS_KEY_BY_FIELD).forEach(([field, key]) => {
      if (contentObj[field] === undefined) return
      writes.push(
        api.updateCMSPage(key, {
          title: CMS_TITLE_BY_KEY[key],
          content: contentObj[field],
        })
      )
    })

    if (contentObj.faqs !== undefined) {
      writes.push(
        api.updateCMSPage('faqs', {
          title: CMS_TITLE_BY_KEY.faqs,
          content: 'Frequently asked questions',
          points: asArray(contentObj.faqs).map((f) => ({
            title: f.question,
            description: f.answer,
          })),
        })
      )
    }

    await Promise.all(writes)
    return contentObj
  },

  /* ------------------------ Complaints --------------------------- */

  async getComplaints(params = {}) {
    const res = await api.getComplaints({ limit: 100, ...params })
    return itemsOf(res).map(normalizeComplaint).filter(Boolean)
  },

  /**
   * Resolve a complaint. `resolutionAction` must be one of the values the API
   * accepts: Warning Sent | User Suspended | Profile Removed | Dismissed.
   * Choosing "User Suspended" also suspends the reported account server-side,
   * so callers must not issue a separate status update.
   */
  async resolveComplaint(complaintId, resolutionAction, adminNotes = '') {
    const res = await api.resolveComplaint(complaintId, resolutionAction, adminNotes)
    return normalizeComplaint(res?.complaint || res)
  },

  async getBlockHistory(params = {}) {
    const res = await api.getBlocks({ limit: 100, ...params })
    return itemsOf(res).map((b) => {
      const blocker =
        typeof b.blockerUserId === 'object' && b.blockerUserId !== null ? b.blockerUserId : null
      const blocked = typeof b.blockedUserId === 'object' && b.blockedUserId !== null ? b.blockedUserId : null
      const blockedProfile =
        typeof b.blockedProfileId === 'object' && b.blockedProfileId !== null ? b.blockedProfileId : null

      return {
        id: b.id || b._id,
        blockedByUserId: blocker?.id || blocker?._id || b.blockerUserId || '',
        blockedByName: blocker?.name || '',
        blockedUserId: blocked?.id || blocked?._id || b.blockedUserId || '',
        blockedUserName: blocked?.name || '',
        blockedProfileName: blockedProfile?.fullName || '',
        date: formatDateTime(b.createdAt),
        reason: b.reason || '',
      }
    })
  },

  /* -------------------- Featured Profiles ------------------------ */

  async toggleProfileFeatured(userId, profileId, isFeatured) {
    const res = await api.setProfileFeatured(profileId, isFeatured)
    return normalizeProfile(res?.profile || res)
  },

  async getMatchPairs(params = {}) {
    const res = await api.getMatchPairs({ limit: 100, ...params })
    return itemsOf(res).map((pair) => ({
      id: pair.id || pair._id,
      matchScore: pair.matchScore || 0,
      date: formatDate(pair.createdAt || pair.lastCalculatedAt),
      user1: {
        id: pair.profile?.profileId || pair.profile?.id || '',
        name: pair.profile?.fullName || '',
        gender: pair.profile?.gender || '',
        age: ageFromDob(pair.profile?.dob),
        gotra: pair.profile?.gotra || '',
        image: resolveAssetUrl(pair.profile?.profilePicture),
        accountName: pair.profile?.ownerName || '',
      },
      user2: {
        id: pair.matchedProfile?.profileId || pair.matchedProfile?.id || '',
        name: pair.matchedProfile?.fullName || '',
        gender: pair.matchedProfile?.gender || '',
        age: ageFromDob(pair.matchedProfile?.dob),
        gotra: pair.matchedProfile?.gotra || '',
        image: resolveAssetUrl(pair.matchedProfile?.profilePicture),
        accountName: pair.matchedProfile?.ownerName || '',
      },
    }))
  },

  /* ------------------------- Dashboard --------------------------- */

  async getDashboardMetrics() {
    const res = await api.getDashboardMetrics()
    const k = res?.kpis || res || {}

    return {
      totalUsers: k.totalUsers || 0,
      activeUsers: k.activeUsers || 0,
      suspendedUsers: k.suspendedUsers || 0,
      pendingVerifications: k.pendingVerifications || 0,
      totalProfiles: k.totalProfiles || k.totalCandidateProfiles || 0,
      verifiedProfiles: k.verifiedProfiles || 0,
      dailyMatches: k.dailyMatches || 0,
      revenue: k.totalRevenue || 0,
      activeSubscriptions: k.activeSubscriptions || 0,
      pendingComplaints: k.pendingComplaints || 0,
    }
  },

  /* -------------------------- Audit ------------------------------ */

  async getAuditLogs(params = {}) {
    const res = await api.getAuditLogs({ limit: 100, ...params })
    return itemsOf(res).map(normalizeAuditLog).filter(Boolean)
  },
}

export default adminDataService
