import Link from 'next/link';
import { Button, Icons } from '@/components/ui';
import site from '@/lib/site';

export const metadata = { title: 'Page not found' };

// A dead end should still offer the two things worth doing: pair a number, or
// read how to.
const SUGGESTIONS = [
  { href: '/link-bot', label: 'Link Bot', what: 'Pair a WhatsApp number' },
  { href: '/how-to-use', label: 'How to Use', what: 'The walkthrough' },
  { href: '/faq', label: 'FAQ', what: 'Common questions' },
  { href: '/', label: 'Home', what: 'Back to the start' },
];

export default function NotFound() {
  return (
    <section style={{ paddingTop: 80, paddingBottom: 100 }}>
      <div className="container-site">
        <div style={{ maxWidth: 620 }}>
          <p className="eyebrow">404</p>
          <h1 className="headline" style={{ fontSize: 'clamp(2rem, 4.6vw, 3rem)', marginTop: 14 }}>
            That page is not here<span className="accent">.</span>
          </h1>
          <p className="lede" style={{ marginTop: 16 }}>
            The link may be old, or mistyped. Nothing is broken — try one of these instead.
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <Button href="/link-bot" variant="primary" icon={<Icons.Link size={16} />}>
              Link your WhatsApp
            </Button>
            <Button
              href={site.contact.whatsappUrl}
              variant="ghost"
              icon={<Icons.WhatsApp size={16} />}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ask support
            </Button>
          </div>
        </div>

        <div className="grid-cards" style={{ marginTop: 40, gap: 12 }}>
          {SUGGESTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="card card-pad" style={{ textDecoration: 'none', display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15 }}>{s.label}</span>
              <span style={{ color: 'var(--muted)', fontSize: 13.5 }}>{s.what}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
