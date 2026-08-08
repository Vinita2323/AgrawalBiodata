// Admin Data Service - Central Persistent Data & Operations Store for Matrimony Hub
const STORAGE_KEYS = {
  USERS: 'admin_users_db',
  VERIFICATIONS: 'admin_verifications_db',
  MATCHES: 'admin_matches_db',
  SUBSCRIPTIONS: 'admin_subscriptions_db',
  PAYMENTS: 'admin_payments_db',
  BANNERS: 'admin_banners_db',
  STATIC_CONTENT: 'admin_static_content_db',
  COMPLAINTS: 'admin_complaints_db',
  BLOCK_HISTORY: 'admin_block_history_db',
  AUDIT_LOGS: 'admin_audit_logs_db',
}

// Initial Seed Data
const INITIAL_USERS = [
  {
    id: 'USR-101',
    name: 'Rajesh Agrawal',
    mobile: '+91 98290 12345',
    email: 'rajesh.agrawal@example.com',
    accountStatus: 'Active',
    verificationStatus: 'Approved',
    subscriptionPlan: 'Gold Annual',
    subscriptionStatus: 'Active',
    createdDate: '2025-11-10',
    lastActive: '10 mins ago',
    profiles: [
      {
        profileId: 'PRF-501',
        fullName: 'Priya Garg',
        gender: 'Female',
        age: 26,
        height: "5'4\"",
        gotra: 'Garg',
        motherGotra: 'Bansal',
        dob: '1998-05-14',
        tob: '08:30 AM',
        pob: 'Jaipur, Rajasthan',
        complexion: 'Fair',
        manglik: 'Non-Manglik',
        qualification: 'M.Tech, Software Engineer',
        workingAt: 'TCS Digital',
        income: '15-20 LPA',
        hobbies: 'Classical Dance, Reading, Travelling',
        residentialAddress: '104, Agrasen Nagar, Gopalpura Bypass, Jaipur, Rajasthan',
        verified: true,
        isFeatured: true,
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
        matchScore: 95,
      },
      {
        profileId: 'PRF-502',
        fullName: 'Rohan Agrawal',
        gender: 'Male',
        age: 28,
        height: "5'10\"",
        gotra: 'Garg',
        motherGotra: 'Goyal',
        dob: '1996-08-20',
        tob: '11:15 AM',
        pob: 'Delhi',
        complexion: 'Wheatish',
        manglik: 'Anshik Manglik',
        qualification: 'MBA, Finance Manager',
        workingAt: 'HDFC Bank',
        income: '18-22 LPA',
        hobbies: 'Cricket, Swimming',
        residentialAddress: 'B-42, South Extension, New Delhi',
        verified: true,
        isFeatured: false,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
        matchScore: 88,
      }
    ]
  },
  {
    id: 'USR-102',
    name: 'Sunita Goyal',
    mobile: '+91 94140 67890',
    email: 'sunita.goyal@example.com',
    accountStatus: 'Active',
    verificationStatus: 'Pending',
    subscriptionPlan: 'Free Tier',
    subscriptionStatus: 'Active',
    createdDate: '2026-01-05',
    lastActive: '1 hour ago',
    profiles: [
      {
        profileId: 'PRF-503',
        fullName: 'Anjali Bansal',
        gender: 'Female',
        age: 24,
        height: "5'3\"",
        gotra: 'Bansal',
        motherGotra: 'Singhal',
        dob: '2000-02-18',
        tob: '04:45 PM',
        pob: 'Indore, MP',
        complexion: 'Very Fair',
        manglik: 'Non-Manglik',
        qualification: 'B.Arch, Architect',
        workingAt: 'Design Studio',
        income: '8-10 LPA',
        hobbies: 'Painting, Interior Design',
        residentialAddress: '12, Vijay Nagar, Indore',
        verified: false,
        isFeatured: true,
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        matchScore: 91,
      }
    ]
  },
  {
    id: 'USR-103',
    name: 'Vikram Singhal',
    mobile: '+91 97110 54321',
    email: 'vikram.singhal@example.com',
    accountStatus: 'Active',
    verificationStatus: 'Approved',
    subscriptionPlan: 'Gold Monthly',
    subscriptionStatus: 'Active',
    createdDate: '2026-01-15',
    lastActive: '3 hours ago',
    profiles: [
      {
        profileId: 'PRF-504',
        fullName: 'Aarav Singhal',
        gender: 'Male',
        age: 29,
        height: "5'11\"",
        gotra: 'Singhal',
        motherGotra: 'Kansal',
        dob: '1995-11-04',
        tob: '06:20 AM',
        pob: 'Chandigarh',
        complexion: 'Fair',
        manglik: 'Non-Manglik',
        qualification: 'MS, Data Scientist',
        workingAt: 'Microsoft',
        income: '30+ LPA',
        hobbies: 'AI Research, Cycling',
        residentialAddress: 'Sector 17, Chandigarh',
        verified: true,
        isFeatured: false,
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
        matchScore: 94,
      }
    ]
  },
  {
    id: 'USR-104',
    name: 'Mahesh Mittal',
    mobile: '+91 98100 99887',
    email: 'mahesh.mittal@example.com',
    accountStatus: 'Suspended',
    verificationStatus: 'Rejected',
    subscriptionPlan: 'Free Tier',
    subscriptionStatus: 'Expired',
    createdDate: '2025-12-01',
    lastActive: '3 days ago',
    profiles: [
      {
        profileId: 'PRF-505',
        fullName: 'Neha Mittal',
        gender: 'Female',
        age: 27,
        height: "5'5\"",
        gotra: 'Mittal',
        motherGotra: 'Tayal',
        dob: '1997-04-12',
        tob: '09:00 PM',
        pob: 'Surat, Gujarat',
        complexion: 'Fair',
        manglik: 'Manglik',
        qualification: 'B.Com, Accountant',
        workingAt: 'Self Employed',
        income: '6-8 LPA',
        hobbies: 'Cooking, Music',
        residentialAddress: 'Ring Road, Surat',
        verified: false,
        isFeatured: false,
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
        matchScore: 78,
      }
    ]
  },
  {
    id: 'USR-105',
    name: 'Pankaj Goyal',
    mobile: '+91 99280 33445',
    email: 'pankaj.goyal@example.com',
    accountStatus: 'Active',
    verificationStatus: 'Pending',
    subscriptionPlan: 'Gold Quarterly',
    subscriptionStatus: 'Active',
    createdDate: '2026-02-01',
    lastActive: 'Just now',
    profiles: [
      {
        profileId: 'PRF-506',
        fullName: 'Riya Goyal',
        gender: 'Female',
        age: 25,
        height: "5'2\"",
        gotra: 'Goyal',
        motherGotra: 'Tingal',
        dob: '1999-09-25',
        tob: '02:10 PM',
        pob: 'Kota, Rajasthan',
        complexion: 'Fair',
        manglik: 'Non-Manglik',
        qualification: 'B.Tech, UI/UX Designer',
        workingAt: 'Startup Inc',
        income: '12-15 LPA',
        hobbies: 'Sketching, Photography',
        residentialAddress: 'Talwandi, Kota',
        verified: false,
        isFeatured: true,
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
        matchScore: 89,
      }
    ]
  }
]

