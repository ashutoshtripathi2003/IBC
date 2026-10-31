'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Badge';
import type { ExamplePerson } from '@/content/examples';
import styles from './cards.module.css';

/** A person on the network. The connect control is interactive in previews (no request is sent). */
export function ProfileCard({
  person,
  compact = false,
}: {
  person: ExamplePerson;
  compact?: boolean;
}) {
  const [requested, setRequested] = useState(false);
  return (
    <Card accent="person" className={compact ? styles.compact : undefined}>
      <div className={styles.head}>
        <span className={styles.avatar} aria-hidden="true">
          {person.initials}
        </span>
        <div className={styles.identity}>
          <h3 className={styles.name}>{person.name}</h3>
          <p className={styles.sub}>
            {person.role}, {person.company}
          </p>
          <p className={styles.meta}>{person.location}</p>
        </div>
      </div>
      {!compact && (
        <>
          <div className={styles.tags}>
            {person.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
          <button
            type="button"
            className={`${styles.connect} ${requested ? styles.connected : ''}`}
            aria-pressed={requested}
            onClick={() => {
              setRequested((value) => !value);
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={requested ? 'sent' : 'connect'}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {requested ? 'Request sent' : 'Connect'}
              </motion.span>
            </AnimatePresence>
          </button>
        </>
      )}
    </Card>
  );
}
