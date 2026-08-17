/**
 * Standardized API Response Helpers
 */

const success = (res, message = 'Success', data = null, statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  if (meta !== null && meta !== undefined) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

const created = (res, message = 'Resource created successfully', data = null, meta = null) => {
  return success(res, message, data, 201, meta);
};

const error = (res, message = 'Internal Server Error', statusCode = 500, code = 'INTERNAL_ERROR', errors = null) => {
  const response = {
    success: false,
    message,
    error: message,
    code
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

const badRequest = (res, message = 'Bad Request', errors = null, code = 'BAD_REQUEST') => {
  return error(res, message, 400, code, errors);
};

const unauthorized = (res, message = 'Unauthorized access', code = 'UNAUTHORIZED') => {
  return error(res, message, 401, code);
};

const forbidden = (res, message = 'Forbidden access', code = 'FORBIDDEN') => {
  return error(res, message, 403, code);
};

const notFound = (res, message = 'Resource not found', code = 'NOT_FOUND') => {
  return error(res, message, 404, code);
};

const tooManyRequests = (res, message = 'Too many requests, please try again later', code = 'RATE_LIMIT_EXCEEDED', meta = null) => {
  const response = {
    success: false,
    message,
    error: message,
    code
  };
  if (meta) {
    response.meta = meta;
  }
  return res.status(429).json(response);
};

const paginate = (res, items = [], page = 1, limit = 10, total = 0, message = 'Data fetched successfully') => {
  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = parseInt(page, 10) || 1;
  const currentLimit = parseInt(limit, 10) || 10;

  return res.status(200).json({
    success: true,
    message,
    data: {
      items,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      }
    }
  });
};

module.exports = {
  success,
  created,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  tooManyRequests,
  paginate
};
