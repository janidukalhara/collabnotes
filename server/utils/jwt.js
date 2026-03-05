/**
 * utils/jwt.js — Token generation and verification helpers
 *
 * Access tokens are short-lived (default 15 m).
 * Refresh tokens are long-lived (default 7 d) and stored hashed in the DB.
 */

const jwt = require('jsonwebtoken');

/**
 * Sign an access token for the given user.
 * @param {Object} payload  — data to embed (typically { id, email })
 * @returns {string}
 */
const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

/**
 * Sign a refresh token.
 * @param {Object} payload
 * @returns {string}
 */
const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

/**
 * Verify an access token.
 * @param {string} token
 * @returns {Object} decoded payload
 * @throws {JsonWebTokenError | TokenExpiredError}
 */
const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

/**
 * Verify a refresh token.
 * @param {string} token
 * @returns {Object} decoded payload
 */
const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
