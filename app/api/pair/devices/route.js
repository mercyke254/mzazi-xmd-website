// GET /api/pair/devices — the signed-in user's linked numbers, plan and limit.
//
// An account that has never paired has no bot-side row at all, which is not an
// error: it is a person who is about to make their first pairing, and they are
// answered with FREE, one device and an empty list so the page renders normally.
import { NextResponse } from 'next/server';
import { sessionClaims } from '@/lib/session';
import { describeDbError } from '@/lib/db';
import { deviceBotMap } from '@/lib/bots';
import { PLANS, getAccount, planAndDevices } from '@/lib/pair';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const claims = await sessionClaims();
    if (!claims?.userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const account = await getAccount(claims.userId);
    if (!account) {
      return NextResponse.json(
        {
          plan: 'FREE',
          maxDevices: 1,
          endDate: null,
          devices: [],
          plans: Object.values(PLANS),
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const { plan, maxDevices, endDate, devices } = await planAndDevices(account.id);

    // Which bot holds each number. The session table has no bot column — the only
    // place this mapping exists is the telemetry each bot publishes — so it is
    // looked up rather than assumed. null when no bot has reported yet.
    const botMap = await deviceBotMap();

    return NextResponse.json(
      {
        plan,
        maxDevices,
        endDate,
        devices: devices.map((d) => ({
          number: d.phoneNumber,
          connectedAt: d.connectedAt,
          status: d.status,
          bot: botMap[String(d.phoneNumber)] || null,
        })),
        plans: Object.values(PLANS),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    if (e?.isConfig) return NextResponse.json({ error: e.message }, { status: 500 });
    const { reason } = describeDbError(e);
    console.error('Pair devices error:', reason);
    return NextResponse.json({ error: `Could not load your devices: ${reason}.` }, { status: 500 });
  }
}
