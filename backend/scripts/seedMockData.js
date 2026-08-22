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
const Plan = require('../models/Plan');
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
      subscriptionPlan: SUBSCRIPTION_PLANS.GOLD,
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
      profilePicture: '',
      gallery: [],
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
      profilePicture: '',
      gallery: [],
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
      subscriptionPlan: SUBSCRIPTION_PLANS.GOLD,
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
      profilePicture: '',
      gallery: [],
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
      profilePicture: '',
      gallery: [],
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
      subscriptionPlan: SUBSCRIPTION_PLANS.GOLD,
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
      profilePicture: '',
      gallery: [],
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
      subscriptionPlan: SUBSCRIPTION_PLANS.GOLD,
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
      profilePicture: '',
      gallery: [],
      verified: true,
      isFeatured: false
    }
  },
  {
    user: {
      mobile: '+919876500007',
      name: 'Neeraj Bindal',
      email: 'neeraj.bindal@example.com',
      gender: GENDER.MALE,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      subscriptionPlan: SUBSCRIPTION_PLANS.PLATINUM,
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
    },
    profile: {
      profileId: 'PRF-MOCK-007',
      profileFor: 'Self',
      fullName: 'Neeraj Bindal',
      gender: GENDER.MALE,
      dob: new Date('1991-04-10'),
      tob: '07:00 AM',
      pob: 'Bangalore',
      height: "5'9\"",
      complexion: 'Wheatish',
      maritalStatus: 'Never Married',
      bloodGroup: 'B+',
      diet: 'Eggetarian',
      hobbies: ['Chess', 'Cycling', 'Data Science Blogging'],
      bio: 'Lead Data Scientist at a global analytics firm. Enjoys quiet weekends, cycling, and mentoring juniors.',
      gotra: 'Bindal',
      motherGotra: 'Kansal',
      manglik: MANGLIK_STATUS.NON_MANGLIK,
      rashi: 'Aries',
      nakshatra: 'Ashwini',
      qualification: 'M.Tech Data Science, IIIT Bangalore',
      educationLevel: 'Postgraduate',
      workingAt: 'Flipkart',
      occupation: 'Lead Data Scientist',
      occupationType: 'Private Job',
      income: '52 LPA',
      grandfather: 'Late Shri Om Prakash Bindal',
      grandmother: 'Smt. Kamla Bindal',
      maternalGrandfather: 'Shri Suresh Kansal',
      maternalGrandmother: 'Smt. Urmila Kansal',
      father: 'Shri Ravi Bindal',
      fatherOccupation: 'Private Job',
      fatherOccupationDetails: 'General Manager, HDFC Bank, Bangalore',
      mother: 'Smt. Neelam Bindal',
      motherOccupation: 'Homemaker',
      familyType: 'Nuclear',
      familyValues: 'Modern',
      familyOrigin: 'Rohtak, Haryana',
      brotherList: [],
      sisterList: [
        { name: 'Shalini Bindal', relationType: 'Sister', status: 'Married', spouseName: 'Rajat Kansal', homePlace: 'Gurugram', occupation: 'HR Manager' }
      ],
      taujiList: [],
      chachaList: [
        { name: 'Shri Ashok Bindal', relationType: 'Chacha', status: 'Married', spouseName: 'Poonam Bindal', homePlace: 'Rohtak', occupation: 'School Principal' }
      ],
      buajiList: [],
      mamajiList: [
        { name: 'Shri Deepak Kansal', relationType: 'Mamaji', status: 'Married', spouseName: 'Ritu Kansal', homePlace: 'Panipat', occupation: 'Textile Trader' }
      ],
      residentialAddress: '204, Prestige Lakeside Habitat, Varthur',
      city: 'Bangalore',
      state: 'Karnataka',
      mobileNumber: '+919876500007',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      profilePicture: '',
      gallery: [],
      verified: true,
      isFeatured: false
    }
  },
  {
    user: {
      mobile: '+919876500008',
      name: 'Anjali Tayal',
      email: 'anjali.tayal@example.com',
      gender: GENDER.FEMALE,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      subscriptionPlan: SUBSCRIPTION_PLANS.GOLD,
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
    },
    profile: {
      profileId: 'PRF-MOCK-008',
      profileFor: 'Self',
      fullName: 'Anjali Tayal',
      gender: GENDER.FEMALE,
      dob: new Date('1998-01-27'),
      tob: '03:20 PM',
      pob: 'Lucknow',
      height: "5'3\"",
      complexion: 'Fair',
      maritalStatus: 'Never Married',
      bloodGroup: 'A+',
      diet: 'Vegetarian',
      hobbies: ['Sketching', 'Interior Design', 'Travel'],
      bio: 'Practicing Architect with a boutique design studio. Loves heritage architecture and weekend road trips.',
      gotra: 'Tayal',
      motherGotra: 'Airan',
      manglik: MANGLIK_STATUS.NON_MANGLIK,
      rashi: 'Capricorn',
      nakshatra: 'Shravana',
      qualification: 'B.Arch, SPA Delhi',
      educationLevel: 'Graduate',
      workingAt: 'Studio Verve Architects',
      occupation: 'Architect',
      occupationType: 'Private Job',
      income: '18 LPA',
      grandfather: 'Late Shri Chandra Prakash Tayal',
      grandmother: 'Smt. Saroj Tayal',
      maternalGrandfather: 'Shri Vijay Airan',
      maternalGrandmother: 'Smt. Kusum Airan',
      father: 'Shri Manoj Tayal',
      fatherOccupation: 'Business',
      fatherOccupationDetails: 'Owner, Tayal Timber Traders, Lucknow',
      mother: 'Smt. Sarita Tayal',
      motherOccupation: 'Homemaker',
      familyType: 'Joint',
      familyValues: 'Traditional yet Modern',
      familyOrigin: 'Lucknow, Uttar Pradesh',
      brotherList: [
        { name: 'Yash Tayal', relationType: 'Brother', status: 'Unmarried', homePlace: 'Lucknow', occupation: 'Managing Family Business' }
      ],
      sisterList: [],
      taujiList: [
        { name: 'Shri Vinay Tayal', relationType: 'Tauji', status: 'Married', spouseName: 'Anita Tayal', homePlace: 'Kanpur', occupation: 'Retired Govt Officer' }
      ],
      chachaList: [],
      buajiList: [
        { name: 'Smt. Rekha Airan', relationType: 'Buaji', status: 'Married', spouseName: 'Shri Mahesh Airan', homePlace: 'Varanasi', occupation: 'Homemaker' }
      ],
      mamajiList: [
        { name: 'Shri Naresh Airan', relationType: 'Mamaji', status: 'Married', spouseName: 'Shweta Airan', homePlace: 'Allahabad', occupation: 'Civil Engineer' }
      ],
      residentialAddress: '18/4, Hazratganj',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      mobileNumber: '+919876500008',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      profilePicture: '',
      gallery: [],
      verified: true,
      isFeatured: true
    }
  },
  {
    user: {
      mobile: '+919876500009',
      name: 'Dr. Rohan Kuchhal',
      email: 'rohan.kuchhal@example.com',
      gender: GENDER.MALE,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      subscriptionPlan: SUBSCRIPTION_PLANS.GOLD,
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
    },
    profile: {
      profileId: 'PRF-MOCK-009',
      profileFor: 'Self',
      fullName: 'Dr. Rohan Kuchhal',
      gender: GENDER.MALE,
      dob: new Date('1990-07-02'),
      tob: '10:05 PM',
      pob: 'Pune',
      height: "5'8\"",
      complexion: 'Fair',
      maritalStatus: 'Never Married',
      bloodGroup: 'O-',
      diet: 'Vegetarian',
      hobbies: ['Running', 'Classical Music', 'Volunteering'],
      bio: 'Orthopedic Surgeon at a leading multi-specialty hospital. Calm, disciplined, and family-oriented.',
      gotra: 'Kuchhal',
      motherGotra: 'Mangal',
      manglik: MANGLIK_STATUS.MANGLIK,
      rashi: 'Cancer',
      nakshatra: 'Pushya',
      qualification: 'MBBS, MS Orthopedics (BJ Medical College)',
      educationLevel: 'Postgraduate',
      workingAt: 'Ruby Hall Clinic',
      occupation: 'Orthopedic Surgeon',
      occupationType: 'Doctor / Healthcare',
      income: '40 LPA',
      grandfather: 'Late Shri Devi Dayal Kuchhal',
      grandmother: 'Smt. Prem Kuchhal',
      maternalGrandfather: 'Shri Baldev Mangal',
      maternalGrandmother: 'Smt. Chanda Mangal',
      father: 'Shri Sanjay Kuchhal',
      fatherOccupation: 'Private Job',
      fatherOccupationDetails: 'Retired GM, Bank of Maharashtra',
      mother: 'Smt. Meenakshi Kuchhal',
      motherOccupation: 'Retired Teacher',
      familyType: 'Nuclear',
      familyValues: 'Traditional',
      familyOrigin: 'Pune, Maharashtra',
      brotherList: [],
      sisterList: [
        { name: 'Nidhi Kuchhal', relationType: 'Sister', status: 'Married', spouseName: 'Ankit Nangal', homePlace: 'Nashik', occupation: 'Bank Manager' }
      ],
      taujiList: [],
      chachaList: [
        { name: 'Shri Rakesh Kuchhal', relationType: 'Chacha', status: 'Married', spouseName: 'Sunita Kuchhal', homePlace: 'Nagpur', occupation: 'Advocate' }
      ],
      buajiList: [],
      mamajiList: [
        { name: 'Shri Prakash Mangal', relationType: 'Mamaji', status: 'Married', spouseName: 'Lata Mangal', homePlace: 'Aurangabad', occupation: 'Businessman' }
      ],
      residentialAddress: 'Flat 802, Kumar Paradise, Viman Nagar',
      city: 'Pune',
      state: 'Maharashtra',
      mobileNumber: '+919876500009',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      profilePicture: '',
      gallery: [],
      verified: true,
      isFeatured: true
    }
  },
  {
    user: {
      mobile: '+919876500010',
      name: 'Kirti Nangal',
      email: 'kirti.nangal@example.com',
      gender: GENDER.FEMALE,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      subscriptionPlan: SUBSCRIPTION_PLANS.DIAMOND,
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
    },
    profile: {
      profileId: 'PRF-MOCK-010',
      profileFor: 'Self',
      fullName: 'Kirti Nangal',
      gender: GENDER.FEMALE,
      dob: new Date('1994-11-30'),
      tob: '01:15 PM',
      pob: 'Ahmedabad',
      height: "5'5\"",
      complexion: 'Very Fair',
      maritalStatus: 'Never Married',
      bloodGroup: 'B-',
      diet: 'Vegetarian',
      hobbies: ['Debating', 'Reading', 'Badminton'],
      bio: 'Corporate Lawyer at a top-tier law firm. Articulate, ambitious, and deeply rooted in family values.',
      gotra: 'Nangal',
      motherGotra: 'Dharan',
      manglik: MANGLIK_STATUS.NON_MANGLIK,
      rashi: 'Sagittarius',
      nakshatra: 'Purva Ashadha',
      qualification: 'B.A. LLB (Hons), NLU Ahmedabad',
      educationLevel: 'Graduate',
      workingAt: 'Khaitan & Co.',
      occupation: 'Corporate Lawyer',
      occupationType: 'Private Job',
      income: '32 LPA',
      grandfather: 'Late Shri Jagmohan Nangal',
      grandmother: 'Smt. Vidya Nangal',
      maternalGrandfather: 'Shri Ramesh Dharan',
      maternalGrandmother: 'Smt. Kavita Dharan',
      father: 'Shri Anil Nangal',
      fatherOccupation: 'Business',
      fatherOccupationDetails: 'Partner, Nangal Chemicals Pvt Ltd, Ahmedabad',
      mother: 'Smt. Rita Nangal',
      motherOccupation: 'Homemaker',
      familyType: 'Nuclear',
      familyValues: 'Modern',
      familyOrigin: 'Ahmedabad, Gujarat',
      brotherList: [
        { name: 'Aryan Nangal', relationType: 'Brother', status: 'Unmarried', homePlace: 'Ahmedabad', occupation: 'Engineering Student' }
      ],
      sisterList: [],
      taujiList: [],
      chachaList: [
        { name: 'Shri Sunil Nangal', relationType: 'Chacha', status: 'Married', spouseName: 'Deepa Nangal', homePlace: 'Vadodara', occupation: 'Chemical Engineer' }
      ],
      buajiList: [
        { name: 'Smt. Poonam Dharan', relationType: 'Buaji', status: 'Married', spouseName: 'Shri Nitin Dharan', homePlace: 'Surat', occupation: 'Homemaker' }
      ],
      mamajiList: [],
      residentialAddress: '7, Shantiniketan Society, Satellite',
      city: 'Ahmedabad',
      state: 'Gujarat',
      mobileNumber: '+919876500010',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      profilePicture: '',
      gallery: [],
      verified: true,
      isFeatured: true
    }
  },
  {
    user: {
      mobile: '+919876500011',
      name: 'Saurabh Madhukul',
      email: 'saurabh.madhukul@example.com',
      gender: GENDER.MALE,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      subscriptionPlan: SUBSCRIPTION_PLANS.GOLD,
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
    },
    profile: {
      profileId: 'PRF-MOCK-011',
      profileFor: 'Self',
      fullName: 'Saurabh Madhukul',
      gender: GENDER.MALE,
      dob: new Date('1995-05-18'),
      tob: '05:50 AM',
      pob: 'Hyderabad',
      height: "5'10\"",
      complexion: 'Wheatish',
      maritalStatus: 'Never Married',
      bloodGroup: 'A-',
      diet: 'Non-Vegetarian',
      hobbies: ['Football', 'Gaming', 'Public Speaking'],
      bio: 'Marketing Manager at a fast-growing D2C brand. Outgoing, sociable, and enjoys building new things.',
      gotra: 'Madhukul',
      motherGotra: 'Goyan',
      manglik: MANGLIK_STATUS.NON_MANGLIK,
      rashi: 'Taurus',
      nakshatra: 'Mrigashira',
      qualification: 'MBA (Marketing), ISB Hyderabad',
      educationLevel: 'Postgraduate',
      workingAt: 'Mamaearth',
      occupation: 'Marketing Manager',
      occupationType: 'Private Job',
      income: '26 LPA',
      grandfather: 'Late Shri Ram Swaroop Madhukul',
      grandmother: 'Smt. Gita Madhukul',
      maternalGrandfather: 'Shri Ashok Goyan',
      maternalGrandmother: 'Smt. Rama Goyan',
      father: 'Shri Vijay Madhukul',
      fatherOccupation: 'Private Job',
      fatherOccupationDetails: 'Deputy General Manager, BHEL, Hyderabad',
      mother: 'Smt. Sunita Madhukul',
      motherOccupation: 'Homemaker',
      familyType: 'Nuclear',
      familyValues: 'Moderate',
      familyOrigin: 'Hyderabad, Telangana',
      brotherList: [],
      sisterList: [
        { name: 'Ishita Madhukul', relationType: 'Sister', status: 'Unmarried', homePlace: 'Hyderabad', occupation: 'MBBS Student' }
      ],
      taujiList: [
        { name: 'Shri Suresh Madhukul', relationType: 'Tauji', status: 'Married', spouseName: 'Kamla Madhukul', homePlace: 'Warangal', occupation: 'Retired Bank Officer' }
      ],
      chachaList: [],
      buajiList: [],
      mamajiList: [
        { name: 'Shri Ramesh Goyan', relationType: 'Mamaji', status: 'Married', spouseName: 'Sudha Goyan', homePlace: 'Vijayawada', occupation: 'Real Estate Consultant' }
      ],
      residentialAddress: 'Plot 56, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      mobileNumber: '+919876500011',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      profilePicture: '',
      gallery: [],
      verified: true,
      isFeatured: false
    }
  },
  {
    user: {
      mobile: '+919876500012',
      name: 'Nisha Bhandal',
      email: 'nisha.bhandal@example.com',
      gender: GENDER.FEMALE,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      subscriptionPlan: SUBSCRIPTION_PLANS.GOLD,
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
    },
    profile: {
      profileId: 'PRF-MOCK-012',
      profileFor: 'Self',
      fullName: 'Nisha Bhandal',
      gender: GENDER.FEMALE,
      dob: new Date('1996-08-05'),
      tob: '09:45 AM',
      pob: 'Kolkata',
      height: "5'4\"",
      complexion: 'Fair',
      maritalStatus: 'Never Married',
      bloodGroup: 'O+',
      diet: 'Vegetarian',
      hobbies: ['Teaching', 'Bharatanatyam', 'Reading'],
      bio: 'Assistant Professor of Economics at a reputed university. Warm, articulate, and deeply committed to family.',
      gotra: 'Bhandal',
      motherGotra: 'Tingal',
      manglik: MANGLIK_STATUS.NON_MANGLIK,
      rashi: 'Leo',
      nakshatra: 'Purva Phalguni',
      qualification: 'M.A. Economics, Presidency University',
      educationLevel: 'Postgraduate',
      workingAt: 'St. Xavier\'s College',
      occupation: 'Assistant Professor',
      occupationType: 'Govt Job',
      income: '14 LPA',
      grandfather: 'Late Shri Har Prasad Bhandal',
      grandmother: 'Smt. Radha Bhandal',
      maternalGrandfather: 'Shri Mahesh Tingal',
      maternalGrandmother: 'Smt. Usha Tingal',
      father: 'Shri Ramesh Bhandal',
      fatherOccupation: 'Business',
      fatherOccupationDetails: 'Owner, Bhandal Stationery Mart, Kolkata',
      mother: 'Smt. Sushma Bhandal',
      motherOccupation: 'Homemaker',
      familyType: 'Joint',
      familyValues: 'Traditional',
      familyOrigin: 'Kolkata, West Bengal',
      brotherList: [
        { name: 'Tarun Bhandal', relationType: 'Brother', status: 'Married', spouseName: 'Priti Goyal', homePlace: 'Kolkata', occupation: 'Chartered Accountant' }
      ],
      sisterList: [],
      taujiList: [
        { name: 'Shri Mohan Bhandal', relationType: 'Tauji', status: 'Married', spouseName: 'Kanta Bhandal', homePlace: 'Asansol', occupation: 'Retired Postmaster' }
      ],
      chachaList: [],
      buajiList: [],
      mamajiList: [
        { name: 'Shri Anil Tingal', relationType: 'Mamaji', status: 'Married', spouseName: 'Meena Tingal', homePlace: 'Durgapur', occupation: 'Steel Trader' }
      ],
      residentialAddress: '22B, Ballygunge Place',
      city: 'Kolkata',
      state: 'West Bengal',
      mobileNumber: '+919876500012',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      profilePicture: '',
      gallery: [],
      verified: true,
      isFeatured: false
    }
  },
  {
    user: {
      mobile: '+919876500013',
      name: 'Karan Airan',
      email: 'karan.airan@example.com',
      gender: GENDER.MALE,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      subscriptionPlan: SUBSCRIPTION_PLANS.FREE,
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
    },
    profile: {
      profileId: 'PRF-MOCK-013',
      profileFor: 'Self',
      fullName: 'Karan Airan',
      gender: GENDER.MALE,
      dob: new Date('1989-12-14'),
      tob: '12:00 PM',
      pob: 'Surat',
      height: "5'9\"",
      complexion: 'Wheatish',
      maritalStatus: 'Never Married',
      bloodGroup: 'AB-',
      diet: 'Vegetarian',
      hobbies: ['Business Networking', 'Golf', 'Cricket'],
      bio: 'Third-generation diamond and textile business owner. Grounded, family-first, and enjoys mentoring young entrepreneurs.',
      gotra: 'Airan',
      motherGotra: 'Bhandal',
      manglik: MANGLIK_STATUS.ANSHIK_MANGLIK,
      rashi: 'Sagittarius',
      nakshatra: 'Mula',
      qualification: 'B.Com, South Gujarat University',
      educationLevel: 'Graduate',
      workingAt: 'Airan Textiles & Gems',
      occupation: 'Business Owner',
      occupationType: 'Business',
      income: '70 LPA',
      grandfather: 'Late Shri Motilal Airan',
      grandmother: 'Smt. Kesar Airan',
      maternalGrandfather: 'Late Shri Girdhari Bhandal',
      maternalGrandmother: 'Smt. Leela Bhandal',
      father: 'Shri Naresh Airan',
      fatherOccupation: 'Business',
      fatherOccupationDetails: 'Founder, Airan Textiles & Gems, Surat',
      mother: 'Smt. Kiran Airan',
      motherOccupation: 'Homemaker',
      familyType: 'Joint',
      familyValues: 'Traditional',
      familyOrigin: 'Surat, Gujarat',
      brotherList: [
        { name: 'Manav Airan', relationType: 'Brother', status: 'Married', spouseName: 'Payal Kansal', homePlace: 'Surat', occupation: 'Co-runs Family Business' }
      ],
      sisterList: [],
      taujiList: [
        { name: 'Shri Dinesh Airan', relationType: 'Tauji', status: 'Married', spouseName: 'Shobha Airan', homePlace: 'Rajkot', occupation: 'Diamond Merchant' }
      ],
      chachaList: [],
      buajiList: [
        { name: 'Smt. Neha Kansal', relationType: 'Buaji', status: 'Married', spouseName: 'Shri Rajesh Kansal', homePlace: 'Bharuch', occupation: 'Homemaker' }
      ],
      mamajiList: [],
      residentialAddress: 'B-802, Ganesh Glory, Vesu',
      city: 'Surat',
      state: 'Gujarat',
      mobileNumber: '+919876500013',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      profilePicture: '',
      gallery: [],
      verified: false,
      isFeatured: false
    }
  },
  {
    user: {
      mobile: '+919876500014',
      name: 'Meera Dharan',
      email: 'meera.dharan@example.com',
      gender: GENDER.FEMALE,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      subscriptionPlan: SUBSCRIPTION_PLANS.PLATINUM,
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
    },
    profile: {
      profileId: 'PRF-MOCK-014',
      profileFor: 'Self',
      fullName: 'Meera Dharan',
      gender: GENDER.FEMALE,
      dob: new Date('1997-02-09'),
      tob: '04:30 AM',
      pob: 'Chennai',
      height: "5'3\"",
      complexion: 'Fair',
      maritalStatus: 'Never Married',
      bloodGroup: 'B+',
      diet: 'Vegetarian',
      hobbies: ['Carnatic Music', 'Coding Side-Projects', 'Trekking'],
      bio: 'Senior Software Engineer at a global product company. Loves solving problems, both in code and in life.',
      gotra: 'Dharan',
      motherGotra: 'Kuchhal',
      manglik: MANGLIK_STATUS.NON_MANGLIK,
      rashi: 'Aquarius',
      nakshatra: 'Dhanishta',
      qualification: 'B.E. Computer Science, Anna University',
      educationLevel: 'Graduate',
      workingAt: 'Zoho Corporation',
      occupation: 'Senior Software Engineer',
      occupationType: 'Private Job',
      income: '24 LPA',
      grandfather: 'Late Shri Subhash Dharan',
      grandmother: 'Smt. Kamala Dharan',
      maternalGrandfather: 'Shri Ganesh Kuchhal',
      maternalGrandmother: 'Smt. Padma Kuchhal',
      father: 'Shri Ramesh Dharan',
      fatherOccupation: 'Govt Job',
      fatherOccupationDetails: 'Senior Manager, Tamil Nadu State Electricity Board',
      mother: 'Smt. Lakshmi Dharan',
      motherOccupation: 'Retired Bank Officer',
      familyType: 'Nuclear',
      familyValues: 'Modern',
      familyOrigin: 'Chennai, Tamil Nadu',
      brotherList: [],
      sisterList: [
        { name: 'Divya Dharan', relationType: 'Sister', status: 'Unmarried', homePlace: 'Chennai', occupation: 'CA Articleship' }
      ],
      taujiList: [],
      chachaList: [
        { name: 'Shri Suresh Dharan', relationType: 'Chacha', status: 'Married', spouseName: 'Vani Dharan', homePlace: 'Coimbatore', occupation: 'Engineer' }
      ],
      buajiList: [],
      mamajiList: [
        { name: 'Shri Ganapathy Kuchhal', relationType: 'Mamaji', status: 'Married', spouseName: 'Radha Kuchhal', homePlace: 'Madurai', occupation: 'Doctor' }
      ],
      residentialAddress: 'Flat 6B, Sundar Nagar, Velachery',
      city: 'Chennai',
      state: 'Tamil Nadu',
      mobileNumber: '+919876500014',
      privacySettings: {
        phoneVisibility: 'Connected Members Only',
        addressVisibility: 'Connected Members Only',
        photoVisibility: 'Visible to All'
      },
      profilePicture: '',
      gallery: [],
      verified: true,
      isFeatured: true
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

      if (item.user.subscriptionPlan) {
        const matchingPlan = await Plan.findOne({ name: item.user.subscriptionPlan });
        if (matchingPlan && String(user.subscriptionPlanId) !== String(matchingPlan._id)) {
          user.subscriptionPlanId = matchingPlan._id;
          await user.save();
        }
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
