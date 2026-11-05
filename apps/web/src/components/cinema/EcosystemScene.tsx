import { Icon, type UiIcon } from '@/components/ui/Icon';
import { SceneMotion } from './SceneMotion';
import styles from './Scenes.module.css';

const CHAIN: readonly { icon: UiIcon; label: string; text: string }[] = [
  { icon: 'user', label: 'People', text: 'A procurement lead searches for a casting supplier.' },
  {
    icon: 'building',
    label: 'Companies',
    text: 'She finds foundries by capability, location and size.',
  },
  { icon: 'box', label: 'Products', text: 'Each lists parts with alloys, tolerances and MOQ.' },
  { icon: 'globe', label: 'Suppliers', text: 'Raw-material suppliers stand behind every foundry.' },
  {
    icon: 'briefcase',
    label: 'Buyers',
    text: 'Buyers send requests for quotation to the shortlist.',
  },
  {
    icon: 'arrow',
    label: 'Opportunities',
    text: 'A quotation becomes an order, and a relationship.',
  },
];

/** Scene 05 — "Every connection can create an opportunity." */
export function EcosystemScene() {
  return (
    <SceneMotion
      id="ecosystem"
      className={`${styles.scene} ${styles.dark}`}
      labelledBy="ecosystem-title"
      tone="dark"
    >
      <div className={styles.container}>
        <p className={`eyebrow ${styles.eyebrowLight}`}>Discover. Connect. Do business.</p>
        <h2 id="ecosystem-title" className={`display ${styles.titleLight} ${styles.wide}`}>
          <span className="mask-line" data-line>
            <span>Every connection can</span>
          </span>
          <span className="mask-line" data-line>
            <span className={styles.goldText}>create an opportunity.</span>
          </span>
        </h2>
        <div className={styles.chain} data-steps>
          <span className={styles.chainLine} aria-hidden="true">
            <span data-draw className={styles.chainFill} />
          </span>
          <span className={styles.chainLineY} aria-hidden="true">
            <span data-draw-y className={styles.chainFillY} />
          </span>
          <ol className={styles.chainList}>
            {CHAIN.map((node, i) => (
              <li key={node.label} className={styles.node} data-step>
                <span className={styles.nodeIcon} aria-hidden="true">
                  <Icon name={node.icon} size={22} />
                </span>
                <span className={styles.nodeNum}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.nodeLabel}>{node.label}</span>
                <span className={styles.nodeText}>{node.text}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className={styles.footnote}>An illustrative journey through the platform.</p>
      </div>
    </SceneMotion>
  );
}
