// ─────────────────────────────────────────────────────────────────────────────
// THE BRIDGE TO MZAZI.SHOP
//
// This site has no database, no bot key and no session secret. Pairing works
// because every call the browser makes is forwarded, server to server, to the
// live MZAZI API at MZAZI_API_BASE — the same endpoints the main site uses:
//
//   POST /api/auth/login     GET  /api/auth/me       POST /api/auth/logout
//   POST /api/pair           GET  /api/pair          GET  /api/pair/bots
//   GET  /api/pair/devices   POST /api/pair/plan     POST /api/pair/unlink
//   POST /api/contact
//
// Three things make this work, and each is deliberate:
//
// 1. AN ALLOWLIST, not a wildcard. A catch-all that forwards anything is an open
//    proxy: anyone could use this domain to reach the API from a different
//    origin. Only the endpoint/method pairs listed below are reachable, and
//    everything else is a 404 before any request leaves the server.
//
// 2. THE SESSION COOKIE IS RE-ISSUED FOR THIS DOMAIN. The live API sets `token`
//    for mzazi.shop. Relaying that verbatim would store nothing, because a
//    browser refuses a cookie whose Domain is not the host that answered. So the
//    Domain attribute is stripped and the cookie becomes first-party here; the
//    proxy then puts it back on the outgoing request. One login, and both sites
//    agree about who you are.
//
// 3. NOTHING ELSE IS RELAYED. Only the token cookie goes out with the request,
//    and only the response's content-type and Set-Cookie come back — so a header
//    the API happens to send (rate-limit internals, server hints) cannot leak
//    into this origin.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import site from '@/lib/site';
import { rewriteCookie } from '@/lib/proxyCookie';

export const dynamic = 'force-dynamic';

// Path (after /api/) → the methods that may be forwarded.
const ALLOWED = {
  'auth/login': ['POST'],
  'auth/signup': ['POST'],
  'auth/logout': ['POST'],
  'auth/me': ['GET'],
  'pair': ['POST', 'GET'],
  'pair/bots': ['GET'],
  'pair/devices': ['GET'],
  'pair/plan': ['POST'],
  'pair/unlink': ['POST'],
  'contact': ['POST'],
};

// Long enough for a pairing code request, short enough that a hung upstream does
// not hold a serverless invocation open.
const UPSTREAM_TIMEOUT_MS = 20_000;

function upstreamUrl(path, search) {
  const base = String(site.apiBase || '').replace(/\/+$/, '');
  return `${base}/api/${path}${search || ''}`;
}

async function forward(request, { params }) {
  const { path: segments } = await params;
  const path = Array.isArray(segments) ? segments.join('/') : String(segments || '');
  const method = request.method.toUpperCase();

  const allowedMethods = ALLOWED[path];
  if (!allowedMethods) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!allowedMethods.includes(method)) {
    return NextResponse.json(
      { error: `Method ${method} not allowed` },
      { status: 405, headers: { Allow: allowedMethods.join(', ') } }
    );
  }

  const incoming = new URL(request.url);
  const target = upstreamUrl(path, incoming.search);

  const headers = {
    accept: 'application/json',
    'user-agent': 'mzazi-xmd-website',
    'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
  };

  const contentType = request.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;

  // Only the session cookie travels, and only as the API expects to read it.
  const token = request.cookies.get('token')?.value;
  if (token) headers.cookie = `token=${token}`;

  let body;
  if (method !== 'GET' && method !== 'HEAD') {
    body = await request.text();
    if (!body) body = undefined;
  }

  let upstream;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (e) {
    const timedOut = e?.name === 'TimeoutError' || e?.name === 'AbortError';
    return NextResponse.json(
      {
        error: timedOut
          ? 'The server took too long to answer. Please try again.'
          : 'We could not reach the MZAZI service. Please try again in a moment.',
      },
      { status: 502 }
    );
  }

  // Pass the API's own payload through untouched — the panel reads its exact
  // shape, and re-wrapping it here would only create a second contract to keep
  // in step.
  const text = await upstream.text();
  const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });

  const upstreamType = upstream.headers.get('content-type');
  if (upstreamType) responseHeaders.set('content-type', upstreamType);

  const isHttps = incoming.protocol === 'https:';
  const setCookies =
    typeof upstream.headers.getSetCookie === 'function'
      ? upstream.headers.getSetCookie()
      : [upstream.headers.get('set-cookie')].filter(Boolean);

  for (const cookie of setCookies) {
    responseHeaders.append('set-cookie', rewriteCookie(cookie, { isHttps }));
  }

  return new NextResponse(text, { status: upstream.status, headers: responseHeaders });
}

export const GET = forward;
export const POST = forward;
