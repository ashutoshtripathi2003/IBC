import { CompanyCard } from '@/components/cards/CompanyCard';
import { Section } from '@/components/ui/Section';
import { exampleCompany } from '@/content/examples';
import split from './split.module.css';
import styles from './TrustSection.module.css';
import story from './story.module.css';

const PILLARS = [
  {
    term: 'Business identity',
    text: 'Legal name, country and registration, in a format that works for every country.',
  },
  {
    term: 'Verification',
    text: 'Checked against official registers, so “verified” always means something specific.',
  },
  {
    term: 'Reviews',
    text: 'Written by counterparties after a completed order, not by anyone with an account.',
  },
  {
    term: 'Reputation',
    text: 'Built from how a business actually trades: on time, as quoted, as described.',
  },
] as const;

export function TrustSection() {
  return (
    <Section id="trust" labelledBy="trust-title" align="wide">
      <div className={split.split}>
        <div>
          <h2 id="trust-title" className={story.title}>
            Know who you’re doing business with.
          </h2>
          <dl className={styles.pillars}>
            {PILLARS.map((pillar) => (
              <div key={pillar.term} className={styles.pillar}>
                <dt>{pillar.term}</dt>
                <dd>{pillar.text}</dd>
              </div>
            ))}
          </dl>
        </div>
        <figure className={styles.figure}>
          <CompanyCard company={exampleCompany} showIdentity />
          <figcaption className={story.caption}>
            Illustration of a verified business. Names are examples.
          </figcaption>
        </figure>
      </div>
    </Section>
  );
}
