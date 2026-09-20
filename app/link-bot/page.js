import { PageHero, Section } from '@/components/PageShell';
import PairingPanel from './PairingPanel';
import { Alert, Icons } from '@/components/ui';
import site from '@/lib/site';

export const metadata = {
  title: 'Link Bot',
  description:
    'Link your WhatsApp to MZAZI XMD and get a pairing code in seconds. Enter your number, type the code on your phone, and the bot is live.',
};

export default function LinkBotPage() {
  return (
    <>
      <PageHero
        eyebrow="Link Bot"
        title="Pair your WhatsApp number"
        lede="Enter the number you want the bot on, copy the code we give you, and type it into WhatsApp. The whole thing usually takes under a minute."
      />

      <Section>
        <div style={{ display: 'grid', gap: 20, maxWidth: 720 }}>
          <Alert kind="brand" title="Have your phone ready">
            The code has to be typed into WhatsApp on the number you are linking, under{' '}
            <strong>Settings → Linked devices → Link a device → Link with phone number instead</strong>.
          </Alert>

          <PairingPanel />

          <div className="card card-pad">
            <h2 className="section-title" style={{ fontSize: '1.15rem', marginBottom: 12 }}>
              <span className="bar" aria-hidden="true" />
              While you are here
            </h2>
            <div style={{ display: 'grid', gap: 12, fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
              <p style={{ margin: 0, display: 'flex', gap: 9 }}>
                <Icons.CheckCircle size={16} style={{ color: 'var(--good)', flex: '0 0 auto', marginTop: 2 }} />
                <span>A number stays linked until you unlink it — closing this page changes nothing.</span>
              </p>
              <p style={{ margin: 0, display: 'flex', gap: 9 }}>
                <Icons.CheckCircle size={16} style={{ color: 'var(--good)', flex: '0 0 auto', marginTop: 2 }} />
                <span>Unlinking is immediate: the bot stops answering on that number, and your device slot frees up.</span>
              </p>
              <p style={{ margin: 0, display: 'flex', gap: 9 }}>
                <Icons.CheckCircle size={16} style={{ color: 'var(--good)', flex: '0 0 auto', marginTop: 2 }} />
                <span>
                  Stuck on a step? The{' '}
                  <a href="/how-to-use" className="link">walkthrough</a> has it with screenshots of the
                  WhatsApp screen names, or you can{' '}
                  <a href={site.contact.whatsappUrl} target="_blank" rel="noopener noreferrer" className="link">
                    message support
                  </a>.
                </span>
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
