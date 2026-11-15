export const LOCAL_SCRAPS_KEY = 'scraplens_local_scraps_v2';
export const LOCAL_LISTINGS_KEY = 'scraplens_local_listings_v2';

// Older builds pre-seeded fictitious demo fixtures under these keys.
// Clearing them automatically guarantees returning browsers never see stale fake data.
const LEGACY_DEMO_KEYS = ['scraplens_user_scraps_v1', 'scraplens_user_listings_v1'];

/**
 * Clears the client-side demo session cookie.
 */
export function clearDemoSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'scraplens_demo_session=; path=/; max-age=0';
}

/**
 * Removes legacy pre-seeded demo localStorage keys if present.
 */
export function purgeLegacyDemoStorage() {
  if (typeof window === 'undefined') return;
  try {
    for (const legacyKey of LEGACY_DEMO_KEYS) {
      window.localStorage.removeItem(legacyKey);
    }
  } catch {
    // Ignore storage access restrictions (e.g. private mode quotas)
  }
}

/**
 * Clears all local demo/portal data and legacy demo keys from localStorage.
 */
export function clearLocalPortalStorage() {
  if (typeof window === 'undefined') return;
  try {
    purgeLegacyDemoStorage();
    window.localStorage.removeItem(LOCAL_SCRAPS_KEY);
    window.localStorage.removeItem(LOCAL_LISTINGS_KEY);
  } catch {
    // Ignore storage access errors
  }
}

/**
 * Reads a persisted collection from localStorage without ever seeding fake data.
 * Filters out any legacy `is_demo: true` records defensively.
 */
export function readLocalCollection(key) {
  if (typeof window === 'undefined') return [];

  try {
    purgeLegacyDemoStorage();
    const stored = window.localStorage.getItem(key);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && item.is_demo !== true);
  } catch {
    return [];
  }
}

/**
 * Writes a collection array cleanly to localStorage.
 */
export function writeLocalCollection(key, items) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.warn('[local-store] Storage write failed:', err);
  }
}

/**
 * Generates a unique identifier preferring Web Crypto UUIDs with a safe fallback.
 */
export function generateEntityId(prefix = 'item') {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

