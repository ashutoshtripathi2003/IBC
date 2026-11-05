'use client';

import { useState, type InputHTMLAttributes } from 'react';
import styles from './forms.module.css';

/** Password input with a show/hide toggle. */
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.passwordWrap}>
      <input {...props} type={visible ? 'text' : 'password'} className={styles.input} />
      <button
        type="button"
        className={styles.reveal}
        aria-pressed={visible}
        aria-controls={props.id}
        onClick={() => {
          setVisible((v) => !v);
        }}
      >
        {visible ? 'Hide' : 'Show'}
        <span className="visually-hidden"> password</span>
      </button>
    </div>
  );
}
