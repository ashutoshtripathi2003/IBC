import { Section } from '@/components/ui/Section';
import { ECOSYSTEMS } from '@/components/network/engine/graph';
import styles from './ProblemSection.module.css';
import story from './story.module.css';

export function ProblemSection() {
  return (
    <Section id="problem" labelledBy="problem-title">
      <div>
        <h2 id="problem-title" className={story.title}>
          The world is connected. Business isn’t.
        </h2>
        <p className={story.body}>
          A buyer searches one marketplace, the supplier lists on another, and the person who could
          introduce them is on a third. Relationships live in phone contacts and spreadsheets, and
          trust is built one call at a time.
        </p>
        <ul role="list" className={styles.islands} aria-label="Separate business ecosystems today">
          {ECOSYSTEMS.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
        <p className={styles.turn}>IBC ties them into one network.</p>
      </div>
    </Section>
  );
}
