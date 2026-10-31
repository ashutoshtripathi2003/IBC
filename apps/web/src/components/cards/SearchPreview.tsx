'use client';

import { motion, useInView } from 'motion/react';
import { instantHide } from '@/lib/motion/useReveal';
import { useEffect, useRef, useState } from 'react';
import { exampleCompany, examplePerson, exampleProduct, exampleSearch } from '@/content/examples';
import { easeOut } from '@/lib/motion';
import { usePrefersReducedMotion } from '@/lib/motion/hooks';
import { CompanyCard } from './CompanyCard';
import { ProductCard } from './ProductCard';
import { ProfileCard } from './ProfileCard';
import styles from './SearchPreview.module.css';

/**
 * Illustration of IBC search: a plain-language query is typed, then the people, companies
 * and products that match arrive together. Plays once when scrolled into view.
 */
export function SearchPreview() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = usePrefersReducedMotion();
  const [typed, setTyped] = useState(0);
  const done = reduced || typed >= exampleSearch.length;

  useEffect(() => {
    if (!inView || reduced) return;
    const timer = setInterval(() => {
      setTyped((count) => {
        if (count >= exampleSearch.length) {
          clearInterval(timer);
          return count;
        }
        return count + 1;
      });
    }, 38);
    return () => {
      clearInterval(timer);
    };
  }, [inView, reduced]);

  const results = [
    <CompanyCard
      key="company"
      company={{
        ...exampleCompany,
        name: 'Varhad Spinning Mills',
        sector: 'Textiles, yarn and fibre',
        location: 'Akola, India',
        capabilities: ['Organic cotton', 'GOTS certified yarn', 'Export'],
        established: 2004,
      }}
    />,
    <ProductCard key="product" product={exampleProduct} />,
    <ProfileCard
      key="person"
      person={{
        ...examplePerson,
        name: 'Rohan Deshmukh',
        initials: 'RD',
        role: 'Export manager',
        company: 'Varhad Spinning Mills',
        location: 'Akola, India',
      }}
      compact
    />,
  ];

  return (
    <figure ref={ref} className={styles.preview}>
      <div className={styles.field}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className={styles.icon}>
          <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className={styles.query}>
          <span className="visually-hidden">{exampleSearch}</span>
          <span aria-hidden="true">{reduced ? exampleSearch : exampleSearch.slice(0, typed)}</span>
          {!done && <span className={styles.caret} aria-hidden="true" />}
        </span>
      </div>
      <div className={styles.results}>
        {results.map((result, index) => (
          <motion.div
            key={result.key}
            initial={false}
            animate={done ? 'shown' : 'hidden'}
            variants={{
              hidden: { opacity: 0, y: 18, transition: instantHide },
              shown: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: easeOut, delay: 0.15 + index * 0.12 },
              },
            }}
          >
            {result}
          </motion.div>
        ))}
      </div>
      <figcaption className={styles.caption}>
        Illustration of IBC search. Names are examples.
      </figcaption>
    </figure>
  );
}
