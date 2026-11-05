import Link from 'next/link';
import { PersonCard } from '@/components/catalog/cards';
import { DemoBadge } from '@/components/ui/Badge';
import { people } from '@/content/catalog';
import { SceneMotion } from './SceneMotion';
import styles from './Scenes.module.css';

const ROLES = [
  ['Engineers', 'who specify the parts'],
  ['Procurement leads', 'who source and compare'],
  ['Plant heads', 'who keep lines running'],
  ['Founders', 'who build what comes next'],
  ['Exporters', 'who open new markets'],
  ['Distributors', 'who carry products further'],
] as const;

/** Scene 04 — "Business is built by people." */
export function PeopleScene() {
  return (
    <SceneMotion
      id="people"
      className={`${styles.scene} ${styles.light}`}
      labelledBy="people-title"
      tone="light"
    >
      <div className={styles.container}>
        <div className={styles.split}>
          <div className={styles.stickyCol}>
            <p className={`eyebrow ${styles.eyebrowDark}`}>The professional network</p>
            <h2 id="people-title" className={`display ${styles.titleDark}`}>
              <span className="mask-line" data-line>
                <span>Business is</span>
              </span>
              <span className="mask-line" data-line>
                <span>built by</span>
              </span>
              <span className="mask-line" data-line>
                <span className={styles.goldText}>people.</span>
              </span>
            </h2>
            <p className={styles.lead} data-rise>
              Every order starts with a person. On IBC, professionals and companies are linked: see
              someone’s role, the company behind them and what they trade. One person can hold
              several roles.
            </p>
            <div className={styles.ctaRow} data-rise>
              <Link href="/network" className={styles.btnDark}>
                Meet professionals
              </Link>
              <Link href="/join?intent=connect" className={styles.btnOutlineDark}>
                Build your network
              </Link>
            </div>
          </div>
          <ol className={styles.roles}>
            {ROLES.map(([role, line], i) => (
              <li key={role} className={styles.roleRow} data-rise>
                <span className={styles.roleNum}>{String(i + 1).padStart(2, '0')}</span>
                <span className={`display ${styles.roleName}`}>{role}</span>
                <span className={styles.roleLine}>{line}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className={styles.rowHead} data-rise>
          <h3 className={styles.rowTitle}>Professionals on IBC</h3>
          <DemoBadge />
        </div>
        <div className={styles.cards4}>
          {people.slice(0, 4).map((person) => (
            <div key={person.slug} data-rise>
              <PersonCard person={person} />
            </div>
          ))}
        </div>
      </div>
    </SceneMotion>
  );
}
