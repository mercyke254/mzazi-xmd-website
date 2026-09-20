import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TechBackground from '../components/TechBackground';
import { ThemeProvider, THEME_BOOT_SCRIPT } from '../components/ui/ThemeProvider';
import { ToastProvider } from '../components/ui/Toast';
import site from '../lib/site';
import './globals.css';

export const metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords:
    'mzazi xmd, mzazi xmd bot, whatsapp bot pairing, pairing code, whatsapp automation, link whatsapp bot, mzazi tech',
  applicationName: site.name,
  openGraph: {
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    type: 'website',
    locale: 'en_US',
    url: site.url,
    siteName: site.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: site.name,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'WhatsApp',
  description: site.description,
  url: site.url,
  publisher: {
    '@type': 'Organization',
    name: site.legalName,
    url: site.accountBase,
  },
  sameAs: [site.contact.telegramUrl, site.contact.whatsappUrl],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7C3AED' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0F' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sets the theme before first paint, so a dark-mode visitor never sees a
            white flash on the way in. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-default">
        <ThemeProvider>
          <ToastProvider>
            <TechBackground />
            {/* The header, the page, and the footer as a column so the footer sits
                at the bottom even on a short page. */}
            <div style={{ position: 'relative', zIndex: 1, minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
              <Navbar />
              <main style={{ flex: '1 1 auto' }}>{children}</main>
              <Footer />
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
