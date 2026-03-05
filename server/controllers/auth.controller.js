/**
 * controllers/auth.controller.js
 *
 * Handles register, login, refresh, logout, and getMe.
 *
 * Access tokens are returned in the JSON body.
 * Refresh tokens are also returned in the JSON body (the client should store
 * them securely — httpOnly cookie or secure storage).
 */

const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, password });

    const accessToken = signAccessToken({ id: user._id, email: user.email });
    const refreshToken = signRefreshToken({ id: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      accessToken,
      refreshToken,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (excluded by default via schema)
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const accessToken = signAccessToken({ id: user._id, email: user.email });
    const refreshToken = signRefreshToken({ id: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    // Remove password from response
    user.password = undefined;

    res.json({ accessToken, refreshToken, user });
  } catch (err) {
    next(err);
  }
};

// ─── Refresh ──────────────────────────────────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required.' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Refresh token reuse detected or user not found.' });
    }

    const newAccessToken = signAccessToken({ id: user._id, email: user.email });
    const newRefreshToken = signRefreshToken({ id: user._id });

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    req.user.refreshToken = null;
    await req.user.save();
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Get current user ─────────────────────────────────────────────────────────
const getMe = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, refresh, logout, getMe };
