/**
 * Admin Authentication Middleware (JWT Bearer Token with Role Verification)
 */

const { verifyAdminToken } = require('../utils/token');
const { unauthorized, forbidden } = require('../utils/apiResponse');
const Admin = require('../models/Admin');

const adminAuth = (allowedRoles = ['Super Admin', 'Moderator']) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return unauthorized(res, 'Admin authentication required. No Bearer token provided.');
      }

      const token = authHeader.split(' ')[1];
      const decoded = verifyAdminToken(token);

      if (!decoded || !decoded.adminId) {
        return unauthorized(res, 'Invalid or expired admin access token');
      }

      const admin = await Admin.findById(decoded.adminId);
      if (!admin) {
        return unauthorized(res, 'Admin account not found');
      }

      if (admin.status !== 'Active') {
        return forbidden(res, 'Admin account is currently inactive or deactivated');
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(admin.role)) {
        return forbidden(res, `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`);
      }

      req.admin = {
        adminId: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
        adminDoc: admin
      };

      next();
    } catch (error) {
      return unauthorized(res, 'Admin authentication verification failed');
    }
  };
};

module.exports = adminAuth;
