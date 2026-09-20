import { PageHero, ProsePage } from '@/components/PageShell';
import site from '@/lib/site';

export const metadata = {
  title: 'Terms of Service',
  description:
    'The rules for using MZAZI XMD: what you may do with a linked WhatsApp number, what is not allowed, plans and payments, and the limits of our responsibility.',
};

// Deliberately plain. The terms a person actually needs to know before linking a
// number are the ones about WhatsApp's own rules and about spam — so those are
// sections 3 and 4 rather than buried at the bottom.
const SECTIONS = [
  {
    id: 'agreement',
    title: '1. The Agreement',
    body: (
      <p>
        These terms cover your use of {site.name} and of any bot operated under it. By creating an account,
        linking a WhatsApp number or using a command, you accept them. If you do not accept them, do not link
        a number.
      </p>
    ),
  },
  {
    id: 'eligibility',
    title: '2. Who May Use It',
    body: (
      <p>
        You must be at least 16 and legally able to enter into this agreement. You must be the owner of, or
        have permission to act for, every WhatsApp number you link. Linking a number you do not control is a
        breach of these terms and grounds for immediate removal.
      </p>
    ),
  },
  {
    id: 'whatsapp',
    title: '3. WhatsApp\'s Rules Still Apply',
    body: (
      <>
        <p>
          Linking a device uses WhatsApp's own Linked Devices feature. Your use of WhatsApp remains governed
          by WhatsApp's Terms of Service, and nothing here overrides them.
        </p>
        <p>
          WhatsApp may end a linked session, and it may restrict or ban a number that it judges to be
          violating its rules — including for bulk messaging, unsolicited contact or automation it does not
          permit. That risk sits with the number's owner, not with us. Do not use the bot to send unsolicited
          bulk messages.
        </p>
      </>
    ),
  },
  {
    id: 'acceptable',
    title: '4. Acceptable Use',
    body: (
      <>
        <p>Do not use the bot to:</p>
        <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>
          <li>send spam, bulk or unsolicited messages, or messages to people who asked you to stop;</li>
          <li>harass, threaten, defraud or impersonate anyone;</li>
          <li>distribute illegal content, malware, or content that sexualises minors;</li>
          <li>break the rules of a group you have added the bot to, or override its admins;</li>
          <li>attempt to disrupt the service for others, or to extract another user's data;</li>
          <li>resell or sublicense the service without agreeing it with us in writing first.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'groups',
    title: '5. Groups',
    body: (
      <p>
        You are responsible for having the bot in a group and for what it does there. Group protections such
        as antilink and warnings act on other people's messages; make sure the group knows a bot is present
        and agrees to those features before you switch them on.
      </p>
    ),
  },
  {
    id: 'plans',
    title: '6. Plans, Devices and Payment',
    body: (
      <>
        <p>
          Plans set how many numbers you may link at once. Prices and allowances are shown on mzazi.shop and
          in the bot, and both are kept in step by the same system — if you see a difference, tell support and
          the correct figure will be honoured.
        </p>
        <p>
          Payments are processed by Paystack. Access is granted on a successful payment, and a plan runs for
          the period shown at purchase. Unless a plan is described as recurring it does not renew itself.
        </p>
      </>
    ),
  },
  {
    id: 'refunds',
    title: '7. Refunds',
    body: (
      <p>
        If a plan fails to work and we cannot fix it, you may ask for a refund of the unused portion within
        seven days of payment. Refunds are made to the original payment method. Refunds are not given where
        the account was removed for breaching these terms.
      </p>
    ),
  },
  {
    id: 'availability',
    title: '8. Availability and Changes',
    body: (
      <p>
        The service is offered as it is. Features may be added, changed or removed, and there will be
        occasional downtime for maintenance or because WhatsApp has changed something. We aim to announce
        anything that affects normal use in the support channel.
      </p>
    ),
  },
  {
    id: 'termination',
    title: '9. Suspension and Termination',
    body: (
      <p>
        You can stop at any time: unlink your devices and, if you wish, ask for your account to be closed.
        We may suspend or terminate access where these terms are broken, where the service is being abused,
        or where we are legally required to. Where it is reasonable to do so, you will be told why.
      </p>
    ),
  },
  {
    id: 'liability',
    title: '10. Limits of Our Responsibility',
    body: (
      <p>
        We are not responsible for indirect or consequential loss, for lost profits, or for anything arising
        from a restriction WhatsApp places on your number. Our total responsibility for a claim relating to
        the service is limited to what you paid us in the three months before the claim.
      </p>
    ),
  },
  {
    id: 'governing',
    title: '11. Governing Law',
    body: (
      <p>
        These terms are governed by the laws of Kenya, and disputes are subject to the jurisdiction of the
        Kenyan courts.
      </p>
    ),
  },
  {
    id: 'contact',
    title: '12. Contact',
    body: (
      <p>
        Questions about these terms: message {site.contact.whatsappDisplay} on WhatsApp, email{' '}
        <a href={`mailto:${site.contact.email}`} className="link">{site.contact.email}</a>, or use the{' '}
        <a href="/contact" className="link">contact form</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of service"
        lede="The rules for running a bot on your own WhatsApp number — including the two that matter most: WhatsApp's terms still apply, and no spam."
        meta={`Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
      />
      <ProsePage sections={SECTIONS} />
    </>
  );
}
