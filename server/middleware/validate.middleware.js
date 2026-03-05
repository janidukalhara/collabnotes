/**
 * middleware/validate.middleware.js
 *
 * Wraps express-validator's `validationResult` and returns 422 when there
 * are validation errors, so controllers can assume input is valid.
 */

const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { validate };
