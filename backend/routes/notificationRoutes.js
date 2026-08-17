/**
 * Notification Routes
 * Agrawal Matrimony Platform
 */

const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

router.use(auth);

// Preferences must be declared before the /:id routes so "preferences" is not
// captured as a notification id.
router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);

router.get('/unread-count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllRead);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
