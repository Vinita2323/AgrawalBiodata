/**
 * Audit Trail Controller
 * Immutable Administrative Action Querying
 * Agrawal Matrimony Platform
 */

const AuditLog = require('../models/AuditLog');
const { success, notFound, paginate } = require('../utils/apiResponse');

/**
 * 1. Admin: Query Immutable Audit Trail Logs
 * GET /api/admin/audit-logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const {
      adminId,
      actor,
      adminName,
      action,
      target,
      search,
      q,
      startDate,
      fromDate,
      endDate,
      toDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    if (typeof adminId === 'string' && adminId.trim() !== '') {
      filter.adminId = adminId.trim();
    }

    const actorQuery = typeof actor === 'string' ? actor : typeof adminName === 'string' ? adminName : '';
    if (actorQuery && actorQuery.trim() !== '') {
      const sanitized = actorQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.adminName = new RegExp(sanitized, 'i');
    }

    if (typeof action === 'string' && action.trim() !== '') {
      const sanitized = action.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.action = new RegExp(sanitized, 'i');
    }

    if (typeof target === 'string' && target.trim() !== '') {
      const sanitized = target.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.target = new RegExp(sanitized, 'i');
    }

    // Date range filtering
    const start = typeof startDate === 'string' ? startDate : typeof fromDate === 'string' ? fromDate : null;
    const end = typeof endDate === 'string' ? endDate : typeof toDate === 'string' ? toDate : null;

    if (start || end) {
      filter.createdAt = {};
      if (start && !isNaN(new Date(start).getTime())) {
        filter.createdAt.$gte = new Date(start);
      }
      if (end && !isNaN(new Date(end).getTime())) {
        const endD = new Date(end);
        // Include full day if only date is passed
        endD.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endD;
      }
    }

    // Global search query
    const searchQuery = typeof search === 'string' ? search : typeof q === 'string' ? q : '';
    if (searchQuery && searchQuery.trim() !== '') {
      const sanitized = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(sanitized, 'i');
      filter.$or = [
        { logId: regex },
        { action: regex },
        { target: regex },
        { details: regex },
        { adminName: regex }
      ];
    }

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' || sortOrder === '1' ? 1 : -1;

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('adminId', 'name email role')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    return paginate(res, logs, page, limit, total, 'Audit logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Admin: Get Single Audit Log Details
 * GET /api/admin/audit-logs/:id
 */
const getAuditLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findById(id).populate('adminId', 'name email role');
    if (!log) {
      return notFound(res, `Audit log not found with ID: ${id}`);
    }

    return success(res, 'Audit log details retrieved successfully', { log });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById
};
