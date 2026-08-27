// Firebase Cloud Messaging Service Worker
// Agrawal Matrimony Platform
//
// Handles push delivery while the app is backgrounded or closed. This file
// is served as a static asset (Vite does not process public/), so the config
// values below must be filled in by hand - see PUSH_NOTIFICATIONS_SOP.md.
// These are public client identifiers, not secrets.

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Agrawal Matrimony';
  self.registration.showNotification(title, {
    body: payload.notification?.body || '',
    icon: '/favicon.svg',
    data: payload.data || {}
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const linkTarget = event.notification.data?.linkTarget || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(linkTarget);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(linkTarget);
      }
    })
  );
});