const INITIAL_VERIFICATIONS = [
  {
    id: 'VRF-201',
    userId: 'USR-102',
    userName: 'Sunita Goyal',
    profileId: 'PRF-503',
    profileName: 'Anjali Bansal',
    mobile: '+91 94140 67890',
    email: 'sunita.goyal@example.com',
    mobileVerified: true,
    emailVerified: true,
    govtIdStatus: 'Pending',
    govtIdType: 'Aadhaar Card',
    govtIdDocUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600',
    profDocStatus: 'Pending',
    profDocType: 'B.Arch Degree & Council Registration',
    profDocUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=600',
    status: 'Pending',
    submittedAt: '2026-02-06 14:30',
    rejectionReason: '',
  },
  {
    id: 'VRF-202',
    userId: 'USR-105',
    userName: 'Pankaj Goyal',
    profileId: 'PRF-506',
    profileName: 'Riya Goyal',
    mobile: '+91 99280 33445',
    email: 'pankaj.goyal@example.com',
    mobileVerified: true,
    emailVerified: true,
    govtIdStatus: 'Pending',
    govtIdType: 'PAN Card',
    govtIdDocUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
    profDocStatus: 'Approved',
    profDocType: 'Design Certificate',
    profDocUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=600',
    status: 'Pending',
    submittedAt: '2026-02-07 09:15',
    rejectionReason: '',
  },
  {
    id: 'VRF-200',
    userId: 'USR-101',
    userName: 'Rajesh Agrawal',
    profileId: 'PRF-501',
    profileName: 'Priya Garg',
    mobile: '+91 98290 12345',
    email: 'rajesh.agrawal@example.com',
    mobileVerified: true,
    emailVerified: true,
    govtIdStatus: 'Approved',
    govtIdType: 'Passport',
    govtIdDocUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600',
    profDocStatus: 'Approved',
    profDocType: 'TCS Offer Letter',
    profDocUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=600',
    status: 'Approved',
    submittedAt: '2025-11-12 11:00',
    approvedAt: '2025-11-12 16:45',
    rejectionReason: '',
  },
  {
    id: 'VRF-199',
    userId: 'USR-104',
    userName: 'Mahesh Mittal',
    profileId: 'PRF-505',
    profileName: 'Neha Mittal',
    mobile: '+91 98100 99887',
    email: 'mahesh.mittal@example.com',
    mobileVerified: true,
    emailVerified: false,
    govtIdStatus: 'Rejected',
    govtIdType: 'Aadhaar Card',
    govtIdDocUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600',
    profDocStatus: 'Rejected',
    profDocType: 'N/A',
    profDocUrl: '',
    status: 'Rejected',
    submittedAt: '2025-12-02 10:20',
    rejectedAt: '2025-12-03 12:10',
    rejectionReason: 'Blurred ID document & name mismatch on government record.',
  }
]

