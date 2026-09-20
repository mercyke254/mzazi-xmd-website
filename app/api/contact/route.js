// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contact
//
// Writes the message into the platform's `inquiries` table — the same table the
// admin panel reads — so an enquiry from this site lands in the support inbox
// rather than in a log line.
//
// Worth knowing: the platform's own /api/contact endpoint only console.logs the
// submission and answers "success". Nothing is stored by it, so a message sent
// from the main site's contact form is gone the moment the instance recycles.
// This one stores it. A signed-in visitor's enquiry is attached to their account
// (user_id), which is how the member-thread view shows it; a visitor who is not
// signed in still gets a row, with user_id null and their name and email from the
// form, because a person asking a question should not have to register first.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { db, describeDbError } from '@/lib/db';
import { currentUser } from '@/lib/session';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const MAX_SUBJECT = 255;
const MAX_MESSAGE = 5000;

// Deliberately permissive: this validates a form, not an RFC. Anything stricter
// starts rejecting addresses that really do exist.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request) {
  try {
    // Public endpoint, so it is the one most worth throttling.
    const limit = rateLimit(`contact:${clientIp(request)}`, { max: 5, windowMs: 10 * 60_000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many messages from this connection. Please try again shortly, or reach us on WhatsApp.' },
        { status: 429 }
      );
    }

    let body;
    try { body = await request.json(); } catch { body = {}; }

    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim();
    const phone = String(body?.phone || '').trim();
    const subject = String(body?.subject || '').trim() || 'MZAZI XMD enquiry';
    const message = String(body?.message || '').trim();

    if (!name) return NextResponse.json({ error: 'Please tell us your name.' }, { status: 400 });
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please give an email address we can reply to.' }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ error: 'Please describe what you need in a sentence or two.' }, { status: 400 });
    }
    if (subject.length > MAX_SUBJECT) {
      return NextResponse.json({ error: `Subject is too long (max ${MAX_SUBJECT} characters).` }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE) {
      return NextResponse.json({ error: `Message is too long (max ${MAX_MESSAGE} characters).` }, { status: 400 });
    }

    // Attach the account when there is one — it turns a stranger's question into
    // a member thread with the device list a click away.
    const user = await currentUser().catch(() => null);

    // The phone number is part of the message rather than a column: the table has
    // no field for it, and dropping what someone chose to give us would be worse
    // than appending it.
    const fullMessage = phone ? `${message}\n\n— WhatsApp: ${phone}` : message;
    const accountName = user
      ? (user.fullname || `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.email)
      : name;

    const inserted = await db()`
      INSERT INTO inquiries (user_id, user_email, user_name, subject, message)
      VALUES (${user?.id ?? null}, ${user?.email || email}, ${accountName}, ${subject}, ${fullMessage})
      RETURNING id
    `;
    const inquiryId = inserted[0].id;

    // The same opening message the platform files, so the thread view is not
    // empty for a message that was never empty.
    await db()`
      INSERT INTO inquiry_messages (inquiry_id, sender, message)
      VALUES (${inquiryId}, 'user', ${fullMessage})
    `;

    return NextResponse.json({
      message: 'Message received. We will reply to the email address you gave.',
      id: inquiryId,
    });
  } catch (e) {
    if (e?.isConfig) return NextResponse.json({ error: e.message }, { status: 500 });
    const { reason } = describeDbError(e);
    console.error('Contact error:', reason);
    return NextResponse.json(
      { error: `We could not send that: ${reason}. Please use WhatsApp or email instead.` },
      { status: 500 }
    );
  }
}
