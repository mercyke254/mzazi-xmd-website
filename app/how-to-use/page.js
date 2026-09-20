import { PageHero, Section, CallToAction } from '@/components/PageShell';
import { Button, Alert, Icons } from '@/components/ui';
import site from '@/lib/site';

export const metadata = {
  title: 'How to Use',
  description:
    'Step by step: link your WhatsApp to MZAZI XMD, use the commands, manage groups, and unlink when you want to.',
};

const COMMANDS = [
  { cmd: '.menu', what: 'The full command list, grouped by category.' },
  { cmd: '.help', what: 'A shorter list plus how to ask support for anything missing.' },
  { cmd: '.ping', what: 'Confirms the bot is awake and shows how fast it answered.' },
  { cmd: '.ai <question>', what: 'Ask the AI anything — it replies in the same chat.' },
  { cmd: '.sticker', what: 'Reply to any image or video to turn it into a sticker.' },
  { cmd: '.play <song>', what: 'Search and send audio or video by name.' },
];

// Every tile below is a command that exists in the pack the bot serves —
// antilink, welcome/goodbye, addwarn and friends, promote/demote, tagall and
// hidetagall, lockgroup — rather than a feature the site hopes is there.
const GROUP_TOOLS = [
  { name: 'Welcome & goodbye', what: 'A card is generated with the member\'s picture as they join or leave.' },
  { name: 'Antilink', what: 'Removes links posted in the group and warns whoever sent them.' },
  { name: 'Warnings', what: 'Warn a member, check their count, clear it, or list everyone who has one.' },
  { name: 'Promote & demote', what: 'Give or take admin rights, with the group told who did it.' },
  { name: 'Tag all', what: 'Calls the whole group at once — hidetagall does the same without showing the list.' },
  { name: 'Group lock', what: 'Close or open the group so only admins can post.' },
];

export default function HowToUsePage() {
  return (
    <>
      <PageHero
        eyebrow="How to Use"
        title="From pairing to your first command"
        lede="Everything you need in order, with the parts people get stuck on called out. Nothing here requires a computer."
      >
        <Button href="/link-bot" variant="primary" icon={<Icons.Link size={16} />}>
          Start pairing
        </Button>
      </PageHero>

      {/* ── The five steps ─────────────────────────────────────────────────── */}
      <Section
        title="Pairing, step by step"
        description="This is exactly what the Link Bot page walks you through."
      >
        <div style={{ display: 'grid', gap: 14 }}>
          {site.steps.map((s) => (
            <div key={s.n} className="card card-pad" style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span
                  aria-hidden="true"
                  className="mono"
                  style={{
                    width: 34, height: 34, borderRadius: '50%', flex: '0 0 34px',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--brand-tint)', color: 'var(--brand)', fontWeight: 700, fontSize: 14,
                  }}
                >
                  {s.n}
                </span>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
                  {s.title}
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink-2)' }}>{s.body}</p>
              {s.note && (
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: 'var(--muted)', paddingLeft: 46 }}>
                  {s.note}
                </p>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <Alert kind="warn" title="The step people miss">
            WhatsApp hides the code entry behind <strong>Link with phone number instead</strong>. If you
            see a QR scanner, look under the camera view for that button — there is no QR code to scan here.
          </Alert>
        </div>
      </Section>

      {/* ── Commands ───────────────────────────────────────────────────────── */}
      <Section
        title="Your first commands"
        description="Send these from any chat. The prefix is a full stop by default, and the owner can change it."
      >
        <div className="card card-pad" style={{ padding: 0, overflow: 'hidden' }}>
          {COMMANDS.map((c, i) => (
            <div
              key={c.cmd}
              className="row-item"
              style={{
                display: 'flex', gap: 14, alignItems: 'baseline', flexWrap: 'wrap',
                padding: '14px 18px',
                borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)',
              }}
            >
              <code className="mono" style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 14, minWidth: 150 }}>
                {c.cmd}
              </code>
              <span style={{ fontSize: 14, color: 'var(--muted)', flex: '1 1 220px' }}>{c.what}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 14, fontSize: 13.5, color: 'var(--muted)' }}>
          Send <code className="mono">.menu</code> in WhatsApp for the full set of 1,000+ commands.
        </p>
      </Section>

      {/* ── Groups ─────────────────────────────────────────────────────────── */}
      <Section
        title="Using it in a group"
        description="Add the bot's number to the group, make it an admin, and switch the parts you want on."
      >
        <div className="grid-cards" style={{ gap: 14 }}>
          {GROUP_TOOLS.map((g) => (
            <div key={g.name} className="card card-pad">
              <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 15.5, fontWeight: 700, color: 'var(--ink)' }}>
                {g.name}
              </h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--muted)' }}>{g.what}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
          <Alert kind="info" title="It needs admin rights for the moderation features">
            Antilink, the warnings and the welcome cards all act on the group, so the bot's number has to be
            an admin. Commands like <code className="mono">.menu</code> and <code className="mono">.ai</code>{' '}
            work in a group without them.
          </Alert>
        </div>
      </Section>

      {/* ── Housekeeping ──────────────────────────────────────────────────── */}
      <Section title="Managing your devices">
        <div style={{ display: 'grid', gap: 14, maxWidth: 760 }}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: 'var(--ink-2)' }}>
            The <a href="/link-bot" className="link">Link Bot</a> page lists every number on your account
            with the bot holding it. <strong>Unlink</strong> stops the bot on that number straight away and
            frees the slot for another.
          </p>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: 'var(--ink-2)' }}>
            You can also remove the device from WhatsApp itself — the same screen where you linked it. Either
            way works; the bot notices within a few seconds.
          </p>
          <Alert kind="warn" title="Only you can unlink your numbers">
            Unlinking is restricted to the account that linked the number. Support cannot remove a device
            for you, which is what keeps a linked number yours.
          </Alert>
        </div>
      </Section>

      <CallToAction
        title="Still stuck?"
        body="Tell support which step you are on and what you see. Screenshots help, and someone usually replies within a couple of hours."
        primary={
          <Button
            href={site.contact.whatsappUrl}
            variant="primary"
            size="lg"
            icon={<Icons.WhatsApp size={17} />}
            target="_blank"
            rel="noopener noreferrer"
          >
            Message support
          </Button>
        }
        secondary={
          <Button href="/faq" variant="ghost" size="lg" icon={<Icons.Help size={17} />}>
            Read the FAQ
          </Button>
        }
      />
    </>
  );
}
