// ─────────────────────────────────────────────────────────────────────────────
// Shared pieces of the pairing endpoints.
//
// Mirrors the platform's lib/pairApi.js, with one addition: the site user and the
// bot-side account are two different records joined by a single number.
//
//   users.id (this site, and the platform)   ← the person signing in
//        │
//        └── "User"."telegramId" (the bot's own table, Prisma)  ← the account the
//             │                                                       bot bills and
//             ├── "Subscription"                                     counts devices
//             └── "WhatsAppSession"
//
// They are joined by `telegramId = users.id`, which is what lets one account work
// on both sites and in the Telegram bot. Getting this wrong is why a person can
// sign in and still see no devices, so it is written once here.
// ─────────────────────────────────────────────────────────────────────────────

import { db } from './db';

// Device plans, mirrored from the platform's lib/pairApi.js and the bot's
// lib/subscription.js. Shown in the panel's limit message; buying stays on the
// main site, so this is a display copy and not a source of truth for billing.
export const PLANS = {
  PLAN_5: { key: 'PLAN_5', name: '5 Devices', maxDevices: 5, priceKsh: 100, days: 30 },
  PLAN_10: { key: 'PLAN_10', name: '10 Devices', maxDevices: 10, priceKsh: 150, days: 30 },
  PLAN_20: { key: 'PLAN_20', name: '20 Devices', maxDevices: 20, priceKsh: 200, days: 30 },
  UNLIMITED: { key: 'UNLIMITED', name: 'Unlimited', maxDevices: 999, priceKsh: 250, days: 30 },
};

/** Digits only, and a length a phone number can actually be. */
export function normalizeNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

/** The bot-side account for a signed-in user, or null if they have never paired. */
export async function getAccount(siteUserId) {
  const rows = await db()`
    SELECT id FROM "User" WHERE "telegramId" = ${Number(siteUserId)} LIMIT 1
  `;
  return rows[0] || null;
}

/**
 * The plan and device allowance, and the linked sessions, for an account.
 *
 * An account with no Subscription row is on FREE with one device — that is the
 * same default the bot applies, so the panel never shows a limit the bot would
 * not enforce.
 */
export async function planAndDevices(accountId) {
  const subRows = await db()`
    SELECT plan, "maxDevices", "endDate", status
    FROM "Subscription" WHERE "userId" = ${accountId} LIMIT 1
  `;
  const sub = subRows[0];
  const active = !!sub && sub.status === 'ACTIVE' && (!sub.endDate || new Date(sub.endDate) > new Date());
  const plan = active ? sub.plan : 'FREE';
  const maxDevices = active && sub.plan !== 'FREE' ? sub.maxDevices : 1;

  // Only ACTIVE sessions: an INACTIVE row has been unlinked and must not occupy
  // a device slot in the count the panel shows.
  const devices = await db()`
    SELECT "phoneNumber", "connectedAt", status
    FROM "WhatsAppSession"
    WHERE "userId" = ${accountId} AND status = 'ACTIVE'
    ORDER BY id DESC
  `;

  return { plan, maxDevices, endDate: active ? sub.endDate : null, devices };
}

/** Is a request for this account already queued or being worked on? */
export async function pendingPairFor(accountId) {
  const rows = await db()`
    SELECT id FROM bot_control
    WHERE action = 'pair' AND status IN ('pending', 'claimed')
      AND payload->>'accountId' = ${String(accountId)}
    ORDER BY id DESC LIMIT 1
  `;
  return rows[0] || null;
}

/**
 * Queue a pairing request for the bot to pick up.
 *
 * `bot_id` is only set when the caller named a bot. An untargeted row stays
 * claimable by any bot, which is what the endpoint wrote before bots were
 * selectable — so requests queued by older clients are not stranded by the
 * change.
 */
export async function queuePair({ number, accountId, botId = '', named = false }) {
  const rows = await db()`
    INSERT INTO bot_control (action, payload, status, bot_id)
    VALUES ('pair', ${JSON.stringify({ number, accountId })}::jsonb, 'pending', ${named ? botId : ''})
    RETURNING id
  `;
  return rows[0];
}

/** The status of one request, scoped to the account that made it. */
export async function pairingRequest(requestId, accountId) {
  const rows = await db()`
    SELECT id, action, status, result, created_at, done_at
    FROM bot_control
    WHERE id = ${requestId} AND payload->>'accountId' = ${String(accountId)}
  `;
  return rows[0] || null;
}
