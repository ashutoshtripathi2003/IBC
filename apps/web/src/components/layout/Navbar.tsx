'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { accountLinks, primaryNav } from '@/content/site';
import { track } from '@/lib/analytics';
import { easeOut } from '@/lib/motion';
import { useScrolledPast } from '@/lib/motion/hooks';
import { Logo } from './Logo';
import styles from './Navbar.module.css';

export function Navbar() {
  const pathname = usePathname();
  const scrolled = useScrolledPast(24);
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when navigation completes (adjusting state during render, per React docs).
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    menuRef.current?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (event.key === 'Tab' && menuRef.current) {
        // Keep focus within the menu and its toggle while open.
        const focusable = [
          toggleRef.current,
          ...menuRef.current.querySelectorAll<HTMLElement>('a, button'),
        ].filter((el): el is HTMLElement => el !== null);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={`${styles.bar} ${scrolled || open ? styles.solid : ''}`}>
      <nav className={styles.inner} aria-label="Main">
        <Link href="/" className={styles.brand} aria-label="IBC — Indian Business Circle, home">
          <Logo />
        </Link>

        <ul role="list" className={styles.links}>
          {primaryNav.map((item) => (
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
          ))}
        </ul>

        <div className={styles.actions}>
          <Link
            href={accountLinks.login.href}
            className={styles.login}
            onClick={() => {
              track({ name: 'login_click', location: 'navbar' });
            }}
          >
            {accountLinks.login.label}
          </Link>
          <Button href={accountLinks.join.href} event={{ name: 'join_click', location: 'navbar' }}>
            {accountLinks.join.label}
          </Button>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => {
            setOpen((value) => !value);
          }}
        >
          <span className="visually-hidden">{open ? 'Close menu' : 'Open menu'}</span>
          <span className={`${styles.burger} ${open ? styles.burgerOpen : ''}`} aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            id="mobile-menu"
            className={styles.menu}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            <ul role="list" className={styles.menuList}>
              {primaryNav.map((item, index) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: easeOut, delay: 0.12 + index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className={styles.menuLink}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    onClick={() => {
                      track({ name: 'nav_click', item: item.label, surface: 'mobile' });
                      setOpen(false);
                    }}
                  >
                    <span className={styles.menuLabel}>{item.label}</span>
                    <span className={styles.menuSummary}>{item.summary}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <motion.div
              className={styles.menuActions}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              <Button
                href={accountLinks.join.href}
                size="lg"
                event={{ name: 'join_click', location: 'mobile_menu' }}
              >
                {accountLinks.join.label}
              </Button>
              <Button
                href={accountLinks.login.href}
                variant="secondary"
                size="lg"
                event={{ name: 'login_click', location: 'mobile_menu' }}
              >
                {accountLinks.login.label}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
