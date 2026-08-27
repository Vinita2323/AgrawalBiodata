/**
 * Writes the Firebase web config into the built service worker.
 *
 * `public/firebase-messaging-sw.js` is copied to `dist/` verbatim - Vite does
 * not substitute env vars in `public/`. Editing the tracked file by hand is a
 * trap: it is under version control, so `git reset --hard origin/main` on the
 * next deploy silently reverts it to placeholders and web push stops working
 * with nothing obvious to point at.
 *
 * So the tracked file stays a template, and this step rewrites only the build
 * output. The values come from frontend/.env like every other VITE_* value,
 * which means a deploy needs no manual file edits and the working tree stays
 * clean.
 *
 * Runs after `vite build`. Missing config is a warning, not a failure: the
 * rest of the app works fine without push.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SW = path.join(root, 'dist', 'firebase-messaging-sw.js');

/** Minimal .env reader - the frontend has no dotenv dependency. */
function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

// Real environment wins, so CI/hosting secrets override a checked-out .env.
const fileEnv = {
  ...readEnvFile(path.join(root, '.env')),
  ...readEnvFile(path.join(root, '.env.production')),
};
const readVar = (name) => process.env[name] || fileEnv[name] || '';

const FIELDS = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
};

if (!fs.existsSync(SW)) {
  console.warn('[sw-config] dist/firebase-messaging-sw.js not found - skipped.');
  process.exit(0);
}

const missing = Object.values(FIELDS).filter((name) => !readVar(name));
if (missing.length === Object.keys(FIELDS).length) {
  console.warn(
    '[sw-config] No VITE_FIREBASE_* values found. Background push will stay disabled.\n' +
      '            Set them in frontend/.env and rebuild to enable it.'
  );
  process.exit(0);
}

let source = fs.readFileSync(SW, 'utf8');
let replaced = 0;

for (const [key, envName] of Object.entries(FIELDS)) {
  const value = readVar(envName);
  if (!value) continue;
  // Matches `key: '<anything>'` inside the initializeApp block.
  const pattern = new RegExp(`(${key}\\s*:\\s*)(['"])(?:\\\\.|(?!\\2)[^\\\\])*\\2`);
  if (!pattern.test(source)) {
    console.warn(`[sw-config] could not locate "${key}" in the service worker.`);
    continue;
  }
  source = source.replace(pattern, `$1'${value.replace(/'/g, "\\'")}'`);
  replaced++;
}

fs.writeFileSync(SW, source);

if (missing.length) {
  console.warn(`[sw-config] missing values: ${missing.join(', ')}`);
}
console.log(`[sw-config] injected ${replaced}/${Object.keys(FIELDS).length} Firebase values into dist/firebase-messaging-sw.js`);
