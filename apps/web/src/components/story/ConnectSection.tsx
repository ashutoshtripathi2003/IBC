'use client';

import { motion } from 'motion/react';
import { useRef } from 'react';
import { CompanyCard } from '@/components/cards/CompanyCard';
import { ProfileCard } from '@/components/cards/ProfileCard';
import { Section } from '@/components/ui/Section';
import { exampleCompany, examplePartner, examplePerson } from '@/content/examples';
import { easeOut } from '@/lib/motion';
import { instantHide, useReveal } from '@/lib/motion/useReveal';
import split from './split.module.css';
import styles from './ConnectSection.module.css';
import story from './story.module.css';

export function ConnectSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reveal = useReveal(ref);

  return (
    <Section id="connect" labelledBy="connect-title" align="wide">
      <div className={split.split}>
        <div>
          <h2 id="connect-title" className={story.title}>
            Relationships that come with context.
          </h2>
          <p className={story.body}>
            Connect with the people behind businesses in Pune or Hamburg. See who they are, what
            their company does, and how you are already linked before you send the first message.
          </p>
        </div>
        <figure ref={ref} className={styles.pair}>
          <div className={styles.people}>
            <ProfileCard person={examplePerson} />
            <svg
              className={styles.thread}
              viewBox="0 0 40 120"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <motion.path
                d="M20 0 C 2 40, 38 80, 20 120"
                fill="none"
                stroke="var(--periwinkle)"
                strokeWidth="1.5"
                initial={false}
                animate={reveal}
                variants={{
                  hidden: { pathLength: 0, transition: instantHide },
                  shown: {
                    pathLength: 1,
                    transition: { duration: 1.2, ease: easeOut, delay: 0.3 },
                  },
                }}
              />
            </svg>
            <ProfileCard person={examplePartner} />
          </div>
          <CompanyCard company={exampleCompany} />
          <figcaption className={story.caption}>
            Illustration of IBC profiles. Names are examples.
          </figcaption>
        </figure>
      </div>
    </Section>
  );
}
