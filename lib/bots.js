// ─────────────────────────────────────────────────────────────────────────────
// MIRRORED MODULE — kept in step with lib/bots.js on the mzazi.shop platform.
//
// This file is a copy, on purpose. Which bot can serve a pairing is decided by
// the `bot_profiles` setting and by the telemetry each bot publishes, and a
// second implementation of that logic would eventually answer differently from
// the first — offering a bot that cannot take the request, or hiding one that
// can. The bot repos mirror each other the same way.
//
// The only change from the original is where the database client comes from.
// ─────────────────────────────────────────────────────────────────────────────
// MZAZI API — which bots this site can pair into.
//
// Read from the SAME `settings` row the bot itself reads — `bot_profiles` —
// rather than from a list kept here. Two lists would drift, and the morning they
// disagree the site would either offer a bot that cannot serve the request or
// hide one that can. One source of truth, read from both sides.
//
// The parsing mirrors lib/profiles.js on the bot, lib/bots.js on the link site
// and the quartzxd copies, including the fallback, so every side agrees on what
// the primary bot is called.
// The connection comes from lib/db.js, which reads DATABASE_URL in exactly one
// place for this site and reports a missing one as configuration rather than as
// a crash.
import { db } from './db';

const SETTINGS_KEY = 'bot_profiles';
const NAME_KEY = 'bot_name';

// Matches the bot's own staticConfig default for botName.
const FALLBACK_NAME = 'QUARTZ XD';
const FALLBACK_ID = 'main';

function parseProfiles(raw) {
  if (!raw) return [];

  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn('[web][bots] bot_profiles is not valid JSON — treating it as unset');
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];

  const cleaned = parsed
    .filter((p) => p && typeof p === 'object')
    .map((p) => ({
      id: String(p.id ?? '').trim(),
      name: String(p.name ?? '').trim(),
    }))
    .filter((p) => p.id && p.name);

  const seen = new Set();
  return cleaned.filter((p) => (seen.has(p.id) ? false : seen.add(p.id)));
}

/** The selectable bots, always at least one. Never throws. */
export async function listBots() {
  const settings = {};

  try {
    const rows = await db()`
      SELECT key, value FROM settings
      WHERE key IN ('bot_profiles', 'bot_name')
    `;
    for (const row of rows) settings[row.key] = row.value || '';
  } catch (err) {
    console.warn('[web][bots] could not read the settings table:', err.message);
  }

  const configured = parseProfiles(settings[SETTINGS_KEY]);
  if (configured.length) return configured;

  return [{ id: FALLBACK_ID, name: settings[NAME_KEY] || FALLBACK_NAME }];
}

/** Resolve a caller's requested bot. See the note on `named` below. */
export async function resolveBot(requested) {
  const bots = await listBots();
  const wanted = String(requested || '').trim();

  if (wanted) {
    const found = bots.find((b) => b.id === wanted);
    if (!found) return { ok: false, error: 'That bot is not available.' };
    return { ok: true, bot: found, named: true };
  }

  if (bots.length > 1) {
    return { ok: false, error: 'Choose which bot to link to.' };
  }

  return { ok: true, bot: bots[0], named: false };
}

/** Newest telemetry row for one bot, or null. */
export async function statusFor(botId) {
  try {
    const rows = await db()`
      SELECT bot_id, online, version, uptime_seconds, session_numbers, last_seen_at
      FROM bot_status
      WHERE bot_id = ${botId}
      ORDER BY last_seen_at DESC
      LIMIT 1
    `;
    return rows.length ? rows[0] : null;
  } catch (err) {
    console.warn('[web][bots] could not read bot_status:', err.message);
    return null;
  }
}

function numbersOf(row) {
  try {
    const parsed = JSON.parse((row && row.session_numbers) || '[]');
    return Array.isArray(parsed) ? parsed.map((n) => String(n)) : [];
  } catch {
    return [];
  }
}

/**
 * Which bot currently holds each paired number.
 *
 * The bot only publishes its session list through `bot_status`, so that is the
 * only place this mapping exists. Without it an unlink would be issued to
 * whichever bot happened to claim the row, which would find no such session and
 * leave the device linked.
 */
export async function deviceBotMap() {
  const map = {};
  try {
    const rows = await db()`
      SELECT bot_id, session_numbers, last_seen_at
      FROM bot_status
      ORDER BY last_seen_at ASC
    `;
    // Ascending, so the NEWEST row for an id wins — a bot that was renamed
    // leaves its old row behind with a stale session list.
    for (const r of rows) {
      for (const n of numbersOf(r)) map[n] = r.bot_id;
    }
  } catch (err) {
    console.warn('[web][bots] could not read bot_status:', err.message);
  }
  return map;
}

/** Every bot with live state, for the selector. */
export async function listBotsWithStatus() {
  const bots = await listBots();

  const byId = {};
  try {
    const rows = await db()`
      SELECT bot_id, online, session_numbers, last_seen_at
      FROM bot_status
      ORDER BY last_seen_at DESC
    `;
    for (const r of rows) {
      if (!Object.prototype.hasOwnProperty.call(byId, r.bot_id)) byId[r.bot_id] = r;
    }
  } catch (err) {
    console.warn('[web][bots] could not read bot_status:', err.message);
  }

  const withStatus = bots.map((b) => {
    const row = byId[b.id] || null;
    return {
      id: b.id,
      name: b.name,
      // No row means never seen, which is not the same as reporting offline —
      // both mean "cannot serve a pairing now", and `known` says which.
      known: !!row,
      online: !!(row && row.online),
      deviceCount: numbersOf(row).length,
    };
  });

  return { bots: withStatus, multiple: withStatus.length > 1 };
}

/**
 * Resolve the bot an action should be issued to for a specific number.
 *
 * Preference order is deliberate:
 *  1. the bot the caller named — they are looking at it,
 *  2. else the bot telemetry says holds this number — the only correct answer
 *     for an unlink,
 *  3. else the single configured bot, untargeted.
 */
export async function resolveBotForNumber(number, requested) {
  const wanted = String(requested || '').trim();
  if (wanted) return resolveBot(wanted);

  const bots = await listBots();

  // With one bot there is nothing to disambiguate, so the row is left untargeted
  // — exactly what this wrote before bots were selectable. Targeting it with the
  // fallback id "main" would look equivalent today and then silently strand the
  // request if bot_profiles is switched on before a bot claims it: a row naming
  // a profile that no longer exists is claimed by nobody.
  if (bots.length === 1) return { ok: true, bot: bots[0], named: false };

  const n = String(number || '').replace(/\D/g, '');
  if (n) {
    const map = await deviceBotMap();
    const owner = map[n];
    if (owner) {
      const found = bots.find((b) => b.id === owner);
      // owner may name a bot no longer in the list; fall through rather than
      // issuing an action to something the settings no longer describe.
      if (found) return { ok: true, bot: found, named: true };
    }
  }

  // Telemetry does not identify the holder — no bot may have reported since the
  // session appeared, or the mapping may predate it. The removal still goes out,
  // untargeted, exactly as it did before bots were selectable: every bot may
  // claim such a row and the one holding the number is the one that can act.
  //
  // Deliberately NOT an error, unlike a pairing. Pairing must name a bot (the
  // code has to come from a specific one), so guessing there is wrong. A removal
  // is safe untargeted, and blocking it because telemetry was thin would deny a
  // legitimate unlink — a worse failure than a claim that does nothing.
  return { ok: true, bot: bots[0], named: false };
}
