import { PageHero, Section } from '@/components/PageShell';
import { Card, CardHeader, Icons } from '@/components/ui';
import ContactForm from './ContactForm';
import site from '@/lib/site';

export const metadata = {
  title: 'Contact',
  description:
    'Reach the MZAZI XMD team on WhatsApp, Telegram, email or the contact form. Support hours, response times and where to find us.',
};

const CHANNELS = [
  {
    icon: 'WhatsApp',
    label: 'WhatsApp',
    value: site.contact.whatsappDisplay,
    href: site.contact.whatsappUrl,
    note: 'Fastest for pairing problems and anything account-related.',
    external: true,
  },
  {
    icon: 'Send',
    label: 'Telegram',
    value: `@${site.contact.telegram}`,
    href: site.contact.telegramUrl,
    note: 'Announcements, releases and support in one channel.',
    external: true,
  },
  {
    icon: 'Send',
    label: 'Email',
    value: site.contact.email,
    href: `mailto:${site.contact.email}`,
    note: 'Best for invoices, refunds and anything needing a record.',
    external: false,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to a person"
        lede="Support is run by the people who maintain the bot, so answers come from someone who can actually fix the problem."
      />

      <Section>
        <div className="grid-2-responsive" style={{ gap: 24, alignItems: 'start' }}>

          {/* ── The channels ── */}
          <div style={{ display: 'grid', gap: 14 }}>
            <h2 className="section-title" style={{ fontSize: '1.2rem', marginBottom: 2 }}>
              <span className="bar" aria-hidden="true" />
              Where to find us
            </h2>

            {CHANNELS.map((c) => {
              const Icon = Icons[c.icon] || Icons.Send;
              return (
                <a
                  key={c.label}
                  href={c.href}
                  {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="card card-pad"
                  style={{ textDecoration: 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 42, height: 42, flex: '0 0 42px', borderRadius: 'var(--r-md)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--brand-tint)', color: 'var(--brand)',
                    }}
                  >
                    <Icon size={19} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, color: 'var(--ink)', fontSize: 15.5 }}>{c.label}</span>
                    <span className="mono" style={{ display: 'block', color: 'var(--brand)', fontSize: 14, margin: '3px 0 6px' }}>
                      {c.value}
                    </span>
                    <span style={{ display: 'block', color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.6 }}>{c.note}</span>
                  </span>
                  <Icons.ArrowRight size={16} style={{ color: 'var(--dim)', marginLeft: 'auto', flex: '0 0 auto' }} />
                </a>
              );
            })}

            <div className="card card-pad" style={{ display: 'grid', gap: 10 }}>
              <p className="eyebrow" style={{ margin: 0 }}>Support hours</p>
              <p style={{ margin: 0, fontSize: 14.5, color: 'var(--ink-2)' }}>{site.contact.hours}</p>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.65 }}>
                Outside those hours, messages are still received — they are answered the next working day.
                {site.contact.location} time.
              </p>
            </div>
          </div>

          {/* ── The form ── */}
          <Card>
            <CardHeader
              title="Send a message"
              description="It reaches the same support inbox as everything else."
              icon={<Icons.Send size={18} />}
            />
            <div style={{ padding: '0 20px 20px' }}>
              <ContactForm />
            </div>
          </Card>
        </div>
      </Section>

      <Section narrow>
        <div className="card card-pad">
          <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: 12 }}>
            <span className="bar" aria-hidden="true" />
            Before you write
          </h2>
          <div style={{ display: 'grid', gap: 10, fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
            <p style={{ margin: 0, display: 'flex', gap: 9 }}>
              <Icons.CheckCircle size={16} style={{ color: 'var(--good)', flex: '0 0 auto', marginTop: 3 }} />
              <span>Pairing trouble is almost always the code entry step — the <a href="/how-to-use" className="link">walkthrough</a> shows where it hides.</span>
            </p>
            <p style={{ margin: 0, display: 'flex', gap: 9 }}>
              <Icons.CheckCircle size={16} style={{ color: 'var(--good)', flex: '0 0 auto', marginTop: 3 }} />
              <span>For devices, plan limits and unlinking, the <a href="/link-bot" className="link">Link Bot page</a> answers most of it on sight.</span>
            </p>
            <p style={{ margin: 0, display: 'flex', gap: 9 }}>
              <Icons.CheckCircle size={16} style={{ color: 'var(--good)', flex: '0 0 auto', marginTop: 3 }} />
              <span>Never send a pairing code, session file or password to anyone — support will never ask for one.</span>
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
