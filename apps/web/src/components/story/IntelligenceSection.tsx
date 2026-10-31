'use client';

import { motion } from 'motion/react';
import { useRef } from 'react';
import { Section } from '@/components/ui/Section';
import { easeOut } from '@/lib/motion';
import { instantHide, useReveal } from '@/lib/motion/useReveal';
import split from './split.module.css';
import styles from './IntelligenceSection.module.css';
import story from './story.module.css';

const QUERY = 'Someone near Pune who can make 5,000 aluminium enclosures by March';
const UNDERSTOOD = [
  { field: 'Product', value: 'Aluminium enclosures' },
  { field: 'Quantity', value: '5,000 units' },
  { field: 'Needed by', value: 'March' },
  { field: 'Near', value: 'Pune, India' },
  { field: 'Capability', value: 'Die casting, machining' },
] as const;

const CAPABILITIES = [
  { title: 'Semantic search', text: 'Understands what you mean, not only the words you type.' },
  { title: 'Matching', text: 'Puts buyers and suppliers in front of each other when they fit.' },
  {
    title: 'Recommendations',
    text: 'Suggests people, businesses and opportunities worth your time.',
  },
  {
    title: 'Business intelligence',
    text: 'Shows how your market and your relationships are moving.',
  },
] as const;

export function IntelligenceSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reveal = useReveal(ref, 0.5);

  return (
    <Section id="intelligence" labelledBy="ai-title" align="wide">
      <div className={split.split}>
        <div>
          <h2 id="ai-title" className={story.title}>
            Intelligence behind every connection.
          </h2>
          <p className={story.body}>
            IBC reads requests the way a well-connected colleague would, then brings the right
            people and businesses together.
          </p>
          <ul role="list" className={styles.capabilities}>
            {CAPABILITIES.map((item) => (
              <li key={item.title}>
                <span className={styles.capTitle}>{item.title}</span>
                <span className={styles.capText}>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <figure ref={ref} className={styles.demo}>
          <blockquote className={styles.query}>“{QUERY}”</blockquote>
          <p className={styles.understood}>IBC understands:</p>
          <dl className={styles.fields}>
            {UNDERSTOOD.map((item, index) => (
              <motion.div
                key={item.field}
                className={styles.field}
                initial={false}
                animate={reveal}
                variants={{
                  hidden: { opacity: 0, x: -12, transition: instantHide },
                  shown: {
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.5, ease: easeOut, delay: 0.3 + index * 0.14 },
                  },
                }}
              >
                <dt>{item.field}</dt>
                <dd>{item.value}</dd>
              </motion.div>
            ))}
          </dl>
          <figcaption className={story.caption}>
            Illustration of how IBC interprets a request.
          </figcaption>
        </figure>
      </div>
    </Section>
  );
}