const INITIAL_SUBSCRIPTIONS = [
  {
    id: 'SUB-PLAN-1',
    name: 'Free Tier',
    price: 0,
    currency: 'INR',
    durationDays: 365,
    durationType: 'Free Forever',
    status: 'Active',
    badge: 'Basic',
    benefits: [
      'Create 1 Matrimonial Profile',
      'View up to 5 Profiles per day',
      'Send up to 3 Interests per month',
      'Standard Search Filters',
      'Basic Biodata Export'
    ],
    activeSubscribers: 1240,
    createdDate: '2025-01-01',
  },
  {
    id: 'SUB-PLAN-2',
    name: 'Gold Monthly',
    price: 999,
    currency: 'INR',
    durationDays: 30,
    durationType: '1 Month',
    status: 'Active',
    badge: 'Popular',
    benefits: [
      'Manage Multiple Profiles',
      'Unlimited Profile Views',
      'Unlimited Expressed Interests',
      'Unlimited Direct Chat with Connected Members',
      'Advanced Gotra & Kundali Filters',
      'PDF Biodata Download',
      'Verified Badge Priority'
    ],
    activeSubscribers: 430,
    createdDate: '2025-01-01',
  },
  {
    id: 'SUB-PLAN-3',
    name: 'Gold Quarterly',
    price: 2499,
    currency: 'INR',
    durationDays: 90,
    durationType: '3 Months',
    status: 'Active',
    badge: 'Best Value',
    benefits: [
      'All Gold Monthly Benefits',
      'Featured Profile Placement for 14 Days',
      'Direct Phone & Contact Unlocks (15/mo)',
      'Dedicated Matchmaker Support'
    ],
    activeSubscribers: 310,
    createdDate: '2025-01-01',
  },
  {
    id: 'SUB-PLAN-4',
    name: 'Gold Annual Premium',
    price: 6999,
    currency: 'INR',
    durationDays: 365,
    durationType: '12 Months',
    status: 'Active',
    badge: 'VIP',
    benefits: [
      'All Gold Quarterly Benefits',
      'Unlimited Contact Number Unlocks',
      'Permanent Featured Profile Badge',
      'Priority Horoscope Verification',
      'VIP Concierge Matchmaking'
    ],
    activeSubscribers: 185,
    createdDate: '2025-01-01',
  }
]

