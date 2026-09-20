import { PageHero, Section, CallToAction } from '@/components/PageShell';
import { Button, Icons } from '@/components/ui';
import site from '@/lib/site';

export const metadata = {
  title: 'FAQ',
  description:
    'Answers to the questions people ask before and after linking their WhatsApp to MZAZI XMD — pairing, devices, privacy, plans and troubleshooting.',
};

// The FAQ is a list of details/summary pairs rather than an accordion component:
// it works with JavaScript disabled, it is searchable by the browser's own
// find-on-page, and each answer is reachable by URL fragment.
export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Questions, answered"
        lede="Pairing, devices, privacy, plans and what to do when something does not work. If your question is not here, support answers messages directly."
      />

      <Section narrow>
        <div style={{ display: 'grid', gap: 10 }}>
          {site.faq.map((f, i) => (
            <details key={f.q} className="card card-pad" open={i === 0}>
              <summary
                style={{
                  cursor: 'pointer', fontWeight: 700, color: 'var(--ink)', fontSize: 15.5,
                  listStyle: 'none', display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <Icons.Help size={16} style={{ color: 'var(--brand)', flex: '0 0 auto' }} />
                {f.q}
              </summary>
              <p style={{ margin: '12px 0 0', fontSize: 14.5, lineHeight: 1.75, color: 'var(--ink-2)', paddingLeft: 26 }}>
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </Section>

      <Section narrow>
        <div className="card card-pad">
          <h2 className="section-title" style={{ fontSize: '1.15rem', marginBottom: 10 }}>
            <span className="bar" aria-hidden="true" />
            Something not covered here?
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 14.5, lineHeight: 1.75, color: 'var(--muted)' }}>
            Send a message with what you tried and what happened. Screenshots of the WhatsApp screen help
            more than a description of it, especially for pairing.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button href="/contact" variant="primary" icon={<Icons.Send size={16} />}>
              Contact support
            </Button>
            <Button href="/how-to-use" variant="ghost" icon={<Icons.Help size={16} />}>
              How to use
            </Button>
          </div>
        </div>
      </Section>

      <CallToAction
        title="Ready to try it?"
        body="Pairing takes about a minute and needs nothing but your phone."
        primary={
          <Button href="/link-bot" variant="primary" size="lg" icon={<Icons.Link size={17} />}>
            Link your WhatsApp
          </Button>
        }
      />
    </>
  );
}
