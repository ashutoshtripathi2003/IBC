import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CompanyCard, OpportunityCard, ProductCard, ServiceCard } from '@/components/catalog/cards';
import { Grid } from '@/components/catalog/Grid';
import styles from '@/components/explore/detail.module.css';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { DemoNotice } from '@/components/home/HomeSections';
import { Tag } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import {
  companies,
  industries,
  industryBySlug,
  opportunities,
  products,
  services,
} from '@/content/catalog';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;
export const generateStaticParams = () => industries.map((i) => ({ slug: i.slug }));

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const industry = industryBySlug((await params).slug);
  return industry
    ? pageMetadata({
        title: industry.name,
        description: industry.summary,
        path: `/industries/${industry.slug}`,
      })
    : {};
}

function Block({
  title,
  count,
  href,
  children,
}: {
  title: string;
  count: number;
  href: string;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: '1rem',
        }}
      >
        <h2 className={styles.sectionTitle}>{title}</h2>
        <Link
          href={href}
          style={{ color: 'var(--link)', fontWeight: 600, fontSize: 'var(--text-sm)' }}
        >
          View all
        </Link>
      </div>
      {children}
    </section>
  );
}

export default async function IndustryPage({ params }: { params: Params }) {
  const industry = industryBySlug((await params).slug);
  if (!industry) notFound();
  const inIndustry = (item: { industries?: readonly string[]; industry?: string }) =>
    (item.industries ?? [item.industry]).includes(industry.slug);
  const co = companies.filter(inIndustry);
  const pr = products.filter(inIndustry);
  const se = services.filter(inIndustry);
  const op = opportunities.filter(inIndustry);

  return (
    <>
      <PageHeader
        title={industry.name}
        intro={industry.summary}
        crumbs={[
          { href: '/discover', label: 'Discover' },
          { href: `/industries/${industry.slug}`, label: industry.name },
        ]}
        aside={
          <span className={styles.industryIcon}>
            <Icon name={industry.icon} size={30} />
          </span>
        }
      >
        <div className={styles.tags}>
          {industry.segments.map((segment) => (
            <Tag key={segment}>{segment}</Tag>
          ))}
        </div>
      </PageHeader>
      <PageBody>
        <DemoNotice />
        <div className={styles.stack}>
          <Block title="Products" count={pr.length} href={`/products?industry=${industry.slug}`}>
            <Grid min={15.5}>
              {pr.slice(0, 8).map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </Grid>
          </Block>
          <Block title="Companies" count={co.length} href={`/businesses?industry=${industry.slug}`}>
            <Grid min={19}>
              {co.map((c) => (
                <CompanyCard key={c.slug} company={c} />
              ))}
            </Grid>
          </Block>
          <Block title="Services" count={se.length} href={`/services?industry=${industry.slug}`}>
            <Grid min={19}>
              {se.map((s) => (
                <ServiceCard key={s.slug} service={s} />
              ))}
            </Grid>
          </Block>
          <Block
            title="Opportunities"
            count={op.length}
            href={`/opportunities?industry=${industry.slug}`}
          >
            <Grid min={19}>
              {op.map((o) => (
                <OpportunityCard key={o.slug} opportunity={o} />
              ))}
            </Grid>
          </Block>
          {co.length + pr.length + se.length + op.length === 0 && (
            <div className={styles.emptySmall}>
              No listings in {industry.name} yet. Businesses in this industry can list their company
              and products when IBC opens.{' '}
              <Link href="/join" style={{ color: 'var(--link)', fontWeight: 600 }}>
                Join IBC
              </Link>
            </div>
          )}
        </div>
      </PageBody>
    </>
  );
}
