import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { accountLinks, demoNotice } from '@/content/site';
import styles from './HomeSections.module.css';

export function DemoNotice() {
  return (
    <p className={styles.demoNotice}>
      <Icon name="shield" size={16} />
      {demoNotice}
    </p>
  );
}

const STEPS = [
  {
    icon: 'search',
    title: 'Discover',
    text: 'Search products, manufacturers, suppliers and professionals across industries and countries.',
  },
  {
    icon: 'user',
    title: 'Connect',
    text: 'Reach the right person at the right company, with their role and business in view.',
  },
  {
    icon: 'message',
    title: 'Request quotations',
    text: 'Send one request to several suppliers and compare quotes side by side.',
  },
  {
    icon: 'briefcase',
    title: 'Do business',
    text: 'Agree terms, place orders and build a track record that others can trust.',
  },
] as const;

export function HowItWorks() {
  return (
    <ol className={styles.steps}>
      {STEPS.map((step, index) => (
        <li key={step.title} className={styles.step}>
          <span className={styles.stepIcon}>
            <Icon name={step.icon} size={22} />
          </span>
          <span className={styles.stepNo}>Step {index + 1}</span>
          <h3 className={styles.stepTitle}>{step.title}</h3>
          <p className={styles.stepText}>{step.text}</p>
        </li>
      ))}
    </ol>
  );
}

const TRUST = [
  {
    title: 'Business identity',
    text: 'Company pages record legal name, country, registration and tax identifiers in a format that works for every country.',
  },
  {
    title: 'Verification you can rely on',
    text: 'The Verified badge appears only after IBC has checked a business against official records. Nothing is verified by default.',
  },
  {
    title: 'Reputation from real trade',
    text: 'Reviews will come from counterparties after completed orders, not from anyone with an account.',
  },
] as const;

export function TrustPoints() {
  return (
    <div className={styles.trust}>
      {TRUST.map((point) => (
        <div key={point.title} className={styles.trustPoint}>
          <Icon name="shield" size={22} className={styles.trustIcon} />
          <h3 className={styles.trustTitle}>{point.title}</h3>
          <p className={styles.trustText}>{point.text}</p>
        </div>
      ))}
    </div>
  );
}

export function JoinBand() {
  return (
    <section className={styles.join} aria-labelledby="join-title">
      <div className={styles.joinInner}>
        <div>
          <h2 id="join-title" className={styles.joinTitle}>
            Put your business on the industrial map.
          </h2>
          <p className={styles.joinText}>
            IBC opens first in Maharashtra, then across India and international markets. Join to
            list your company, products and services.
          </p>
        </div>
        <div className={styles.joinActions}>
          <Button
            href={accountLinks.join.href}
            variant="accent"
            size="lg"
            event={{ name: 'join_click', location: 'home_band' }}
          >
            Join IBC
          </Button>
          <Link href="/about" className={styles.joinLink}>
            Learn about IBC
          </Link>
        </div>
      </div>
    </section>
  );
}
