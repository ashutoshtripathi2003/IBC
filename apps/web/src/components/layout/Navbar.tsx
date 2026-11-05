'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SearchBox } from '@/components/search/SearchBox';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { industries } from '@/content/catalog';
import { accountLinks, primaryNav } from '@/content/site';
import { track } from '@/lib/analytics';
import { Brand } from './Brand';
import styles from './Navbar.module.css';

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const discoverRef = useRef<HTMLLIElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close menus when navigation completes.
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setDiscoverOpen(false);
  }

  useEffect(() => {
    if (!discoverOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!discoverRef.current?.contains(event.target as Node)) setDiscoverOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDiscoverOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [discoverOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const focusables = () =>
      Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('a[href], button, input, select') ?? [],
      );
    focusables()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      // Keep focus inside the menu (and its toggle) while it is open.
      const items = [toggleRef.current, ...focusables()].filter((el) => el !== null);
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === '/discover' && pathname.startsWith('/industries'));

  return (
    <header className={styles.bar}>
      <nav className={styles.inner} aria-label="Main">
        <Link href="/" className={styles.brand} aria-label="IBC, Industrial Business Circle, home">
          <Brand />
        </Link>

        <ul role="list" className={styles.links}>
          {primaryNav.map((item) =>
            item.href === '/discover' ? (
              <li key={item.href} ref={discoverRef} className={styles.discover}>
                <button
                  type="button"
                  className={styles.link}
                  aria-expanded={discoverOpen}
                  aria-controls="discover-panel"
                  data-active={isActive(item.href) || undefined}
                  onClick={() => {
                    setDiscoverOpen((v) => !v);
                  }}
                >
                  {item.label}
                  <Icon name="chevronDown" size={14} className={styles.caret} />
                </button>
                <AnimatePresence>
                  {discoverOpen && (
                    <motion.div
                      id="discover-panel"
                      className={styles.panel}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.16 }}
                    >
                      <p className={styles.panelTitle}>Browse by industry</p>
                      <ul role="list" className={styles.panelGrid}>
                        {industries.map((industry) => (
                          <li key={industry.slug}>
                            <Link
                              href={`/industries/${industry.slug}`}
                              className={styles.panelLink}
                            >
                              <Icon name={industry.icon} size={18} />
                              {industry.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className={styles.panelFoot}>
                        <Link href="/discover" className={styles.panelMore}>
                          All industries
                        </Link>
                        <Link href="/search" className={styles.panelMore}>
                          Search everything
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            ) : (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={styles.link}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  onClick={() => {
                    track({ name: 'nav_click', item: item.label, surface: 'desktop' });
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ),
          )}
        </ul>

        <div className={styles.actions}>
          <Link href="/search" className={styles.iconLink} aria-label="Search">
            <Icon name="search" size={20} />
          </Link>
          <Link
            href={accountLinks.login.href}
            className={styles.login}
            onClick={() => {
              track({ name: 'login_click', location: 'header' });
            }}
          >
            {accountLinks.login.label}
          </Link>
          <Button
            href={accountLinks.join.href}
            variant="accent"
            event={{ name: 'join_click', location: 'header' }}
          >
            {accountLinks.join.label}
          </Button>
        </div>

        <div className={styles.mobileActions}>
          <Link href="/search" className={styles.iconLink} aria-label="Search">
            <Icon name="search" size={20} />
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className={styles.toggle}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => {
              setMenuOpen((v) => !v);
            }}
          >
            <span className="visually-hidden">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            ref={menuRef}
            className={styles.menu}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <SearchBox />
            <ul role="list" className={styles.menuList}>
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={styles.menuLink}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    onClick={() => {
                      track({ name: 'nav_click', item: item.label, surface: 'mobile' });
                      setMenuOpen(false);
                    }}
                  >
                    <span>
                      <span className={styles.menuLabel}>{item.label}</span>
                      <span className={styles.menuSummary}>{item.summary}</span>
                    </span>
                    <Icon name="chevron" size={18} />
                  </Link>
                </li>
              ))}
            </ul>
            <div className={styles.menuActions}>
              <Button
                href={accountLinks.join.href}
                variant="accent"
                size="lg"
                fullWidth
                event={{ name: 'join_click', location: 'mobile_menu' }}
              >
                {accountLinks.join.label}
              </Button>
              <Button
                href={accountLinks.login.href}
                variant="secondary"
                size="lg"
                fullWidth
                event={{ name: 'login_click', location: 'mobile_menu' }}
              >
                {accountLinks.login.label}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
