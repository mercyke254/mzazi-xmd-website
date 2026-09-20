// ─────────────────────────────────────────────────────────────────────────────
// The Neon connection.
//
// This site talks to the SAME Neon database the platform does — the one holding
// `users`, `bot_control` and the bot telemetry. That is what makes an account and
// a pairing interchangeable between the two sites: there is one users table, and
// the pairing request this site queues is claimed by the same running bot that
// polls the queue for mzazi.shop and for the Telegram side.
//
// The client is built lazily. `neon(process.env.DATABASE_URL)` at module scope
// throws during import when the variable is missing, which would turn a
// configuration mistake into a blank page with nothing in it — including the
// health check whose whole job is to report that mistake.
// ─────────────────────────────────────────────────────────────────────────────

import { neon } from '@neondatabase/serverless';

export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
    this.isConfig = true;
  }
}

let client = null;

/** True when the deployment has a database configured at all. */
export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim());
}

/**
 * The Neon tagged-template client.
 *
 * Call it as SQL: `const rows = await db()`SELECT ...``
 * Throws ConfigError when DATABASE_URL is missing, so routes can answer with a
 * message that names the variable instead of a generic 500.
 */
export function db() {
  if (!hasDatabaseUrl()) {
    throw new ConfigError(
      'DATABASE_URL is not set on this deployment. Add the platform Neon connection string to the environment.'
    );
  }
  if (!client) client = neon(process.env.DATABASE_URL);
  return client;
}

/**
 * Turn a Postgres error into something worth showing a person.
 *
 * The three that actually happen: the variable points at an empty or wrong
 * database (undefined table), the credentials are wrong, or the host is
 * unreachable. Anything else is reported by its code rather than swallowed.
 */
export function describeDbError(error) {
  const code = error?.code || '';
  const message = String(error?.message || '');

  if (error?.isConfig) return { code: 'NO_DATABASE_URL', reason: message };

  if (code === '42P01') {
    const table = (message.match(/relation "([^"]+)"/) || [])[1] || 'a table';
    return {
      code,
      reason: `the database is reachable but has no "${table}" table — this must point at the platform database, not a new one`,
    };
  }
  if (code === '28P01' || code === '28000') {
    return { code, reason: 'the database rejected the credentials in DATABASE_URL' };
  }
  if (code === '3D000') {
    return { code, reason: 'the database named in DATABASE_URL does not exist' };
  }
  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN'].includes(code)) {
    return { code, reason: 'the database host could not be reached' };
  }
  if (/fetch failed|network/i.test(message)) {
    return { code: code || 'NETWORK', reason: 'the database host could not be reached' };
  }

  return { code: code || 'DB_ERROR', reason: message || 'the database query failed' };
}

export default db;
