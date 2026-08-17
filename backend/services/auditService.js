/**
 * Audit Logging Service
 */

const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

class AuditService {
  /**
   * Records an immutable audit log entry for administrative/security actions
   * @param {object} params
   * @param {string} [params.adminId]
   * @param {string} [params.adminName]
   * @param {string} [params.adminRole]
   * @param {string} params.action
   * @param {string} [params.target]
   * @param {string} [params.details]
   * @param {string} [params.ipAddress]
   * @param {object} [params.metadata]
   * @returns {Promise<object|null>}
   */
  async logAction({
    adminId = null,
    adminName = 'System',
    adminRole = 'Super Admin',
    action,
    target = '',
    details = '',
    ipAddress = '',
    metadata = {}
  }) {
    try {
      if (!action) return null;

      const log = new AuditLog({
        adminId,
        adminName,
        adminRole,
        action,
        target,
        details,
        ipAddress,
        metadata
      });

      await log.save();
      return log;
    } catch (error) {
      logger.error(`Failed to record audit log: ${error.message}`);
      return null;
    }
  }
}

module.exports = new AuditService();
