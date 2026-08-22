/**
 * Application-wide Constants and Enums
 * Agrawal Matrimony Platform
 */

const AGARWAL_GOTRAS = [
  { id: 1, english: 'Garg', hindi: 'गर्ग', sage: 'Garga' },
  { id: 2, english: 'Goyal', hindi: 'गोयल', sage: 'Gobhil', aliases: ['Goel'] },
  { id: 3, english: 'Bansal', hindi: 'बंसल', sage: 'Vatsa' },
  { id: 4, english: 'Bindal', hindi: 'बिंदल', sage: 'Vashistha' },
  { id: 5, english: 'Mittal', hindi: 'मित्तल', sage: 'Maitreya' },
  { id: 6, english: 'Singhal', hindi: 'सिंघल', sage: 'Shringi' },
  { id: 7, english: 'Jindal', hindi: 'जिंदल', sage: 'Jaimini' },
  { id: 8, english: 'Tingal', hindi: 'तिंगल', sage: 'Tandya' },
  { id: 9, english: 'Tayal', hindi: 'तायल', sage: 'Tittira' },
  { id: 10, english: 'Airan', hindi: 'ऐरन', sage: 'Aurva' },
  { id: 11, english: 'Dharan', hindi: 'धारण', sage: 'Dhaumya' },
  { id: 12, english: 'Madhukul', hindi: 'मधुकुल', sage: 'Mudgala' },
  { id: 13, english: 'Goyan', hindi: 'गोयन', sage: 'Gautama', aliases: ['Dhingan'] },
  { id: 14, english: 'Kuchhal', hindi: 'कुच्छल', sage: 'Kashyapa', aliases: ['Kushal'] },
  { id: 15, english: 'Kansal', hindi: 'कंसल', sage: 'Kaushik' },
  { id: 16, english: 'Nangal', hindi: 'नांगल', sage: 'Nagendra', aliases: ['Nagal'] },
  { id: 17, english: 'Mangal', hindi: 'मंगल', sage: 'Mandavya' },
  { id: 18, english: 'Bhandal', hindi: 'भंदल', sage: 'Bharadwaj' }
];

const GOTRA_NAMES_EN = AGARWAL_GOTRAS.map(g => g.english);

const ACCOUNT_STATUS = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  // Self-service pause. Unlike Suspended (an admin action) the user can undo
  // this themselves simply by logging back in.
  DEACTIVATED: 'Deactivated'
};

const VERIFICATION_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

const ADMIN_ROLES = {
  SUPER_ADMIN: 'Super Admin',
  MODERATOR: 'Moderator'
};

const SUBSCRIPTION_STATUS = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
  FREE: 'Free'
};

// These must stay in sync with the `name` field of the plans seeded in
// scripts/seedPlans.js — subscriptionPlan is a display string copied from
// Plan.name at purchase time (see services/paymentService.js), not an enum.
const SUBSCRIPTION_PLANS = {
  FREE: 'Free',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
  DIAMOND: 'Diamond'
};

const MANGLIK_STATUS = {
  NON_MANGLIK: 'Non-Manglik',
  MANGLIK: 'Manglik',
  ANSHIK_MANGLIK: 'Anshik Manglik',
  DONT_KNOW: "Don't Know"
};

const GENDER = {
  MALE: 'Male',
  FEMALE: 'Female'
};

const MARITAL_STATUS = {
  NEVER_MARRIED: 'Never Married',
  DIVORCED: 'Divorced',
  WIDOWED: 'Widowed',
  AWAITING_DIVORCE: 'Awaiting Divorce'
};

const RELATIVE_RELATION_TYPES = [
  'Brother',
  'Sister',
  'Tauji',
  'Chacha',
  'Buaji',
  'Mamaji',
  'Masiji'
];

const RELATIVE_MARITAL_STATUS = {
  UNMARRIED: 'Unmarried',
  MARRIED: 'Married'
};

const FATHER_OCCUPATION = [
  'Business',
  'Private Job',
  'Govt Job',
  'Retired',
  'Not Employed'
];

