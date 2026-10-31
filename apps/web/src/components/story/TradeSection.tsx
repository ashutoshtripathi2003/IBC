'use client';

import { formatMoney, moneyFromDecimal } from '@ibc/kernel';
import { motion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { tradeJourney } from '@/content/site';
import { useMinWidth, usePrefersReducedMotion } from '@/lib/motion/hooks';
import styles from './TradeSection.module.css';
import story from './story.module.css';

type Artifact = (typeof tradeJourney)[number]['artifact'];

function renderArtifact(artifact: Artifact) {
  if (typeof artifact === 'string') return artifact;
  return (
    <>
      <span className={styles.amount}>
        {formatMoney(moneyFromDecimal(artifact.amount, artifact.currency), artifact.locale)}
      </span>
      {artifact.note}
    </>
  );
}

function useHorizontal(): boolean {
  const reduced = usePrefersReducedMotion();
  return useMinWidth(1024) && !reduced;
}

function Steps() {
  return (
    <ol className={styles.steps}>
      {tradeJourney.map((item, index) => (
        <li key={item.step} className={styles.step}>
          <span className={styles.index} aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className={styles.stepTitle}>{item.step}</h3>
          <p className={styles.detail}>{item.detail}</p>
          <p className={styles.artifact}>{renderArtifact(item.artifact)}</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * The transaction journey, RFQ to delivery. On wide screens with motion, vertical scroll
 * moves the journey sideways through a pinned stage; elsewhere it is a plain list.
 */
export function TradeSection() {
  const horizontal = useHorizontal();
  const wrapper = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: wrapper, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0.08, 0.92], [0, -distance]);
  const progress = useTransform(scrollYProgress, [0.08, 0.92], [0, 1]);

  useEffect(() => {
    if (!horizontal) return;
    const measure = () => {
      const el = track.current;
      if (el) setDistance(Math.max(0, el.scrollWidth - window.innerWidth + 120));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
    };
  }, [horizontal]);

  const header = (
    <div className={styles.header}>
      <h2 id="trade-title" className={story.title}>
        Do business, end to end.
      </h2>
      <p className={story.body}>
        From the first request to the final delivery, every step of a deal happens in one place,
        with one record both sides can trust.
      </p>
    </div>
  );

  if (!horizontal) {
    return (
      <section id="trade" aria-labelledby="trade-title" className={styles.vertical}>
        {header}
        <Steps />
      </section>
    );
  }

  return (
    <section id="trade" aria-labelledby="trade-title" ref={wrapper} className={styles.wrapper}>
      <div className={styles.sticky}>
        {header}
        <motion.div ref={track} className={styles.track} style={{ x }}>
          <Steps />
        </motion.div>
        <div className={styles.rail} aria-hidden="true">
          <motion.span className={styles.railFill} style={{ scaleX: progress }} />
        </div>
      </div>
    </section>
  );
}
