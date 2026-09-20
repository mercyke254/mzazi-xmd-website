import { PageHero, ProsePage } from '@/components/PageShell';
import site from '@/lib/site';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'What MZAZI XMD collects when you link a WhatsApp number, what the bot can and cannot see, how long data is kept, and how to have it removed.',
};

// Written for what THIS site and this bot actually do. The one thing worth
// stating plainly, because it is what people link to us worried about: the bot
// runs on the user's own WhatsApp account and does not read their messages.
const SECTIONS = [
  {
    id: 'collect',
    title: '1. What We Collect',
    body: (
      <>
        <p>
          <strong style={{ color: 'var(--ink)' }}>Account data:</strong> the name, email address and password
          of the account you sign in with. Passwords are stored as bcrypt hashes, never as text.
        </p>
        <p>
          <strong style={{ color: 'var(--ink)' }}>Linked-device data:</strong> the WhatsApp number you link,
          when it was linked, and the session credentials WhatsApp issues for it. Those credentials are the
          same kind that let WhatsApp Web run, and they are what the bot uses to act as your device.
        </p>
        <p>
          <strong style={{ color: 'var(--ink)' }}>Command and usage data:</strong> which commands are used
          and when, plus the group and chat identifiers needed to run features you switch on (welcome cards,
          antilink, warnings). This is operational data — it is how the bot knows a warning was already given
          to a member.
        </p>
        <p>
          <strong style={{ color: 'var(--ink)' }}>Payment data:</strong> handled entirely by Paystack. Card
          numbers never reach our servers, and we do not store them.
        </p>
        <p>
          <strong style={{ color: 'var(--ink)' }}>Contact submissions:</strong> if you use the contact form or
          write to support, we keep the message so the conversation can be continued.
        </p>
      </>
    ),
  },
  {
    id: 'not-collect',
    title: '2. What We Do Not Collect',
    body: (
      <>
        <p>
          <strong style={{ color: 'var(--ink)' }}>Your message contents.</strong> The bot does not read or
          store your personal conversations. A message is examined only to decide whether it is a command,
          or whether it matches a protection you explicitly enabled in a group — and it is not retained
          beyond that decision.
        </p>
        <p>
          <strong style={{ color: 'var(--ink)' }}>Your contacts.</strong> The contact list on a linked device
          is never read or uploaded.
        </p>
        <p>
          <strong style={{ color: 'var(--ink)' }}>Media you send.</strong> Files are processed to fulfil the
          command you asked for (a sticker, say) and are not kept afterwards.
        </p>
      </>
    ),
  },
  {
    id: 'use',
    title: '3. How We Use It',
    body: (
      <p>
        To run the bot on the number you linked, to apply the group protections you switched on, to keep your
        plan and device allowance correct, to process payments, and to prevent abuse such as spam pairing or
        attempts to use the service against other people. We do not sell personal data, and we do not share it
        for advertising.
      </p>
    ),
  },
  {
    id: 'sharing',
    title: '4. Who We Share It With',
    body: (
      <>
        <p>
          Only the providers that make the service work: our hosting and database providers, and Paystack for
          payments. Where a feature needs an outside service — an AI reply, a download lookup — only the text
          needed for that single request is sent, and nothing that identifies your account.
        </p>
        <p>
          We will disclose data if we are legally required to, and we will tell you when we are permitted to.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: '5. Security',
    body: (
      <p>
        Sessions are held in httpOnly cookies, passwords are bcrypt-hashed, and service-to-service calls are
        authenticated. Anybody with access to a linked device can act as that WhatsApp account — that is true
        of WhatsApp Web too — so unlink any device you no longer use, from this site or from WhatsApp, and
        never share a pairing code with anyone. Support will never ask you for one.
      </p>
    ),
  },
  {
    id: 'retention',
    title: '6. Retention and Deletion',
    body: (
      <p>
        Account and payment records are kept while your account is open and afterwards for as long as billing
        and tax rules require. Command and usage data is kept for a rolling operational window. Unlinking a
        device ends the bot's access to that number immediately and the session credentials are discarded.
        To have your account data removed, ask through the contact page and we will confirm when it is done.
      </p>
    ),
  },
  {
    id: 'rights',
    title: '7. Your Rights',
    body: (
      <p>
        You can ask for a copy of the personal data held about you, ask for corrections, ask for deletion, or
        object to a particular use. Requests go through the contact page. You can also unlink devices and stop
        using the service at any time without asking us.
      </p>
    ),
  },
  {
    id: 'children',
    title: '8. Children',
    body: (
      <p>
        The service is not intended for anyone under 16. If you believe a child has created an account, tell
        us and we will remove it.
      </p>
    ),
  },
  {
    id: 'changes',
    title: '9. Changes to This Policy',
    body: (
      <p>
        When this policy changes, the date at the top changes with it, and material changes are announced in
        the support channel. Continuing to use the service after a change means you accept the updated policy.
      </p>
    ),
  },
  {
    id: 'contact',
    title: '10. Contact',
    body: (
      <p>
        Privacy questions: message {site.contact.whatsappDisplay} on WhatsApp, or email{' '}
        <a href={`mailto:${site.contact.email}`} className="link">{site.contact.email}</a>. You can also use the{' '}
        <a href="/contact" className="link">contact form</a>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy policy"
        lede="What this site and this bot collect, what they deliberately do not, and how to have anything removed."
        meta={`Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
      />
      <ProsePage sections={SECTIONS} />
    </>
  );
}
