/**
 * Super Admin Database Seed Script (Idempotent)
 * Default: admin@matrimonyhub.com / admin123
 */

const { connectDB, disconnectDB } = require('../config/db');
const Admin = require('../models/Admin');
const logger = require('../utils/logger');
const { ADMIN_ROLES } = require('../config/constants');

const seedAdmin = async () => {
  const defaultAdmin = {
    name: 'Super Administrator',
    email: 'admin@matrimonyhub.com',
    password: 'admin123',
    role: ADMIN_ROLES.SUPER_ADMIN,
    status: 'Active',
    preferences: {
      notifyVerifications: true,
      notifyComplaints: true,
      notifyPayments: true
    }
  };

  try {
    let admin = await Admin.findOne({ email: defaultAdmin.email });

    if (!admin) {
      admin = new Admin(defaultAdmin);
      await admin.save();
      logger.info(`[SEED] Default Super Admin created: ${defaultAdmin.email}`);
    } else {
      admin.name = defaultAdmin.name;
      admin.password = defaultAdmin.password; // Triggers pre-save bcrypt hash
      admin.role = ADMIN_ROLES.SUPER_ADMIN;
      admin.status = 'Active';
      await admin.save();
      logger.info(`[SEED] Default Super Admin updated/verified: ${defaultAdmin.email}`);
    }

    return admin;
  } catch (error) {
    logger.error(`[SEED ERROR] Failed to seed Super Admin: ${error.message}`);
    throw error;
  }
};

// If run directly from CLI
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedAdmin();
      await disconnectDB();
      logger.info('[SEED] Super Admin seeding completed successfully.');
      process.exit(0);
    } catch (err) {
      logger.error(`[SEED FATAL] ${err.message}`);
      process.exit(1);
    }
  })();
}

module.exports = seedAdmin;
