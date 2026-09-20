'use client';

// MZAZI XMD — header and navigation.
//
// The hamburger is the navigation at EVERY width, not just on phones. That is the
// brief: land on the page, see the brand, and one button holds the whole map. On
// wide screens the same drawer opens as a panel from the right, so there is one
// navigation to maintain and one place a link can go missing from.
//
// Accessibility is the reason for most of the code below: the drawer traps the
// page behind it, Escape closes it, focus returns to the button that opened it,
// and the current page is marked with aria-current.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { Button, Icons, ThemeToggle } from '@/components/ui';
import site from '@/lib/site';

function isActive(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const openerRef = useRef(null);
  const drawerRef = useRef(null);

  // A new page means the drawer has done its job.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Escape closes it, and focus goes back to the button rather than being lost.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); openerRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Scroll lock while the drawer covers the page. Restoring the previous value
  // rather than clearing it keeps any other lock (a modal, say) intact.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  // Move focus into the drawer once it is on screen.
  useEffect(() => {
    if (open) drawerRef.current?.querySelector('a, button')?.focus();
  }, [open]);

  const primary = site.nav.find((l) => l.primary);

  return (
    <>
      <header className="app-header no-print">
        <div className="container-site">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, height: 'var(--nav-h)' }}>

            <Link
              href="/"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flex: '0 0 auto' }}
              aria-label={`${site.name} home`}
            >
              <Logo size={32} withText id="xmd-bolt-header" />
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
              <ThemeToggle />

              {/* The one shortcut worth keeping outside the drawer: the thing the
                  site is for. */}
              {primary && (
                <span className="hidden sm:inline-flex">
                  <Button href={primary.href} size="sm" icon={<Icons.Link size={15} />}>
                    Link Bot
                  </Button>
                </span>
              )}

              <button
                type="button"
                ref={openerRef}
                className="icon-btn"
                onClick={() => setOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={open}
                aria-controls="site-drawer"
              >
                <Icons.Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {open && (
        <>
          <div
            className="overlay"
            onClick={() => setOpen(false)}
            aria-hidden="true"
            style={{ zIndex: 94 }}
          />
          <div
            className="drawer"
            id="site-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            ref={drawerRef}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
              <Link href="/" style={{ textDecoration: 'none' }} aria-label={`${site.name} home`}>
                <Logo size={28} withText id="xmd-bolt-drawer" />
              </Link>
              <button
                type="button"
                className="icon-btn"
                onClick={() => { setOpen(false); openerRef.current?.focus(); }}
                aria-label="Close navigation menu"
              >
                <Icons.X size={18} />
              </button>
            </div>

            <nav aria-label="Main" style={{ padding: 14, display: 'grid', gap: 2 }}>
              {site.nav.map((l) => {
                const active = isActive(pathname, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`side-link ${active ? 'is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>

            <div style={{ padding: '0 14px 18px' }}>
              <div style={{ paddingTop: 14, borderTop: '1px solid var(--line)', display: 'grid', gap: 10 }}>
                <Button href="/link-bot" variant="primary" block icon={<Icons.Link size={16} />}>
                  Link your WhatsApp
                </Button>
                <Button
                  href={site.contact.whatsappUrl}
                  variant="ghost"
                  block
                  icon={<Icons.WhatsApp size={16} />}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat with support
                </Button>
              </div>

              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {site.legalNav.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
