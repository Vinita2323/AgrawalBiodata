/**
 * Firebase App + Cloud Messaging Client
 * Agrawal Matrimony Platform
 *
 * These config values are public client identifiers (not secrets) issued by
 * Firebase Console > Project Settings > General, safe to ship in the bundle.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

/**
 * Messaging is unavailable in some browsers (Safari < 16.4, private/incognito
 * restrictions on IndexedDB, no service worker support). Resolves null there
 * instead of throwing so callers degrade gracefully.
 */
export async function getMessagingIfSupported() {
  try {
    if (!firebaseConfig.apiKey || !(await isSupported())) return null;
    return getMessaging(firebaseApp);
  } catch {
    return null;
  }
}

export default firebaseApp;
