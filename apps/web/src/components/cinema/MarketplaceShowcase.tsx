'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { formatPrice } from '@/components/catalog/cards';
import { DemoBadge } from '@/components/ui/Badge';
import { companyBySlug, productBySlug, productMedia, type Product } from '@/content/catalog';
import { formatLocation } from '@/lib/geo';
import styles from './Scenes.module.css';

const FEATURED = [
  'api-610-oh2-process-pump',
  'isopropyl-alcohol-99-9',
  'ev-motor-housing-a356',
  'aluminium-ingot-a7',
  'hdpe-film-grade',
  'organic-cotton-yarn-40s',
] as const;

const items = FEATURED.map((slug) => productBySlug(slug)).filter((p): p is Product => Boolean(p));

/** Scene 06 product stage: pick a product, see its render, specifications and supplier. */
export function MarketplaceShowcase() {
  const id = useId();
  const [index, setIndex] = useState(0);
  const product = items[index] ?? items[0];
  if (!product) return null;
  const media = productMedia(product.slug);
  const supplier = companyBySlug(product.companySlug);
  const price = formatPrice(product);

  return (
    <div className={styles.showcase}>
      <div className={styles.picker} role="tablist" aria-label="Featured products">
        {items.map((p, i) => (
          <button
            key={p.slug}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === index}
            aria-controls={`${id}-panel`}
            tabIndex={i === index ? 0 : -1}
            className={styles.pick}
            onClick={() => {
              setIndex(i);
            }}
            onKeyDown={(e) => {
              if (
                e.key !== 'ArrowDown' &&
                e.key !== 'ArrowUp' &&
                e.key !== 'ArrowRight' &&
                e.key !== 'ArrowLeft'
              )
                return;
              e.preventDefault();
              const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
              const next = (index + step + items.length) % items.length;
              setIndex(next);
              document.getElementById(`${id}-tab-${next}`)?.focus();
            }}
          >
            <span className={styles.pickCat}>{p.category}</span>
            <span className={styles.pickName}>{p.name}</span>
          </button>
        ))}
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${index}`}
        className={styles.stageCard}
      >
        <figure key={product.slug} className={styles.stageMedia}>
          {media && (
            /* eslint-disable-next-line @next/next/no-img-element -- pre-rendered WebP with srcset */
            <img
              src={`${media.base}-800.webp`}
              srcSet={`${media.base}-800.webp 800w, ${media.base}-1600.webp 1600w`}
              sizes="(max-width: 899px) 100vw, 50vw"
              width={1600}
              height={1200}
              alt={media.alt}
              loading="lazy"
              decoding="async"
            />
          )}
          <figcaption>Rendered illustration</figcaption>
        </figure>
        <div className={styles.stageInfo}>
          <div className={styles.stageTop}>
            <span className={styles.pickCat}>{product.category}</span>
            <DemoBadge />
          </div>
          <h3 className={styles.stageName}>{product.name}</h3>
          <p className={styles.stageSummary}>{product.summary}</p>
          <dl className={styles.stageSpecs}>
            {product.specs.slice(0, 3).map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
            {product.minimumOrder && (
              <div>
                <dt>Minimum order</dt>
                <dd>{product.minimumOrder}</dd>
              </div>
            )}
          </dl>
          <p className={styles.stagePrice}>
            {price.value} {price.unit && <span>{price.unit}</span>}
          </p>
          {supplier && (
            <p className={styles.stageSupplier}>
              {supplier.name} · {formatLocation(supplier.location)}
            </p>
          )}
          <div className={styles.ctaRow}>
            <Link href={`/join?intent=rfq&product=${product.slug}`} className={styles.btnDark}>
              Request quotation
            </Link>
            <Link href={`/products/${product.slug}`} className={styles.btnOutlineDark}>
              View product
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
