// ─────────────────────────────────────────────────────────────────────────────
// MZAZI XMD WEBSITE — one place for everything the site says.
//
// Every page reads from here, so renaming a nav item, changing the support number
// or adding an FAQ entry is a one-line edit rather than a hunt through JSX. If a
// value is not in this file it is not on the site.
// ─────────────────────────────────────────────────────────────────────────────

export const site = {
  name: 'MZAZI XMD',
  legalName: 'Mzazi Tech Inc',
  tagline: 'WhatsApp automation, paired in under a minute',
  description:
    'Link your WhatsApp to MZAZI XMD, get a pairing code in seconds, and let the bot handle groups, downloads, AI replies, panels and payments — from your phone.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://xmd.mzazi.shop',

  // Where the real work happens. The site is a front end for this API: every
  // /api/auth/*, /api/pair/* and /api/contact call in app/api/[...path]/route.js
  // is forwarded here, which is why pairing works without a second copy of the
  // database, the bot key or the session secret.
  apiBase: process.env.MZAZI_API_BASE || 'https://www.mzazi.shop',

  // The main site, for the things this one deliberately does not re-implement:
  // creating an account, plans and prices, the wallet.
  accountBase: process.env.NEXT_PUBLIC_MZAZI_SITE || 'https://www.mzazi.shop',

  contact: {
    whatsapp: '254108595201',
    whatsappUrl: 'https://wa.me/254108595201',
    whatsappDisplay: '+254 108 595 201',
    telegram: 'mzazitech',
    telegramUrl: 'https://t.me/mzazitech',
    email: 'mzazitechinc@gmail.com',
    hours: 'Mon–Sat, 08:00–20:00 EAT',
    location: 'Nairobi, Kenya',
  },

  // The hamburger, in order. `primary` marks the one item that also gets a
  // button in the header on wide screens.
  nav: [
    { href: '/', label: 'Home' },
    { href: '/link-bot', label: 'Link Bot', primary: true },
    { href: '/how-to-use', label: 'How to Use' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
    { href: '/developers', label: 'Developers & Friends' },
  ],

  footerNav: [
    { href: '/', label: 'Home' },
    { href: '/link-bot', label: 'Link Bot' },
    { href: '/how-to-use', label: 'How to Use' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
    { href: '/developers', label: 'Developers & Friends' },
  ],

  legalNav: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],

  // What the bot actually does. Kept short and concrete — a feature list that
  // promises nothing the commands do not do.
  features: [
    {
      icon: 'Zap',
      title: 'Pairing codes in seconds',
      body: 'Enter your number, get an 8-character code, type it on your phone. No QR camera, no desktop app, no scanning.',
    },
    {
      icon: 'Users',
      title: 'Built for groups',
      body: 'Welcome and goodbye cards, antilink, antispam, warnings, promotions, mutes and admin tools — all with generated images.',
    },
    {
      icon: 'Command',
      title: 'Commands and AI',
      body: 'Hundreds of commands for downloads, stickers, group admin, games and AI chat, all working from the number you linked.',
    },
    {
      icon: 'Dashboard',
      title: 'Panels and VPS',
      body: 'Resellers can create Pterodactyl panels for clients, choose the nest and the egg, and have the login details sent straight to the client.',
    },
    {
      icon: 'Wallet',
      title: 'Payments on WhatsApp',
      body: 'Plans, wallets and Paystack links handled in the chat itself — pay, verify and get access without leaving WhatsApp.',
    },
    {
      icon: 'Shield',
      title: 'Your session, your control',
      body: 'Every linked device is listed in your dashboard and can be unlinked in one tap. We never see your WhatsApp messages.',
    },
  ],

  // The five steps the pairing actually takes, in the order the page shows them.
  steps: [
    {
      n: 1,
      title: 'Open the Link Bot page',
      body: 'Go to Link Bot from the menu. Sign in with the same MZAZI account you use on mzazi.shop — one account covers both sites.',
      note: 'No account yet? Create one on mzazi.shop, then come back and sign in here.',
    },
    {
      n: 2,
      title: 'Enter your WhatsApp number',
      body: 'Type the number you want the bot on, in international format without + or spaces — for example 254785016388.',
      note: 'This is the number the bot will run on. You will need the phone in your hand for the next step.',
    },
    {
      n: 3,
      title: 'Copy the pairing code',
      body: 'We ask WhatsApp for an 8-character code and show it on screen. It usually arrives in a few seconds.',
      note: 'If the code takes longer than about a minute, the request expires — just start again.',
    },
    {
      n: 4,
      title: 'Enter it on your phone',
      body: 'Open WhatsApp → Settings → Linked devices → Link a device → Link with phone number instead, then type the code.',
      note: 'The app asks for the code instead of a QR scan — look for "Link with phone number instead".',
    },
    {
      n: 5,
      title: 'You are live',
      body: 'Your device appears in your dashboard within a few seconds. Send .menu from any chat to see what the bot can do.',
      note: 'You can unlink any device from the dashboard at any time.',
    },
  ],

  faq: [
    {
      q: 'What is MZAZI XMD?',
      a: 'MZAZI XMD is a WhatsApp bot that runs on your own WhatsApp number. Once you link it, it answers commands, manages your groups, downloads media, replies with AI and can create Pterodactyl servers for you — all inside WhatsApp.',
    },
    {
      q: 'How long does pairing take?',
      a: 'Usually under a minute. You enter your number, we show an 8-character code, and you type it into WhatsApp under Linked devices.',
    },
    {
      q: 'Do I need a computer?',
      a: 'No. Pairing is done entirely from your phone. There is no QR code to scan, which also means it works on WhatsApp Business and on phones where the camera is awkward to reach.',
    },
    {
      q: 'Can I link more than one number?',
      a: 'Yes, depending on your plan. The number of devices your plan allows is shown on the Link Bot page next to your current devices.',
    },
    {
      q: 'Will the bot read my personal chats?',
      a: 'No. The bot only acts on messages that are commands or that match a feature you enabled, such as antilink or a welcome message. It does not send your private conversations anywhere.',
    },
    {
      q: 'How do I unlink a device?',
      a: 'Open Link Bot, find the device in your list and choose Unlink. Your plan frees up immediately and the bot stops responding on that number.',
    },
    {
      q: 'The pairing code did not arrive. What now?',
      a: 'Codes expire quickly. Wait for the current request to finish, then press Generate again. If your phone shows no code prompt at all, make sure you chose "Link with phone number instead" rather than the QR scanner.',
    },
    {
      q: 'My bot stopped responding.',
      a: 'Check the Link Bot page first — if the device shows offline, unlink it and pair again. Sessions can be ended by WhatsApp itself if the number is used elsewhere, for example by WhatsApp Web on another device.',
    },
    {
      q: 'Which plans are available?',
      a: 'Plans are managed on mzazi.shop so the website, the bot and your dashboard can never disagree about a price. Open Link Bot to see the plan your account is on right now, and upgrade from inside WhatsApp.',
    },
    {
      q: 'Is it safe to link my number?',
      a: 'Linking uses WhatsApp\'s official Linked Devices feature, the same one WhatsApp Web uses. You can remove the device from WhatsApp or from this site at any time. See our Privacy Policy for how we handle the little data we keep.',
    },
  ],
};

export default site;
