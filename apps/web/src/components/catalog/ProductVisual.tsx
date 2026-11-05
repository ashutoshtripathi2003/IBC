import { Icon } from '@/components/ui/Icon';
import { industryBySlug, type Product } from '@/content/catalog';
import styles from './catalog.module.css';

/**
 * Product image area. Until suppliers upload photos, a technical tile shows the product's
 * industry and category on an engineering-grid ground (never a stock photo).
 */
export function ProductVisual({
  product,
  size = 'card',
}: {
  product: Product;
  size?: 'card' | 'large';
}) {
  const industry = industryBySlug(product.industry);
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
