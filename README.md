# MZAZI XMD — website

The pairing site for **MZAZI XMD**, the WhatsApp bot. Built with Next.js 14 (App
Router), React 18 and Tailwind, sharing the design system of the main MZAZI TECH
site so the two read as one product.

It has its own API routes and talks to the **platform's Neon database directly**.
Same `users` table, same `bot_control` pairing queue, same session cookie — so an
account and a pairing are interchangeable between this site, mzazi.shop and the
Telegram bot. There is no API to call and no second database to keep in step.

---

## Pages

| Route | What it is |
|---|---|
| `/` | Home — what the bot does, the command pack, the first three pairing steps |
| `/link-bot` | Sign in, pair a number, see the code, manage and unlink devices |
| `/how-to-use` | The full walkthrough, first commands, group tools, device management |
| `/faq` | Ten questions, answered |
| `/contact` | WhatsApp, Telegram, email and a contact form that stores the message |
| `/developers` | The team, the developers, the public repositories, partners |
| `/privacy` · `/terms` | Legal — written for what this site and bot actually do |
| `/robots.txt` · `/sitemap.xml` | Generated from the same navigation the menu uses |

Navigation is a **hamburger at every screen size**, as specified: one button holds
the whole map, and the footer repeats the same links so every page is reachable
without JavaScript and visible to a crawler.

---

## How pairing works

```
browser                 this site                      Neon (shared)        bot
  │                        │                               │                 │
  ├─ POST /api/auth/login ─┤                               │                 │
  │                        ├─ SELECT … FROM users ────────►│                 │
  │                        │◄── the row, bcrypt checked ────┤                 │
  │◄── Set-Cookie: token ──┤   (signed with JWT_SECRET, and │                │
  │                        │    verified against the same   │                │
  │                        │    users table)                │                │
  │                        │                               │                 │
  ├─ POST /api/pair ───────┤                               │                 │
  │                        ├─ is the bot online? ──────────►│                 │
  │                        ├─ INSERT bot_control ─────────►│                 │
  │◄── { requestId } ──────┤   action=pair, status=pending │                 │
  │                        │                               │◄─ claims it ────┤
  │                        │                               │   asks WhatsApp │
  │                        │                               │◄─ writes code ──┤
  ├─ GET /api/pair?id=─────┤                               │                 │
  │                        ├─ SELECT … bot_control ───────►│                 │
  │◄── { status, code } ───┤◄──────────────────────────────┤                 │
```

The bot is the only thing that can talk to WhatsApp, so the API's job is to leave
the request where the bot will find it — and only when a bot exists that can take
it. Everything that decides that is read from the database rather than assumed:

- **Which bots exist** comes from the `bot_profiles` setting the bot itself reads.
  With one bot there is nothing to choose; with two, a pairing must name one,
  because the code has to come from a specific bot.
- **Whether a bot is up** comes from the `bot_status` telemetry each bot
  publishes, checked *before* the row is inserted. A request queued for an offline
  bot would sit there until it expired.
- **Which bot holds a number** comes from that same telemetry, so an unlink goes to
  the bot that can actually act on it. Sent to the other one it would find no such
  session and leave the device linked.

`lib/bots.js` is a deliberate copy of the platform's — see the note in that file.

## Accounts and sessions

One account, both sites. The sign-in form here checks the password against the
same `users` row mzazi.shop checks, and issues the same cookie: name `token`, JWT
claims `{ userId, email }`, seven days, `httpOnly`, `SameSite=Lax`.

The form is here rather than a link to mzazi.shop because a cookie belongs to a
domain: a session created there is never sent to this one. Signing in here mints
this site's own cookie against the same account — so the credentials, the devices
and the plan are all the same, while account creation, plans and the wallet stay
on the main site, one source of truth each.

### The signing key looks after itself

Sessions are signed with a key that comes from, in order:

1. **`JWT_SECRET`, when it is set.** The better answer when the value is known,
   because the platform and this site then share a key and a session issued by
   either is accepted by both.
2. **A key this site generates and keeps in the `settings` table.** Nothing to
   configure, nothing to remember, and sessions survive restarts and deploys.

Requiring `JWT_SECRET` was a mistake worth undoing: the platform generated that
value once and rarely looks at it again, so asking for it to deploy a second site
turned "I cannot remember it" into "I cannot sign in". **Only `DATABASE_URL` is
required.** Setting `JWT_SECRET` later upgrades to shared sessions with no code
change; existing visitors sign in once more, and that is the whole cost.

What changes without it: the key is this site's own, so a session minted here is
not accepted by the platform, nor the reverse. The shared thing that matters is the
account — same row, same credentials, same devices — and that is unaffected.

---

