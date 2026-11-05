import Link from 'next/link';
import { CompanyCard, OpportunityCard } from '@/components/catalog/cards';
import { DemoNotice, HowItWorks, TrustPoints } from '@/components/home/HomeSections';
import { SearchBox } from '@/components/search/SearchBox';
import type { ComponentProps } from 'react';
import { Icon } from '@/components/ui/Icon';
import { companies, opportunities } from '@/content/catalog';
import { SceneMotion } from './SceneMotion';
import styles from './Scenes.module.css';

const ACTIONS: readonly {
  href: string;
  icon: ComponentProps<typeof Icon>['name'];
  label: string;
  text: string;
}[] = [
  {
    href: '/businesses',
    icon: 'building',
    label: 'Discover businesses',
    text: 'Company profiles by capability and location',
  },
  {
    href: '/search?scope=manufacturer',
    icon: 'gear',
    label: 'Find manufacturers',
    text: 'Who makes what, and where',
  },
  {
    href: '/products',
    icon: 'box',
    label: 'Explore products',
    text: 'Specifications, MOQ and pricing',
  },
  {
    href: '/network',
    icon: 'users',
    label: 'Connect with professionals',
    text: 'People, roles and companies',
  },
  {
    href: '/join?intent=message',
    icon: 'message',
    label: 'Send business enquiries',
    text: 'Reach the right person directly',
  },
  {
    href: '/join?intent=rfq',
    icon: 'file',
    label: 'Request quotations',
    text: 'Compare offers from suppliers',
  },
  {
    href: '/opportunities',
    icon: 'briefcase',
    label: 'Explore opportunities',
    text: 'Tenders, RFQs and partnerships',
  },
];

/** Scene 07 — "Where business happens": the practical start of the platform. */
export function DiscoveryScene() {
  return (
    <SceneMotion
      id="discover"
      className={`${styles.scene} ${styles.light}`}
      labelledBy="discover-title"
      tone="light"
    >
      <div className={styles.container}>
        <div className={styles.searchHead}>
          <p className={`eyebrow ${styles.eyebrowDark}`}>Start here</p>
          <h2 id="discover-title" className={`display ${styles.titleDark}`}>
            <span className="mask-line" data-line>
              <span>Where business</span>
            </span>
            <span className="mask-line" data-line>
              <span className={styles.goldText}>happens.</span>
            </span>
          </h2>
          <div className={styles.searchWrap} data-rise>
            <SearchBox variant="hero" />
          </div>
        </div>
        <ul className={styles.actions}>
          {ACTIONS.map((a) => (
            <li key={a.href} data-rise>
              <Link href={a.href} className={styles.action}>
                <span className={styles.actionIcon} aria-hidden="true">
                  <Icon name={a.icon} size={22} />
                </span>
                <span className={styles.actionLabel}>{a.label}</span>
                <span className={styles.actionText}>{a.text}</span>
                <Icon name="arrow" size={18} className={styles.actionArrow} />
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.block}>
          <div className={styles.rowHead}>
            <h3 className={styles.rowTitle}>Manufacturers, suppliers and service firms</h3>
            <Link href="/businesses" className={styles.rowLink}>
              Browse businesses
            </Link>
          </div>
          <DemoNotice />
          <div className={styles.cards3}>
            {companies.slice(0, 3).map((c) => (
              <div key={c.slug} data-rise>
                <CompanyCard company={c} />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.block}>
          <div className={styles.rowHead}>
            <h3 className={styles.rowTitle}>Opportunities</h3>
            <Link href="/opportunities" className={styles.rowLink}>
              All opportunities
            </Link>
          </div>
          <div className={styles.cards3}>
            {opportunities.slice(0, 3).map((o) => (
              <div key={o.slug} data-rise>
                <OpportunityCard opportunity={o} />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.block} id="how">
          <div className={styles.rowHead}>
            <h3 className={styles.rowTitle}>How IBC works</h3>
            <Link href="/about" className={styles.rowLink}>
              About IBC
            </Link>
          </div>
          <HowItWorks />
        </div>

        <div className={`${styles.block} ${styles.trustBlock}`} id="trust">
          <h3 className={styles.rowTitleLight}>Know who you are doing business with</h3>
          <TrustPoints />
        </div>
      </div>
    </SceneMotion>
  );
}
