// GET /api/pair/bots — the bots this site can pair into, with their live state.
//
// `multiple` is the switch the panel reads: with one bot there is nothing to
// choose, so the form stays as it is. With two or more the selector appears and a
// pairing must name one, because the code has to come from a specific bot.
import { NextResponse } from 'next/server';
import { sessionClaims } from '@/lib/session';
import { listBotsWithStatus } from '@/lib/bots';
import { describeDbError } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const claims = await sessionClaims();
    if (!claims?.userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { bots, multiple } = await listBotsWithStatus();
    return NextResponse.json({ bots, multiple }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    const { reason } = describeDbError(e);
    console.error('Pair bots error:', reason);
    return NextResponse.json({ error: `Could not load the bot list: ${reason}.` }, { status: 500 });
  }
}
