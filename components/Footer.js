// MZAZI XMD — page footer.
//
// Sits on every page and carries the three things a visitor looks for at the
// bottom: where else to go (the same navigation as the drawer, so nothing is only
// reachable one way), how to reach a human, and the legal links.

import Link from 'next/link';
import Logo from './Logo';
import { Icons } from '@/components/ui';
import site from '@/lib/site';

const linkStyle = { color: 'var(--muted)', textDecoration: 'none', fontSize: 14 };

function Column({ title, links }) {
  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 12 }}>{title}</p>
      <nav aria-label={title} style={{ display: 'grid', gap: 9 }}>
        {links.map((l) => (
          <Link key={`${title}-${l.href}`} href={l.href} style={linkStyle}>
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="no-print" style={{ marginTop: 'auto', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
      <div className="container-site" style={{ padding: '48px 20px 28px' }}>
        <div className="grid-2-responsive" style={{ gap: 36, alignItems: 'start' }}>

          <div style={{ maxWidth: 340 }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex' }} aria-label={`${site.name} home`}>
              <Logo size={30} withText id="xmd-bolt-footer" />
            </Link>
            <p style={{ margin: '14px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.65 }}>
              {site.tagline}. Link your WhatsApp once and the bot handles the rest — groups, downloads, AI replies, panels and payments.
            </p>

            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <a
                href={site.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tag tag-green"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Icons.WhatsApp size={14} /> WhatsApp
              </a>
              <a
                href={site.contact.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tag tag-blue"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Icons.Send size={14} /> Telegram
              </a>
              <a
                href={`mailto:${site.contact.email}`}
                className="tag"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Icons.Send size={14} /> Email
              </a>
            </div>
          </div>

          <div className="grid-2-responsive" style={{ gap: 28 }}>
            <Column title="Explore" links={site.footerNav} />
            <div>
              <p className="eyebrow" style={{ marginBottom: 12 }}>Support</p>
              <div style={{ display: 'grid', gap: 9, color: 'var(--muted)', fontSize: 14 }}>
                <a href={`mailto:${site.contact.email}`} style={linkStyle}>{site.contact.email}</a>
                <span>{site.contact.whatsappDisplay}</span>
                <span>{site.contact.hours}</span>
                <span>{site.contact.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 36, paddingTop: 20, borderTop: '1px solid var(--line)',
            display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: 'var(--dim)' }}>
            © {year} {site.legalName}. All rights reserved.
          </p>
          <nav aria-label="Legal" style={{ display: 'flex', gap: 18 }}>
            {site.legalNav.map((l) => (
              <Link key={l.href} href={l.href} style={{ ...linkStyle, fontSize: 13 }}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
