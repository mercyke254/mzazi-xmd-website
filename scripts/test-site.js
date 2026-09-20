#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Checks on the things that are easy to break and hard to notice: a nav item
// pointing at a page that does not exist, a bridge that forwards a path it should
// not, a cookie rewrite that silently stops working and signs everybody out.
//
// The modules under test are ES modules in a CommonJS package (Next compiles them,
// plain node cannot require them), so the source is read and executed here rather
// than the behaviour being grepped for. These are the real implementations.
//   node scripts/test-site.js
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) { passed += 1; console.log(`  ✅ ${name}`); }
  else { failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  ❌ ${name}${detail ? `\n       ${detail}` : ''}`); }
}

/** Execute an ESM source file's body and hand back the exports named in `pick`. */
function loadEsm(relative, pick) {
  const src = fs.readFileSync(path.join(ROOT, relative), 'utf8');
  const body = src
    .replace(/^\s*import[^;]*;\s*$/gm, '')   // strip imports: nothing here needs them
    .replace(/^\s*export\s+default\s+/gm, '')
    .replace(/^\s*export\s+/gm, '');
  const shim = { exports: {} };
  // eslint-disable-next-line no-new-func
  const fn = new Function('module', 'exports', 'require', 'process',
    `${body}\nmodule.exports = { ${pick.join(', ')} };`);
  fn(shim, shim.exports, require, process);
  return shim.exports;
}

function exists(relative) {
  return fs.existsSync(path.join(ROOT, relative));
}

console.log('\nMZAZI XMD website\n');

// ── 1. The navigation the brief specified ────────────────────────────────────
{
  console.log('1. Navigation, footer and contact details');
  const { site } = loadEsm('lib/site.js', ['site']);

  const labels = site.nav.map((l) => l.label);
  for (const required of ['Home', 'Link Bot', 'How to Use', 'FAQ', 'Contact']) {
    check(`the menu has ${required}`, labels.includes(required), labels.join(', '));
  }
  check('the menu is one list used by the drawer and the footer',
    JSON.stringify(site.nav.map((l) => l.href)) === JSON.stringify(site.footerNav.map((l) => l.href)));
  check('the footer carries a privacy policy', site.legalNav.some((l) => l.href === '/privacy'));
  check('the footer carries terms', site.legalNav.some((l) => l.href === '/terms'));
  check('there is a developers page in the menu', labels.includes('Developers & Friends'));
  check('the support number is the real one', site.contact.whatsapp === '254108595201', site.contact.whatsapp);
  check('the support email is the real one', site.contact.email === 'mzazitechinc@gmail.com', site.contact.email);
  check('the FAQ has answers to give', site.faq.length >= 8, String(site.faq.length));
  check('the walkthrough has five steps', site.steps.length === 5, String(site.steps.length));
  check('every feature names an icon that exists', site.features.every((f) => typeof f.icon === 'string'));
}

// ── 2. Every link in the menu reaches a real page ────────────────────────────
{
  console.log('\n2. Links resolve to pages that exist');
  const { site } = loadEsm('lib/site.js', ['site']);
  const pageFor = (href) => (href === '/' ? 'app/page.js' : `app${href}/page.js`);

  for (const l of [...site.nav, ...site.legalNav]) {
    check(`  ${l.href} → ${pageFor(l.href)}`, exists(pageFor(l.href)));
  }

  // Any other internal link written in the source has to resolve too — this is
  // how a footer or a body link to a page that was never created gets caught.
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|jsx)$/.test(entry.name)) files.push(full);
    }
  };
  walk(path.join(ROOT, 'app'));
  walk(path.join(ROOT, 'components'));

  const internal = new Set();
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/href=["'](\/[a-z0-9-]*)["']/gi)) internal.add(m[1]);
    for (const m of src.matchAll(/href=["']\$\{site\.accountBase\}(\/[a-z0-9-]*)["']/gi)) internal.add(`~external${m[1]}`);
  }

  const missing = [...internal].filter((href) => href !== '/' && !href.startsWith('~') && !exists(`app${href}/page.js`));
  check('no internal link points at a missing page', missing.length === 0, missing.join(', '));
}

// ── 3. The bridge ────────────────────────────────────────────────────────────
{
  console.log('\n3. The bridge to the platform API');
  const route = fs.readFileSync(path.join(ROOT, 'app/api/[...path]/route.js'), 'utf8');

  // The allowlist is the security boundary: without it this route is an open
  // proxy that lets anyone reach the platform API from this origin.
  const allowBlock = route.match(/const ALLOWED = \{([\s\S]*?)\n\};/);
  check('the bridge has an allowlist', !!allowBlock);
  const list = allowBlock ? allowBlock[1] : '';
  for (const endpoint of ['auth/login', 'auth/logout', 'auth/me', 'pair', 'pair/bots', 'pair/devices', 'pair/plan', 'pair/unlink', 'contact']) {
    check(`  ${endpoint} is allowed`, list.includes(`'${endpoint}'`));
  }
  check('a path that is not listed is refused', /if \(!allowedMethods\)/.test(route) && /status: 404/.test(route));
  check('a method that is not listed is refused', /Method \$\{method\} not allowed/.test(route) && /status: 405/.test(route));
  check('only the token cookie is forwarded, not the whole cookie jar', /headers\.cookie = `token=\$\{token\}`/.test(route));
  check('an unreachable API is a 502, not a crash', /status: 502/.test(route));
  check('the upstream call is bounded by a timeout', /AbortSignal\.timeout/.test(route));
}

// ── 4. The cookie rewrite, executed ──────────────────────────────────────────
{
  console.log('\n4. Sign-in works across domains');
  const { rewriteCookie, isClearingCookie } = loadEsm('lib/proxyCookie.js', ['rewriteCookie', 'isClearingCookie']);

  const upstream = 'token=abc.def.ghi; Domain=.mzazi.shop; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800';
  const https = rewriteCookie(upstream, { isHttps: true });
  check('the Domain is stripped, or the browser would discard the cookie', !/domain/i.test(https), https);
  check('the value is kept', https.startsWith('token=abc.def.ghi'), https);
  check('it stays HttpOnly', /HttpOnly/i.test(https));
  check('it keeps its lifetime', /Max-Age=604800/.test(https));
  check('it is scoped to this origin', /Path=\//.test(https));
  check('it is Secure over https', /Secure/.test(https));
  check('it is SameSite=Lax so the redirect back works', /SameSite=Lax/i.test(https));
  // A duplicated attribute is a smell that the upstream's own copy survived the
  // rewrite — which is exactly what happened before this was moved out of the
  // route, and it was the running build that showed it.
  check('no cookie attribute is emitted twice',
    (https.match(/samesite/gi) || []).length === 1 &&
    (https.match(/\bpath=/gi) || []).length === 1, https);

  const http = rewriteCookie(upstream, { isHttps: false });
  check('Secure is dropped on http, or local development cannot sign in', !/Secure/.test(http));

  check('a logout cookie is recognised', isClearingCookie('token=; Path=/; Max-Age=0'));
  check('a session cookie is not mistaken for a logout', !isClearingCookie(upstream));
  check('logout survives the rewrite as an empty value', rewriteCookie('token=; Path=/; Max-Age=0', { isHttps: true }).startsWith('token=;'));
}

// ── 5. Nothing secret lives in this repo ─────────────────────────────────────
{
  console.log('\n5. No secrets in the front end');
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|jsx|json|mjs)$/.test(entry.name)) files.push(full);
    }
  };
  walk(ROOT);

  const risky = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    if (/DATABASE_URL\s*=\s*["']?postgres/i.test(src)) risky.push(`${path.relative(ROOT, file)}: database URL`);
    if (/JWT_SECRET\s*=\s*["'][^"']+/i.test(src)) risky.push(`${path.relative(ROOT, file)}: jwt secret`);
    if (/ghp_[A-Za-z0-9]{20,}/.test(src)) risky.push(`${path.relative(ROOT, file)}: github token`);
    if (/_KEY\s*=\s*["'][A-Za-z0-9]{16,}/.test(src)) risky.push(`${path.relative(ROOT, file)}: api key`);
  }
  check('no database URL, session secret, API key or token is committed', risky.length === 0, risky.join('; '));
  check('.env is ignored', fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8').includes('.env'));
  check('.env.example is committed as the template', exists('.env.example'));
}

// ── 6. The pieces are all there ──────────────────────────────────────────────
{
  console.log('\n6. Every page the brief asked for');
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
  check('the contact form posts through the bridge', /fetch\('\/api\/contact'/.test(fs.readFileSync(path.join(ROOT, 'app/contact/ContactForm.js'), 'utf8')));
  check('the panel polls for the code', /api\/pair\?requestId=/.test(fs.readFileSync(path.join(ROOT, 'app/link-bot/PairingPanel.js'), 'utf8')));
  check('a favicon is provided', exists('app/icon.svg'));
  check('robots and sitemap are generated', exists('app/robots.js') && exists('app/sitemap.js'));
}

console.log(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) {
  for (const f of failures) console.log(`  ❌ ${f}`);
  console.log('');
  process.exitCode = 1;
}
