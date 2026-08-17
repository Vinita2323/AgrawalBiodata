/**
 * Admin Authentication & Profile Controller
 */

const Admin = require('../models/Admin');
const { signAdminToken } = require('../utils/token');
const { success, badRequest, unauthorized, forbidden } = require('../utils/apiResponse');
const auditService = require('../services/auditService');

/**
 * @desc    Authenticate Admin using email and password
 * @route   POST /api/admin/auth/login
 * @access  Public
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return badRequest(res, 'Both email and password are required');
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const admin = await Admin.findOne({ email: cleanEmail });

    if (!admin) {
      return unauthorized(res, 'Invalid email or password credentials');
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return unauthorized(res, 'Invalid email or password credentials');
    }

    if (admin.status !== 'Active') {
      return forbidden(res, 'This admin account has been deactivated. Please contact Super Admin.');
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    // Log admin login to audit trail
    await auditService.logAction({
      adminId: admin._id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Admin Login',
      target: `Admin Account: ${admin.email}`,
      details: 'Successful administrator login',
      ipAddress: req.ip
    });

    const token = signAdminToken(admin);

    return success(res, 'Admin authentication successful', {
      token,
      admin: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        lastLoginAt: admin.lastLoginAt,
        preferences: admin.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged in admin details
 * @route   GET /api/admin/auth/profile
 * @access  Private (Admin)
 */
const getAdminProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.adminId);
    if (!admin) {
      return unauthorized(res, 'Admin account not found');
    }

    return success(res, 'Admin profile fetched successfully', {
      admin: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        lastLoginAt: admin.lastLoginAt,
        preferences: admin.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update admin account password
 * @route   PUT /api/admin/auth/password
 * @access  Private (Admin)
 */
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return badRequest(res, 'Both current password and new password are required');
    }

    if (newPassword.length < 6) {
      return badRequest(res, 'New password must be at least 6 characters long');
    }

    const admin = await Admin.findById(req.admin.adminId);
    if (!admin) {
      return unauthorized(res, 'Admin account not found');
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return badRequest(res, 'Current password entered is incorrect');
    }

    admin.password = newPassword;
    await admin.save();

    await auditService.logAction({
      adminId: admin._id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Updated Password',
      target: `Admin Account: ${admin.email}`,
      details: 'Administrator successfully modified their login password',
      ipAddress: req.ip
    });

    return success(res, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update admin profile name and email
 * @route   PUT /api/admin/settings/profile
 * @access  Private (Admin)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const admin = await Admin.findById(req.admin.adminId);

    if (!admin) {
      return unauthorized(res, 'Admin not found');
    }

    if (name) admin.name = name.trim();
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      // Check if email already taken by another admin
      const existing = await Admin.findOne({ email: cleanEmail, _id: { $ne: admin._id } });
      if (existing) {
        return badRequest(res, 'Email is already in use by another admin');
      }
      admin.email = cleanEmail;
    }

    await admin.save();

    await auditService.logAction({
      adminId: admin._id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'Updated Admin Profile Credentials',
      target: `Admin Account: ${admin.email}`,
      details: 'Admin updated their profile details',
      ipAddress: req.ip
    });

    return success(res, 'Profile updated successfully', {
      admin: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
        preferences: admin.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update admin notification preferences
 * @route   PUT /api/admin/settings/preferences
 * @access  Private (Admin)
 */
const updatePreferences = async (req, res, next) => {
  try {
    const { notifyVerifications, notifyComplaints, notifyPayments } = req.body;
    const admin = await Admin.findById(req.admin.adminId);

    if (!admin) {
      return unauthorized(res, 'Admin not found');
    }

    if (typeof notifyVerifications === 'boolean') admin.preferences.notifyVerifications = notifyVerifications;
    if (typeof notifyComplaints === 'boolean') admin.preferences.notifyComplaints = notifyComplaints;
    if (typeof notifyPayments === 'boolean') admin.preferences.notifyPayments = notifyPayments;

    await admin.save();

    return success(res, 'Preferences saved successfully', {
      preferences: admin.preferences
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminLogin,
  getAdminProfile,
  updatePassword,
  updateProfile,
  updatePreferences
};
