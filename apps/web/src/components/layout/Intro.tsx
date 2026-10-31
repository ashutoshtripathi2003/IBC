import { LogoMark } from './Logo';
import styles from './Intro.module.css';

/**
 * Opening sequence: the IBC mark ties itself, then the page is revealed. Under one second,
 * shown once per browser session, never with reduced motion. It is purely presentational
 * and never blocks interaction: the page underneath is fully rendered and usable.
 */
export const INTRO_SCRIPT = `try{var m=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(!m&&!sessionStorage.getItem('ibc-intro')){document.documentElement.dataset.intro='play';sessionStorage.setItem('ibc-intro','1');}}catch(e){}`;

export function Intro() {
  return (
    <div className={styles.intro} aria-hidden="true">
      <div className={styles.mark}>
        <LogoMark size={72} animated />
      </div>
    </div>
  );
}
