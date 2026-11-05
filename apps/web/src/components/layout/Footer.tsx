import Link from 'next/link';
import { industries } from '@/content/catalog';
import { accountLinks, primaryNav, site } from '@/content/site';
import { Brand } from './Brand';
import styles from './Footer.module.css';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Brand tone="light" />
          <p className={styles.tagline}>{site.tagline}.</p>
          <p className={styles.motto}>{site.motto}</p>
        </div>
        <nav aria-label="Footer" className={styles.columns}>
          <div>
            <h2 className={styles.heading}>Platform</h2>
            <ul role="list">
              {primaryNav
                .filter((item) => item.href !== '/about')
                .map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={styles.link}>
                      {item.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
          <div>
            <h2 className={styles.heading}>Industries</h2>
            <ul role="list">
              {industries.slice(0, 7).map((industry) => (
                <li key={industry.slug}>
                  <Link href={`/industries/${industry.slug}`} className={styles.link}>
                    {industry.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/discover" className={styles.link}>
                  All industries
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className={styles.heading}>Company</h2>
            <ul role="list">
              <li>
                <Link href="/about" className={styles.link}>
                  About IBC
                </Link>
              </li>
              <li>
                <Link href={accountLinks.join.href} className={styles.link}>
                  {accountLinks.join.label}
                </Link>
              </li>
              <li>
                <Link href={accountLinks.login.href} className={styles.link}>
                  {accountLinks.login.label}
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
      <div className={styles.base}>
        <p>
          © {year} {site.legalName}
        </p>
        <p>Listings marked Demo are fictional examples.</p>
      </div>
    </footer>
  );
}
