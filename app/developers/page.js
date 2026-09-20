import { PageHero, Section, CallToAction } from '@/components/PageShell';
import { Button, Icons } from '@/components/ui';
import site from '@/lib/site';

export const metadata = {
  title: 'Developers & Friends',
  description:
    'The people who build and maintain MZAZI XMD — the core team, the developers behind the platform, and the friends and partners we build with.',
};

// The core team as the MZAZI TECH site credits it. Kept in step deliberately:
// two sites naming their founders differently is the kind of inconsistency a
// visitor notices.
const TEAM = [
  { name: 'Dominic Mokua Kerubo', role: 'Founder', company: 'Mzazi Tech', initials: 'DM' },
  { name: 'Antony Ochieng', role: 'Founder', company: 'Blacklord Tech', initials: 'AO' },
  { name: 'Big Brother', role: 'Founder', company: 'Darknode XMD', initials: 'BB' },
];

// Written to describe what each account actually holds, not a job title that
// cannot be checked from outside.
const DEVELOPERS = [
  {
    handle: 'mzazi89',
    url: 'https://github.com/mzazi89',
    role: 'Bots & platform',
    body: 'The repositories this platform is built from live under this account: the two bot engines, the Baileys fork they run on, the main website and its admin panel. They are all public — read them below.',
    initials: 'MZ',
  },
  {
    handle: 'mercyke254',
    url: 'https://github.com/mercyke254',
    role: 'Front end',
    body: 'This site — the pairing front end and the pages around it — is developed and held under this account.',
    initials: 'MK',
  },
];

// Only repositories that are public. A link that 404s for a visitor is worse than
// no link at all.
const REPOS = [
  { name: 'mzazi-xmd', what: 'The MZAZI XMD bot itself — commands, groups, panels and payments.' },
  { name: 'quartz', what: 'QUARTZ XD, the sibling bot, sharing the same platform and database.' },
  { name: 'baileys', what: 'The WhatsApp library fork both bots run on.' },
  { name: 'web', what: 'The main MZAZI TECH site and the API behind pairing.' },
  { name: 'admin', what: 'The admin panel: users, commands, subscriptions and broadcasts.' },
];

const FRIENDS = [
  { name: 'Blacklord Tech', what: 'Antony Ochieng\'s project, and a founding partner of MZAZI TECH.' },
  { name: 'Darknode XMD', what: 'Big Brother\'s project, and a founding partner of MZAZI TECH.' },
];

function Avatar({ initials, tone = 'brand' }) {
  const bg = tone === 'brand' ? 'var(--brand-tint)' : 'var(--blue-tint)';
  const fg = tone === 'brand' ? 'var(--brand)' : 'var(--blue-deep)';
  return (
    <span
      aria-hidden="true"
      style={{
        width: 56, height: 56, flex: '0 0 56px', borderRadius: '50%',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: bg, color: fg, fontWeight: 800, fontSize: 17,
        fontFamily: 'var(--font-display)', border: '1px solid var(--line)',
      }}
    >
      {initials}
    </span>
  );
}

export default function DevelopersPage() {
  return (
    <>
      <PageHero
        eyebrow="Developers & Friends"
        title="The people behind MZAZI XMD"
        lede="A small team, a public stack, and the partners we build with. If you run something that works well with the bot, we would like to hear about it."
      />

      {/* ── Core team ─────────────────────────────────────────────────────── */}
      <Section
        title="Core team"
        description="The founders behind the platform."
      >
        <div className="grid-cards" style={{ gap: 14 }}>
          {TEAM.map((p) => (
            <article key={p.name} className="card card-pad" style={{ textAlign: 'center', display: 'grid', gap: 10, justifyItems: 'center' }}>
              <Avatar initials={p.initials} />
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                  {p.name}
                </h3>
                <p className="mono" style={{ margin: '5px 0 0', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)' }}>
                  {p.role}
                </p>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)' }}>{p.company}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ── Developers ────────────────────────────────────────────────────── */}
      <Section
        title="Developers"
        description="Where the code lives, and who to bother about it."
      >
        <div style={{ display: 'grid', gap: 14 }}>
          {DEVELOPERS.map((d) => (
            <article key={d.handle} className="card card-pad" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <Avatar initials={d.initials} tone="blue" />
              <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
                    @{d.handle}
                  </h3>
                  <span className="tag tag-blue">{d.role}</span>
                </div>
                <p style={{ margin: '10px 0 12px', fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>{d.body}</p>
                <Button
                  href={d.url}
                  variant="ghost"
                  size="sm"
                  icon={<Icons.ExternalLink size={15} />}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/{d.handle}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* ── Repositories ──────────────────────────────────────────────────── */}
      <Section
        title="Open repositories"
        description="Read the code before you trust it with your number. That is the point of listing them."
      >
        <div className="card card-pad" style={{ padding: 0, overflow: 'hidden' }}>
          {REPOS.map((r, i) => (
            <a
              key={r.name}
              href={`https://github.com/mzazi89/${r.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="row-item"
              style={{
                display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap',
                padding: '15px 18px', textDecoration: 'none',
                borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)',
              }}
            >
              <Icons.Command size={17} style={{ color: 'var(--brand)', flex: '0 0 auto' }} />
              <code className="mono" style={{ color: 'var(--ink)', fontWeight: 700, fontSize: 14, minWidth: 110 }}>
                {r.name}
              </code>
              <span style={{ fontSize: 13.5, color: 'var(--muted)', flex: '1 1 220px' }}>{r.what}</span>
              <Icons.ExternalLink size={15} style={{ color: 'var(--dim)', marginLeft: 'auto', flex: '0 0 auto' }} />
            </a>
          ))}
        </div>
      </Section>

      {/* ── Friends ───────────────────────────────────────────────────────── */}
      <Section
        title="Friends & partners"
        description="The people who make the bot better by using it hard."
      >
        <div className="grid-2-responsive" style={{ gap: 14 }}>
          {FRIENDS.map((f) => (
            <article key={f.name} className="card card-pad">
              <h3 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                {f.name}
              </h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>{f.what}</p>
            </article>
          ))}
        </div>

        <div className="card card-pad" style={{ marginTop: 14 }}>
          <h3 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
            Want to be on this page?
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>
            If you have built a command pack, an integration, or you test the bot at a scale that finds real
            bugs — say hello. Contributions and partners are both credited here.
          </p>
          <Button href="/contact" variant="ghost" size="sm" icon={<Icons.Send size={15} />}>
            Get in touch
          </Button>
        </div>
      </Section>

      <CallToAction
        title="Building something on top?"
        body="The bots, the API and the admin panel are all in the open. Start from the repositories above, or ask us where to begin."
        primary={
          <Button href="/contact" variant="primary" size="lg" icon={<Icons.Send size={17} />}>
            Talk to the team
          </Button>
        }
        secondary={
          <Button
            href={site.contact.telegramUrl}
            variant="ghost"
            size="lg"
            icon={<Icons.Send size={17} />}
            target="_blank"
            rel="noopener noreferrer"
          >
            Join on Telegram
          </Button>
        }
      />
    </>
  );
}
