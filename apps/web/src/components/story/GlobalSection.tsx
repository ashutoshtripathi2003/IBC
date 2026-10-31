'use client';

import { useMotionValueEvent, useScroll } from 'motion/react';
import { useRef, useState } from 'react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Section } from '@/components/ui/Section';
import { globalReach } from '@/content/site';
import styles from './GlobalSection.module.css';
import story from './story.module.css';

export interface Capabilities {
  countries: number;
  timeZones: number;
}

/** Maharashtra to the world: each region lights up in turn as the reader scrolls. */
export function GlobalSection({ capabilities }: { capabilities: Capabilities }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 40%'] });
  const [active, setActive] = useState(globalReach.length - 1);
  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    setActive(Math.min(globalReach.length - 1, Math.floor(value * globalReach.length)));
  });

  return (
    <Section id="global" labelledBy="global-title">
      <div>
        <h2 id="global-title" className={story.title}>
          Built locally. Designed for the world.
        </h2>
        <p className={story.body}>
          IBC starts where its founders do business, then grows outward. Every account, price and
          conversation is built to work in any country, currency, language and time zone.
        </p>
        <ol ref={ref} className={styles.reach}>
          {globalReach.map((place, index) => (
            <li key={place} className={index <= active ? styles.on : undefined}>
              {place}
            </li>
          ))}
        </ol>
        <dl className={styles.facts}>
          <div>
            <dt>
              <AnimatedCounter value={capabilities.countries} />
            </dt>
            <dd>countries and territories an account can be based in</dd>
          </div>
          <div>
            <dt>
              <AnimatedCounter value={capabilities.timeZones} />
            </dt>
            <dd>time zones, so meetings and deadlines land at the right hour</dd>
          </div>
          <div>
            <dt>Every</dt>
            <dd>ISO currency, with prices kept exact to the smallest unit</dd>
          </div>
        </dl>
      </div>
    </Section>
  );
}
