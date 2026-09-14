/**
 * localStorage that cannot crash the app.
 *
 * Reading `window.localStorage` is not safe in itself. An Android WebView built
 * with `setDomStorageEnabled(false)` - the platform default - and a browser with
 * site data blocked both throw SecurityError on *property access*, before any
 * get/set call is made. `isAuthenticated()` did exactly that during the first
 * render, so the whole React tree came down and the app showed nothing but a
 * blank dark screen. That is the "app does not open or load" the Play review
 * reported.
 *
 * Every operation below degrades to an in-memory Map instead of throwing, so a
 * session still works for as long as the app stays open even where nothing can
 * be persisted.
 */

/** Fallback store used when the real one is unreachable. */
const memoryStore = new Map();

let backingStore;
let probed = false;

/**
 * Resolves the real localStorage once, or null if it is unusable.
 *
 * Probed with an actual write: Safari's private mode exposes the object and
 * then throws QuotaExceededError on the first setItem, so merely reaching the
 * property proves nothing.
 */
function resolveStore() {
  if (probed) return backingStore;
  probed = true;
  backingStore = null;

  try {
    if (typeof window === 'undefined') return null;
    const store = window.localStorage;
    if (!store) return null;

    const probeKey = '__storage_probe__';
    store.setItem(probeKey, '1');
    store.removeItem(probeKey);
    backingStore = store;
  } catch {
    backingStore = null;
  }

  return backingStore;
}

/**
 * Whether values written here survive an app restart. Callers that must warn a
 * user their session will not be remembered can check this; nothing else needs
 * to care, because reads and writes work either way.
 */
export function isPersistent() {
  return resolveStore() !== null;
}

export function getItem(key) {
  const store = resolveStore();
  if (store) {
    try {
      return store.getItem(key);
    } catch {
      // Fall through to memory - the store went away mid-session.
    }
  }
  return memoryStore.has(key) ? memoryStore.get(key) : null;
}

export function setItem(key, value) {
  const stringValue = String(value);
  memoryStore.set(key, stringValue);

  const store = resolveStore();
  if (!store) return false;
  try {
    store.setItem(key, stringValue);
    return true;
  } catch {
    // Over quota, or storage revoked. The memory copy above still stands.
    return false;
  }
}

export function removeItem(key) {
  memoryStore.delete(key);

  const store = resolveStore();
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    // Nothing to do - the key is already gone from the memory store.
  }
}

/** Reads a JSON value, returning `fallback` for missing or corrupt entries. */
export function getJson(key, fallback = null) {
  const raw = getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Writes a JSON value. Non-serializable input is dropped rather than thrown. */
export function setJson(key, value) {
  try {
    return setItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

export const safeStorage = {
  getItem,
  setItem,
  removeItem,
  getJson,
  setJson,
  isPersistent
};

export default safeStorage;
