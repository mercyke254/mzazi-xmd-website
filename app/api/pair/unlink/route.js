// POST /api/pair/unlink — ask the bot to log a linked number out.
//
// Two checks before anything is queued, and both matter:
//
//   · The number must belong to the caller. Without this, any signed-in user
//     could unlink anybody's number by guessing it — the panel only ever sends
//     its own, but the endpoint cannot rely on the browser for that.
//   · The request must be issued to the bot that actually holds the number.
//     Telemetry says which one that is. Sending it to the other bot would find no
//     such session and leave the device linked, which looks exactly like the
//     unlink silently failing.
import { NextResponse } from 'next/server';
import { db, describeDbError } from '@/lib/db';
import { sessionClaims } from '@/lib/session';
import { resolveBotForNumber } from '@/lib/bots';
import { normalizeNumber, getAccount } from '@/lib/pair';

export const dynamic = 'force-dynamic';

const ACTIONS = ['unlink', 'delete'];

export async function POST(request) {
  try {
    const claims = await sessionClaims();
    if (!claims?.userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    let body;
    try { body = await request.json(); } catch { body = {}; }

    const number = normalizeNumber(body?.number);
    if (!number) return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });

    const action = ACTIONS.includes(body?.action) ? body.action : 'unlink';

    // Ownership. A number with no session row at all is allowed through: there is
    // nothing to take from anyone, and refusing it would block the case where a
    // device was removed from WhatsApp's own screen first.
    const account = await getAccount(claims.userId);
    if (account) {
      const rows = await db()`
        SELECT "userId" FROM "WhatsAppSession" WHERE "phoneNumber" = ${number} LIMIT 1
      `;
      if (rows.length && Number(rows[0].userId) !== Number(account.id)) {
        return NextResponse.json({ error: 'This number is not linked to your account.' }, { status: 403 });
      }
    }

    const resolved = await resolveBotForNumber(number, body?.bot);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    const bot = resolved.bot;

    // `delete` also wipes the session files from the bot's disk; `unlink` just
    // logs out. Both are issues on the same control action.
    const payload = action === 'delete'
      ? { number, accountId: claims.userId, mode: 'delete' }
      : { number, accountId: claims.userId };

    const pending = await db()`
      SELECT id FROM bot_control
      WHERE action = 'unpair' AND status IN ('pending', 'claimed')
        AND payload->>'number' = ${number}
      ORDER BY id DESC LIMIT 1
    `;
    if (pending.length) {
      return NextResponse.json({ error: 'A request for this number is already in progress.' }, { status: 409 });
    }

    const rows = await db()`
      INSERT INTO bot_control (action, payload, status, bot_id)
      VALUES ('unpair', ${JSON.stringify(payload)}::jsonb, 'pending', ${resolved.named ? bot.id : ''})
      RETURNING id
    `;

    return NextResponse.json({ requestId: rows[0].id, number, action, bot: bot.id });
  } catch (e) {
    if (e?.isConfig) return NextResponse.json({ error: e.message }, { status: 500 });
    const { reason } = describeDbError(e);
    console.error('Pair unlink error:', reason);
    return NextResponse.json({ error: `Could not start the unlink: ${reason}.` }, { status: 500 });
  }
}