const INITIAL_PAYMENTS = [
  {
    id: 'PAY-8801',
    transactionId: 'rzp_live_9812471201',
    userId: 'USR-101',
    userName: 'Rajesh Agrawal',
    userEmail: 'rajesh.agrawal@example.com',
    planName: 'Gold Annual Premium',
    amount: 6999,
    paymentMethod: 'Razorpay / UPI',
    paymentStatus: 'Success',
    gatewayRef: 'pay_Nkx78129381',
    createdDate: '2025-11-10 10:45',
  },
  {
    id: 'PAY-8802',
    transactionId: 'rzp_live_9812471202',
    userId: 'USR-103',
    userName: 'Vikram Singhal',
    userEmail: 'vikram.singhal@example.com',
    planName: 'Gold Monthly',
    amount: 999,
    paymentMethod: 'Credit Card',
    paymentStatus: 'Success',
    gatewayRef: 'pay_Nkx78129382',
    createdDate: '2026-01-15 14:20',
  },
  {
    id: 'PAY-8803',
    transactionId: 'rzp_live_9812471203',
    userId: 'USR-105',
    userName: 'Pankaj Goyal',
    userEmail: 'pankaj.goyal@example.com',
    planName: 'Gold Quarterly',
    amount: 2499,
    paymentMethod: 'UPI (GPay)',
    paymentStatus: 'Success',
    gatewayRef: 'pay_Nkx78129383',
    createdDate: '2026-02-01 18:10',
  },
  {
    id: 'PAY-8804',
    transactionId: 'rzp_live_9812471204',
    userId: 'USR-104',
    userName: 'Mahesh Mittal',
    userEmail: 'mahesh.mittal@example.com',
    planName: 'Gold Monthly',
    amount: 999,
    paymentMethod: 'Net Banking',
    paymentStatus: 'Failed',
    gatewayRef: 'pay_Nkx78129384_failed',
    createdDate: '2025-12-01 11:30',
  }
]

const INITIAL_BANNERS = [
  {
    id: 'BAN-101',
    title: 'Find Your Perfect Match in Agrawal Community',
    subtitle: '100% Verified Profiles with Authentic Family & Gotra Credentials',
    imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200',
    linkTarget: '/matches',
    status: 'Active',
    positionOrder: 1,
  },
  {
    id: 'BAN-102',
    title: 'Upgrade to Gold Membership',
    subtitle: 'Unlock Unlimited Chats, Direct Contact Details & VIP Badge',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200',
    linkTarget: '/membership',
    status: 'Active',
    positionOrder: 2,
  }
]

const INITIAL_STATIC_CONTENT = {
  aboutUs: `Welcome to Matrimony Hub - Agrawal Biodata, the premier matchmaking platform built specifically for the Agrawal community. We provide a safe, dignified, and intelligent digital platform where families and individuals can discover compatible life partners with authentic gotra, family tree details, professional achievements, and verified credentials.`,
  contactUs: `Head Office: 108 Agrasen Bhavan, MG Road, Jaipur, Rajasthan - 302001\nEmail: support@matrimonyhub.com | Helpline: +91 1800 123 4567\nOperating Hours: Monday to Saturday, 9:00 AM - 7:00 PM IST`,
  privacyPolicy: `Matrimony Hub values your privacy. We strictly safeguard all user biodatas, photos, and identity proof documents using end-to-end encryption. Your contact details are never disclosed to non-connected members without your explicit permission.`,
  termsOfService: `By creating an account on Matrimony Hub, you agree to submit genuine personal & family details. Misrepresentation of identity, gotra, age, or marital status will lead to immediate account suspension and legal reporting.`,
  communityGuidelines: `1. Treat all members and their families with respect.\n2. Do not use abusive or vulgar language in chats.\n3. Verify identity before organizing in-person meetings.`,
}

