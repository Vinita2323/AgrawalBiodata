/**
 * Mock Matrimonial Candidates Seeder (Idempotent)
 * Agrawal Matrimony Platform
 *
 * Seeds realistic Agarwal matrimonial candidates spanning multiple Gotras,
 * both genders, horoscopes, 3-gen family tree, relatives, and photos.
 */

const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Profile = require('../models/Profile');
const logger = require('../utils/logger');
const { calculateProfileCompletion } = require('../services/profileScoreService');
const { ACCOUNT_STATUS, VERIFICATION_STATUS, SUBSCRIPTION_STATUS, SUBSCRIPTION_PLANS, MANGLIK_STATUS, GENDER } = require('../config/constants');

const MOCK_CANDIDATES = [
  {
    user: {
      mobile: '+919876500001',
      name: 'Rahul Garg',
      email: 'rahul.garg@example.com',
      gender: GENDER.MALE,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      subscriptionPlan: SUBSCRIPTION_PLANS.GOLD_YEARLY,
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
    },
    profile: {
      profileId: 'PRF-MOCK-001',
      profileFor: 'Self',
      fullName: 'Rahul Garg',
      gender: GENDER.MALE,
      dob: new Date('1994-06-15'),
      tob: '08:30 AM',
      pob: 'Delhi',
      height: "5'11\"",
      complexion: 'Fair',
      maritalStatus: 'Never Married',
      bloodGroup: 'B+',
      diet: 'Vegetarian',
      hobbies: ['Reading', 'Badminton', 'Traveling'],
      bio: 'Senior Software Architect in a leading Tech MNC. Value family traditions and modern outlook.',
      gotra: 'Garg',
      motherGotra: 'Bansal',
      manglik: MANGLIK_STATUS.NON_MANGLIK,
      rashi: 'Gemini',
      nakshatra: 'Ardra',
      qualification: 'B.Tech + M.Tech Computer Science',
      educationLevel: 'Postgraduate',
      workingAt: 'Microsoft India',
      occupation: 'Software Architect',
      occupationType: 'Private Job',
      income: '45 LPA',
      grandfather: 'Late Shri Rameshwar Dayal Garg',
      grandmother: 'Smt. Shanti Devi Garg',
      maternalGrandfather: 'Late Shri Mohan Lal Bansal',
      maternalGrandmother: 'Smt. Savitri Devi Bansal',
      father: 'Shri Suresh Kumar Garg',
      fatherOccupation: 'Business',
      fatherOccupationDetails: 'Owner - Garg Textile Traders, Chandni Chowk, Delhi',
      mother: 'Smt. Anita Garg',
      motherOccupation: 'Homemaker',
      familyType: 'Nuclear',
      familyValues: 'Traditional yet Modern',
      familyOrigin: 'Hisar, Haryana',
      brotherList: [
        { name: 'Aditya Garg', relationType: 'Brother', status: 'Married', spouseName: 'Ritu Goyal', homePlace: 'Delhi', occupation: 'Chartered Accountant' }
      ],
      sisterList: [
        { name: 'Kavita Garg', relationType: 'Sister', status: 'Married', spouseName: 'Manish Mittal', homePlace: 'Jaipur', occupation: 'Assistant Professor' }
      ],
      taujiList: [
        { name: 'Shri Dinesh Garg', relationType: 'Tauji', status: 'Married', spouseName: 'Sunita Garg', homePlace: 'Hisar', occupation: 'Senior Advocate' }
      ],
      chachaList: [
        { name: 'Shri Vinod Garg', relationType: 'Chacha', status: 'Married', spouseName: 'Meena Garg', homePlace: 'Gurugram', occupation: 'Real Estate Developer' }
      ],
      buajiList: [
        { name: 'Smt. Radha Mittal', relationType: 'Buaji', status: 'Married', spouseName: 'Shri O.P. Mittal', homePlace: 'Meerut', occupation: 'Homemaker' }
      ],
      mamajiList: [
        { name: 'Shri Rajesh Bansal', relationType: 'Mamaji', status: 'Married', spouseName: 'Alka Bansal', homePlace: 'Agra', occupation: 'Industrialist' }
      ],
      residentialAddress: 'A-42, Ashok Vihar Phase 1',
      city: 'Delhi',
      state: 'Delhi',
      mobileNumber: '+919876500001',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      profilePicture: '/uploads/profiles/mock_rahul_garg.jpg',
      gallery: [
        { url: '/uploads/profiles/mock_rahul_garg_1.jpg', caption: 'Traditional Attire', isPrimary: true },
        { url: '/uploads/profiles/mock_rahul_garg_2.jpg', caption: 'Casual Outing', isPrimary: false }
      ],
      verified: true,
      isFeatured: true
    }
  },
  {
    user: {
      mobile: '+919876500002',
      name: 'Priya Bansal',
      email: 'priya.bansal@example.com',
      gender: GENDER.FEMALE,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      subscriptionPlan: SUBSCRIPTION_PLANS.PLATINUM,
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
    },
    profile: {
      profileId: 'PRF-MOCK-002',
      profileFor: 'Self',
      fullName: 'Priya Bansal',
      gender: GENDER.FEMALE,
      dob: new Date('1996-03-22'),
      tob: '11:45 AM',
      pob: 'Jaipur',
      height: "5'5\"",
      complexion: 'Very Fair',
      maritalStatus: 'Never Married',
      bloodGroup: 'O+',
      diet: 'Vegetarian',
      hobbies: ['Classical Music', 'Painting', 'Cooking'],
      bio: 'Chartered Accountant working at Deloitte. Warm-hearted, fond of Indian heritage and cultural events.',
      gotra: 'Bansal',
      motherGotra: 'Mittal',
      manglik: MANGLIK_STATUS.NON_MANGLIK,
      rashi: 'Taurus',
      nakshatra: 'Rohini',
      qualification: 'CA, B.Com (Hons) SRCC Delhi',
      educationLevel: 'Postgraduate',
      workingAt: 'Deloitte India',
      occupation: 'Senior Auditor / Chartered Accountant',
      occupationType: 'Private Job',
      income: '28 LPA',
      grandfather: 'Late Shri Bhagwan Das Bansal',
      grandmother: 'Smt. Kanta Devi Bansal',
      maternalGrandfather: 'Shri Ramavatar Mittal',
      maternalGrandmother: 'Smt. Kamlesh Mittal',
      father: 'Shri Kailash Bansal',
      fatherOccupation: 'Govt Job',
      fatherOccupationDetails: 'Deputy Director, Rajasthan State Finance Commission',
      mother: 'Smt. Pushpa Bansal',
      motherOccupation: 'School Principal',
      familyType: 'Joint',
      familyValues: 'Traditional',
      familyOrigin: 'Jaipur, Rajasthan',
      brotherList: [
        { name: 'Aman Bansal', relationType: 'Brother', status: 'Unmarried', homePlace: 'Jaipur', occupation: 'MBA Student at IIM Indore' }
      ],
      sisterList: [],
      taujiList: [
        { name: 'Shri Govind Bansal', relationType: 'Tauji', status: 'Married', spouseName: 'Sarita Bansal', homePlace: 'Jaipur', occupation: 'Jewellery Merchant' }
      ],
      chachaList: [
        { name: 'Shri Anand Bansal', relationType: 'Chacha', status: 'Married', spouseName: 'Manju Bansal', homePlace: 'Kota', occupation: 'Senior Civil Engineer' }
      ],
      buajiList: [
        { name: 'Smt. Shakuntala Singhal', relationType: 'Buaji', status: 'Married', spouseName: 'Shri G.K. Singhal', homePlace: 'Alwar', occupation: 'Homemaker' }
      ],
      mamajiList: [
        { name: 'Shri Rakesh Mittal', relationType: 'Mamaji', status: 'Married', spouseName: 'Sunita Mittal', homePlace: 'Bikaner', occupation: 'Chartered Accountant' }
      ],
      residentialAddress: 'B-12, Malviya Nagar',
      city: 'Jaipur',
      state: 'Rajasthan',
      mobileNumber: '+919876500002',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      profilePicture: '/uploads/profiles/mock_priya_bansal.jpg',
      gallery: [
        { url: '/uploads/profiles/mock_priya_bansal_1.jpg', caption: 'Festival Celebration', isPrimary: true },
        { url: '/uploads/profiles/mock_priya_bansal_2.jpg', caption: 'Convocation Ceremony', isPrimary: false }
      ],
      verified: true,
      isFeatured: true
    }
  },
  {
    user: {
      mobile: '+919876500003',
      name: 'Amit Goyal',
      email: 'amit.goyal@example.com',
      gender: GENDER.MALE,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      subscriptionPlan: SUBSCRIPTION_PLANS.GOLD_MONTHLY,
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
    },
    profile: {
      profileId: 'PRF-MOCK-003',
      profileFor: 'Self',
      fullName: 'Amit Goyal',
      gender: GENDER.MALE,
      dob: new Date('1992-11-04'),
      tob: '04:15 PM',
      pob: 'Agra',
      height: "5'10\"",
      complexion: 'Wheatish',
      maritalStatus: 'Never Married',
      bloodGroup: 'A+',
      diet: 'Vegetarian',
      hobbies: ['Cricket', 'Stock Market', 'Photography'],
      bio: 'VP at Investment Banking Firm in Mumbai. Looking for an educated, understanding partner with rooted values.',
      gotra: 'Goyal',
      motherGotra: 'Singhal',
      manglik: MANGLIK_STATUS.ANSHIK_MANGLIK,
      rashi: 'Scorpio',
      nakshatra: 'Anuradha',
      qualification: 'MBA (Finance) IIM Ahmedabad, B.Com',
      educationLevel: 'Postgraduate',
      workingAt: 'Morgan Stanley',
      occupation: 'Investment Banker / VP',
      occupationType: 'Private Job',
      income: '60 LPA',
      grandfather: 'Late Shri Jagdish Prasad Goyal',
      grandmother: 'Smt. Sharda Goyal',
      maternalGrandfather: 'Late Shri Chhagan Lal Singhal',
      maternalGrandmother: 'Smt. Vidya Singhal',
      father: 'Shri Prem Chand Goyal',
      fatherOccupation: 'Business',
      fatherOccupationDetails: 'Owner - Goyal Footwear Industries, Agra',
      mother: 'Smt. Usha Goyal',
      motherOccupation: 'Homemaker',
      familyType: 'Joint',
      familyValues: 'Moderate',
      familyOrigin: 'Agra, Uttar Pradesh',
      brotherList: [
        { name: 'Nikhil Goyal', relationType: 'Brother', status: 'Married', spouseName: 'Anjali Bindal', homePlace: 'Agra', occupation: 'Managing Family Business' }
      ],
      sisterList: [],
      taujiList: [
        { name: 'Shri Hari Ram Goyal', relationType: 'Tauji', status: 'Married', spouseName: 'Sudha Goyal', homePlace: 'Mathura', occupation: 'Retired Banker' }
      ],
      chachaList: [
        { name: 'Shri Mukesh Goyal', relationType: 'Chacha', status: 'Married', spouseName: 'Seema Goyal', homePlace: 'Agra', occupation: 'Architect' }
      ],
      buajiList: [],
      mamajiList: [
        { name: 'Shri Anil Singhal', relationType: 'Mamaji', status: 'Married', spouseName: 'Pooja Singhal', homePlace: 'Aligarh', occupation: 'Medical Doctor' }
      ],
      residentialAddress: 'Flat 1402, Lodha Bellissimo, Lower Parel',
      city: 'Mumbai',
      state: 'Maharashtra',
      mobileNumber: '+919876500003',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      profilePicture: '/uploads/profiles/mock_amit_goyal.jpg',
      gallery: [
        { url: '/uploads/profiles/mock_amit_goyal_1.jpg', caption: 'Corporate Portrait', isPrimary: true }
      ],
      verified: true,
      isFeatured: false
    }
  },
  {
    user: {
      mobile: '+919876500004',
      name: 'Sneha Mittal',
      email: 'sneha.mittal@example.com',
      gender: GENDER.FEMALE,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      subscriptionPlan: SUBSCRIPTION_PLANS.DIAMOND,
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
    },
    profile: {
      profileId: 'PRF-MOCK-004',
      profileFor: 'Self',
      fullName: 'Dr. Sneha Mittal',
      gender: GENDER.FEMALE,
      dob: new Date('1995-08-19'),
      tob: '06:10 AM',
      pob: 'Chandigarh',
      height: "5'6\"",
      complexion: 'Fair',
      maritalStatus: 'Never Married',
      bloodGroup: 'AB+',
      diet: 'Vegetarian',
      hobbies: ['Yoga', 'Classical Dance', 'Gardening'],
      bio: 'MD Dermatologist practicing in Super Speciality Hospital. Passionate about wellness, arts, and family gatherings.',
      gotra: 'Mittal',
      motherGotra: 'Jindal',
      manglik: MANGLIK_STATUS.NON_MANGLIK,
      rashi: 'Leo',
      nakshatra: 'Magha',
      qualification: 'MBBS, MD Dermatology (AIIMS)',
      educationLevel: 'Doctorate',
      workingAt: 'Fortis Hospital',
      occupation: 'Consultant Dermatologist',
      occupationType: 'Doctor / Healthcare',
      income: '36 LPA',
      grandfather: 'Late Shri Darshan Lal Mittal',
      grandmother: 'Smt. Vimla Mittal',
      maternalGrandfather: 'Shri Harish Chandra Jindal',
      maternalGrandmother: 'Smt. Sushila Jindal',
      father: 'Dr. Ashok Mittal',
      fatherOccupation: 'Govt Job',
      fatherOccupationDetails: 'Head of Surgery, PGIMER Chandigarh',
      mother: 'Dr. Sunita Mittal',
      motherOccupation: 'Senior Gynecologist',
      familyType: 'Nuclear',
      familyValues: 'Progressive',
      familyOrigin: 'Chandigarh',
      brotherList: [],
      sisterList: [
        { name: 'Ritu Mittal', relationType: 'Sister', status: 'Unmarried', homePlace: 'Chandigarh', occupation: 'Law Student at NLSIU' }
      ],
      taujiList: [],
      chachaList: [
        { name: 'Dr. Pradeep Mittal', relationType: 'Chacha', status: 'Married', spouseName: 'Dr. Veena Mittal', homePlace: 'Ludhiana', occupation: 'Pediatrician' }
      ],
      buajiList: [
        { name: 'Smt. Gayatri Garg', relationType: 'Buaji', status: 'Married', spouseName: 'Shri S.N. Garg', homePlace: 'Ambala', occupation: 'Homemaker' }
      ],
      mamajiList: [
        { name: 'Shri Deepak Jindal', relationType: 'Mamaji', status: 'Married', spouseName: 'Renu Jindal', homePlace: 'Kurukshetra', occupation: 'Managing Director, Jindal Steels' }
      ],
      residentialAddress: 'House No. 512, Sector 11-B',
      city: 'Chandigarh',
      state: 'Punjab',
      mobileNumber: '+919876500004',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      profilePicture: '/uploads/profiles/mock_sneha_mittal.jpg',
      gallery: [
        { url: '/uploads/profiles/mock_sneha_mittal_1.jpg', caption: 'Hospital Clinic', isPrimary: true },
        { url: '/uploads/profiles/mock_sneha_mittal_2.jpg', caption: 'Family Function', isPrimary: false }
      ],
      verified: true,
      isFeatured: true
    }
  },
  {
    user: {
      mobile: '+919876500005',
      name: 'Vikram Singhal',
      email: 'vikram.singhal@example.com',
      gender: GENDER.MALE,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      subscriptionPlan: SUBSCRIPTION_PLANS.GOLD_YEARLY,
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
    },
    profile: {
      profileId: 'PRF-MOCK-005',
      profileFor: 'Self',
      fullName: 'Vikram Singhal',
      gender: GENDER.MALE,
      dob: new Date('1993-01-28'),
      tob: '02:40 PM',
      pob: 'Indore',
      height: "6'0\"",
      complexion: 'Fair',
      maritalStatus: 'Never Married',
      bloodGroup: 'O+',
      diet: 'Vegetarian',
      hobbies: ['Fitness', 'Tennis', 'Trekking'],
      bio: 'Co-Founder & CTO of a B2B SaaS startup. Tech enthusiast, food lover, and active community volunteer.',
      gotra: 'Singhal',
      motherGotra: 'Bindal',
      manglik: MANGLIK_STATUS.NON_MANGLIK,
      rashi: 'Aquarius',
      nakshatra: 'Shatabhisha',
      qualification: 'B.Tech IIT Bombay (Computer Science)',
      educationLevel: 'Graduate',
      workingAt: 'TechScale Innovations',
      occupation: 'Tech Entrepreneur / CTO',
      occupationType: 'Business',
      income: '80 LPA',
      grandfather: 'Late Shri Banwari Lal Singhal',
      grandmother: 'Smt. Bhagwati Singhal',
      maternalGrandfather: 'Late Shri Satya Narayan Bindal',
      maternalGrandmother: 'Smt. Maya Bindal',
      father: 'Shri Mahendra Singhal',
      fatherOccupation: 'Business',
      fatherOccupationDetails: 'Founder, Singhal Agro Foods Pvt Ltd, Indore',
      mother: 'Smt. Geeta Singhal',
      motherOccupation: 'Homemaker',
      familyType: 'Joint',
      familyValues: 'Traditional yet Modern',
      familyOrigin: 'Indore, Madhya Pradesh',
      brotherList: [
        { name: 'Rohit Singhal', relationType: 'Brother', status: 'Unmarried', homePlace: 'Bengaluru', occupation: 'Product Manager' }
      ],
      sisterList: [],
      taujiList: [
        { name: 'Shri Ramesh Singhal', relationType: 'Tauji', status: 'Married', spouseName: 'Kiran Singhal', homePlace: 'Ujjain', occupation: 'Senior Consultant' }
      ],
      chachaList: [],
      buajiList: [
        { name: 'Smt. Santosh Goyal', relationType: 'Buaji', status: 'Married', spouseName: 'Shri Satish Goyal', homePlace: 'Bhopal', occupation: 'Homemaker' }
      ],
      mamajiList: [
        { name: 'Shri Kamal Bindal', relationType: 'Mamaji', status: 'Married', spouseName: 'Preeti Bindal', homePlace: 'Gwalior', occupation: 'Pharmaceutical Distributor' }
      ],
      residentialAddress: '104, Indrapuri Colony',
      city: 'Indore',
      state: 'Madhya Pradesh',
      mobileNumber: '+919876500005',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      profilePicture: '/uploads/profiles/mock_vikram_singhal.jpg',
      gallery: [
        { url: '/uploads/profiles/mock_vikram_singhal_1.jpg', caption: 'Startup Summit', isPrimary: true }
      ],
      verified: true,
      isFeatured: true
    }
  },
  {
    user: {
      mobile: '+919876500006',
      name: 'Pooja Jindal',
      email: 'pooja.jindal@example.com',
      gender: GENDER.FEMALE,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      subscriptionPlan: SUBSCRIPTION_PLANS.GOLD_YEARLY,
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
    },
    profile: {
      profileId: 'PRF-MOCK-006',
      profileFor: 'Self',
      fullName: 'Pooja Jindal',
      gender: GENDER.FEMALE,
      dob: new Date('1997-09-12'),
      tob: '09:20 AM',
      pob: 'Noida',
      height: "5'4\"",
      complexion: 'Fair',
      maritalStatus: 'Never Married',
      bloodGroup: 'B+',
      diet: 'Vegetarian',
      hobbies: ['Baking', 'Digital Art', 'Reading'],
      bio: 'Product Designer at a FinTech firm. Calm, caring, and values deep family bonds.',
      gotra: 'Jindal',
      motherGotra: 'Tayal',
      manglik: MANGLIK_STATUS.NON_MANGLIK,
      rashi: 'Virgo',
      nakshatra: 'Hasta',
      qualification: 'B.Des NID Ahmedabad',
      educationLevel: 'Graduate',
      workingAt: 'Razorpay Software',
      occupation: 'Senior Product Designer (UI/UX)',
      occupationType: 'Private Job',
      income: '22 LPA',
      grandfather: 'Late Shri Madan Mohan Jindal',
      grandmother: 'Smt. Shakuntala Jindal',
      maternalGrandfather: 'Shri Ram Niwas Tayal',
      maternalGrandmother: 'Smt. Shanti Tayal',
      father: 'Shri Ajay Jindal',
      fatherOccupation: 'Private Job',
      fatherOccupationDetails: 'Senior General Manager, Bharat Petroleum (BPCL)',
      mother: 'Smt. Rekha Jindal',
      motherOccupation: 'Homemaker',
      familyType: 'Nuclear',
      familyValues: 'Modern',
      familyOrigin: 'Noida, Uttar Pradesh',
      brotherList: [],
      sisterList: [
        { name: 'Swati Jindal', relationType: 'Sister', status: 'Unmarried', homePlace: 'Noida', occupation: 'Architectural Intern' }
      ],
      taujiList: [],
      chachaList: [
        { name: 'Shri Sanjay Jindal', relationType: 'Chacha', status: 'Married', spouseName: 'Anita Jindal', homePlace: 'Ghaziabad', occupation: 'Chartered Accountant' }
      ],
      buajiList: [
        { name: 'Smt. Madhu Goyal', relationType: 'Buaji', status: 'Married', spouseName: 'Shri Rajiv Goyal', homePlace: 'Delhi', occupation: 'Homemaker' }
      ],
      mamajiList: [
        { name: 'Shri Naveen Tayal', relationType: 'Mamaji', status: 'Married', spouseName: 'Archana Tayal', homePlace: 'Panipat', occupation: 'Textile Exporter' }
      ],
      residentialAddress: 'Tower 4, Flat 903, ATS Greens Village, Sector 93A',
      city: 'Noida',
      state: 'Uttar Pradesh',
      mobileNumber: '+919876500006',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      profilePicture: '/uploads/profiles/mock_pooja_jindal.jpg',
      gallery: [
        { url: '/uploads/profiles/mock_pooja_jindal_1.jpg', caption: 'Design Showcase', isPrimary: true }
      ],
      verified: true,
      isFeatured: false
    }
  }
];

