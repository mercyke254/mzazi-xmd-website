'use client';

// MZAZI XMD — the contact form.
//
// Posts to /api/contact, which is the bridge: the enquiry is stored by the live
// MZAZI API exactly as it is when submitted on mzazi.shop, so support reads one
// inbox rather than two. Nothing is sent from here directly.

import { useState } from 'react';
import { Button, Alert, Icons } from '@/components/ui';

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' };

export default function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.message.trim().length < 10) {
      setError('Please describe what you need in a sentence or two (at least 10 characters).');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject: form.subject.trim() || 'MZAZI XMD enquiry',
          message: form.message.trim(),
        }),
      });
      const d = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(d.error || d.message || 'We could not send that. Please try WhatsApp or email instead.');
        return;
      }

      setSent(true);
      setForm(EMPTY);
    } catch {
      setError('We could not reach the server. Check your connection, or use WhatsApp or email below.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Alert kind="success" title="Message received">
        Thanks — support has it and will reply to the email address you gave. If it is urgent, WhatsApp is
        usually faster: {''}
        <a href="https://wa.me/254108595201" target="_blank" rel="noopener noreferrer" className="link">
          message us directly
        </a>.
      </Alert>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
      <div className="grid-2-responsive" style={{ gap: 14 }}>
        <div>
          <label className="label" htmlFor="c-name">Your name</label>
          <input id="c-name" className="input" required value={form.name} onChange={set('name')} autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="c-email">Email</label>
          <input id="c-email" className="input" type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
        </div>
      </div>

      <div className="grid-2-responsive" style={{ gap: 14 }}>
        <div>
          <label className="label" htmlFor="c-phone">WhatsApp number <span style={{ color: 'var(--dim)', fontWeight: 400 }}>(optional)</span></label>
          <input id="c-phone" className="input mono" value={form.phone} onChange={set('phone')} placeholder="254785016388" inputMode="numeric" />
        </div>
        <div>
          <label className="label" htmlFor="c-subject">Subject</label>
          <input id="c-subject" className="input" value={form.subject} onChange={set('subject')} placeholder="Pairing help" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="c-message">How can we help?</label>
        <textarea
          id="c-message"
          className="input"
          rows={5}
          required
          value={form.message}
          onChange={set('message')}
          placeholder="Tell us what you tried and what happened. If it is about pairing, which step are you on?"
        />
        <p className="field-hint">{form.message.trim().length} characters</p>
      </div>

      {error && <Alert kind="error" title="Could not send">{error}</Alert>}

      <div>
        <Button type="submit" variant="primary" loading={sending} loadingText="Sending…" icon={<Icons.Send size={16} />}>
          Send message
        </Button>
      </div>
    </form>
  );
}
