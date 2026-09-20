// GET /api/auth/me — who is signed in, or 401.
//
// The panel calls this first and renders its sign-in form when it gets a 401, so
// the only thing that matters here is which of the two answers it gives.
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/session';
import { describeDbError } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    return NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    if (e?.isConfig) return NextResponse.json({ error: e.message }, { status: 500 });
    const { reason } = describeDbError(e);
    console.error('Session lookup failed:', reason);
    return NextResponse.json({ error: `Could not check your session: ${reason}.` }, { status: 500 });
  }
}
