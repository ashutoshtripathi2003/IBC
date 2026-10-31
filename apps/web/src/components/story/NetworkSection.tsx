'use client';

import { motion, useScroll, useSpring } from 'motion/react';
import { useRef } from 'react';
import { Section } from '@/components/ui/Section';
import styles from './NetworkSection.module.css';
import story from './story.module.css';

const CHAIN = [
  {
    kind: 'person',
    title: 'A person',
    text: 'A sourcing lead with a requirement and a reputation.',
  },
  {
    kind: 'company',
    title: 'Their company',
    text: 'Registered, described, and connected to its people.',
  },
  { kind: 'product', title: 'A product', text: 'Specified by the company that makes it.' },
  { kind: 'person', title: 'A buyer', text: 'Who finds it through the network, not by luck.' },
  {
    kind: 'opportunity',
    title: 'A transaction',
    text: 'Quoted, ordered, paid and delivered on IBC.',
  },
] as const;

export function NetworkSection() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 45%'] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <Section id="network" labelledBy="network-title">
      <div>
        <h2 id="network-title" className={story.title}>
          One network, from first hello to final delivery.
        </h2>
        <p className={story.body}>
          People, companies, products and services sit on the same graph. Every relationship can
          lead to the next one, and business follows the threads.
        </p>
        <ol ref={ref} className={styles.chain}>
          <motion.span className={styles.thread} style={{ scaleY: progress }} aria-hidden="true" />
          {CHAIN.map((link, index) => (
            <li key={`${link.title}-${index}`} className={styles.link}>
              <span className={styles.knot} data-kind={link.kind} aria-hidden="true" />
              <span className={styles.linkTitle}>{link.title}</span>
              <span className={styles.linkText}>{link.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
