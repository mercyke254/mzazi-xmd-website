// ─────────────────────────────────────────────────────────────────────────────
// The key this site signs its sessions with.
//
// Requiring JWT_SECRET was a mistake worth undoing: the platform generates that
// value once and rarely looks at it again, so asking for it to deploy a second
// site turns "I cannot remember it" into "I cannot sign in". A site should be able
// to look after its own signing key.
//
// So the secret comes from, in order:
//
//   1. JWT_SECRET, when it is set. This is the better answer when the value IS
//      known, because the platform and this site then share one key and a session
//      issued by either is understood by both.
//
//   2. A key this site generates for itself, stored in the `settings` table and
//      reused for ever after. Nothing to configure, nothing to remember, and
//      sessions survive restarts and deploys.
//
// What changes when it falls back to (2): the key is this site's own, so a session
// minted here is NOT accepted by the platform, and one from the platform is not
// accepted here. Since the shared thing that matters is the ACCOUNT — the same
// users row, the same credentials, the same devices — that is a fair trade for
// never having to find the value again. Setting JWT_SECRET later upgrades this
// without a code change; existing visitors just sign in once more.
//
// The generated key is obtained from the database that already holds everything
// else, with no new table: `settings` is the key/value table the bots and the
// admin panel both read, and an extra key is ignored by both.
// ─────────────────────────────────────────────────────────────────────────────

import { randomBytes } from 'crypto';
import { db, ConfigError } from './db';

const SETTING_KEY = 'xmd_website_session_secret';
const KEY_BYTES = 32;

// Per process. The value never changes while an instance is warm, and this sits
// on the path of every authenticated request.
let cached = null;

export class SessionSecretError extends ConfigError {}

async function readStored() {
  const rows = await db()`
    SELECT value FROM settings WHERE key = ${SETTING_KEY} ORDER BY updated_at, key LIMIT 1
  `;
  const value = rows[0]?.value;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Store a freshly generated key.
 *
 * Written as INSERT … WHERE NOT EXISTS rather than ON CONFLICT, because ON CONFLICT
 * needs a unique index on `key` and this table predates us — it may or may not have
 * one. If two cold instances somehow race, both write the same kind of value and
 * the read below takes the first row consistently; the cost is a session that has
 * to be made again, which is the same cost as a deploy.
 */
async function storeGenerated(secret) {
  await db()`
    INSERT INTO settings (key, value)
    SELECT ${SETTING_KEY}, ${secret}
    WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = ${SETTING_KEY})
  `;
}

/**
 * @returns {Promise<{ secret: string, source: 'environment'|'database' }>}
 * Throws SessionSecretError when neither source can provide one, with a message
 * that names both.
 */
export async function getSessionSecret() {
  if (cached) return cached;

  const fromEnv = process.env.JWT_SECRET && String(process.env.JWT_SECRET).trim();
  if (fromEnv) {
    cached = { secret: fromEnv, source: 'environment' };
    return cached;
  }

  try {
    const stored = await readStored();
    if (stored) {
      cached = { secret: stored, source: 'database' };
      return cached;
    }

    const generated = randomBytes(KEY_BYTES).toString('hex');
    await storeGenerated(generated);

    // Read back rather than trusting the insert: another instance may have won the
    // race, and both should end up using the same key.
    const settled = (await readStored()) || generated;
    cached = { secret: settled, source: 'database' };
    return cached;
  } catch (e) {
    if (e?.isConfig) {
      throw new SessionSecretError(
        'No session key is available. Either set JWT_SECRET, or give this site a working DATABASE_URL so it can keep one of its own.'
      );
    }
    throw new SessionSecretError(
      `Could not read or create this site's session key: ${e?.message || e}. Check that DATABASE_URL is right.`
    );
  }
}

/**
 * Where the key comes from, for the health check. Never the value itself.
 * @returns {Promise<'environment'|'database'|'unavailable'>}
 */
export async function sessionSecretSource() {
  try {
    const { source } = await getSessionSecret();
    return source;
  } catch {
    return 'unavailable';
  }
}

/** For tests. */
export function resetSessionSecretCache() {
  cached = null;
}

export const SESSION_SECRET_SETTING_KEY = SETTING_KEY;
