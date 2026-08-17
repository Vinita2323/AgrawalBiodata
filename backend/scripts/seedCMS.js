/**
 * CMS Pages & Banners Seeder
 * Agrawal Matrimony Platform
 */

const { CMSPage, Banner } = require('../models/CMS');
const { connectDB, disconnectDB } = require('../config/db');
const logger = require('../utils/logger');

const defaultPages = [
  {
    key: 'about-us',
    title: 'About Agrawal Matrimony',
    metaDescription: 'Discover the premier matrimonial portal dedicated to Agrawal and Vaishya families.',
    content: 'Agrawal Matrimony is the dedicated matrimonial platform connecting Agrawal and Vaishya families across India and globally, preserving cultural heritage and Gotra traditions.',
    points: [
      { title: '18 Authentic Gotras', description: 'Honoring the historic 18 Gotras established by Maharaja Agrasen.' },
      { title: '100% KYC Verified Profiles', description: 'Rigorous multi-point identity and profession verification.' },
      { title: 'Privacy & Family Respect', description: 'Discrete contact masking and member-only photo protection.' }
    ],
    isActive: true
  },
  {
    key: 'privacy-policy',
    title: 'Privacy Policy',
    metaDescription: 'Read how Agrawal Matrimony protects your personal information and documents.',
    content: 'We are committed to safeguarding the personal biodata, photographs, and contact information of our community members.',
    points: [
      { title: 'Data Encryption', description: 'All sensitive data and documents are stored with bank-grade encryption.' },
      { title: 'Contact Sharing Control', description: 'Your phone number is only shared with mutual matches you approve.' },
      { title: 'KYC Document Protection', description: 'Identity proofs are used exclusively for verification and never published.' }
    ],
    isActive: true
  },
  {
    key: 'terms-of-service',
    title: 'Terms of Service',
    metaDescription: 'Terms of use and service agreement for Agrawal Matrimony members.',
    content: 'By accessing Agrawal Matrimony, you agree to our community standards and terms of use.',
    points: [
      { title: 'Genuine Profiles', description: 'All candidates must belong to the Agrawal/Vaishya community with authentic biodata.' },
      { title: 'Zero Tolerance for Misconduct', description: 'Abuse, fraudulent documents, and commercial exploitation lead to permanent account suspension.' },
      { title: 'Subscription Terms', description: 'Premium benefits are non-transferable and subject to our Fair Usage Policy.' }
    ],
    isActive: true
  },
  {
    key: 'contact-us',
    title: 'Contact Support',
    metaDescription: 'Get in touch with the Agrawal Matrimony customer assistance team.',
    content: 'Our dedicated customer assistance team is available 7 days a week to support your matrimonial journey.',
    points: [
      { title: 'Official Helpline', description: '+91 80000 12345 (9:00 AM - 8:00 PM IST)' },
      { title: 'Support Email', description: 'support@agrawalmatrimony.com' },
      { title: 'Office Address', description: 'Agrawal Samaj Bhawan, Sector 18, Noida, Uttar Pradesh, 201301' }
    ],
    isActive: true
  },
  {
    key: 'faqs',
    title: 'Frequently Asked Questions',
    metaDescription: 'Common questions and answers regarding matchmaking, Gotras, and KYC.',
    content: 'Find answers to common questions about matchmaking, Gotra compatibility, and verification.',
    points: [
      { title: 'How does Gotra matching work?', description: 'Our engine applies strict Gotra exogamy rules, flagging paternal and maternal gotra conflicts.' },
      { title: 'How long does KYC verification take?', description: 'Admin verification is completed within 24 hours of document submission.' },
      { title: 'Can I manage multiple biodatas under one account?', description: 'Yes, our platform supports multi-profile management for family members.' }
    ],
    isActive: true
  },
  {
    key: 'community-guidelines',
    title: 'Agrawal Community Guidelines',
    metaDescription: 'Core values and behavioral standards for our matrimonial platform.',
    content: 'Maintaining trust, dignity, and cultural values within the matrimonial circle.',
    points: [
      { title: 'Authenticity First', description: 'Provide accurate family, astrology, and education information.' },
      { title: 'Respectful Communication', description: 'Treat fellow families with warmth and courtesy in all interactions.' }
    ],
    isActive: true
  }
];

const defaultBanners = [
  {
    title: 'Find Your Soulmate Within Authentic 18 Gotras',
    subtitle: '100% Verified Agrawal Families',
    imageUrl: '/uploads/banners/banner_gotras.jpg',
    targetUrl: '/matches',
    sortOrder: 1,
    isActive: true
  },
  {
    title: 'Maharaja Agrasen Jayanti Special - 50% Off',
    subtitle: 'Unlock Unlimited Contact Views & Direct Chat',
    imageUrl: '/uploads/banners/banner_festival.jpg',
    targetUrl: '/plans',
    sortOrder: 2,
    isActive: true
  },
  {
    title: 'Safe & Secure Matrimony - Multi-Layer KYC Verification',
    subtitle: 'Aadhaar & Professional Document Checked',
    imageUrl: '/uploads/banners/banner_kyc.jpg',
    targetUrl: '/verification',
    sortOrder: 3,
    isActive: true
  }
];

const seedCMS = async () => {
  try {
    logger.info('Seeding CMS static pages and hero banners...');

    for (const pageData of defaultPages) {
      await CMSPage.findOneAndUpdate(
        { key: pageData.key },
        { $set: pageData },
        { upsert: true, new: true }
      );
    }
    logger.info(`Seeded ${defaultPages.length} CMS static pages.`);

    for (const bannerData of defaultBanners) {
      await Banner.findOneAndUpdate(
        { title: bannerData.title },
        { $set: bannerData },
        { upsert: true, new: true }
      );
    }
    logger.info(`Seeded ${defaultBanners.length} CMS hero banners.`);
  } catch (error) {
    logger.error(`Failed to seed CMS data: ${error.message}`);
    throw error;
  }
};

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedCMS();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      process.exit(1);
    }
  })();
}

module.exports = seedCMS;
