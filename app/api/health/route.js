// ─────────────────────────────────────────────────────────────────────────────
// GET /api/health — "why can I not sign in?"
//
// This site's sign-in depends on a database and a signing key. The database comes
// from DATABASE_URL; the signing key comes from JWT_SECRET if that is set, and
// otherwise from a key this site keeps for itself (lib/sessionSecret.js). So there
// is no longer a variable anybody has to remember, and this endpoint reports which
// of the two sources is actually in use.
//
// It is safe to leave public. It reports whether a variable is SET and never its
// value, and the only database facts it exposes are the names of tables that had
// to exist for the site to be running at all.
//
//   GET /api/health → 200 when sign-in should work, 503 when it cannot.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { db, hasDatabaseUrl, describeDbError } from '@/lib/db';
import { sessionSecretSource } from '@/lib/sessionSecret';

export const dynamic = 'force-dynamic';

// What sign-in needs, and what pairing needs on top of it. Grouped, because one
// missing table in the second group should not be reported as "you cannot sign in".
const SIGN_IN_TABLES = ['users'];
const PAIRING_TABLES = ['bot_control', 'bot_status', 'settings'];
// The bot-side tables, joined to a site account by User.telegramId.
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
      // Refined below, once the database can be asked. Without JWT_SECRET this is
      // not a problem to report — it is the self-managed path — so it must not
      // read like one.
      sessionKey: process.env.JWT_SECRET
        ? 'JWT_SECRET (shared with the platform)'
        : 'self-managed — read from the database below',
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    database: null,
    tables: null,
    verdict: '',
  };

  if (!hasDatabaseUrl()) {
    report.config.sessionKey = 'unavailable — needs DATABASE_URL to keep one of its own';
    report.verdict =
      'DATABASE_URL is not set on this deployment, so nothing can sign in. Add the platform Neon connection string; the session key looks after itself once it is there.';
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

  // Which key is in use. Deliberately reported as a source and never as a value —
  // "self-managed in the database" is the answer a deployment without JWT_SECRET
  // should give, and it is a working answer.
  const source = await sessionSecretSource();
  report.config.sessionKey =
    source === 'environment' ? 'JWT_SECRET (shared with the platform)'
      : source === 'database' ? 'self-managed, stored in the database'
        : 'unavailable';

  try {
    const sql = db();
    const signIn = await checkTables(sql, SIGN_IN_TABLES);
    const pairing = await checkTables(sql, PAIRING_TABLES);
    const account = await checkTables(sql, ACCOUNT_TABLES);

    report.tables = { signIn, pairing, account };

    if (signIn.missing.length) {
      report.verdict = `The database is reachable but has no ${signIn.missing.join(', ')} table — this must point at the platform database, not a new one.`;
      return NextResponse.json(report, { status: 503 });
    }

    if (source === 'unavailable') {
      report.verdict =
        'The database is fine, but no session key could be read or created — check the connection can write to the settings table.';
      return NextResponse.json(report, { status: 503 });
    }

    report.ok = true;

    if (pairing.missing.length) {
      report.verdict = `Sign-in works. Pairing will not: the ${pairing.missing.join(', ')} table is missing.`;
    } else if (account.missing.length) {
      report.verdict = `Sign-in works and pairing can be queued. The device list stays empty until the ${account.missing.join(', ')} table exists.`;
    } else {
      report.verdict = 'Sign-in and pairing should both work.';
    }

    return NextResponse.json(report, { status: 200 });
  } catch (e) {
    const { code, reason } = describeDbError(e);
    report.tables = { error: { code, reason } };
    report.verdict = `The database answered but the table check failed: ${reason}.`;
    return NextResponse.json(report, { status: 503 });
  }
}
