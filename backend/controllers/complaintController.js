/**
 * Complaint & Abuse Moderation Controller
 * Agrawal Matrimony Platform
 */

const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Profile = require('../models/Profile');
const auditService = require('../services/auditService');
const { success, created, badRequest, notFound, paginate } = require('../utils/apiResponse');

/**
 * 1. User: Report Abuse / File a Complaint
 * POST /api/complaints
 */
const submitComplaint = async (req, res, next) => {
  try {
    const reporterUserId = req.user.userId;
    const reporterProfileId = req.user.activeProfileId || null;

    const {
      reportedUserId,
      reportedProfileId,
      reason,
      category = 'Other',
      description = '',
      evidenceUrls = []
    } = req.body;

    if (!reason || reason.trim() === '') {
      return badRequest(res, 'Complaint reason is required');
    }

    if (!reportedUserId && !reportedProfileId) {
      return badRequest(res, 'Target reported user ID or profile ID is required');
    }

    // Resolve reportedUserId if only reportedProfileId provided
    let finalReportedUserId = reportedUserId || null;
    let finalReportedProfileId = reportedProfileId || null;

    if (!finalReportedUserId && finalReportedProfileId) {
      const profile = await Profile.findById(finalReportedProfileId);
      if (profile && profile.userId) {
        finalReportedUserId = profile.userId;
      }
    }

    if (!finalReportedProfileId && finalReportedUserId) {
      const user = await User.findById(finalReportedUserId);
      if (user && user.activeProfileId) {
        finalReportedProfileId = user.activeProfileId;
      }
    }

    // Check that user is not reporting themselves
    if (finalReportedUserId && String(finalReportedUserId) === String(reporterUserId)) {
      return badRequest(res, 'You cannot report your own account');
    }

    const complaint = new Complaint({
      reporterUserId,
      reporterProfileId,
      reportedUserId: finalReportedUserId,
      reportedProfileId: finalReportedProfileId,
      reason: reason.trim(),
      category: category || 'Other',
      description: description ? description.trim() : '',
      evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [evidenceUrls].filter(Boolean),
      status: 'Pending'
    });

    await complaint.save();

    return created(res, 'Abuse report submitted successfully. Our safety moderation team will review it.', {
      complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. User: Get My Submitted Reports
 * GET /api/complaints/my-reports
 */
const getMyReports = async (req, res, next) => {
  try {
    const reporterUserId = req.user.userId;
    const complaints = await Complaint.find({ reporterUserId })
      .populate('reportedUserId', 'name mobile accountStatus')
      .populate('reportedProfileId', 'fullName profileId gotra')
      .sort({ createdAt: -1 });

    return success(res, 'Your submitted reports retrieved successfully', {
      complaints,
      count: complaints.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Admin: List All Complaints (with filters, search & pagination)
 * GET /api/admin/complaints
 */
const getAdminComplaints = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { status, category, search, q } = req.query;

    const filter = {};

    if (typeof status === 'string' && status !== 'All') {
      filter.status = status;
    }

    if (typeof category === 'string' && category !== 'All') {
      filter.category = category;
    }

    const searchQuery = typeof search === 'string' ? search : typeof q === 'string' ? q : '';
    if (searchQuery && searchQuery.trim() !== '') {
      const sanitized = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(sanitized, 'i');
      filter.$or = [
        { complaintId: regex },
        { reason: regex },
        { description: regex }
      ];
    }

    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .populate('reporterUserId', 'name mobile email verificationStatus accountStatus')
      .populate('reportedUserId', 'name mobile email verificationStatus accountStatus')
      .populate('reporterProfileId', 'fullName profileId gotra gender')
      .populate('reportedProfileId', 'fullName profileId gotra gender verified')
      .populate('resolvedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return paginate(res, complaints, page, limit, total, 'Complaints retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Admin: Inspect Complaint Details
 * GET /api/admin/complaints/:id
 */
const getAdminComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id)
      .populate('reporterUserId', 'name mobile email verificationStatus accountStatus createdAt')
      .populate('reportedUserId', 'name mobile email verificationStatus accountStatus createdAt')
      .populate('reporterProfileId')
      .populate('reportedProfileId')
      .populate('resolvedBy', 'name email role');

    if (!complaint) {
      return notFound(res, `Complaint not found with ID: ${id}`);
    }

    return success(res, 'Complaint details retrieved successfully', { complaint });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Admin: Resolve Complaint with Resolution Action
 * PUT /api/admin/complaints/:id/resolve
 */
const resolveComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolutionAction, action, adminNotes = '', status } = req.body;

    const chosenAction = resolutionAction || action;
    const allowedActions = ['Warning Sent', 'User Suspended', 'Profile Removed', 'Dismissed'];

    if (!chosenAction || !allowedActions.includes(chosenAction)) {
      return badRequest(res, `Valid resolutionAction is required. Must be one of: ${allowedActions.join(', ')}`);
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return notFound(res, `Complaint not found with ID: ${id}`);
    }

    const adminId = req.admin ? req.admin.adminId : null;
    const adminName = req.admin ? req.admin.name : 'Super Admin';
    const adminRole = req.admin ? req.admin.role : 'Super Admin';

    complaint.resolutionAction = chosenAction;
    complaint.adminNotes = adminNotes || complaint.adminNotes;
    complaint.resolvedBy = adminId;
    complaint.resolvedByName = adminName;
    complaint.resolvedAt = new Date();
    complaint.status = status || (chosenAction === 'Dismissed' ? 'Dismissed' : 'Resolved');

    await complaint.save();

    // If resolutionAction === 'User Suspended', automatically suspend the reported user
    if (chosenAction === 'User Suspended') {
      let targetUserId = complaint.reportedUserId;
      if (!targetUserId && complaint.reportedProfileId) {
        const profile = await Profile.findById(complaint.reportedProfileId);
        if (profile && profile.userId) {
          targetUserId = profile.userId;
        }
      }

      if (targetUserId) {
        await User.findByIdAndUpdate(targetUserId, {
          accountStatus: 'Suspended'
        });

        // Log specific suspension audit log
        await auditService.logAction({
          adminId,
          adminName,
          adminRole,
          action: 'User Suspended via Complaint Resolution',
          target: targetUserId.toString(),
          details: `User suspended following resolution of abuse complaint ${complaint.complaintId || complaint._id}. Reason: ${complaint.reason}. Admin Notes: ${adminNotes}`,
          ipAddress: req.ip,
          metadata: {
            complaintId: complaint._id,
            complaintCode: complaint.complaintId,
            reportedUserId: targetUserId,
            resolutionAction: chosenAction,
            adminNotes
          }
        });
      }
    }

    // Log complaint resolution audit log
    await auditService.logAction({
      adminId,
      adminName,
      adminRole,
      action: 'Resolved Abuse Complaint',
      target: (complaint.complaintId || complaint._id).toString(),
      details: `Resolved complaint ${complaint.complaintId || complaint._id} with action: "${chosenAction}". Notes: ${adminNotes || 'N/A'}`,
      ipAddress: req.ip,
      metadata: {
        complaintId: complaint._id,
        complaintCode: complaint.complaintId,
        resolutionAction: chosenAction,
        adminNotes
      }
    });

    return success(res, `Complaint ${complaint.complaintId || complaint._id} resolved with action: ${chosenAction}`, {
      complaint
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitComplaint,
  getMyReports,
  getAdminComplaints,
  getAdminComplaintById,
  resolveComplaint
};
