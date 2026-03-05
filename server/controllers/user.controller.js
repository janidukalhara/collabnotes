/**
 * controllers/user.controller.js
 */

const User = require('../models/User');

// ─── Update profile ───────────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// ─── Change password ──────────────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Search users by email (used when adding collaborators) ──────────────────
const searchUsers = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email query required.' });

    const users = await User.find({
      email: { $regex: email, $options: 'i' },
      _id: { $ne: req.user._id },
    })
      .select('name email avatar')
      .limit(10);

    res.json({ users });
  } catch (err) {
    next(err);
  }
};

module.exports = { updateProfile, changePassword, searchUsers };