## Running it

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev                  # http://localhost:3000
```

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | **yes** | The platform's Neon connection string — the same database mzazi.shop and the bots use. |
| `JWT_SECRET` | no | Signs sessions. Set it to the platform's value to share sessions between the sites; leave it empty and this site generates and keeps its own. See above. |
| `NEXT_PUBLIC_SITE_URL` | no | This site's public address — canonical URLs, the sitemap, shares. Has a default. |
| `NEXT_PUBLIC_MZAZI_SITE` | no | The main site, for account creation and plans. Has a default. |

Only the two `NEXT_PUBLIC_` values are readable by the browser, and neither is a
secret. `DATABASE_URL` is read in exactly one place (`lib/db.js`) and `JWT_SECRET`
in one other (`lib/sessionSecret.js`), and neither appears in `lib/site.js` — which
client components import.

### `GET /api/health`

The first thing to open after deploying, and the whole diagnosis for "why can I
not sign in". It reports whether each variable is **set** (never its value),
whether the database answered, and which tables it found:

```json
{ "ok": true,
  "config": { "databaseUrl": "set",
              "sessionKey": "self-managed, stored in the database",
              "nodeEnv": "production" },
  "database": { "reachable": true, "name": "neondb" },
  "tables": { "signIn": { "present": ["users"], "missing": [] },
              "pairing": { "present": ["bot_control","bot_status","settings"], "missing": [] } },
  "verdict": "Sign-in and pairing should both work." }
```

`sessionKey` reports **which** key is signing sessions and never its value:
`JWT_SECRET (shared with the platform)` or `self-managed, stored in the database`.
A missing `users` table means `DATABASE_URL` points at a new Neon project rather
than the platform database, and it says so.

---

## Checking it

```bash
npm run test     # 126 assertions, no network, no database
npm run build    # compiles and type-checks every route
```

`scripts/test-site.js` executes the real modules with their boundaries replaced by
doubles: a fake Neon client that records the SQL, and a fake cookie store that
records what a session writes. So what is asserted is what this code says to the
database and the browser — which is where a mismatch with the platform would hide.
It covers:

- **the session cookie**: its name, attributes, seven-day life, and that the JWT
  carries `userId` and `email` — the claims the platform's own routes read
- **the signing key**: that `JWT_SECRET` is used when set, that a stored key is
  read rather than regenerated, that a first boot generates one, stores it under a
  namespaced key without overwriting an existing one, and caches it in the process
  — and that with neither source available the error names both ways out
- **the pairing queue**: that an insert writes `action='pair'`, `status='pending'`
  and a payload carrying the number and account; that an unnamed request stays
  untargeted so any bot may claim it; that a request is only readable by the
  account that made it
- **plan and device limits**: FREE with one device by default, an expired
  subscription falling back to FREE, and unlinked sessions not occupying a slot
- **bot resolution**: one bot versus several, an unknown name refused, a bot that
  has never reported telemetry never counted as online
- **throttling**: ten sign-in attempts allowed, the eleventh refused
- **every internal link** resolving to a page that exists, and no connection
  string, secret or token anywhere in the repository

---

## Editing what the site says

Almost all copy lives in **`lib/site.js`** — navigation, contact details, features,
the five pairing steps and the FAQ. Renaming a menu item or correcting the support
number is a one-line edit, and the sitemap, the footer and the contact page follow
it.

The home page's command counts are counted from the registry the bot actually
serves, not invented. If the pack changes size, update `COMMAND_GROUPS` in
`app/page.js`.

---

## Deploying

Anywhere that runs Next.js. On Vercel: import the repository, set `DATABASE_URL`
(and the two public URLs if the defaults are not right), deploy. Nothing else to
provision — the database and the bot stay where they are, and the session key looks
after itself.

Then, in order:

1. **Open `/api/health`.** It should say `ok: true`. If it does not, it names the
   one thing that is wrong.
2. **Sign in** on `/link-bot` with a real account. You should see your devices.
3. **Pair a number** with a bot running. The code should appear within about
   fifteen seconds.
4. Point `NEXT_PUBLIC_SITE_URL` at the real domain so the sitemap and shares are
   correct, and serve the site over HTTPS — the session cookie is marked `Secure`
   in production, and a pairing code is worth protecting.

---

## Two things worth knowing

**The contact form stores messages; the platform's does not.** mzazi.shop's
`/api/contact` only logs the submission and answers "success", so a message sent
from there is gone when the instance recycles. This site's writes to the
`inquiries` table the admin panel reads — attached to the account when the visitor
is signed in, and with `user_id` null when they are not, so a person asking a
question does not have to register first.

**Buying a plan stays on the main site.** The panel shows the current plan and the
device limit, and links out for upgrades, so pricing lives in one place.

---

## Licence

© Mzazi Tech Inc. All rights reserved.
