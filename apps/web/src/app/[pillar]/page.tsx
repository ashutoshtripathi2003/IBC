import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JoinBand } from '@/components/pages/JoinBand';
import { PageHero } from '@/components/pages/PageHero';
import { TrackPillar } from '@/components/pages/TrackPillar';
import styles from '@/components/pages/pages.module.css';
import { pillars } from '@/content/site';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;

export function generateStaticParams() {
  return pillars.map((pillar) => ({ pillar: pillar.slug }));
}

type Params = Promise<{ pillar: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { pillar: slug } = await params;
  const pillar = pillars.find((p) => p.slug === slug);
  if (!pillar) return {};
  return pageMetadata({ title: pillar.title, description: pillar.lede, path: `/${pillar.slug}` });
}

export default async function PillarPage({ params }: { params: Params }) {
  const { pillar: slug } = await params;
  const pillar = pillars.find((p) => p.slug === slug);
  if (!pillar) notFound();
  return (
    <>
      <TrackPillar pillar={pillar.slug} />
      <PageHero
        title={pillar.title}
        headline={pillar.headline}
        lede={pillar.lede}
        focus={pillar.focus}
      />
      <ul role="list" className={styles.points}>
        {pillar.points.map((point) => (
          <li key={point.title} className={styles.point}>
            <h2 className={styles.pointTitle}>{point.title}</h2>
            <p className={styles.pointBody}>{point.body}</p>
          </li>
        ))}
      </ul>
      <JoinBand location={`pillar_${pillar.slug}`} />
    </>
  );
}
