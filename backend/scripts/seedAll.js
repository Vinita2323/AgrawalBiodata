/**
 * Master Database Seeder
 * Runs all individual module seed scripts idempotently
 */

const { connectDB, disconnectDB } = require('../config/db');
const seedAdmin = require('./seedAdmin');
const seedPlans = require('./seedPlans');
const seedCMS = require('./seedCMS');
const seedMockData = require('./seedMockData');
const logger = require('../utils/logger');

const seedAll = async () => {
  try {
    logger.info('Starting master database seeding...');
    await seedAdmin();
    await seedPlans();
    await seedCMS();
    await seedMockData();
    logger.info('Master database seeding completed successfully.');
  } catch (error) {
    logger.error(`Database seeding failed: ${error.message}`);
    throw error;
  }
};

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedAll();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      process.exit(1);
    }
  })();
}

module.exports = seedAll;
