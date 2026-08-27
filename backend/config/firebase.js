/**
 * Firebase Admin SDK Initialization (Cloud Messaging)
 *
 * Push is optional infrastructure layered on top of the in-app notification
 * feed: when no service account is configured (local dev, CI, or before
 * Firebase is set up in the console) `getMessaging()` returns null and
 * callers skip sending instead of throwing.
 */

const path = require('path');
const admin = require('firebase-admin');
const env = require('./env');
const logger = require('../utils/logger');

let messaging = null;

try {
  let credential = null;

  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    credential = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    credential = require(path.resolve(env.FIREBASE_SERVICE_ACCOUNT_PATH));
  }

  if (credential) {
    admin.initializeApp({ credential: admin.credential.cert(credential) });
    messaging = admin.messaging();
    logger.info('Firebase Admin initialized - push notifications enabled');
  } else {
    logger.warn('Firebase not configured (FIREBASE_SERVICE_ACCOUNT_PATH/_JSON unset) - push notifications disabled');
  }
} catch (error) {
  logger.error(`Firebase Admin initialization failed: ${error.message}`);
}

module.exports = { getMessaging: () => messaging };
