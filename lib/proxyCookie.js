// ─────────────────────────────────────────────────────────────────────────────
// Turning the API's Set-Cookie into one THIS origin can hold.
//
// This is the single detail that makes signing in here work at all. The platform
// API sets `token` for mzazi.shop; a browser discards a cookie whose Domain does
// not match the host that answered, so relaying it verbatim would leave the user
// apparently signed in and still getting 401s. Stripping Domain makes it
// first-party on this site, and the proxy then sends it back on every upstream
// call.
//
// Kept out of the route so it can be tested on its own — it is pure, and it is
// the piece worth being certain about.
// ─────────────────────────────────────────────────────────────────────────────

// Attributes that describe WHERE a cookie may be sent, which is exactly what has
// to be rewritten for the cookie to belong to this origin.
const DROPPED = new Set(['domain', 'path', 'secure', 'samesite', 'partitioned']);

/**
 * @param {string} raw        the upstream Set-Cookie header
 * @param {object} options
 * @param {boolean} options.isHttps  whether this site was reached over https
 * @param {string}  options.path     default "/"
 * @returns {string} a Set-Cookie value for this origin
 */
export function rewriteCookie(raw, { isHttps = true, path = '/' } = {}) {
  const parts = String(raw || '').split(';');
  const kept = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const name = trimmed.split('=')[0].trim().toLowerCase();
    if (DROPPED.has(name)) continue;
    kept.push(trimmed);
  }

  // HttpOnly, Max-Age and Expires survive untouched: those are properties of the
  // session itself, not of the domain it is being moved to.
  kept.push(`Path=${path}`);
  kept.push('SameSite=Lax');
  if (isHttps) kept.push('Secure');

  return kept.join('; ');
}

/** True when the cookie being set carries no value — how logout arrives. */
export function isClearingCookie(raw) {
  const first = String(raw || '').split(';')[0].trim();
  const value = first.includes('=') ? first.slice(first.indexOf('=') + 1) : '';
  return value === '';
}

export default rewriteCookie;
