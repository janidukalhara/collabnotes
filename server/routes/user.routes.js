/**
 * routes/user.routes.js
 */

const { Router } = require('express');
const { body } = require('express-validator');
const { updateProfile, changePassword, searchUsers } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

router.use(protect);

router.get('/search', searchUsers);

router.put(
  '/profile',
  [body('name').optional().trim().notEmpty().withMessage('Name cannot be blank')],
  validate,
  updateProfile
);

router.put(
  '/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
  ],
  validate,
  changePassword
);

module.exports = router;
