import { formatMoney } from '@ibc/kernel';
import Link from 'next/link';
import { Badge, DemoBadge, Tag } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Monogram } from '@/components/ui/Monogram';
import {
  companyBySlug,
  industryBySlug,
  type Company,
  type Industry,
  type Opportunity,
  type Person,
  type Product,
  type Service,
} from '@/content/catalog';
import { countryName, formatLocation } from '@/lib/geo';
import { ProductVisual } from './ProductVisual';
import styles from './catalog.module.css';

const PRICE_LOCALE: Record<string, string> = {
  INR: 'en-IN',
  EUR: 'de-DE',
  AED: 'en-AE',
  USD: 'en-US',
};

export function formatPrice(product: Product): { value: string; unit: string } {
  if (!product.price) return { value: 'Price on request', unit: '' };
  const locale = PRICE_LOCALE[product.price.amount.currency] ?? 'en';
  return { value: formatMoney(product.price.amount, locale), unit: product.price.unit };
}

function industryNames(slugs: readonly string[]): string {
  return slugs
    .map((s) => industryBySlug(s)?.name)
    .filter(Boolean)
    .join(' · ');
}

export function CompanyCard({ company }: { company: Company }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <Monogram name={company.name} size={52} />
        <div className={styles.headText}>
          <h3 className={styles.title}>
            <Link href={`/businesses/${company.slug}`} className={styles.stretch}>
              {company.name}
            </Link>
          </h3>
          <p className={styles.meta}>{industryNames(company.industries)}</p>
          <p className={styles.meta}>
            <Icon name="pin" size={14} />
            {company.location.city}, {countryName(company.location.country)}
          </p>
        </div>
        {company.demo && <DemoBadge />}
      </div>
      <p className={styles.summary}>{company.summary}</p>
      <div className={styles.tags}>
        {company.types.map((t) => (
          <Badge key={t} tone="neutral">
            {t}
          </Badge>
        ))}
        {company.verified && <Badge tone="verified">Verified</Badge>}
      </div>
      <div className={styles.tags}>
        {company.capabilities.slice(0, 3).map((c) => (
          <Tag key={c}>{c}</Tag>
        ))}
      </div>
      <div className={styles.actions}>
        <span className={styles.linkLike}>View company</span>
        <Link
          href={`/join?intent=connect&company=${company.slug}`}
          className={styles.secondaryAction}
        >
          Connect
        </Link>
      </div>
    </article>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const company = companyBySlug(product.companySlug);
  const price = formatPrice(product);
  return (
    <article className={`${styles.card} ${styles.productCard}`}>
      <ProductVisual product={product} />
      <div className={styles.productBody}>
        <div className={styles.productTop}>
          <span className={styles.category}>{product.category}</span>
          {product.demo && <DemoBadge />}
        </div>
        <h3 className={styles.title}>
          <Link href={`/products/${product.slug}`} className={styles.stretch}>
            {product.name}
          </Link>
        </h3>
        <p className={styles.meta}>{company?.name}</p>
        <dl className={styles.specs}>
          {product.specs.slice(0, 2).map((spec) => (
            <div key={spec.label}>
              <dt>{spec.label}</dt>
              <dd>{spec.value}</dd>
            </div>
          ))}
        </dl>
        <div className={styles.priceRow}>
          <span className={styles.price}>{price.value}</span>
          {price.unit && <span className={styles.unit}>{price.unit}</span>}
        </div>
        <p className={styles.meta}>
          {product.minimumOrder ? `MOQ ${product.minimumOrder}` : 'No minimum order'} ·{' '}
          {product.shipsFrom.city}, {countryName(product.shipsFrom.country)}
        </p>
        <div className={styles.actions}>
          <Link href={`/join?intent=rfq&product=${product.slug}`} className={styles.primaryAction}>
            Request quotation
          </Link>
        </div>
      </div>
    </article>
  );
}

export function PersonCard({ person }: { person: Person }) {
  const current = person.roles.find((role) => role.current);
  const org = current?.companySlug
    ? companyBySlug(current.companySlug)?.name
    : current?.organisation;
  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <Monogram name={person.name} size={52} shape="circle" />
        <div className={styles.headText}>
          <h3 className={styles.title}>
            <Link href={`/network/${person.slug}`} className={styles.stretch}>
              {person.name}
            </Link>
          </h3>
          <p className={styles.meta}>{person.headline}</p>
          {org && <p className={styles.meta}>{org}</p>}
        </div>
        {person.demo && <DemoBadge />}
      </div>
      <p className={styles.meta}>
        <Icon name="pin" size={14} />
        {formatLocation(person.location)}
      </p>
      <div className={styles.tags}>
        {person.expertise.slice(0, 3).map((e) => (
          <Tag key={e}>{e}</Tag>
        ))}
      </div>
      <div className={styles.actions}>
        <span className={styles.linkLike}>View profile</span>
        <Link
          href={`/join?intent=connect&person=${person.slug}`}
          className={styles.secondaryAction}
        >
          Connect
        </Link>
      </div>
    </article>
  );
}

export function ServiceCard({ service }: { service: Service }) {
  const company = companyBySlug(service.companySlug);
  const industry = industryBySlug(service.industry);
  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.iconTile}>
          {industry && <Icon name={industry.icon} size={22} />}
        </span>
        <div className={styles.headText}>
          <h3 className={styles.title}>
            <Link href={`/businesses/${service.companySlug}#services`} className={styles.stretch}>
              {service.name}
            </Link>
          </h3>
          <p className={styles.meta}>{company?.name}</p>
        </div>
        {service.demo && <DemoBadge />}
      </div>
      <p className={styles.summary}>{service.summary}</p>
      <p className={styles.meta}>
        <Icon name="globe" size={14} />
        {service.coverage.join(', ')}
      </p>
    </article>
  );
}

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const industry = industryBySlug(opportunity.industry);
  const poster = companyBySlug(opportunity.postedBy)?.name ?? 'Demo buyer';
  return (
    <article className={styles.card} id={opportunity.slug}>
      <div className={styles.productTop}>
        <Badge tone="gold">{opportunity.kind}</Badge>
        {opportunity.demo && <DemoBadge />}
      </div>
      <h3 className={styles.title}>{opportunity.title}</h3>
      <p className={styles.meta}>
        {poster} · {industry?.name} · {opportunity.location.city},{' '}
        {countryName(opportunity.location.country)}
      </p>
      <p className={styles.summary}>{opportunity.summary}</p>
      <dl className={styles.specs}>
        {opportunity.quantity && (
          <div>
            <dt>Quantity</dt>
            <dd>{opportunity.quantity}</dd>
          </div>
        )}
        {opportunity.deadline && (
          <div>
            <dt>Deadline</dt>
            <dd>{opportunity.deadline}</dd>
          </div>
        )}
      </dl>
      <div className={styles.actions}>
        <Link
          href={`/join?intent=respond&opportunity=${opportunity.slug}`}
          className={styles.primaryAction}
        >
          Respond
        </Link>
      </div>
    </article>
  );
}

export function IndustryCard({ industry }: { industry: Industry }) {
  return (
    <Link href={`/industries/${industry.slug}`} className={styles.industryCard}>
      <span className={styles.industryIcon}>
        <Icon name={industry.icon} size={26} />
      </span>
      <span className={styles.industryName}>{industry.name}</span>
      <span className={styles.industrySegments}>{industry.segments.slice(0, 3).join(' · ')}</span>
      <Icon name="arrow" size={18} className={styles.industryArrow} />
    </Link>
  );
}
