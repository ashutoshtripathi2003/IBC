import type { MetadataRoute } from 'next';
import { companies, industries, people, products } from '@/content/catalog';
import { site } from '@/content/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '/',
    '/discover',
    '/businesses',
    '/products',
    '/services',
    '/network',
    '/opportunities',
    '/about',
    '/join',
    ...industries.map((i) => `/industries/${i.slug}`),
    ...companies.map((c) => `/businesses/${c.slug}`),
    ...products.map((p) => `/products/${p.slug}`),
    ...people.map((p) => `/network/${p.slug}`),
  ];
  return paths.map((path) => ({
    url: new URL(path, site.url).toString(),
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
