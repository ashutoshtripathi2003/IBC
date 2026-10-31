'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import styles from './NetworkLegend.module.css';

const KINDS = [
  { kind: 'person', label: 'People', text: 'Professionals, founders, buyers and advisors.' },
  { kind: 'company', label: 'Companies', text: 'Businesses of every size, in every country.' },
  { kind: 'product', label: 'Products', text: 'What those businesses make and sell.' },
  { kind: 'service', label: 'Services', text: 'Expertise that moves trade forward.' },
  {
    kind: 'opportunity',
    label: 'Opportunities',
    text: 'Open demand: requests, orders, partnerships.',
  },
] as const;

/** Explains what the network visualisation shows, for anyone who wants to know. */
export function NetworkLegend() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => {
          setOpen(true);
        }}
      >
        <span className={styles.dots} aria-hidden="true">
          {KINDS.map(({ kind }) => (
            <span key={kind} className={styles.dot} data-kind={kind} />
          ))}
        </span>
        What am I looking at?
      </button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title="The IBC network"
      >
        <p className={styles.intro}>
          Each point is a participant in the network. Threads are relationships between them; the
          moving lights are business travelling along those relationships.
        </p>
        <dl className={styles.list}>
          {KINDS.map(({ kind, label, text }) => (
            <div key={kind} className={styles.row}>
              <dt>
                <span className={styles.dot} data-kind={kind} aria-hidden="true" />
                {label}
              </dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.note}>The visual is illustrative; it does not show real members.</p>
      </Modal>
    </>
  );
}
