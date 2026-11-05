import '@fontsource-variable/ibm-plex-sans';
import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AnalyticsBoot } from '@/components/layout/AnalyticsBoot';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { site } from '@/content/site';
import { organizationJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.fullName} | ${site.tagline}`, template: `%s | ${site.fullName}` },
  description: site.description,
  applicationName: site.fullName,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.fullName,
    title: `${site.fullName}: ${site.headline}`,
    description: site.description,
    url: '/',
    locale: 'en',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: site.fullName }],
  },
  twitter: { card: 'summary_large_image', title: site.fullName, description: site.description },
  robots: { index: true, follow: true },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#10243e',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Navbar />
        <main id="main">{children}</main>
        <Footer />
        <AnalyticsBoot />
      </body>
    </html>
  );
}
