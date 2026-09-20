# MZAZI XMD — website

The pairing site for **MZAZI XMD**, the WhatsApp bot. Built with Next.js 14 (App
Router), React 18 and Tailwind, sharing the design system of the main MZAZI TECH
site so the two read as one product.

It is a **front end**. It has no database, no bot key and no session secret — it
forwards the calls it needs to the live platform API. That is the whole design,
and it is why pairing here is the same pairing as everywhere else.

---

## Pages

| Route | What it is |
|---|---|
| `/` | Home — what the bot does, the command pack, the first three pairing steps |
| `/link-bot` | Sign in, pair a number, see the code, manage and unlink devices |
| `/how-to-use` | The full walkthrough, first commands, group tools, device management |
| `/faq` | Ten questions, answered |
| `/contact` | WhatsApp, Telegram, email and a contact form |
| `/developers` | The team, the developers, the public repositories, partners |
| `/privacy` · `/terms` | Legal — written for what this site and bot actually do |
| `/robots.txt` · `/sitemap.xml` | Generated from the same navigation the menu uses |

Navigation is a **hamburger at every screen size**, as specified: one button holds
the whole map, and the footer repeats the same links so every page is reachable
without JavaScript and visible to a crawler.

---

## How pairing works

```
browser                this site                     MZAZI platform API
  │                       │                                  │
  ├─ POST /api/auth/login ─┤                                  │
  │                       ├─ POST /api/auth/login ───────────►│
  │                       │◄── 200 + Set-Cookie: token ───────┤
  │◄── Set-Cookie: token ─┤   (Domain stripped, so the       │
  │    first-party here   │    cookie belongs to THIS origin)│
  │                       │                                  │
  ├─ POST /api/pair ──────┤                                  │
  │                       ├─ POST /api/pair (Cookie: token) ─►│  queues a `pair`
  │                       │◄── { requestId } ────────────────┤  row; the bot picks
  │◄── { requestId } ─────┤                                  │  it up and writes
  │                       │                                  │  the code back
  ├─ GET /api/pair?… ─────┤                                  │
  │                       ├─ GET /api/pair?requestId= ───────►│
  │◄── { status, code } ──┤◄──────────────────────────────────┤
```

`app/api/[...path]/route.js` is the only backend this repo has. Three things about
it matter:

1. **It is an allowlist.** Only the endpoint/method pairs listed in that file are
   forwarded; anything else is a 404 before a request leaves the server. A
   catch-all that forwarded anything would be an open proxy.
2. **It re-issues the session cookie for this domain.** The platform sets `token`
   for mzazi.shop, and a browser discards a cookie whose Domain is not the host
   that answered — so the Domain attribute is stripped and the cookie becomes
   first-party here. This is the single detail that makes signing in work, and it
   is unit-tested in `scripts/test-site.js`.
3. **Only the token cookie is forwarded**, never the browser's whole cookie jar.

### Why the sign-in form is on this site

Signing in on mzazi.shop would not authenticate anything here: that cookie belongs
to that domain and is never sent to this one. So `/link-bot` carries its own email
and password form, which forwards the credentials to the platform API to be
verified. The account is the same account — creation, plans and the wallet stay on
mzazi.shop on purpose, so there is one source of truth for each.

---

## Running it

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev                  # http://localhost:3000
```

| Variable | Purpose |
|---|---|
| `MZAZI_API_BASE` | The platform API to forward to. Point at staging to test against staging. |
| `NEXT_PUBLIC_SITE_URL` | This site's public address — canonical URLs, sitemap, shares. |
| `NEXT_PUBLIC_MZAZI_SITE` | The main site, for account creation and plans. |

`MZAZI_API_BASE` is read server-side only. Nothing in the browser needs it, and no
secret of any kind belongs in this repository — `scripts/test-site.js` fails the
build-time check if one appears.

---

## Checking it

```bash
npm run test     # 68 assertions, no network, no database
npm run build    # compiles and type-checks every route
```

`scripts/test-site.js` executes the real modules rather than grepping them, and
covers the things that break quietly:

- every menu and footer link resolves to a page that exists
- the API allowlist still refuses unlisted endpoints and methods
- the cookie rewrite strips Domain, keeps HttpOnly and Max-Age, drops Secure over
  http, and emits no attribute twice
- no database URL, session secret, API key or token is committed
- every page the brief asked for is present

---

## Editing what the site says

Almost all copy lives in **`lib/site.js`** — the navigation, the contact details,
the features, the five pairing steps and the FAQ. Renaming a menu item or
correcting the support number is a one-line edit there, and the sitemap, the
footer and the contact page all follow it.

The one number worth knowing: the home page's command counts are counted from the
registry the bot actually serves, not invented. If the pack changes size, update
`COMMAND_GROUPS` in `app/page.js`.

---

## Deploying

Anywhere that runs Next.js. On Vercel: import the repository, set the three
environment variables, and deploy — there is nothing else to provision, because
the database and the bot stay where they are.

Once it is up, worth doing:

1. Point `NEXT_PUBLIC_SITE_URL` at the real domain, so the sitemap and shares are
   correct.
2. Serve it over HTTPS. The session cookie is marked `Secure` when the request
   arrives over https, and the pairing code is worth protecting.
3. If the platform API restricts origins, this site does not need adding — every
   call is made server to server, not from the browser.

---

## Licence

© Mzazi Tech Inc. All rights reserved.
