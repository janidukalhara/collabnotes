/**
 * config/db.js — MongoDB connection via Mongoose
 */

const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.error('MONGODB_URI is not defined. Check your .env file.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      // Mongoose 7+ drops the need for most legacy options, but we keep
      // serverSelectionTimeoutMS to fail fast in CI.
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
