// ─────────────────────────────────────────────────────────────────────────────
// Per-IP burst protection for the endpoints that take input from strangers.
//
// Same design as the platform's lib/ip-limiter.js — an in-memory sliding window
// per warm instance — and deliberately labelled as such: this slows down a script
// hammering the sign-in form from one address, and it is NOT a global quota. A
// determined attacker with many addresses, or one who waits out a cold start,
// gets past it. The platform's DB-backed limiter is the stronger one; this is the
// cheap one that costs nothing to run in front of bcrypt.
//
// The passwords are the reason it exists: bcrypt is intentionally slow, so an
// unthrottled sign-in endpoint is also a way to burn the server's CPU.
// ─────────────────────────────────────────────────────────────────────────────

const buckets = new Map();
const MAX_BUCKETS = 5000;

/**
 * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
 */
export function rateLimit(key, { max = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const bucketKey = `${key || 'unknown'}:${max}:${windowMs}`;
  const record = buckets.get(bucketKey);

  if (!record || now - record.start > windowMs) {
    // Bounded so a flood of distinct addresses cannot grow this without limit.
    if (buckets.size > MAX_BUCKETS) buckets.clear();
    buckets.set(bucketKey, { start: now, count: 1 });
    return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
  }

  record.count += 1;
  if (record.count > max) {
    return { allowed: false, remaining: 0, retryAfterMs: windowMs - (now - record.start) };
  }
  return { allowed: true, remaining: max - record.count, retryAfterMs: 0 };
}

/** Best-effort client address, from the proxy headers a host sets. */
export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim().slice(0, 45);
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || 'unknown';
}

/** For tests. */
export function resetRateLimits() {
  buckets.clear();
}