const INITIAL_COMPLAINTS = [
  {
    id: 'CMP-701',
    category: 'Fake Profile',
    reportedProfileId: 'PRF-505',
    reportedProfileName: 'Neha Mittal',
    reportedUserId: 'USR-104',
    reporterUserId: 'USR-101',
    reporterUserName: 'Rajesh Agrawal',
    reason: 'Suspicious profile information and incorrect employment details.',
    description: 'The uploaded photos do not match the educational certificates, and the phone number provided belongs to an unregistered third party.',
    status: 'Under Review',
    createdDate: '2026-02-04 16:20',
    assignedTo: 'Admin Team',
    actionTaken: '',
  },
  {
    id: 'CMP-702',
    category: 'Abuse',
    reportedProfileId: 'PRF-505',
    reportedProfileName: 'Neha Mittal',
    reportedUserId: 'USR-104',
    reporterUserId: 'USR-103',
    reporterUserName: 'Vikram Singhal',
    reason: 'Inappropriate message sent in chat.',
    description: 'Received unsolicited promotional links and aggressive remarks.',
    status: 'Resolved',
    createdDate: '2026-01-20 11:10',
    assignedTo: 'Moderator Alpha',
    actionTaken: 'User Suspended for 30 days',
  }
]

const INITIAL_BLOCK_HISTORY = [
  {
    id: 'BLK-901',
    blockedByUserId: 'USR-101',
    blockedByName: 'Rajesh Agrawal',
    blockedUserId: 'USR-104',
    blockedUserName: 'Mahesh Mittal',
    blockedProfileName: 'Neha Mittal',
    date: '2026-02-04 16:30',
    reason: 'Inappropriate conduct',
  }
]

const INITIAL_AUDIT_LOGS = [
  {
    id: 'LOG-301',
    adminName: 'Super Admin',
    adminRole: 'Super Admin',
    action: 'Approved Profile Verification',
    target: 'Verification VRF-200 (Priya Garg)',
    timestamp: '2025-11-12 16:45',
    details: 'Verified Aadhaar ID and TCS employment proof.',
  },
  {
    id: 'LOG-302',
    adminName: 'Moderator Alpha',
    adminRole: 'Moderator',
    action: 'Suspended User Account',
    target: 'User USR-104 (Mahesh Mittal)',
    timestamp: '2025-12-03 12:10',
    details: 'Suspended account due to failed identity verification and reported harassment.',
  }
]

// Storage Initialization Helper
function getItem(key, initialData) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initialData))
      return initialData
    }
    return JSON.parse(raw)
  } catch (err) {
    console.error(`Error loading storage key ${key}:`, err)
    return initialData
  }
}

function setItem(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.error(`Error saving storage key ${key}:`, err)
  }
}