const seedMockData = async () => {
  try {
    logger.info('Starting realistic mock candidate seeding...');
    let seededCount = 0;

    for (const item of MOCK_CANDIDATES) {
      // 1. Check/upsert User
      let user = await User.findOne({ mobile: item.user.mobile });
      if (!user) {
        user = new User(item.user);
        await user.save();
      } else {
        Object.assign(user, item.user);
        await user.save();
      }

      // 2. Check/upsert Profile
      let profile = await Profile.findOne({ profileId: item.profile.profileId });
      const profileData = {
        ...item.profile,
        userId: user._id
      };

      // Calculate completion score
      const completion = calculateProfileCompletion(profileData);
      profileData.completionPercentage = completion.percentage;

      if (!profile) {
        profile = new Profile(profileData);
        await profile.save();
      } else {
        Object.assign(profile, profileData);
        await profile.save();
      }

      // 3. Link Profile to User
      if (!user.profiles.includes(profile._id)) {
        user.profiles.push(profile._id);
      }
      user.activeProfileId = profile._id;
      await user.save();

      seededCount++;
      logger.info(`[SEED] Candidate profile seeded: ${profile.fullName} (${profile.gotra} Gotra, ${profile.gender})`);
    }

    logger.info(`Successfully seeded ${seededCount} realistic Agarwal matrimonial candidates.`);
    return true;
  } catch (error) {
    logger.error(`Failed to seed mock candidate data: ${error.message}`);
    throw error;
  }
};

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedMockData();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      process.exit(1);
    }
  })();
}

module.exports = seedMockData;
