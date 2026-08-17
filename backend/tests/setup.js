/**
 * Jest Global Test Setup (MongoDB Memory Server)
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET = 'test_jwt_access_secret_key_12345';
  process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_key_12345';
  process.env.JWT_ADMIN_SECRET = 'test_jwt_admin_secret_key_12345';
  process.env.OTP_EXPIRY_SECONDS = '300';
  process.env.OTP_COOLDOWN_SECONDS = '2'; // 2s cooldown in tests for fast testing

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDB(uri);
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  await disconnectDB();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
