import type { MetadataRoute } from 'next';
import { pillars, site } from '@/content/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['/', ...pillars.map((p) => `/${p.slug}`), '/about', '/join'];
  return paths.map((path) => ({
    url: new URL(path, site.url).toString(),
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
