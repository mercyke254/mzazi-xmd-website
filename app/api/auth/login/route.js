// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
//
// Checks the password against the bcrypt hash in the shared Neon `users` table
// and issues the same session cookie the platform issues. There is no second
// account system here: the row this reads is the row mzazi.shop reads.
//
// Every branch below mirrors the platform's login so the same credentials give
// the same answer on both sites — including the two answers that are easy to get
// wrong: an account with no password set (someone who signed up with Google) is
// told to set one rather than told its password is wrong, and a missing email and
// a wrong password are both "Invalid email or password" so the form cannot be
// used to find out which addresses have accounts.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, describeDbError } from '@/lib/db';
import { startSession } from '@/lib/session';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // bcrypt is intentionally slow, which makes an unthrottled login endpoint a
    // way to burn CPU as well as a way to guess passwords.
    const limit = rateLimit(`login:${clientIp(request)}`, { max: 10, windowMs: 60_000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const email = String(body?.email || '').trim();
    const password = String(body?.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Case-insensitive: addresses are stored as they were typed at signup, and a
    // phone keyboard capitalises the first letter.
    const rows = await db()`SELECT * FROM users WHERE lower(email) = lower(${email}) LIMIT 1`;
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'No password set on this account. Set one from the main site, then sign in here.' },
        { status: 401 }
      );
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await startSession(user);

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        fullname: user.fullname,
        email: user.email,
      },
    });
  } catch (e) {
    if (e?.isConfig) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    const { reason } = describeDbError(e);
    console.error('Login error:', reason);
    return NextResponse.json({ error: `Sign-in is unavailable: ${reason}.` }, { status: 500 });
  }
}
