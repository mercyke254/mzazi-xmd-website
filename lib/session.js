// ─────────────────────────────────────────────────────────────────────────────
// The session cookie.
//
// Deliberately identical to the platform's: same cookie name (`token`), same JWT
// claims ({ userId, email }), same seven-day life, same attributes. Two reasons,
// and the second is the one that matters:
//
//   1. A session from either site is understood by the other, because both verify
//      against the same secret and the same users table.
//   2. A browser will not send mzazi.shop's cookie to this domain, so this site
//      mints its own — and because the claims are the same shape, everything that
//      reads them (the pair routes, any future API on the platform) accepts it
//      without knowing which site issued it.
//
// The SIGNING KEY is looked after by lib/sessionSecret.js: JWT_SECRET when it is
// set (which is what makes the two sites share sessions), and a key this site
// generates and keeps in the database when it is not. Either way there is nothing
// to configure here.
// ─────────────────────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from './db';
import { getSessionSecret } from './sessionSecret';

export const SESSION_COOKIE = 'token';
export const SESSION_DAYS = 7;
const MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

/** The cookie attributes the platform uses, in one place. */
function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  };
}

/** Issue a session for a user row. */
export async function startSession(user) {
  const { secret } = await getSessionSecret();
  const token = jwt.sign({ userId: user.id, email: user.email }, secret, {
    expiresIn: `${SESSION_DAYS}d`,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, cookieOptions(MAX_AGE_SECONDS));
  return token;
}

/** Expire it. */
export async function endSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', cookieOptions(0));
}

/**
 * Who is asking, according to the cookie alone.
 *
 * No database call — this is what an endpoint uses to decide whether to bother,
 * and to know whose rows to look at. Returns null for anything unreadable:
 * absent, tampered with, or expired.
 */
export async function sessionClaims() {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE);
    if (!token || !token.value) return null;
    const { secret } = await getSessionSecret();
    return jwt.verify(token.value, secret);
  } catch {
    // An unusable signing key lands here too, which is correct: without one no
    // session can be trusted, so the caller gets null rather than a user.
    return null;
  }
}

/**
 * The user row behind the session, or null.
 *
 * The extra lookup matters: a token remains valid for its full seven days, so a
 * user deleted in the meantime would otherwise keep a working session.
 */
export async function currentUser() {
  const claims = await sessionClaims();
  if (!claims?.userId) return null;

  const rows = await db()`
    SELECT id, firstname, lastname, fullname, email, created_at
    FROM users WHERE id = ${claims.userId}
  `;
  return rows[0] || null;
}
