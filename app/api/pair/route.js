// ─────────────────────────────────────────────────────────────────────────────
// /api/pair — the pairing queue.
//
// POST { number, bot? } → writes a `pair` row into bot_control in the shared Neon
//   database. The running bot polls that table (within about 15 seconds), asks
//   WhatsApp for the pairing code, and writes it back into the same row.
//
// GET ?requestId= → the row's status, and the code once it is there. The panel
//   polls this every three seconds.
//
// The bot is the only thing that can talk to WhatsApp, so this endpoint's whole
// job is to leave the request somewhere the bot will find it — and to leave it
// only when a bot exists that can take it. A request queued for an offline bot
// would sit there until it expired, which is why the online check comes before
// the insert rather than after.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { db, describeDbError } from '@/lib/db';
import { sessionClaims } from '@/lib/session';
import { resolveBot, statusFor } from '@/lib/bots';
import { normalizeNumber, queuePair, pendingPairFor, pairingRequest } from '@/lib/pair';

export const dynamic = 'force-dynamic';

function failure(e) {
  if (e?.isConfig) return NextResponse.json({ error: e.message }, { status: 500 });
  const { reason } = describeDbError(e);
  console.error('Pair error:', reason);
  return NextResponse.json({ error: `Pairing is unavailable: ${reason}.` }, { status: 500 });
}

export async function POST(request) {
  try {
    const claims = await sessionClaims();
    if (!claims?.userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    let body;
    try { body = await request.json(); } catch { body = {}; }

    const number = normalizeNumber(body?.number);
    if (!number) {
      return NextResponse.json(
        { error: 'Invalid phone number. Use format like 254785016388 (numbers only, no +, spaces or dashes).' },
        { status: 400 }
      );
    }

    // Which bot. Refused before anything is queued, so a bad target cannot leave
    // a row behind for a bot that will never take it.
    const resolved = await resolveBot(body?.bot);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    const bot = resolved.bot;

    // THAT bot must be online: the code has to come from a specific one.
    const status = await statusFor(bot.id);
    if (!status || !status.online) {
      return NextResponse.json(
        { error: `${bot.name} is currently offline. Try again in a few minutes.` },
        { status: 503 }
      );
    }

    // One pairing request at a time per account — two would race for the same
    // WhatsApp account and confuse the person waiting.
    const pending = await pendingPairFor(claims.userId);
    if (pending) {
      return NextResponse.json(
        { error: 'You already have a pairing request in progress.', requestId: pending.id },
        { status: 409 }
      );
    }

    const row = await queuePair({
      number,
      accountId: claims.userId,
      botId: bot.id,
      named: resolved.named,
    });

    return NextResponse.json({ requestId: row.id, number, bot: bot.id, botName: bot.name });
  } catch (e) {
    return failure(e);
  }
}

export async function GET(request) {
  try {
    const claims = await sessionClaims();
    if (!claims?.userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const requestId = Number(new URL(request.url).searchParams.get('requestId'));
    if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });

    const row = await pairingRequest(requestId, claims.userId);
    if (!row) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    // `result` is written by the bot as JSON text, so it arrives as a string.
    let result = null;
    if (row.status === 'done' && row.result) {
      try { result = JSON.parse(row.result); } catch { result = { raw: row.result }; }
    }

    // failed, if the bot recorded a reason for it
    let error = null;
    if (row.status === 'failed' && row.result) {
      try { error = JSON.parse(row.result)?.error || String(row.result); } catch { error = String(row.result); }
    }

    return NextResponse.json(
      { requestId: row.id, status: row.status, result, error, createdAt: row.created_at, doneAt: row.done_at },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    return failure(e);
  }
}
