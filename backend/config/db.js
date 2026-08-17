/**
 * Database Connection Setup (MongoDB with Mongoose)
 */

const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

let isConnected = false;

const connectDB = async (customUri = null) => {
  const uri = customUri || env.MONGODB_URI;

  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    isConnected = true;
    if (env.NODE_ENV !== 'test') {
      logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    }

    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    if (env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  if (env.NODE_ENV !== 'test') {
    logger.warn('MongoDB disconnected. Reconnecting...');
  }
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection event error: ${err.message}`);
});

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  mongoose
};
