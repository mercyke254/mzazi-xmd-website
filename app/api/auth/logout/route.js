// POST /api/auth/logout — expire the session cookie.
//
// Only this site's cookie is cleared. Signing out here does not sign the visitor
// out of mzazi.shop, and it does not unlink any device — those are separate
// things, and the panel says so rather than leaving a person to guess.
import { NextResponse } from 'next/server';
import { endSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await endSession();
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
