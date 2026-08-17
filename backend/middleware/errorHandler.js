/**
 * Centralized Error Handling Middleware
 */

const logger = require('../utils/logger');
const { error, notFound, badRequest, unauthorized } = require('../utils/apiResponse');

// 404 Route Not Found Middleware
const notFoundHandler = (req, res, next) => {
  return notFound(res, `Route not found: ${req.method} ${req.originalUrl}`);
};

// Global Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || 'INTERNAL_ERROR';
  let errors = err.errors || null;

  // Log error stack in development and test when not 4xx
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, { stack: err.stack });
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Database validation failed';
    errorCode = 'VALIDATION_ERROR';
    errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return badRequest(res, message, errors, errorCode);
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const val = err.keyValue ? err.keyValue[field] : '';
    message = `Duplicate value '${val}' for field '${field}'. It must be unique.`;
    errorCode = 'DUPLICATE_KEY_ERROR';
    return badRequest(res, message, [{ field, message }], errorCode);
  }

  // Handle Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for parameter: ${err.path}`;
    errorCode = 'INVALID_ID_FORMAT';
    return badRequest(res, message, null, errorCode);
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return unauthorized(res, 'Invalid authentication token');
  }

  if (err.name === 'TokenExpiredError') {
    return unauthorized(res, 'Authentication token has expired');
  }

  // Handle Multer File Upload Errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    errorCode = 'FILE_UPLOAD_ERROR';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds maximum allowed limit (5MB)';
    } else {
      message = `File upload error: ${err.message}`;
    }
    return badRequest(res, message, null, errorCode);
  }

  return error(res, message, statusCode, errorCode, errors);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