const GOVT_ID_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Passport',
  'Voter ID',
  'Driving License'
];

const VERIFICATION_REJECTION_REASONS = [
  'Blurred / Unreadable Document',
  'Name Mismatch on Identity Record',
  'Expired Identity Proof',
  'Invalid Professional Degree/Certificate',
  'Fraudulent Document Image'
];

const COMPLAINT_CATEGORIES = [
  'Fake Profile',
  'Abuse',
  'Inappropriate Content',
  'Harassment',
  'Spam',
  'Financial Scam / Fraud',
  'Misrepresentation of Gotra / Family'
];

const INTEREST_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled'
};

const BLOCK_REASONS = [
  'Inappropriate Behavior',
  'Spam/Fake Profile',
  'Harassment',
  'Not Interested',
  'Other'
];

/**
 * Notification types. `category` groups them for the UI filter tabs
 * (All / Matches / Interests / Messages) and `preference` names the user
 * preference flag that gates delivery.
 */
const NOTIFICATION_TYPES = {
  INTEREST_RECEIVED: 'InterestReceived',
  INTEREST_ACCEPTED: 'InterestAccepted',
  INTEREST_DECLINED: 'InterestDeclined',
  PROFILE_VISITED: 'ProfileVisited',
  NEW_MATCH: 'NewMatch',
  MESSAGE_RECEIVED: 'MessageReceived',
  VERIFICATION_APPROVED: 'VerificationApproved',
  VERIFICATION_REJECTED: 'VerificationRejected',
  PAYMENT_SUCCESS: 'PaymentSuccess',
  SUBSCRIPTION_EXPIRING: 'SubscriptionExpiring',
  PROFILE_INCOMPLETE: 'ProfileIncomplete',
  SYSTEM: 'System'
};

const NOTIFICATION_CATEGORIES = ['All', 'Matches', 'Interests', 'Messages', 'Account'];

const NOTIFICATION_META = {
  [NOTIFICATION_TYPES.INTEREST_RECEIVED]: { category: 'Interests', preference: 'interestAlerts' },
  [NOTIFICATION_TYPES.INTEREST_ACCEPTED]: { category: 'Interests', preference: 'interestAlerts' },
  [NOTIFICATION_TYPES.INTEREST_DECLINED]: { category: 'Interests', preference: 'interestAlerts' },
  [NOTIFICATION_TYPES.PROFILE_VISITED]: { category: 'Matches', preference: 'newMatchAlerts' },
  [NOTIFICATION_TYPES.NEW_MATCH]: { category: 'Matches', preference: 'newMatchAlerts' },
  [NOTIFICATION_TYPES.MESSAGE_RECEIVED]: { category: 'Messages', preference: 'messageAlerts' },
  [NOTIFICATION_TYPES.VERIFICATION_APPROVED]: { category: 'Account', preference: null },
  [NOTIFICATION_TYPES.VERIFICATION_REJECTED]: { category: 'Account', preference: null },
  [NOTIFICATION_TYPES.PAYMENT_SUCCESS]: { category: 'Account', preference: null },
  [NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING]: { category: 'Account', preference: null },
  [NOTIFICATION_TYPES.PROFILE_INCOMPLETE]: { category: 'Account', preference: null },
  [NOTIFICATION_TYPES.SYSTEM]: { category: 'Account', preference: null }
};

module.exports = {
  AGARWAL_GOTRAS,
  GOTRA_NAMES_EN,
  ACCOUNT_STATUS,
  VERIFICATION_STATUS,
  USER_ROLES,
  ADMIN_ROLES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_PLANS,
  MANGLIK_STATUS,
  GENDER,
  MARITAL_STATUS,
  RELATIVE_RELATION_TYPES,
  RELATIVE_MARITAL_STATUS,
  FATHER_OCCUPATION,
  GOVT_ID_TYPES,
  VERIFICATION_REJECTION_REASONS,
  COMPLAINT_CATEGORIES,
  INTEREST_STATUS,
  BLOCK_REASONS,
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_META
};

