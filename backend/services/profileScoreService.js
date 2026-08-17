/**
 * Profile Score & Completion Calculation Service
 * Agrawal Matrimony Platform
 * 
 * 5-Section Weighted Engine:
 * 1. Personal Details: 25%
 * 2. Astrological & Gotra: 15%
 * 3. Education & Profession: 20%
 * 4. Family Tree & Relatives: 25%
 * 5. Media & Contact Info: 15%
 * Total = 100%
 */

const { isValidGotra } = require('../utils/gotras');

/**
 * Checks if a string value is non-empty
 * @param {any} val 
 * @returns {boolean}
 */
const isFilled = (val) => {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') return val.trim().length > 0;
  if (val instanceof Date) return !isNaN(val.getTime());
  if (Array.isArray(val)) return val.length > 0;
  return true;
};

/**
 * Calculates completion percentage and section breakdown for a given profile
 * @param {object} profile - Profile Mongoose document or plain JS object
 * @returns {{ percentage: number, breakdown: { personal: number, astrology: number, education: number, family: number, media: number } }}
 */
const calculateProfileCompletion = (profile) => {
  if (!profile) {
    return {
      percentage: 0,
      breakdown: {
        personal: 0,
        astrology: 0,
        education: 0,
        family: 0,
        media: 0
      }
    };
  }

  const p = profile._doc || profile;

  // 1. Personal Details (Max 25%)
  let personal = 0;
  if (isFilled(p.fullName)) personal += 5;
  if (isFilled(p.gender)) personal += 5;
  if (isFilled(p.dob)) personal += 5;
  if (isFilled(p.gotra) && isValidGotra(p.gotra)) personal += 5;
  
  let physical = 0;
  if (isFilled(p.height)) physical += 2.5;
  if (isFilled(p.complexion)) physical += 2.5;
  personal += physical;

  // 2. Astrological Details (Max 15%)
  let astrology = 0;
  if (isFilled(p.tob)) astrology += 4;
  if (isFilled(p.pob)) astrology += 4;
  if (isFilled(p.motherGotra) && isValidGotra(p.motherGotra)) astrology += 4;
  if (isFilled(p.manglik)) astrology += 3;

  // 3. Education & Profession (Max 20%)
  let education = 0;
  if (isFilled(p.qualification)) education += 8;
  
  let profession = 0;
  if (isFilled(p.occupation)) profession += 4;
  if (isFilled(p.workingAt)) profession += 3;
  else if (profession > 0) profession += 3; // if occupation filled and workingAt empty, grant full or partial
  if (profession > 7) profession = 7;
  education += profession;

  if (isFilled(p.income)) education += 5;

  // 4. Family Tree & Relatives (Max 25%)
  let family = 0;
  if (isFilled(p.father)) family += 4;
  if (isFilled(p.fatherOccupation)) family += 4;
  if (isFilled(p.mother)) family += 5;
  if (isFilled(p.grandfather) || isFilled(p.maternalGrandfather)) family += 4;

  // Check if at least 1 relative is filled with a valid name in any list
  const relativeLists = [
    p.brotherList,
    p.sisterList,
    p.taujiList,
    p.chachaList,
    p.buajiList,
    p.mamajiList,
    p.masijiList
  ];

  const hasAnyRelative = relativeLists.some(
    list => Array.isArray(list) && list.some(r => r && isFilled(r.name))
  );

  if (hasAnyRelative) {
    family += 8;
  }

  // 5. Media & Contact Info (Max 15%)
  let media = 0;
  if (isFilled(p.profilePicture) || (Array.isArray(p.gallery) && p.gallery.length > 0) || (Array.isArray(p.galleryPhotos) && p.galleryPhotos.length > 0)) {
    media += 10;
  }

  let contact = 0;
  if (isFilled(p.residentialAddress) || isFilled(p.city) || isFilled(p.state)) contact += 2.5;
  if (isFilled(p.mobileNumber) || isFilled(p.email)) contact += 2.5;
  media += contact;

  // Clamp sections to their max values
  personal = Math.min(25, Math.round(personal));
  astrology = Math.min(15, Math.round(astrology));
  education = Math.min(20, Math.round(education));
  family = Math.min(25, Math.round(family));
  media = Math.min(15, Math.round(media));

  const totalPercentage = Math.min(100, personal + astrology + education + family + media);

  return {
    percentage: totalPercentage,
    breakdown: {
      personal,
      astrology,
      education,
      family,
      media
    }
  };
};

module.exports = {
  calculateProfileCompletion
};
