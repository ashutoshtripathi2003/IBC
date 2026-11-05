import { PageSection } from '@/components/catalog/PageSection';
import styles from '@/components/explore/detail.module.css';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { HowItWorks, JoinBand, TrustPoints } from '@/components/home/HomeSections';
import { site } from '@/content/site';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'About',
  description: `${site.fullName} brings professional networking, company discovery, industrial products and B2B trade together.`,
  path: '/about',
});

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About IBC"
        intro="Industrial Business Circle brings professional networking, company discovery, industrial product discovery and B2B trade into one network."
        crumbs={[{ href: '/about', label: 'About' }]}
      />
      <PageBody>
        <div className={styles.layout}>
          <div className={styles.mainCol}>
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Why IBC exists</h2>
              <p className={styles.prose}>
                Industrial business still runs on scattered tools: a professional network for
                people, directories for suppliers, marketplaces for products and messaging apps for
                negotiation. IBC connects professionals, companies, products, services and
                opportunities on one business graph, so finding the right partner and doing business
                with them is one continuous experience.
              </p>
            </section>
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Where we start</h2>
              <p className={styles.prose}>
                IBC is built for global scale and launches for local density: first in Maharashtra,
                then across India and international markets. Accounts, prices and listings work in
                any country, currency, language and time zone from the start.
              </p>
            </section>
          </div>
          <aside className={styles.sideCol}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>{site.legalName}</h2>
              <p className={styles.note}>{site.motto}</p>
            </div>
          </aside>
        </div>
      </PageBody>
      <PageSection id="how" tone="white" title="How IBC works">
        <HowItWorks />
      </PageSection>
      <PageSection id="trust" tone="navy" title="Trust and verification">
        <TrustPoints />
      </PageSection>
      <JoinBand />
    </>
  );
}
