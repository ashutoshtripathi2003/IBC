import type { Metadata } from 'next';
import { site } from '@/content/site';

/** schema.org structured data describing IBC and its website. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${site.url}/#organization`,
        name: site.fullName,
        alternateName: site.name,
        url: site.url,
        logo: `${site.url}/icon.svg`,
        description: site.tagline,
      },
      {
        '@type': 'WebSite',
        '@id': `${site.url}/#website`,
        name: site.fullName,
        url: site.url,
        publisher: { '@id': `${site.url}/#organization` },
        inLanguage: 'en',
      },
    ],
  };
}

/**
 * Per-page metadata. Always sets canonical URL and a complete Open Graph block: Next.js
 * replaces (does not merge) a parent's openGraph, so the image must be repeated here.
 */
export function pageMetadata(options: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
}): Metadata {
  return {
    title: options.title,
    description: options.description,
    alternates: { canonical: options.path },
    openGraph: {
      type: 'website',
      siteName: site.fullName,
      title: `${options.title} | ${site.fullName}`,
      description: options.description,
      url: options.path,
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: site.fullName }],
    },
    ...(options.index === false ? { robots: { index: false } } : {}),
  };
}
