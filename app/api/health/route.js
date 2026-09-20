// ─────────────────────────────────────────────────────────────────────────────
// GET /api/health — "why can I not sign in?"
//
// This site's login depends on exactly three things: DATABASE_URL, JWT_SECRET, and
// a database that already holds the platform's tables. When any of them is wrong
// the sign-in form can only say that it failed, so this endpoint says which one.
//
// It is safe to leave public. It reports whether each variable is SET and never
// its value, and the only database facts it exposes are the names of tables that
// had to exist for the site to be running at all.
//
//   GET /api/health → 200 when sign-in should work, 503 when it cannot.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { db, hasDatabaseUrl, describeDbError } from '@/lib/db';

export const dynamic = 'force-dynamic';

// The tables a sign-in actually touches. Checked by name so the report can say
// WHICH one is missing rather than "a query failed".
const REQUIRED_TABLES = ['users', 'bot_control', 'bot_status', 'settings'];
const ACCOUNT_TABLES = ['User', 'Subscription', 'WhatsAppSession'];

async function checkTables(sql, names) {
  const rows = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ANY(${names})
  `;
  const found = new Set(rows.map((r) => r.table_name));
  return {
    present: names.filter((n) => found.has(n)),
    missing: names.filter((n) => !found.has(n)),
  };
}

export async function GET() {
  const report = {
    ok: false,
    config: {
      databaseUrl: hasDatabaseUrl() ? 'set' : 'MISSING',
      jwtSecret: process.env.JWT_SECRET ? 'set' : 'MISSING',
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    database: null,
    tables: null,
    verdict: '',
  };

  if (!hasDatabaseUrl()) {
    report.verdict = 'DATABASE_URL is not set on this deployment, so nothing can sign in. Add the platform Neon connection string.';
    return NextResponse.json(report, { status: 503 });
  }
  if (!process.env.JWT_SECRET) {
    report.verdict = 'JWT_SECRET is not set, so no session can be issued or trusted. Use the same value as the platform site.';
    return NextResponse.json(report, { status: 503 });
  }

  try {
    const sql = db();
    const ping = await sql`SELECT current_database() AS name, now() AS at`;

    report.database = {
      reachable: true,
      name: ping[0]?.name || null,
      serverTime: ping[0]?.at || null,
    };
  } catch (e) {
    const { code, reason } = describeDbError(e);
    report.database = { reachable: false, code, reason };
    report.verdict = `The database could not be reached: ${reason}. Check DATABASE_URL.`;
    return NextResponse.json(report, { status: 503 });
  }

  try {
    const sql = db();
    const auth = await checkTables(sql, REQUIRED_TABLES);
    const account = await checkTables(sql, ACCOUNT_TABLES);

    report.tables = { auth, account };

    // Missing auth tables stop sign-in; missing account tables only stop the
    // device list, which is a narrower problem and reported as such.
    if (auth.missing.length) {
      report.verdict = `The database is reachable but has no ${auth.missing.join(', ')} table — this must point at the platform database, not a new one.`;
      return NextResponse.json(report, { status: 503 });
    }

    report.ok = true;
    report.verdict = account.missing.length
      ? `Sign-in should work. Pairing will report no devices until the ${account.missing.join(', ')} table exists.`
      : 'Sign-in and pairing should both work.';

    return NextResponse.json(report, { status: 200 });
  } catch (e) {
    const { code, reason } = describeDbError(e);
    report.tables = { error: { code, reason } };
    report.verdict = `The database answered but the table check failed: ${reason}.`;
    return NextResponse.json(report, { status: 503 });
  }
}
