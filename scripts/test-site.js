#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Checks on the things that break quietly.
//
// The modules under test are ES modules in a CommonJS package (Next compiles
// them, plain node cannot require them) and the interesting ones talk to a
// database. So each is read and executed here with its boundary replaced by a
// double: a fake Neon client that records the SQL it is handed, and a fake cookie
// store that records what a session writes. What is being checked is therefore
// what THIS code says to the database and the browser — the SQL, the parameters
// and the cookie attributes — which is exactly where a mismatch with the platform
// would hide.
//
//   node scripts/test-site.js
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-used-only-by-this-file';

let passed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) { passed += 1; console.log(`  ✅ ${name}`); }
  else { failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  ❌ ${name}${detail ? `\n       ${detail}` : ''}`); }
}

/**
 * Execute an ESM source file's body and hand back the exports named in `pick`.
 *
 * Relative imports are bound from `deps` rather than resolved, so a file gets the
 * real implementation of what it imports (pass it in) and a clear error if a new
 * import appears that the caller has not provided — which is how a change to the
 * wiring is noticed here instead of in production.
 */
function loadEsm(relative, pick, deps = {}) {
  const src = fs.readFileSync(path.join(ROOT, relative), 'utf8');
  const body = src
    // Default import: `import jwt from 'jsonwebtoken'`. A CommonJS package has no
    // .default, so the module itself is the value in that case.
    .replace(
      /^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"];?\s*$/gm,
      (m, name, spec) => `const ${name} = (__dep(${JSON.stringify(spec)}).default !== undefined ? __dep(${JSON.stringify(spec)}).default : __dep(${JSON.stringify(spec)}));`
    )
    .replace(
      /^\s*import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?\s*$/gm,
      (m, names, spec) => `const { ${names} } = __dep(${JSON.stringify(spec)});`
    )
    .replace(/^\s*import[^;]*;\s*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, '')
    .replace(/^\s*export\s+/gm, '');
  const shim = { exports: {} };
  const __dep = (spec) => {
    if (!(spec in deps)) {
      throw new Error(`${relative} imports "${spec}" — pass it in deps to loadEsm()`);
    }
    return deps[spec];
  };
  // eslint-disable-next-line no-new-func
  const fn = new Function('module', 'exports', 'require', 'process', '__dep',
    `${body}\nmodule.exports = { ${pick.join(', ')} };`);
  fn(shim, shim.exports, require, process, __dep);
  return shim.exports;
}

/**
 * A Neon client that answers from `handler` and records every query.
 * `db()` is called as a tagged template, so this returns that shape.
 */
function fakeDb(handler = () => []) {
  const calls = [];
  const sql = async (strings, ...values) => {
    const query = strings.join(' ? ');
    calls.push({ query, values });
    return handler(query, values, calls) || [];
  };
  return {
    calls,
    sql,
    module: {
      db: () => sql,
      hasDatabaseUrl: () => true,
      ConfigError: class ConfigError extends Error {
        constructor(message) { super(message); this.name = 'ConfigError'; this.isConfig = true; }
      },
    },
  };
}

const exists = (relative) => fs.existsSync(path.join(ROOT, relative));
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

const envModule = () => loadEsm('lib/env.js', ['cleanEnvValue', 'normaliseUrl']);

// The body below uses await — several of the modules under test are async — so
// it all runs inside one async function rather than at the top level, which would
// make this file ambiguous between CommonJS and ESM.
async function main() {
console.log('\nMZAZI XMD website\n');

// ── 1. Navigation, footer and contact details ────────────────────────────────
{
  console.log('1. Navigation, footer and contact details');
  const { site } = loadEsm('lib/site.js', ['site'], { './env': envModule() });

  const labels = site.nav.map((l) => l.label);
  for (const required of ['Home', 'Link Bot', 'How to Use', 'FAQ', 'Contact']) {
    check(`the menu has ${required}`, labels.includes(required), labels.join(', '));
  }
  check('the drawer and the footer carry the same links',
    JSON.stringify(site.nav.map((l) => l.href)) === JSON.stringify(site.footerNav.map((l) => l.href)));
  check('the footer carries a privacy policy', site.legalNav.some((l) => l.href === '/privacy'));
  check('the footer carries terms', site.legalNav.some((l) => l.href === '/terms'));
  check('there is a developers page in the menu', labels.includes('Developers & Friends'));
  check('the support number is the real one', site.contact.whatsapp === '254108595201');
  check('the support email is the real one', site.contact.email === 'mzazitechinc@gmail.com');
  check('the FAQ has answers to give', site.faq.length >= 8, String(site.faq.length));
  check('the walkthrough has five steps', site.steps.length === 5);

  // The apiBase fields are gone with the proxy: nothing here should still be
  // reaching for a remote API the site no longer has.
  check('the site config no longer describes a remote API',
    !('apiBase' in site) && !('apiBaseRaw' in site));
}

// ── 2. Every link reaches a real page ────────────────────────────────────────
{
  console.log('\n2. Links resolve to pages that exist');
  const { site } = loadEsm('lib/site.js', ['site'], { './env': envModule() });
  const pageFor = (href) => (href === '/' ? 'app/page.js' : `app${href}/page.js`);

  for (const l of [...site.nav, ...site.legalNav]) {
    check(`  ${l.href}`, exists(pageFor(l.href)));
  }

  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|jsx)$/.test(entry.name)) files.push(full);
    }
  };
  walk(path.join(ROOT, 'app'));
  walk(path.join(ROOT, 'components'));

  const internal = new Set();
  for (const file of files) {
    for (const m of read(path.relative(ROOT, file)).matchAll(/href=["'](\/[a-z0-9-]*)["']/gi)) internal.add(m[1]);
  }
  const missing = [...internal].filter((href) => href !== '/' && !exists(`app${href}/page.js`));
  check('no internal link points at a missing page', missing.length === 0, missing.join(', '));
}

// ── 3. Sessions match the platform's ─────────────────────────────────────────
{
  console.log('\n3. A session issued here is the one the platform expects');
  const jwt = require('jsonwebtoken');

  const written = [];
  const cookiesStub = {
    cookies: async () => ({
      get: () => undefined,
      set: (name, value, options) => written.push({ name, value, options }),
    }),
  };
  const fake = fakeDb();
  // The signing key comes from lib/sessionSecret.js: JWT_SECRET when set, and a
  // key this site keeps in the database when not. Here it is set, so the token is
  // signed with the value the platform would also be using.
  const secretModule = { getSessionSecret: async () => ({ secret: process.env.JWT_SECRET, source: 'environment' }) };
  const { startSession, endSession, sessionClaims } =
    loadEsm('lib/session.js', ['startSession', 'endSession', 'sessionClaims'], {
      'jsonwebtoken': jwt,
      'next/headers': cookiesStub,
      './db': fake.module,
      './sessionSecret': secretModule,
    });

  const user = { id: 42, email: 'demo@example.com' };
  const token = await startSession(user);
  const cookie = written[0];

  check('the cookie is called "token"', cookie?.name === 'token', cookie?.name);
  check('it is httpOnly', cookie?.options?.httpOnly === true);
  check('it is SameSite=Lax', cookie?.options?.sameSite === 'lax');
  check('it is scoped to /', cookie?.options?.path === '/');
  check('it lives for seven days', cookie?.options?.maxAge === 7 * 24 * 60 * 60, String(cookie?.options?.maxAge));

  // The claim names are what the platform's routes read (`decoded.userId`), so
  // they are asserted rather than assumed.
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  check('the token carries userId', decoded.userId === 42, JSON.stringify(decoded));
  check('the token carries the email', decoded.email === 'demo@example.com');
  check('it expires in a week', Math.round((decoded.exp - decoded.iat) / 86400) === 7);

  await endSession();
  const cleared = written[written.length - 1];
  check('signing out expires the cookie', cleared?.value === '' && cleared?.options?.maxAge === 0);

  // Nothing readable means no session: absent, forged or expired.
  const { sessionClaims: claimsWithBadCookie } = loadEsm('lib/session.js', ['sessionClaims'], {
    'jsonwebtoken': jwt,
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'not.a.jwt' }) }) },
    './db': fake.module,
    './sessionSecret': secretModule,
  });
  check('a forged cookie is not a session', (await claimsWithBadCookie()) === null);

  const { sessionClaims: claimsWithoutCookie } = loadEsm('lib/session.js', ['sessionClaims'], {
    'jsonwebtoken': jwt,
    'next/headers': { cookies: async () => ({ get: () => undefined }) },
    './db': fake.module,
    './sessionSecret': secretModule,
  });
  check('no cookie is not a session', (await claimsWithoutCookie()) === null);
}

// ── 4. The pairing queue ─────────────────────────────────────────────────────
{
  console.log('\n4. The pairing queue the bot polls');
  const { normalizeNumber, queuePair, pendingPairFor, pairingRequest, planAndDevices } =
    loadEsm('lib/pair.js', ['normalizeNumber', 'queuePair', 'pendingPairFor', 'pairingRequest', 'planAndDevices'], {
      './db': fakeDb().module,
    });

  check('a normal number is accepted', normalizeNumber('254785016388') === '254785016388');
  check('+ and spaces are stripped', normalizeNumber('+254 785 016 388') === '254785016388');
  check('dashes are stripped', normalizeNumber('254-785-016-388') === '254785016388');
  check('a short number is refused', normalizeNumber('12345') === null);
  check('an absurdly long number is refused', normalizeNumber('1'.repeat(20)) === null);
  check('nothing at all is refused', normalizeNumber('') === null && normalizeNumber(null) === null);

  // The insert is what the bot reads, so its columns and payload are checked.
  {
    const fake = fakeDb(() => [{ id: 77 }]);
    const { queuePair: queue } = loadEsm('lib/pair.js', ['queuePair'], { './db': fake.module });
    const row = await queue({ number: '254785016388', accountId: 42, botId: 'xmd', named: true });

    check('the queue insert returns the row id', row?.id === 77, JSON.stringify(row));
    const insert = fake.calls.find((c) => /INSERT INTO bot_control/.test(c.query));
    check('it writes a pair action', /'pair'/.test(insert?.query || ''));
    check('it writes status pending', /'pending'/.test(insert?.query || ''));
    const payload = insert?.values?.find((v) => typeof v === 'string' && v.includes('accountId'));
    check('the payload carries the number and the account',
      !!payload && JSON.parse(payload).number === '254785016388' && JSON.parse(payload).accountId === 42,
      String(payload));
    check('a named bot is targeted', insert?.values?.includes('xmd'), JSON.stringify(insert?.values));
  }

  {
    // An unnamed request must stay claimable by any bot — the behaviour that
    // existed before bots were selectable.
    const fake = fakeDb(() => [{ id: 78 }]);
    const { queuePair: queue } = loadEsm('lib/pair.js', ['queuePair'], { './db': fake.module });
    await queue({ number: '254785016388', accountId: 42, botId: 'xmd', named: false });
    const insert = fake.calls.find((c) => /INSERT INTO bot_control/.test(c.query));
    check('an unnamed request is not targeted at a bot', insert?.values?.includes(''), JSON.stringify(insert?.values));
  }

  {
    const fake = fakeDb(() => [{ id: 5 }]);
    const { pendingPairFor: pending } = loadEsm('lib/pair.js', ['pendingPairFor'], { './db': fake.module });
    await pending(42);
    const q = fake.calls[0].query;
    check('the in-progress check filters on the account', /payload->>'accountId'/.test(q));
    check('it looks at pending and claimed rows', /pending/.test(q) && /claimed/.test(q));
  }

  {
    const fake = fakeDb(() => [{ id: 5, status: 'done' }]);
    const { pairingRequest: req } = loadEsm('lib/pair.js', ['pairingRequest'], { './db': fake.module });
    await req(5, 42);
    check('a request is only readable by the account that made it',
      /payload->>'accountId'/.test(fake.calls[0].query) && fake.calls[0].values.includes('42'));
  }

  {
    // The plan and the limit decide whether the panel offers another pairing, so
    // the defaults and the ACTIVE-only device filter are both checked.
    const noSub = fakeDb(() => []);
    const { planAndDevices: planOf } = loadEsm('lib/pair.js', ['planAndDevices'], { './db': noSub.module });
    const free = await planOf(1);
    check('no subscription is FREE with one device', free.plan === 'FREE' && free.maxDevices === 1);

    const expired = fakeDb((q) => (/FROM "Subscription"/.test(q)
      ? [{ plan: 'PLAN_10', maxDevices: 10, endDate: '2020-01-01', status: 'ACTIVE' }]
      : []));
    const { planAndDevices: planOf2 } = loadEsm('lib/pair.js', ['planAndDevices'], { './db': expired.module });
    const after = await planOf2(1);
    check('an expired subscription falls back to FREE', after.plan === 'FREE' && after.maxDevices === 1);

    const active = fakeDb((q) => (/FROM "Subscription"/.test(q)
      ? [{ plan: 'PLAN_10', maxDevices: 10, endDate: '2099-01-01', status: 'ACTIVE' }]
      : []));
    const { planAndDevices: planOf3 } = loadEsm('lib/pair.js', ['planAndDevices'], { './db': active.module });
    const live = await planOf3(1);
    check('an active subscription sets the limit', live.plan === 'PLAN_10' && live.maxDevices === 10);

    const deviceQuery = active.calls.find((c) => /WhatsAppSession/.test(c.query));
    check('unlinked sessions do not occupy a device slot',
      /status = 'ACTIVE'/.test(deviceQuery?.query || ''), deviceQuery?.query);
  }
}

// ── 5. Which bot takes the request ───────────────────────────────────────────
{
  console.log('\n5. Which bot takes the request');
  const settings = (profiles, name = 'MZAZI XMD') =>
    fakeDb((q) => {
      if (/FROM settings/.test(q)) {
        return [
          { key: 'bot_profiles', value: profiles },
          { key: 'bot_name', value: name },
        ];
      }
      if (/FROM bot_status/.test(q)) return [];
      return [];
    });

  const { listBots, resolveBot, statusFor } = loadEsm(
    'lib/bots.js', ['listBots', 'resolveBot', 'statusFor'], { './db': settings('') .module }
  );

  const single = await listBots();
  check('with no profiles configured there is one bot', single.length === 1, JSON.stringify(single));
  check('and it is named from the settings table', single[0].name === 'MZAZI XMD');

  const anonymous = await resolveBot('');
  check('an unnamed request resolves to the only bot', anonymous.ok === true && anonymous.named === false);

  const named = await resolveBot('xmd');
  check('an unknown bot name is refused', named.ok === false && !!named.error, JSON.stringify(named));

  const two = settings(JSON.stringify([{ id: 'xmd', name: 'MZAZI XMD' }, { id: 'quartz', name: 'QUARTZ XD' }]));
  const { resolveBot: resolveTwo } = loadEsm('lib/bots.js', ['resolveBot'], { './db': two.module });
  const ambiguous = await resolveTwo('');
  check('with two bots the caller must choose', ambiguous.ok === false, JSON.stringify(ambiguous));
  const chosen = await resolveTwo('quartz');
  check('a named bot is honoured', chosen.ok === true && chosen.bot.id === 'quartz' && chosen.named === true);

  // Telemetry decides whether a pairing can even be queued.
  const online = fakeDb((q) => (/FROM bot_status/.test(q) ? [{ bot_id: 'xmd', online: true }] : []));
  const { statusFor: statusOnline } = loadEsm('lib/bots.js', ['statusFor'], { './db': online.module });
  check('a reporting bot is seen as online', (await statusOnline('xmd'))?.online === true);

  const silent = fakeDb(() => []);
  const { statusFor: statusSilent } = loadEsm('lib/bots.js', ['statusFor'], { './db': silent.module });
  check('a bot that never reported is not online', (await statusSilent('xmd')) === null);
}

// ── 6. Sign-in throttling ────────────────────────────────────────────────────
{
  console.log('\n6. Sign-in throttling');
  const { rateLimit, clientIp } = loadEsm('lib/rateLimit.js', ['rateLimit', 'clientIp']);

  const key = `t-${Date.now()}`;
  let last;
  for (let i = 0; i < 10; i += 1) last = rateLimit(key, { max: 10, windowMs: 60_000 });
  check('ten attempts are allowed', last.allowed === true, JSON.stringify(last));

  const eleventh = rateLimit(key, { max: 10, windowMs: 60_000 });
  check('the eleventh is refused', eleventh.allowed === false);
  check('and it says how long to wait', eleventh.retryAfterMs > 0);

  // A window that has passed starts over rather than staying locked. The wait is
  // longer than the window on purpose: with a 1ms window the two calls can land
  // in the same millisecond and the check would fail at random.
  const shortKey = `s-${Date.now()}`;
  rateLimit(shortKey, { max: 1, windowMs: 20 });
  await new Promise((resolve) => setTimeout(resolve, 40));
  const afterWindow = rateLimit(shortKey, { max: 1, windowMs: 20 });
  check('the window resets', afterWindow.allowed === true);

  const headers = { get: (h) => (h === 'x-forwarded-for' ? '41.90.1.2, 10.0.0.1' : null) };
  check('the client address comes from the first hop',
    clientIp({ headers }) === '41.90.1.2', clientIp({ headers }));
}

// ── 7. Database failures are named ───────────────────────────────────────────
{
  console.log('\n7. A database failure explains itself');
  const { describeDbError } = loadEsm('lib/db.js', ['describeDbError'], {
    '@neondatabase/serverless': { neon: () => () => Promise.resolve([]) },
  });

  check('a missing table names the table',
    describeDbError({ code: '42P01', message: 'relation "users" does not exist' }).reason.includes('users'));
  check('bad credentials are named',
    describeDbError({ code: '28P01' }).reason.includes('credentials'));
  check('a missing database is named',
    describeDbError({ code: '3D000' }).reason.includes('does not exist'));
  check('an unreachable host is named',
    describeDbError({ code: 'ENOTFOUND' }).reason.includes('could not be reached'));
  check('a configuration error passes its own message through',
    describeDbError({ isConfig: true, message: 'DATABASE_URL is not set' }).reason.includes('DATABASE_URL'));
  check('an unknown error still says something', !!describeDbError({}).reason);
}

// ── 7b. The signing key looks after itself ──────────────────────────────────
// The point of this module: deploying a second site must not require finding a
// value the platform generated once and nobody wrote down.
{
  console.log('\n7b. The signing key needs no configuration');

  const { randomBytes } = require('crypto');
  const load = (deps) => loadEsm(
    'lib/sessionSecret.js',
    ['getSessionSecret', 'sessionSecretSource', 'resetSessionSecretCache', 'SESSION_SECRET_SETTING_KEY'],
    deps
  );

  const original = process.env.JWT_SECRET;

  // 1. JWT_SECRET set → used, and reported as coming from there.
  {
    process.env.JWT_SECRET = 'test-fixture-from-the-environment';
    const mod = load({ './db': fakeDb().module, crypto: { randomBytes } });
    mod.resetSessionSecretCache();
    const got = await mod.getSessionSecret();
    check('JWT_SECRET is used when it is set', got.secret === 'test-fixture-from-the-environment');
    check('and it is reported as coming from the environment', got.source === 'environment');
  }

  // 2. Not set, a key already stored → read, not regenerated.
  {
    delete process.env.JWT_SECRET;
    const stored = 'a'.repeat(64);
    const fake = fakeDb((q) => (/FROM settings/.test(q) ? [{ value: stored }] : []));
    const mod = load({ './db': fake.module, crypto: { randomBytes } });
    mod.resetSessionSecretCache();
    const got = await mod.getSessionSecret();
    check('a stored key is used when the variable is not set', got.secret === stored);
    check('and it is reported as self-managed', got.source === 'database');
    check('nothing is written when a key is already there',
      !fake.calls.some((c) => /INSERT INTO settings/.test(c.query)));
  }

  // 3. Not set, nothing stored → generate, store, reuse. This is the first-boot
  //    path on a deployment where nobody knows the platform's secret.
  {
    delete process.env.JWT_SECRET;
    let stored = null;
    const fake = fakeDb((q) => {
      if (/INSERT INTO settings/.test(q)) { stored = q.match(/[0-9a-f]{64}/)?.[0] || null; return []; }
      if (/FROM settings/.test(q)) return stored ? [{ value: stored }] : [];
      return [];
    });
    const mod = load({ './db': fake.module, crypto: { randomBytes } });
    mod.resetSessionSecretCache();
    const got = await mod.getSessionSecret();

    check('a key is generated when there is none', /^[0-9a-f]{64}$/.test(got.secret), got.secret?.slice(0, 12));
    check('it is stored so it survives a restart',
      fake.calls.some((c) => /INSERT INTO settings/.test(c.query)));
    check('it is stored under a namespaced key',
      fake.calls.some((c) => c.values?.includes('xmd_website_session_secret')));
    check('the insert does not overwrite an existing key', /WHERE NOT EXISTS/.test(fake.calls.find((c) => /INSERT/.test(c.query))?.query || ''));
    check('the generated key is 32 bytes of entropy', got.secret.length === 64);

    // A second call must not go back to the database: this sits on the path of
    // every authenticated request.
    const before = fake.calls.length;
    const again = await mod.getSessionSecret();
    check('the key is cached in the process', fake.calls.length === before && again.secret === got.secret);
  }

  // 4. Neither source available → a message that names both ways out.
  {
    delete process.env.JWT_SECRET;
    const failing = {
      db: () => { throw Object.assign(new Error('DATABASE_URL is not set'), { isConfig: true }); },
      hasDatabaseUrl: () => false,
      ConfigError: class ConfigError extends Error {},
    };
    const mod = load({ './db': failing, crypto: { randomBytes } });
    mod.resetSessionSecretCache();
    let message = '';
    try { await mod.getSessionSecret(); } catch (e) { message = e.message; }
    check('with no key and no database the error names both',
      /JWT_SECRET/.test(message) && /DATABASE_URL/.test(message), message);
    check('and it reports the key as unavailable', (await mod.sessionSecretSource()) === 'unavailable');
  }

  process.env.JWT_SECRET = original;
}

// ── 8. The front end asks for the right things ───────────────────────────────
{
  console.log('\n8. The front end and the API agree');
  const panel = read('app/link-bot/PairingPanel.js');
  const form = read('app/contact/ContactForm.js');

  for (const endpoint of ['/api/auth/login', '/api/auth/me', '/api/pair/devices', '/api/pair/bots', '/api/pair/unlink', '/api/pair?requestId=']) {
    check(`  the panel calls ${endpoint}`, panel.includes(endpoint));
  }
  check('the panel posts a pairing request', /fetch\('\/api\/pair'/.test(panel));
  check('the contact form posts to the inquiries endpoint', /fetch\('\/api\/contact'/.test(form));

  // The routes those calls land on have to exist, with the right methods.
  const methods = {
    'app/api/auth/login/route.js': 'POST',
    'app/api/auth/logout/route.js': 'POST',
    'app/api/auth/me/route.js': 'GET',
    'app/api/pair/route.js': 'POST',
    'app/api/pair/bots/route.js': 'GET',
    'app/api/pair/devices/route.js': 'GET',
    'app/api/pair/unlink/route.js': 'POST',
    'app/api/contact/route.js': 'POST',
    'app/api/health/route.js': 'GET',
  };
  for (const [file, method] of Object.entries(methods)) {
    check(`  ${file.replace('app/api/', '').replace('/route.js', '')} exports ${method}`,
      exists(file) && new RegExp(`export async function ${method}\\b`).test(read(file)));
  }

  // Every authenticated endpoint must actually check the session.
  for (const file of ['app/api/pair/route.js', 'app/api/pair/bots/route.js', 'app/api/pair/devices/route.js', 'app/api/pair/unlink/route.js']) {
    check(`  ${file.split('/')[2]} requires a session`, /sessionClaims\(\)/.test(read(file)));
  }

  // Anything under components/ can end up in a client bundle, and a secret that
  // reaches one has leaked. Walked rather than listed so a new component is
  // covered the day it is added.
  const clientFiles = [];
  const walkClient = (dir) => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walkClient(rel);
      else if (/\.(js|jsx)$/.test(entry.name)) clientFiles.push(rel);
    }
  };
  walkClient('components');
  const leaked = clientFiles.filter((f) => /process\.env\.(DATABASE_URL|JWT_SECRET)/.test(read(f)));
  check('no component reads a server-only variable', leaked.length === 0, leaked.join(', '));
  check('the site config is safe in a client bundle',
    !/DATABASE_URL|JWT_SECRET/.test(read('lib/site.js')));
}

// ── 9. No secrets in the repository ──────────────────────────────────────────
{
  console.log('\n9. No secrets in the front end');
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|jsx|json|mjs|ts)$/.test(entry.name)) files.push(full);
    }
  };
  walk(ROOT);

  // This file is the one place that must contain strings shaped like secrets, in
  // order to test that they are handled. Named explicitly rather than skipped by
  // directory, so a real secret committed anywhere else is still caught.
  const SELF = path.join(ROOT, 'scripts', 'test-site.js');
  const risky = [];
  for (const file of files) {
    if (file === SELF) continue;
    const src = fs.readFileSync(file, 'utf8');
    if (/postgres(ql)?:\/\/[^\s"'$]+:[^\s"'$]+@/i.test(src)) risky.push(`${path.relative(ROOT, file)}: connection string`);
    if (/JWT_SECRET\s*[:=]\s*["'][^"']{6,}/.test(src)) risky.push(`${path.relative(ROOT, file)}: jwt secret`);
    if (/ghp_[A-Za-z0-9]{20,}/.test(src)) risky.push(`${path.relative(ROOT, file)}: github token`);
    if (/(SECRET_KEY|API_KEY)\s*[:=]\s*["'][A-Za-z0-9]{16,}/.test(src)) risky.push(`${path.relative(ROOT, file)}: key`);
  }
  check('no connection string, secret or token is committed', risky.length === 0, risky.join('; '));

  const template = read('.env.example');
  check('.env is ignored', read('.gitignore').includes('.env'));
  check('.env.example leaves the secret values empty',
    /^JWT_SECRET=\s*$/m.test(template) && /^DATABASE_URL=\s*$/m.test(template));
  check('.env.example has no quoted values to copy',
    template.split('\n').every((l) => !/^[A-Z0-9_]+=.*["']/.test(l.trim())));
  check('.env.example warns about it anyway', /NO QUOTES/.test(template));
}

// ── 10. Every page the brief asked for ───────────────────────────────────────
{
  console.log('\n10. Every page the brief asked for');
  const pages = {
    'app/page.js': 'home',
    'app/link-bot/page.js': 'link bot',
    'app/how-to-use/page.js': 'how to use',
    'app/faq/page.js': 'faq',
    'app/contact/page.js': 'contact',
    'app/developers/page.js': 'developers and friends',
    'app/privacy/page.js': 'privacy',
    'app/terms/page.js': 'terms',
  };
  for (const [file, label] of Object.entries(pages)) check(`  ${label}`, exists(file));

  check('the hamburger navigation exists', exists('components/Navbar.js'));
  check('the footer exists', exists('components/Footer.js'));
  check('the pairing panel exists', exists('app/link-bot/PairingPanel.js'));
  check('a favicon is provided', exists('app/icon.svg'));
  check('robots and sitemap are generated', exists('app/robots.js') && exists('app/sitemap.js'));
}

console.log(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) {
  for (const f of failures) console.log(`  ❌ ${f}`);
  console.log('');
  process.exitCode = 1;
}
}

main().catch((e) => {
  console.error('\nharness error:', e);
  process.exitCode = 1;
});
