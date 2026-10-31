import { formatMoney } from '@ibc/kernel';
import { Card } from '@/components/ui/Card';
import type { ExampleProduct } from '@/content/examples';
import styles from './cards.module.css';

/** A product, always shown with the business that makes it. Prices use the shared Money type. */
export function ProductCard({ product }: { product: ExampleProduct }) {
  return (
    <Card accent="product">
      <h3 className={styles.name}>{product.name}</h3>
      <p className={styles.sub}>
        {product.maker}, {product.origin}
      </p>
      <div className={styles.priceRow}>
        <span className={styles.price}>{formatMoney(product.price, product.locale)}</span>
        <span className={styles.meta}>{product.priceUnit}</span>
      </div>
      <p className={styles.meta}>Minimum order {product.minimumOrder}</p>
    </Card>
  );
}
