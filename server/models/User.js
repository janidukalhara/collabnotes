/**
 * models/User.js
 *
 * Stores credentials and profile info.  Passwords are hashed with bcrypt
 * before save; the model exposes a comparePassword helper so controllers
 * never touch the raw hash.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries by default
    },
    avatar: {
      type: String,
      default: '',
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

// ─── Pre-save hook: hash password only when it changes ────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance method: safe password comparison ────────────────────────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Transform: strip sensitive fields from JSON output ───────────────────────
UserSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);
