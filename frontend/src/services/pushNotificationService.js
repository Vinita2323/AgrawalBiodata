/**
 * Web Push Notification Service (Firebase Cloud Messaging)
 * Agrawal Matrimony Platform
 *
 * Registers this browser for push delivery: service worker -> permission ->
 * FCM token -> backend. Every step degrades to a no-op instead of throwing,
 * so a browser without notification support (or a user who denies
 * permission) never breaks the rest of the app.
 */

import { getMessagingIfSupported } from '../firebase';
import { saveFcmToken as saveFcmTokenOnBackend, removeFcmToken as removeFcmTokenOnBackend } from './notificationService';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const STORAGE_KEY = 'fcm_token_web';

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  // register() resolves once the registration exists, not once it is active -
  // subscribing to push before activation throws "no active Service Worker".
  await navigator.serviceWorker.ready;
  return registration;
}

/**
 * Requests permission (only if not already decided) and registers the
 * resulting FCM token with the backend. A no-op once a token is already
 * stored for this browser, unless `force` is set - e.g. a user clicking an
 * explicit "Enable notifications" button.
 * @param {boolean} force
 * @returns {Promise<string|null>} the FCM token, or null if unavailable/denied
 */
export async function registerFcmToken(force = false) {
  try {
    if (!force && localStorage.getItem(STORAGE_KEY)) {
      return localStorage.getItem(STORAGE_KEY);
    }

    if (!VAPID_KEY) {
      console.warn('[push] VITE_FIREBASE_VAPID_KEY is not set - this build cannot register for push. Set it in frontend/.env and rebuild.');
      return null;
    }

    const messaging = await getMessagingIfSupported();
    if (!messaging) {
      console.warn('[push] Firebase Messaging is unsupported here. It needs HTTPS (or localhost) and a browser with the Push API - iOS Safari only supports it for installed web apps.');
      return null;
    }

    if (typeof Notification === 'undefined') {
      console.warn('[push] This browser has no Notification API.');
      return null;
    }
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn(`[push] Notification permission was not granted (got "${permission}").`);
        return null;
      }
    } else if (Notification.permission !== 'granted') {
      console.warn('[push] Notifications are blocked for this site. Clear the block in the browser site settings to re-enable.');
      return null;
    }

    const registration = await registerServiceWorker();
    if (!registration) {
      console.warn('[push] Service workers are unavailable, so /firebase-messaging-sw.js could not be registered.');
      return null;
    }

    const { getToken } = await import('firebase/messaging');
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    if (!token) {
      console.warn('[push] Firebase returned no token. Usually the VAPID key does not belong to this Firebase project.');
      return null;
    }

    await saveFcmTokenOnBackend(token);
    localStorage.setItem(STORAGE_KEY, token);
    return token;
  } catch (error) {
    console.error('FCM token registration failed:', error);
    return null;
  }
}

/**
 * Re-registers only if the browser already granted permission - safe to call
 * on every app load / login without ever showing a fresh permission prompt.
 */
export async function registerFcmTokenIfPermitted() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null;
  return registerFcmToken(false);
}

/** Unregisters this browser's token from the backend, e.g. on logout. */
export async function unregisterFcmToken() {
  const token = localStorage.getItem(STORAGE_KEY);
  if (!token) return;

  try {
    await removeFcmTokenOnBackend(token);
  } catch {
    // Ignore - logout must proceed regardless.
  } finally {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Subscribes to messages received while the app tab is focused (the service
 * worker only fires for background/closed tabs).
 * @returns {Promise<Function>} unsubscribe function
 */
export async function onForegroundPush(handler) {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};

  const { onMessage } = await import('firebase/messaging');
  return onMessage(messaging, handler);
}

export default { registerFcmToken, registerFcmTokenIfPermitted, unregisterFcmToken, onForegroundPush };
