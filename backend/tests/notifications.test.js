/**
 * Notification Subsystem Test Suite
 * Agrawal Matrimony Platform
 *
 * Covers:
 * 1. Notification feed listing, category filtering and pagination
 * 2. Read / read-all / unread-count semantics and cross-user isolation
 * 3. Delivery preferences (read, update, validation)
 * 4. Emission hooks from the interest and visitor flows
 */

const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');
const { signAccessToken } = require('../utils/token');
const { NOTIFICATION_TYPES } = require('../config/constants');

describe('Notification Subsystem', () => {
  let alice, bob, aliceToken, bobToken, aliceProfile, bobProfile;

  beforeEach(async () => {
    alice = await User.create({ mobile: '9811100001', name: 'Alice Garg', accountStatus: 'Active' });
    bob = await User.create({ mobile: '9811100002', name: 'Bob Bansal', accountStatus: 'Active' });

    aliceToken = signAccessToken(alice);
    bobToken = signAccessToken(bob);

    aliceProfile = await Profile.create({
      userId: alice._id,
      profileId: 'PRF-900001',
      fullName: 'Alice Garg',
      gender: 'Female',
      dob: new Date('1997-04-10'),
      gotra: 'Garg',
      motherGotra: 'Bansal',
      city: 'Jaipur'
    });

    bobProfile = await Profile.create({
      userId: bob._id,
      profileId: 'PRF-900002',
      fullName: 'Bob Bansal',
      gender: 'Male',
      dob: new Date('1995-02-20'),
      gotra: 'Bansal',
      motherGotra: 'Mittal',
      city: 'Delhi'
    });

    alice.activeProfileId = aliceProfile._id;
    alice.profiles = [aliceProfile._id];
    await alice.save();

    bob.activeProfileId = bobProfile._id;
    bob.profiles = [bobProfile._id];
    await bob.save();
  });

  describe('1. Feed listing & filtering', () => {
    beforeEach(async () => {
      await notificationService.emit({
        userId: alice._id,
        type: NOTIFICATION_TYPES.INTEREST_RECEIVED,
        title: 'Bob expressed interest'
      });
      await notificationService.emit({
        userId: alice._id,
        type: NOTIFICATION_TYPES.PROFILE_VISITED,
        title: 'Bob viewed your profile'
      });
      await notificationService.emit({
        userId: alice._id,
        type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
        title: 'Gold membership activated'
      });
    });

    it('returns the full feed newest-first with an unread count', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(3);
      expect(res.body.data.unreadCount).toBe(3);

      const timestamps = res.body.data.notifications.map((n) => new Date(n.createdAt).getTime());
      expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
    });

    it('filters by category', async () => {
      const res = await request(app)
        .get('/api/notifications?category=Interests')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.notifications[0].category).toBe('Interests');
    });

    it('rejects an unknown category', async () => {
      const res = await request(app)
        .get('/api/notifications?category=Nonsense')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(400);
    });

    it('never leaks another user notifications', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toHaveLength(0);
      expect(res.body.data.unreadCount).toBe(0);
    });

    it('requires authentication', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('2. Read state', () => {
    let notification;

    beforeEach(async () => {
      notification = await notificationService.emit({
        userId: alice._id,
        type: NOTIFICATION_TYPES.INTEREST_RECEIVED,
        title: 'Bob expressed interest'
      });
      await notificationService.emit({
        userId: alice._id,
        type: NOTIFICATION_TYPES.NEW_MATCH,
        title: 'New match found'
      });
    });

    it('marks a single notification read and decrements the unread count', async () => {
      const res = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notification.isRead).toBe(true);
      expect(res.body.data.notification.readAt).toBeTruthy();
      expect(res.body.data.unreadCount).toBe(1);
    });

    it('refuses to mark another user notification read', async () => {
      const res = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(404);

      const stillUnread = await Notification.findById(notification._id);
      expect(stillUnread.isRead).toBe(false);
    });

    it('marks every notification read', async () => {
      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.updated).toBe(2);
      expect(res.body.data.unreadCount).toBe(0);

      const remaining = await Notification.countDocuments({ userId: alice._id, isRead: false });
      expect(remaining).toBe(0);
    });

    it('reports the unread badge count', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(2);
    });

    it('deletes a notification', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${notification._id}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(await Notification.findById(notification._id)).toBeNull();
    });
  });

  describe('3. Delivery preferences', () => {
    it('returns sensible defaults', async () => {
      const res = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.preferences.newMatchAlerts).toBe(true);
      expect(res.body.data.preferences.interestAlerts).toBe(true);
      expect(res.body.data.preferences.promotionalEmails).toBe(false);
    });

    it('updates only the supplied flags', async () => {
      const res = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ interestAlerts: false });

      expect(res.status).toBe(200);
      expect(res.body.data.preferences.interestAlerts).toBe(false);
      // Untouched flags keep their previous value.
      expect(res.body.data.preferences.newMatchAlerts).toBe(true);
    });

    it('rejects a payload with no valid boolean flags', async () => {
      const res = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ nonsense: true, interestAlerts: 'yes' });

      expect(res.status).toBe(400);
    });

    it('records the notification even when its category is muted', async () => {
      await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ interestAlerts: false });

      await notificationService.emit({
        userId: alice._id,
        type: NOTIFICATION_TYPES.INTEREST_RECEIVED,
        title: 'Muted but still recorded'
      });

      // Preferences gate push delivery, not the in-app feed itself.
      const count = await Notification.countDocuments({ userId: alice._id });
      expect(count).toBe(1);
    });
  });

  describe('4. FCM device token registration', () => {
    it('registers a token and de-duplicates repeated registration', async () => {
      const first = await request(app)
        .post('/api/notifications/fcm-token')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ token: 'fcm-token-abc', platform: 'app' });
      expect(first.status).toBe(200);

      const second = await request(app)
        .post('/api/notifications/fcm-token')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ token: 'fcm-token-abc', platform: 'app' });
      expect(second.status).toBe(200);

      const stored = await User.findById(alice._id).select('fcmTokens');
      expect(stored.fcmTokens).toHaveLength(1);
      expect(stored.fcmTokens[0].token).toBe('fcm-token-abc');
      expect(stored.fcmTokens[0].platform).toBe('app');
    });

    it('rejects registration without a token', async () => {
      const res = await request(app)
        .post('/api/notifications/fcm-token')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('caps stored tokens at 10 per account, keeping the most recent', async () => {
      for (let i = 0; i < 12; i += 1) {
        await request(app)
          .post('/api/notifications/fcm-token')
          .set('Authorization', `Bearer ${aliceToken}`)
          .send({ token: `token-${i}`, platform: i % 2 === 0 ? 'web' : 'app' });
      }

      const stored = await User.findById(alice._id).select('fcmTokens');
      expect(stored.fcmTokens).toHaveLength(10);
      expect(stored.fcmTokens.map(t => t.token)).toEqual(
        Array.from({ length: 10 }, (_, i) => `token-${i + 2}`)
      );
    });

    it('removes a registered token', async () => {
      await request(app)
        .post('/api/notifications/fcm-token')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ token: 'fcm-token-remove-me', platform: 'web' });

      const res = await request(app)
        .delete('/api/notifications/fcm-token')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ token: 'fcm-token-remove-me' });
      expect(res.status).toBe(200);

      const stored = await User.findById(alice._id).select('fcmTokens');
      expect(stored.fcmTokens.map(t => t.token)).not.toContain('fcm-token-remove-me');
    });

    it('does not throw when emitting to a user with registered tokens but no Firebase credentials configured', async () => {
      await User.updateOne({ _id: alice._id }, { $set: { fcmTokens: [{ token: 'some-token', platform: 'app' }] } });

      const notification = await notificationService.emit({
        userId: alice._id,
        type: NOTIFICATION_TYPES.INTEREST_RECEIVED,
        title: 'Push attempted with no Firebase app configured'
      });

      expect(notification).not.toBeNull();
    });
  });

  describe('5. Emission from platform events', () => {
    it('notifies the recipient when an interest is expressed', async () => {
      const res = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ recipientProfileId: aliceProfile._id.toString() });

      expect(res.status).toBe(201);

      const notifications = await Notification.find({ userId: alice._id });
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe(NOTIFICATION_TYPES.INTEREST_RECEIVED);
      expect(notifications[0].title).toContain('Bob Bansal');
      expect(notifications[0].linkTarget).toBe('/interests');
    });

    it('notifies the sender when their interest is accepted', async () => {
      const sent = await request(app)
        .post('/api/interests')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ recipientProfileId: aliceProfile._id.toString() });

      await Notification.deleteMany({});

      const accepted = await request(app)
        .put(`/api/interests/${sent.body.data.interest._id}/accept`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(accepted.status).toBe(200);

      const notifications = await Notification.find({ userId: bob._id });
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe(NOTIFICATION_TYPES.INTEREST_ACCEPTED);
    });

    it('notifies a profile owner on the first visit of the day only', async () => {
      await request(app)
        .post('/api/visitors')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ visitedProfileId: aliceProfile._id.toString() });

      await request(app)
        .post('/api/visitors')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ visitedProfileId: aliceProfile._id.toString() });

      const visitNotifications = await Notification.find({
        userId: alice._id,
        type: NOTIFICATION_TYPES.PROFILE_VISITED
      });

      // Two visits, one notification - repeat views must not spam the feed.
      expect(visitNotifications).toHaveLength(1);
    });

    it('does not emit for an unknown notification type', async () => {
      const result = await notificationService.emit({
        userId: alice._id,
        type: 'NotARealType',
        title: 'Should not persist'
      });

      expect(result).toBeNull();
      expect(await Notification.countDocuments({ userId: alice._id })).toBe(0);
    });
  });
});
