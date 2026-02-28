/**
 * Helpers for Phase 13.1 — error handling (network vs 401 vs generic).
 */

/**
 * @param {Error} e
 * @returns {boolean}
 */
export function isNetworkError(e) {
  if (!e) return false;
  const msg = (e.message || '').toLowerCase();
  return (
    e.name === 'TypeError' ||
    /network|fetch|internet|connection|failed to fetch/i.test(msg)
  );
}

/**
 * @param {Error} e
 * @returns {boolean}
 */
export function isUnauthorizedError(e) {
  return !!(e && e.status === 401);
}

/**
 * Throw an error that carries HTTP status for 401 handling in hooks.
 * @param {number} status
 * @param {string} message
 */
export function throwWithStatus(status, message) {
  const err = new Error(message);
  err.status = status;
  throw err;
}
