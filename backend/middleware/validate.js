/**
 * Express Validator Middleware Wrapper
 */

const { validationResult } = require('express-validator');
const { badRequest } = require('../utils/apiResponse');

const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return badRequest(res, 'Validation failed. Please check your inputs.', formattedErrors);
  };
};

module.exports = validate;
