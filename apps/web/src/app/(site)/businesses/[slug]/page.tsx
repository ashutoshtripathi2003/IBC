import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PersonCard, ProductCard, ServiceCard } from '@/components/catalog/cards';
import { Grid } from '@/components/catalog/Grid';
import styles from '@/components/explore/detail.module.css';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { Badge, DemoBadge, Tag } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Monogram } from '@/components/ui/Monogram';
import {
  companies,
  companyBySlug,
  industryBySlug,
  people,
  products,
  services,
} from '@/content/catalog';
import { formatLocation } from '@/lib/geo';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;
export const generateStaticParams = () => companies.map((c) => ({ slug: c.slug }));

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const company = companyBySlug((await params).slug);
  return company
    ? pageMetadata({
        title: company.name,
        description: company.summary,
        path: `/businesses/${company.slug}`,
      })
    : {};
}

export default async function CompanyPage({ params }: { params: Params }) {
  const company = companyBySlug((await params).slug);
  if (!company) notFound();
  const catalogue = products.filter((p) => p.companySlug === company.slug);
  const offered = services.filter((s) => s.companySlug === company.slug);
  const team = people.filter((p) => p.roles.some((r) => r.companySlug === company.slug));

  return (
    <>
      <PageHeader
        title={company.name}
        crumbs={[
          { href: '/businesses', label: 'Businesses' },
          { href: `/businesses/${company.slug}`, label: company.name },
        ]}
      >
        <div className={styles.profileHead}>
          <Monogram name={company.name} size={76} />
          <div className={styles.profileText}>
            <p className={styles.profileMeta}>
              {company.types.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
              {company.verified ? <Badge tone="verified">Verified business</Badge> : null}
              {company.demo && <DemoBadge />}
            </p>
            <p className={styles.profileMeta}>
              <span>
                <Icon name="pin" size={15} />
                {formatLocation(company.location)}
              </span>
              <span>
                <Icon name="clock" size={15} />
                Founded {company.founded}
              </span>
              <span>
                <Icon name="user" size={15} />
                {company.employees} employees
              </span>
            </p>
          </div>
          <div className={styles.actions}>
            <Button href={`/join?intent=rfq&company=${company.slug}`}>Request quotation</Button>
            <Button href={`/join?intent=connect&company=${company.slug}`} variant="secondary">
              Connect
            </Button>
          </div>
        </div>
      </PageHeader>
      <PageBody>
        <div className={styles.layout}>
          <div className={styles.mainCol}>
            <section className={styles.panel} aria-labelledby="about-title">
              <h2 id="about-title" className={styles.panelTitle}>
                About
              </h2>
              <p className={styles.prose}>{company.about}</p>
              <div className={styles.tags}>
                {company.capabilities.map((c) => (
                  <Tag key={c}>{c}</Tag>
                ))}
              </div>
            </section>
            {catalogue.length > 0 && (
              <section aria-labelledby="products-title">
                <h2 id="products-title" className={styles.sectionTitle}>
                  Products
                </h2>
                <Grid min={15}>
                  {catalogue.map((p) => (
                    <ProductCard key={p.slug} product={p} />
                  ))}
                </Grid>
              </section>
            )}
            {offered.length > 0 && (
              <section id="services" aria-labelledby="services-title">
                <h2 id="services-title" className={styles.sectionTitle}>
                  Services
                </h2>
                <Grid min={17}>
                  {offered.map((s) => (
                    <ServiceCard key={s.slug} service={s} />
                  ))}
                </Grid>
              </section>
            )}
            {team.length > 0 && (
              <section aria-labelledby="people-title">
                <h2 id="people-title" className={styles.sectionTitle}>
                  People
                </h2>
                <Grid min={17}>
                  {team.map((p) => (
                    <PersonCard key={p.slug} person={p} />
                  ))}
                </Grid>
              </section>
            )}
          </div>
          <aside className={styles.sideCol} aria-label="Business details">
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Business details</h2>
              <dl className={styles.facts}>
                <div>
                  <dt>Industries</dt>
                  <dd>{company.industries.map((i) => industryBySlug(i)?.name).join(', ')}</dd>
                </div>
                <div>
                  <dt>Business type</dt>
                  <dd>{company.types.join(', ')}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{formatLocation(company.location)}</dd>
                </div>
                <div>
                  <dt>Founded</dt>
                  <dd>{company.founded}</dd>
                </div>
                <div>
                  <dt>Company size</dt>
                  <dd>{company.employees}</dd>
                </div>
              </dl>
            </div>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Verification</h2>
              <p className={styles.verification}>
                <Icon name="shield" size={16} />
                {company.verified
                  ? 'IBC has checked this business against official records.'
                  : 'Not yet verified. IBC shows the Verified badge only after checking a business against official records.'}
              </p>
              {company.demo && (
                <p className={styles.note}>
                  This is a demonstration profile with fictional details.
                </p>
              )}
              <Link href="/about#trust" className={styles.note} style={{ color: 'var(--link)' }}>
                How verification works
              </Link>
            </div>
          </aside>
        </div>
      </PageBody>
    </>
  );
}
