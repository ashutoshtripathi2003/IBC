import { Badge, Tag } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { ExampleCompany } from '@/content/examples';
import styles from './cards.module.css';

/** A business on the network: identity first, then what it can do. */
export function CompanyCard({
  company,
  showIdentity = false,
}: {
  company: ExampleCompany;
  showIdentity?: boolean;
}) {
  return (
    <Card accent="company">
      <div className={styles.head}>
        <span className={`${styles.avatar} ${styles.square}`} aria-hidden="true">
          {company.name
            .split(' ')
            .slice(0, 2)
            .map((word) => word[0])
            .join('')}
        </span>
        <div className={styles.identity}>
          <h3 className={styles.name}>{company.name}</h3>
          <p className={styles.sub}>{company.sector}</p>
          <p className={styles.meta}>
            {company.location}, since {company.established}
          </p>
        </div>
      </div>
      {company.verified && (
        <p className={styles.badgeRow}>
          <Badge tone="verified">Verified business</Badge>
        </p>
      )}
      {showIdentity && (
        <dl className={styles.facts}>
          <div>
            <dt>Legal identity</dt>
            <dd>Checked against the national company register</dd>
          </div>
          <div>
            <dt>Tax registration</dt>
            <dd>Confirmed with the issuing authority</dd>
          </div>
          <div>
            <dt>Track record</dt>
            <dd>Reviews from completed orders on IBC</dd>
          </div>
        </dl>
      )}
      <div className={styles.tags}>
        {company.capabilities.map((capability) => (
          <Tag key={capability}>{capability}</Tag>
        ))}
      </div>
    </Card>
  );
}
