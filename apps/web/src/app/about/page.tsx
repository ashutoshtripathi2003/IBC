import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { JoinBand } from '@/components/pages/JoinBand';
import { PageHero } from '@/components/pages/PageHero';
import styles from '@/components/pages/pages.module.css';
import { globalReach } from '@/content/site';

export const metadata: Metadata = pageMetadata({
  title: 'About',
  description:
    'IBC — Indian Business Circle is building a global network where people, businesses, products and services connect, and where business gets done.',
  path: '/about',
});

const LIFECYCLE = [
  'Discover',
  'Connect',
  'Verify',
  'Chat',
  'Request',
  'Quote',
  'Compare',
  'Negotiate',
  'Order',
  'Pay',
  'Deliver',
  'Review',
  'Reputation',
] as const;

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About IBC"
        headline="Business runs on relationships. We are building the network for them."
        lede="IBC — Indian Business Circle brings professional networking, business discovery and trade into one place, so finding the right partner and doing business with them is one continuous experience."
        focus="company"
      />
      <div className={styles.prose}>
        <section className={styles.proseBlock} aria-labelledby="about-idea">
          <h2 id="about-idea" className={styles.proseTitle}>
            The idea
          </h2>
          <div className={styles.proseBody}>
            <p>
              Today a professional network, a supplier directory, a marketplace and a chat app each
              hold a piece of every deal. IBC connects people, companies, products, services and
              opportunities on one graph, so each relationship can lead to the next.
            </p>
          </div>
        </section>
        <section className={styles.proseBlock} aria-labelledby="about-lifecycle">
          <h2 id="about-lifecycle" className={styles.proseTitle}>
            From discovery to reputation
          </h2>
          <div className={styles.proseBody}>
            <p>IBC is designed around the whole life of a business relationship:</p>
            <ol className={styles.lifecycle}>
              {LIFECYCLE.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </section>
        <section className={styles.proseBlock} aria-labelledby="about-where">
          <h2 id="about-where" className={styles.proseTitle}>
            Where we start
          </h2>
          <div className={styles.proseBody}>
            <p>
              We are building for global scale and launching for local density: first in
              Maharashtra, then across India, then internationally. Every part of the platform is
              designed from day one for any country, currency, language and time zone.
            </p>
            <ol className={styles.lifecycle}>
              {globalReach.map((place) => (
                <li key={place}>{place}</li>
              ))}
            </ol>
          </div>
        </section>
      </div>
      <JoinBand location="about" />
    </>
  );
}
