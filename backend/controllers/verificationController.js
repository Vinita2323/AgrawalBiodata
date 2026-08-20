/**
 * Verification & KYC Controller
 * Document Submission, Admin Queue, One-Click Approval & Profile Badge Synchronization
 * Agrawal Matrimony Platform
 */

const Verification = require('../models/Verification');
const User = require('../models/User');
const Profile = require('../models/Profile');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');
const { getUserActiveProfile, findProfileByIdOrCustomId } = require('../utils/profileHelper');
const { VERIFICATION_STATUS } = require('../config/constants');
const { success, created, badRequest, notFound, paginate } = require('../utils/apiResponse');

/**
 * 1. User: Submit KYC Verification Documents
 * POST /api/verification/submit
 */
const submitVerification = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { documentType = 'Aadhaar', documentNumber = '', profileId } = req.body;

    let idProofUrl = req.body.idProofUrl || '';
    let professionProofUrl = req.body.professionProofUrl || '';
    let addressProofUrl = req.body.addressProofUrl || '';

    // Handle files if uploaded via multer
    if (req.files) {
      if (req.files.idProof && req.files.idProof[0]) {
        idProofUrl = `/uploads/documents/${req.files.idProof[0].filename}`;
      }
      if (req.files.professionProof && req.files.professionProof[0]) {
        professionProofUrl = `/uploads/documents/${req.files.professionProof[0].filename}`;
      }
      if (req.files.addressProof && req.files.addressProof[0]) {
        addressProofUrl = `/uploads/documents/${req.files.addressProof[0].filename}`;
      }
      if (req.files.document && req.files.document[0]) {
        idProofUrl = `/uploads/documents/${req.files.document[0].filename}`;
      }
    } else if (req.file) {
      idProofUrl = `/uploads/documents/${req.file.filename}`;
    }

    if (!idProofUrl && !professionProofUrl && !req.body.idProofUrl) {
      return badRequest(res, 'At least one verification document (ID Proof or Professional Proof) is required');
    }

    // Resolve the candidate profile these documents belong to.
    //
    // An account can run several profiles, so an explicitly named one is
    // honoured only after confirming the caller owns it - otherwise a request
    // could attach its verification record to a stranger's profile. With none
    // named we fall back to the profile the request is acting as.
    let targetProfileId = null;
    if (profileId) {
      const named = await findProfileByIdOrCustomId(profileId);
      if (!named || named.userId.toString() !== userId) {
        return badRequest(res, 'You do not have permission to verify this profile');
      }
      targetProfileId = named._id;
    } else {
      const acting = await getUserActiveProfile(userId, req.user.requestedProfileId);
      targetProfileId = acting?.activeProfile?._id || null;
    }

    // Create new verification record
    const verification = new Verification({
      userId,
      profileId: targetProfileId,
      documentType,
      documentNumber,
      idProofUrl,
      professionProofUrl,
      addressProofUrl,
      status: VERIFICATION_STATUS.PENDING,
      submittedAt: new Date()
    });

    await verification.save();

    // Update User verificationStatus to Pending
    await User.findByIdAndUpdate(userId, {
      verificationStatus: VERIFICATION_STATUS.PENDING
    });

    return created(res, 'KYC verification documents submitted successfully for review', {
      verification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. User: Get current KYC verification status
 * GET /api/verification/status
 */
const getVerificationStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return notFound(res, 'User account not found');
    }

    const latestVerification = await Verification.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate('profileId', 'fullName profileId gotra verified');

    return success(res, 'Verification status retrieved successfully', {
      verificationStatus: user.verificationStatus || 'Unverified',
      isVerified: user.verificationStatus === VERIFICATION_STATUS.APPROVED,
      latestSubmission: latestVerification || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. User: Get all personal verification submissions
 * GET /api/verification/my-submissions
 */
const getMySubmissions = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const submissions = await Verification.find({ userId })
      .sort({ createdAt: -1 })
      .populate('profileId', 'fullName profileId gotra verified');

    return success(res, 'Verification submissions retrieved successfully', {
      count: submissions.length,
      submissions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Admin: List verification queue (with filters and pagination)
 * GET /api/admin/verifications or GET /api/verification/admin
 */
const getAdminVerifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { status, documentType } = req.query;

    const filter = {};
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (documentType) {
      filter.documentType = documentType;
    }

    const total = await Verification.countDocuments(filter);
    const verifications = await Verification.find(filter)
      .populate('userId', 'name mobile email verificationStatus accountStatus')
      .populate('profileId', 'fullName profileId gotra gender dob verified completionPercentage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return paginate(res, verifications, page, limit, total, 'Admin verification queue retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Admin: Inspect verification detail side-by-side
 * GET /api/admin/verifications/:id
 */
const getAdminVerificationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const verification = await Verification.findById(id)
      .populate('userId', 'name mobile email verificationStatus accountStatus subscriptionPlan createdAt')
      .populate('profileId');

    if (!verification) {
      return notFound(res, `Verification submission not found for ID: ${id}`);
    }

    // Also fetch all candidate profiles of this user for side-by-side review
    const candidateProfiles = await Profile.find({ userId: verification.userId._id || verification.userId });

    return success(res, 'Verification details retrieved successfully', {
      verification,
      candidateProfiles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Admin: One-Click Approve KYC Verification & Auto-Sync Candidate Profiles Badge
 * PUT /api/admin/verifications/:id/approve
 */
const approveVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes = '' } = req.body;

    const verification = await Verification.findById(id);
    if (!verification) {
      return notFound(res, `Verification submission not found for ID: ${id}`);
    }

    const adminId = req.admin ? req.admin.adminId : null;
    const adminName = req.admin ? req.admin.name : 'Super Admin';
    const adminRole = req.admin ? req.admin.role : 'Super Admin';

    // 1. Update Verification status
    verification.status = VERIFICATION_STATUS.APPROVED;
    verification.reviewedBy = adminId;
    verification.reviewedByName = adminName;
    verification.reviewedAt = new Date();
    if (notes) verification.adminNotes = notes;
    await verification.save();

    // 2. Update User verificationStatus
    const user = await User.findByIdAndUpdate(
      verification.userId,
      { verificationStatus: VERIFICATION_STATUS.APPROVED },
      { new: true }
    );

    // 3. Automated Profile Badge Synchronization: Set verified = true for all candidate profiles of user
    const profileUpdateResult = await Profile.updateMany(
      { userId: verification.userId },
      { $set: { verified: true } }
    );

    // 4. Log Immutable Audit Trail
    await auditService.logAction({
      adminId,
      adminName,
      adminRole,
      action: 'Approved KYC Verification',
      target: verification._id.toString(),
      details: `Approved KYC document (${verification.documentType}) for User ${verification.userId}. Synchronized ${profileUpdateResult.modifiedCount} profile(s) to verified.`,
      metadata: {
        verificationId: verification._id,
        userId: verification.userId,
        documentType: verification.documentType,
        profilesSynced: profileUpdateResult.modifiedCount
      }
    });

    // 5. Tell the candidate their badge is live
    await notificationService.verificationReviewed({
      userId: verification.userId,
      profileId: verification.profileId,
      approved: true
    });

    return success(res, 'KYC verification approved and candidate profile badges synchronized successfully', {
      verification,
      userVerificationStatus: user ? user.verificationStatus : VERIFICATION_STATUS.APPROVED,
      profilesSynchronized: profileUpdateResult.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Admin: Reject KYC Verification with Reason & Category
 * PUT /api/admin/verifications/:id/reject
 */
const rejectVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      reason,
      rejectionReason,
      category,
      rejectionCategory = 'General',
      notes = ''
    } = req.body;

    const finalReason = reason || rejectionReason || 'Document unreadable or invalid';
    const finalCategory = category || rejectionCategory;

    const verification = await Verification.findById(id);
    if (!verification) {
      return notFound(res, `Verification submission not found for ID: ${id}`);
    }

    const adminId = req.admin ? req.admin.adminId : null;
    const adminName = req.admin ? req.admin.name : 'Super Admin';
    const adminRole = req.admin ? req.admin.role : 'Super Admin';

    // 1. Update Verification status & reasons
    verification.status = VERIFICATION_STATUS.REJECTED;
    verification.rejectionReason = finalReason;
    verification.rejectionCategory = finalCategory;
    verification.reviewedBy = adminId;
    verification.reviewedByName = adminName;
    verification.reviewedAt = new Date();
    if (notes) verification.adminNotes = notes;
    await verification.save();

    // 2. Update User verificationStatus
    const user = await User.findByIdAndUpdate(
      verification.userId,
      { verificationStatus: VERIFICATION_STATUS.REJECTED },
      { new: true }
    );

    // 3. Log Immutable Audit Trail
    await auditService.logAction({
      adminId,
      adminName,
      adminRole,
      action: 'Rejected KYC Verification',
      target: verification._id.toString(),
      details: `Rejected KYC document (${verification.documentType}) for User ${verification.userId}. Reason: ${finalReason} (Category: ${finalCategory})`,
      metadata: {
        verificationId: verification._id,
        userId: verification.userId,
        rejectionReason: finalReason,
        rejectionCategory: finalCategory
      }
    });

    // 4. Tell the candidate why it was rejected so they can re-submit
    await notificationService.verificationReviewed({
      userId: verification.userId,
      profileId: verification.profileId,
      approved: false,
      reason: finalReason
    });

    return success(res, 'KYC verification rejected with reason recorded', {
      verification,
      userVerificationStatus: user ? user.verificationStatus : VERIFICATION_STATUS.REJECTED
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitVerification,
  getVerificationStatus,
  getMySubmissions,
  getAdminVerifications,
  getAdminVerificationById,
  approveVerification,
  rejectVerification
};