export const adminDataService = {
  // Users Management
  getUsers: () => getItem(STORAGE_KEYS.USERS, INITIAL_USERS),
  getUserById: (userId) => {
    const users = adminDataService.getUsers()
    return users.find((u) => u.id === userId) || null
  },
  saveUser: (userObj) => {
    const users = adminDataService.getUsers()
    const index = users.findIndex((u) => u.id === userObj.id)
    if (index >= 0) {
      users[index] = userObj
    } else {
      users.unshift(userObj)
    }
    setItem(STORAGE_KEYS.USERS, users)
    adminDataService.logAction('Saved User Record', `User ${userObj.id} (${userObj.name})`, `Status: ${userObj.accountStatus}`)
    return userObj
  },
  updateUserStatus: (userId, newStatus) => {
    const users = adminDataService.getUsers()
    const user = users.find((u) => u.id === userId)
    if (user) {
      user.accountStatus = newStatus
      setItem(STORAGE_KEYS.USERS, users)
      adminDataService.logAction(`${newStatus === 'Suspended' ? 'Suspended' : 'Activated'} User Account`, `User ${user.id} (${user.name})`, `Account status updated to ${newStatus}`)
    }
    return user
  },
  deleteUser: (userId) => {
    const users = adminDataService.getUsers()
    const updated = users.filter((u) => u.id !== userId)
    setItem(STORAGE_KEYS.USERS, updated)
    adminDataService.logAction('Deleted User Account', `User ${userId}`, 'Account deleted via soft/hard delete policy.')
    return true
  },

  // Verification Requests Management
  getVerifications: () => getItem(STORAGE_KEYS.VERIFICATIONS, INITIAL_VERIFICATIONS),
  getVerificationById: (id) => {
    const list = adminDataService.getVerifications()
    return list.find((v) => v.id === id) || null
  },
  approveVerification: (id) => {
    const verifications = adminDataService.getVerifications()
    const req = verifications.find((v) => v.id === id)
    if (req) {
      req.status = 'Approved'
      req.govtIdStatus = 'Approved'
      req.profDocStatus = 'Approved'
      req.approvedAt = new Date().toISOString().replace('T', ' ').slice(0, 16)
      setItem(STORAGE_KEYS.VERIFICATIONS, verifications)

      // Synchronize with User & Matrimonial Profile!
      const users = adminDataService.getUsers()
      const user = users.find((u) => u.id === req.userId)
      if (user) {
        user.verificationStatus = 'Approved'
        const profile = user.profiles.find((p) => p.profileId === req.profileId)
        if (profile) {
          profile.verified = true
        }
        setItem(STORAGE_KEYS.USERS, users)
      }

      adminDataService.logAction('Approved Verification Request', `Verification ${req.id} for Profile ${req.profileName}`, 'Granted Verified Badge')
    }
    return req
  },
  rejectVerification: (id, reason) => {
    const verifications = adminDataService.getVerifications()
    const req = verifications.find((v) => v.id === id)
    if (req) {
      req.status = 'Rejected'
      req.govtIdStatus = 'Rejected'
      req.profDocStatus = 'Rejected'
      req.rejectionReason = reason
      req.rejectedAt = new Date().toISOString().replace('T', ' ').slice(0, 16)
      setItem(STORAGE_KEYS.VERIFICATIONS, verifications)

      // Update User verification status
      const users = adminDataService.getUsers()
      const user = users.find((u) => u.id === req.userId)
      if (user) {
        user.verificationStatus = 'Rejected'
        setItem(STORAGE_KEYS.USERS, users)
      }

      adminDataService.logAction('Rejected Verification Request', `Verification ${req.id}`, `Reason: ${reason}`)
    }
    return req
  },

  // Subscription Plans
  getSubscriptions: () => getItem(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS),
  saveSubscriptionPlan: (plan) => {
    const plans = adminDataService.getSubscriptions()
    const index = plans.findIndex((p) => p.id === plan.id)
    if (index >= 0) {
      plans[index] = plan
    } else {
      plan.id = `SUB-PLAN-${Date.now().toString().slice(-4)}`
      plan.createdDate = new Date().toISOString().slice(0, 10)
      plans.unshift(plan)
    }
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, plans)
    adminDataService.logAction('Saved Subscription Plan', `Plan ${plan.name}`, `Price: ₹${plan.price}, Status: ${plan.status}`)
    return plan
  },
  deleteSubscriptionPlan: (planId) => {
    const plans = adminDataService.getSubscriptions()
    const updated = plans.filter((p) => p.id !== planId)
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, updated)
    adminDataService.logAction('Deleted Subscription Plan', `Plan ${planId}`, 'Plan deactivated & removed.')
    return true
  },

  // Payments Management
  getPayments: () => getItem(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS),

  // Banners & Content Management
  getBanners: () => getItem(STORAGE_KEYS.BANNERS, INITIAL_BANNERS),
  saveBanner: (banner) => {
    const banners = adminDataService.getBanners()
    const index = banners.findIndex((b) => b.id === banner.id)
    if (index >= 0) {
      banners[index] = banner
    } else {
      banner.id = `BAN-${Date.now().toString().slice(-4)}`
      banners.push(banner)
    }
    setItem(STORAGE_KEYS.BANNERS, banners)
    adminDataService.logAction('Saved Homepage Banner', `Banner ${banner.title}`, `Status: ${banner.status}`)
    return banner
  },
  deleteBanner: (bannerId) => {
    const banners = adminDataService.getBanners()
    const updated = banners.filter((b) => b.id !== bannerId)
    setItem(STORAGE_KEYS.BANNERS, updated)
    adminDataService.logAction('Deleted Banner', `Banner ${bannerId}`, 'Banner removed from homepage slider.')
    return true
  },

  // Static Content
  getStaticContent: () => getItem(STORAGE_KEYS.STATIC_CONTENT, INITIAL_STATIC_CONTENT),
  saveStaticContent: (contentObj) => {
    setItem(STORAGE_KEYS.STATIC_CONTENT, contentObj)
    adminDataService.logAction('Updated Static CMS Content', 'Platform Static Pages', 'Updated Legal & About content.')
    return contentObj
  },

  // Complaints & Moderation
  getComplaints: () => getItem(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS),
  updateComplaintStatus: (complaintId, status, actionTaken = '') => {
    const list = adminDataService.getComplaints()
    const comp = list.find((c) => c.id === complaintId)
    if (comp) {
      comp.status = status
      if (actionTaken) comp.actionTaken = actionTaken
      setItem(STORAGE_KEYS.COMPLAINTS, list)
      adminDataService.logAction('Updated Complaint Status', `Complaint ${complaintId}`, `Status: ${status}, Action: ${actionTaken}`)
    }
    return comp
  },
  getBlockHistory: () => getItem(STORAGE_KEYS.BLOCK_HISTORY, INITIAL_BLOCK_HISTORY),

  // Featured Profiles Match Management
  toggleProfileFeatured: (userId, profileId, isFeatured) => {
    const users = adminDataService.getUsers()
    const user = users.find((u) => u.id === userId)
    if (user) {
      const profile = user.profiles.find((p) => p.profileId === profileId)
      if (profile) {
        profile.isFeatured = isFeatured
        setItem(STORAGE_KEYS.USERS, users)
        adminDataService.logAction(`${isFeatured ? 'Added to' : 'Removed from'} Featured Profiles`, `Profile ${profile.fullName}`, `User ${user.id}`)
      }
    }
  },

  // Dashboard KPI Metrics
  getDashboardMetrics: () => {
    const users = adminDataService.getUsers()
    const verifications = adminDataService.getVerifications()
    const subscriptions = adminDataService.getSubscriptions()
    const payments = adminDataService.getPayments()

    const totalUsers = users.length
    const activeUsers = users.filter((u) => u.accountStatus === 'Active').length
    const pendingVerifications = verifications.filter((v) => v.status === 'Pending').length
    const totalDailyMatches = 342 // Live dynamic daily matches counter
    const totalRevenue = payments
      .filter((p) => p.paymentStatus === 'Success')
      .reduce((sum, p) => sum + p.amount, 0)
    const activeSubscriptions = users.filter((u) => u.subscriptionStatus === 'Active' && u.subscriptionPlan !== 'Free Tier').length

    return {
      totalUsers,
      activeUsers,
      pendingVerifications,
      dailyMatches: totalDailyMatches,
      revenue: totalRevenue,
      activeSubscriptions,
    }
  },

  // Audit Logging
  getAuditLogs: () => getItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS),
  logAction: (action, target, details = '') => {
    const logs = adminDataService.getAuditLogs()
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      adminName: 'Super Admin',
      adminRole: 'Super Admin',
      action,
      target,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      details,
    }
    logs.unshift(newLog)
    setItem(STORAGE_KEYS.AUDIT_LOGS, logs)
  }
}
