import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatPrice, ProductCard } from '@/components/catalog/cards';
import { Grid } from '@/components/catalog/Grid';
import { ProductVisual } from '@/components/catalog/ProductVisual';
import styles from '@/components/explore/detail.module.css';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { Badge, DemoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Monogram } from '@/components/ui/Monogram';
import { companyBySlug, industryBySlug, productBySlug, products } from '@/content/catalog';
import { formatLocation } from '@/lib/geo';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;
export const generateStaticParams = () => products.map((p) => ({ slug: p.slug }));

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = productBySlug((await params).slug);
  return product
    ? pageMetadata({
        title: product.name,
        description: product.summary,
        path: `/products/${product.slug}`,
      })
    : {};
}

export default async function ProductPage({ params }: { params: Params }) {
  const product = productBySlug((await params).slug);
  if (!product) notFound();
  const company = companyBySlug(product.companySlug);
  const industry = industryBySlug(product.industry);
  const price = formatPrice(product);
  const related = products
    .filter((p) => p.industry === product.industry && p.slug !== product.slug)
    .slice(0, 4);

  return (
    <>
      <PageHeader
        title={product.name}
        intro={product.summary}
        crumbs={[
          { href: '/products', label: 'Products' },
          ...(industry ? [{ href: `/industries/${industry.slug}`, label: industry.name }] : []),
          { href: `/products/${product.slug}`, label: product.name },
        ]}
      >
        <p className={styles.profileMeta}>
          <Badge tone="gold">{product.category}</Badge>
          {product.demo && <DemoBadge />}
        </p>
      </PageHeader>
      <PageBody>
        <div className={styles.layout}>
          <div className={styles.mainCol}>
            <ProductVisual product={product} size="large" />
            <section className={styles.panel} aria-labelledby="specs-title">
              <h2 id="specs-title" className={styles.panelTitle}>
                Specifications
              </h2>
              <table className={styles.specTable}>
                <tbody>
                  {product.specs.map((spec) => (
                    <tr key={spec.label}>
                      <th scope="row">{spec.label}</th>
                      <td>{spec.value}</td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">Ships from</th>
                    <td>{formatLocation(product.shipsFrom)}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
          <aside className={styles.sideCol} aria-label="Pricing and supplier">
            <div className={styles.panel}>
              <div className={styles.priceBlock}>
                <span className={styles.price}>{price.value}</span>
                {price.unit && <span className={styles.note}>{price.unit}</span>}
              </div>
              <dl className={styles.facts}>
                <div>
                  <dt>Minimum order</dt>
                  <dd>{product.minimumOrder ?? 'None'}</dd>
                </div>
                <div>
                  <dt>Availability</dt>
                  <dd>{product.availability ?? 'Ask the supplier'}</dd>
                </div>
              </dl>
              <Button
                href={`/join?intent=rfq&product=${product.slug}`}
                size="lg"
                fullWidth
                event={{ name: 'cta_click', cta: 'request_quotation', location: 'product' }}
              >
                Request quotation
              </Button>
              <p className={styles.note}>
                {product.demo ? 'Demonstration listing: prices are illustrative, not offers. ' : ''}
                Quotation requests open when IBC launches.
              </p>
            </div>
            {company && (
              <div className={styles.panel}>
                <h2 className={styles.panelTitle}>Supplier</h2>
                <div className={styles.role}>
                  <Monogram name={company.name} size={44} />
                  <div>
                    <Link href={`/businesses/${company.slug}`} className={styles.roleTitle}>
                      {company.name}
                    </Link>
                    <p className={styles.roleOrg}>{company.types.join(', ')}</p>
                    <p className={styles.note}>
                      <Icon name="pin" size={13} /> {formatLocation(company.location)}
                    </p>
                  </div>
                </div>
                <Button href={`/businesses/${company.slug}`} variant="secondary" fullWidth>
                  View company
                </Button>
              </div>
            )}
          </aside>
        </div>
        {related.length > 0 && (
          <section aria-labelledby="related-title" style={{ marginTop: 'var(--space-9)' }}>
            <h2 id="related-title" className={styles.sectionTitle}>
              More in {industry?.name}
            </h2>
            <Grid min={15}>
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </Grid>
          </section>
        )}
      </PageBody>
    </>
  );
}
