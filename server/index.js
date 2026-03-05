/**
 * index.js — CollabNotes API entry point
 *
 * Boots Express, registers all middleware and routes, then connects to MongoDB.
 * The server only starts listening once the DB connection is established so that
 * the health-check endpoint is reliable from the first request.
 */

require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`🚀  CollabNotes API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
})();

// Unhandled promise rejections → log and exit with non-zero code
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});
