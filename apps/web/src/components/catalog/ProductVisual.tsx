/* eslint-disable @next/next/no-img-element -- pre-rendered WebP with srcset; works in the static export too */
import { Icon } from '@/components/ui/Icon';
import { industryBySlug, productMedia, type Product } from '@/content/catalog';
import styles from './catalog.module.css';

/**
 * Product image area. Products with a studio render show it (labelled as an illustration);
 * the rest show a technical tile with the industry and category, never a stock photo.
 */
export function ProductVisual({
  product,
  size = 'card',
  priority = false,
}: {
  product: Product;
  size?: 'card' | 'large';
  priority?: boolean;
}) {
  const media = productMedia(product.slug);
  const industry = industryBySlug(product.industry);
  if (media) {
    return (
      <figure
        className={`${styles.visual} ${styles.visualPhoto} ${size === 'large' ? styles.visualLarge : ''}`}
      >
        <img
          src={`${media.base}-800.webp`}
          srcSet={`${media.base}-800.webp 800w, ${media.base}-1600.webp 1600w`}
          sizes={
            size === 'large' ? '(max-width: 1023px) 100vw, 60vw' : '(max-width: 640px) 100vw, 26rem'
          }
          width={1600}
          height={1200}
          alt={media.alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={styles.visualImg}
        />
        <figcaption className={styles.visualTag}>Rendered illustration</figcaption>
      </figure>
    );
  }
  return (
    <div
      className={`${styles.visual} ${size === 'large' ? styles.visualLarge : ''}`}
      aria-hidden="true"
    >
      {industry && (
        <Icon
          name={industry.icon}
          size={size === 'large' ? 64 : 40}
          className={styles.visualIcon}
        />
      )}
      <span className={styles.visualLabel}>{product.category}</span>
    </div>
  );
}
