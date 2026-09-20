import { Button, Badge, Icons } from '@/components/ui';
import { Section, CallToAction } from '@/components/PageShell';
import site from '@/lib/site';

// The command pack's real shape, counted from the registry the bot actually
// serves. Quoting numbers that match the product is the whole point of a page
// like this — an invented one would be found out by the first person who ran
// `.menu`.
//
// These sum to 1,020, and the registry holds 1,021: the extra one is an internal
// command used to test the pack, which has no business in a category list. The
// page says 1,020 and means it.
const COMMAND_GROUPS = [
  { label: 'General', count: 424 },
  { label: 'AI', count: 166 },
  { label: 'Group admin', count: 127 },
  { label: 'Fun', count: 93 },
  { label: 'Games', count: 82 },
  { label: 'Downloads', count: 72 },
  { label: 'Owner', count: 56 },
];

const TOTAL_COMMANDS = COMMAND_GROUPS.reduce((sum, g) => sum + g.count, 0);

const STATS = [
  { value: TOTAL_COMMANDS.toLocaleString('en-US'), label: 'Commands' },
  { value: '8', label: 'Character code' },
  { value: '5', label: 'Steps to pair' },
  { value: '<1 min', label: 'Typical pairing' },
];

/** The pairing code, as it looks on the site — the clearest way to show what this is. */
function CodePreview() {
  return (
    <div className="card glow-card" style={{ padding: 22, maxWidth: 380 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span
          aria-hidden="true"
          style={{
            width: 34, height: 34, borderRadius: 'var(--r-sm)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--brand-tint)', color: 'var(--brand)',
          }}
        >
          <Icons.WhatsApp size={18} />
        </span>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>Link a device</p>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>WhatsApp · this number</p>
        </div>
        <span className="tag tag-green" style={{ marginLeft: 'auto' }}>
          <Icons.CheckCircle size={13} /> Ready
        </span>
      </div>

      <p className="label" style={{ marginBottom: 8 }}>Pairing code</p>
      <div
        className="mono tnum"
        style={{
          padding: '18px 12px', borderRadius: 'var(--r-md)', textAlign: 'center',
          fontSize: 'clamp(22px, 5.6vw, 30px)', fontWeight: 700, letterSpacing: '0.18em',
          color: 'var(--brand)', background: 'var(--brand-tint)',
          border: '1px dashed var(--brand-soft)',
        }}
      >
        4KD9-2MP7
      </div>

      <p style={{ margin: '14px 0 0', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
        Settings → Linked devices → <strong>Link with phone number instead</strong>, then type the code.
      </p>
    </div>
  );
}

export default function HomePage() {
  const faqPreview = site.faq.slice(0, 4);

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 56, paddingBottom: 24 }}>
        <div className="container-site">
          <div className="grid-2-responsive" style={{ gap: 40, alignItems: 'center' }}>
            <div style={{ maxWidth: 620 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                <Badge tone="brand" icon={<Icons.Zap size={13} />}>Instant pairing code</Badge>
                <Badge tone="blue" icon={<Icons.Shield size={13} />}>Official linked device</Badge>
              </div>

              <h1 className="headline" style={{ fontSize: 'clamp(2.1rem, 5vw, 3.4rem)' }}>
                {site.name} — WhatsApp automation,
                <span className="accent"> paired in under a minute</span>.
              </h1>

              <p className="lede" style={{ marginTop: 18, maxWidth: 560 }}>
                Enter your number, type the 8-character code into WhatsApp, and the bot is live on
                your own account. No QR scanner, no desktop, no waiting on anyone.
              </p>

              <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
                <Button href="/link-bot" variant="primary" size="lg" icon={<Icons.Link size={17} />}>
                  Link your WhatsApp
                </Button>
                <Button href="/how-to-use" variant="ghost" size="lg" icon={<Icons.Help size={17} />}>
                  How it works
                </Button>
              </div>

              <div style={{ display: 'flex', gap: 18, marginTop: 24, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--muted)' }}>
                  <Icons.CheckCircle size={15} style={{ color: 'var(--good)' }} /> Works on WhatsApp Business
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--muted)' }}>
                  <Icons.CheckCircle size={15} style={{ color: 'var(--good)' }} /> Unlink any time
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <CodePreview />
            </div>
          </div>

          {/* ── Stats ────────────────────────────────────────────────────────── */}
          <div className="grid-cards" style={{ marginTop: 44, gap: 14 }}>
            {STATS.map((s) => (
              <div key={s.label} className="card card-pad" style={{ textAlign: 'center' }}>
                <p className="stat-num">{s.value}</p>
                <p className="stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <Section
        title="What the bot does"
        description="Everything below runs from the number you linked, inside WhatsApp — no dashboard needed to use it."
      >
        <div className="grid-cards" style={{ gap: 14 }}>
          {site.features.map((f) => {
            const Icon = Icons[f.icon] || Icons.Zap;
            return (
              <article key={f.title} className="card card-pad card-accent" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 40, height: 40, borderRadius: 'var(--r-md)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--brand-tint)', color: 'var(--brand)',
                  }}
                >
                  <Icon size={19} />
                </span>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16.5, fontWeight: 700, color: 'var(--ink)' }}>
                  {f.title}
                </h3>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--muted)' }}>{f.body}</p>
              </article>
            );
          })}
        </div>
      </Section>

      {/* ── The command pack ──────────────────────────────────────────────── */}
      <Section
        title={`${TOTAL_COMMANDS.toLocaleString('en-US')} commands, in one menu`}
        description="Every one of these categories is browsable from WhatsApp itself — send .menu and pick one."
      >
        <div className="card card-pad">
          <div style={{ display: 'grid', gap: 12 }}>
            {COMMAND_GROUPS.map((g) => {
              const pct = Math.round((g.count / TOTAL_COMMANDS) * 100);
              return (
                <div key={g.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{g.label}</span>
                    <span className="mono tnum" style={{ fontSize: 13, color: 'var(--muted)' }}>{g.count}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, var(--brand), var(--blue))' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <Section
        title="How it works"
        description="Five steps from opening this page to a live bot. The first three happen here."
      >
        <div className="grid-cards" style={{ gap: 14 }}>
          {site.steps.slice(0, 3).map((s) => (
            <article key={s.n} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="mono" style={{ color: 'var(--brand)', fontSize: 13, fontWeight: 700 }}>
                STEP {String(s.n).padStart(2, '0')}
              </span>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                {s.title}
              </h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--muted)' }}>{s.body}</p>
            </article>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <Button href="/how-to-use" variant="ghost" iconRight={<Icons.ArrowRight size={16} />}>
            Read the full walkthrough
          </Button>
        </div>
      </Section>

      {/* ── FAQ preview ───────────────────────────────────────────────────── */}
      <Section
        title="Questions people ask first"
        description="The rest are on the FAQ page, and support answers the ones that are not."
      >
        <div style={{ display: 'grid', gap: 10 }}>
          {faqPreview.map((f) => (
            <details key={f.q} className="card card-pad">
              <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--ink)', fontSize: 15, listStyle: 'none' }}>
                {f.q}
              </summary>
              <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>{f.a}</p>
            </details>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <Button href="/faq" variant="ghost" iconRight={<Icons.ArrowRight size={16} />}>
            All questions
          </Button>
        </div>
      </Section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <CallToAction
        title="Ready when you are"
        body="Linking takes about a minute, and you can unlink just as quickly. Keep your phone to hand for the code."
        primary={
          <Button href="/link-bot" variant="primary" size="lg" icon={<Icons.Link size={17} />}>
            Link your WhatsApp
          </Button>
        }
        secondary={
          <Button
            href={site.contact.whatsappUrl}
            variant="ghost"
            size="lg"
            icon={<Icons.WhatsApp size={17} />}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ask on WhatsApp
          </Button>
        }
      />
    </>
  );
}
