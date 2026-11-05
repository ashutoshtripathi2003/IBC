'use client';

import { useRouter } from 'next/navigation';
import { useId, useMemo, useRef, useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { track } from '@/lib/analytics';
import { SEARCH_SCOPES, suggest, type SearchScope, type Suggestion } from '@/lib/search';
import styles from './SearchBox.module.css';

const KIND_LABEL: Record<Suggestion['kind'], string> = {
  industry: 'Industry',
  product: 'Product',
  company: 'Company',
  person: 'Professional',
  service: 'Service',
  opportunity: 'Opportunity',
};

const KIND_ICON = {
  industry: 'grid',
  product: 'box',
  company: 'building',
  person: 'user',
  service: 'wrench',
  opportunity: 'briefcase',
} as const;

const POPULAR = ['Isopropyl alcohol', 'Die castings', 'Process pumps', 'Cotton yarn', 'Polymers'];

export function searchHref(query: string, scope: SearchScope = 'all'): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (scope !== 'all') params.set('scope', scope);
  const qs = params.toString();
  return qs ? `/search?${qs}` : '/search';
}

/**
 * Unified search box with autocomplete (WAI-ARIA combobox pattern): arrow keys move through
 * suggestions, Enter opens one or runs the search, Escape closes the list.
 */
export function SearchBox({
  variant = 'page',
  initialQuery = '',
  initialScope = 'all',
  onSearch,
}: {
  variant?: 'hero' | 'header' | 'page';
  initialQuery?: string;
  initialScope?: SearchScope;
  /** When provided (search page), the box updates results instead of navigating. */
  onSearch?: (query: string, scope: SearchScope) => void;
}) {
  const router = useRouter();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState<SearchScope>(initialScope);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const suggestions = useMemo(() => suggest(query), [query]);
  const listOpen = open && suggestions.length > 0;

  const run = (q: string, s: SearchScope = scope) => {
    setOpen(false);
    track({ name: 'cta_click', cta: 'search', location: variant });
    if (onSearch) onSearch(q, s);
    else router.push(searchHref(q, s));
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const chosen = active >= 0 ? suggestions[active] : undefined;
    if (chosen) {
      setOpen(false);
      router.push(chosen.href);
      return;
    }
    run(query);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp' && suggestions.length > 0) {
      event.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  const listId = `${id}-list`;
  const optionId = (i: number) => `${id}-opt-${i}`;

  return (
    <div className={`${styles.root} ${styles[variant]}`}>
      {variant === 'hero' && (
        <div className={styles.scopes} role="radiogroup" aria-label="Search in">
          {SEARCH_SCOPES.filter((s) => s.id !== 'opportunity').map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={scope === s.id}
              className={styles.scope}
              onClick={() => {
                setScope(s.id);
                inputRef.current?.focus();
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <form role="search" className={styles.form} onSubmit={onSubmit}>
        <Icon name="search" size={variant === 'header' ? 18 : 20} className={styles.icon} />
        <label htmlFor={`${id}-input`} className="visually-hidden">
          Search products, companies, professionals and services
        </label>
        <input
          ref={inputRef}
          id={`${id}-input`}
          className={styles.input}
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          placeholder={
            variant === 'header'
              ? 'Search IBC'
              : 'Search products, companies, manufacturers, professionals…'
          }
          value={query}
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 && listOpen ? optionId(active) : undefined}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => {
            // Re-open suggestions on focus, but not for a query whose results are already shown.
            setOpen(query !== initialQuery || !onSearch);
          }}
          onBlur={() => {
            // Let clicks on suggestions register before closing.
            setTimeout(() => {
              setOpen(false);
            }, 120);
          }}
          onKeyDown={onKeyDown}
        />
        {variant !== 'header' && (
          <button type="submit" className={styles.submit}>
            Search
          </button>
        )}
        <div
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          className={styles.list}
          hidden={!listOpen}
        >
          {suggestions.map((s, i) => (
            <div
              key={`${s.kind}-${s.href}`}
              id={optionId(i)}
              role="option"
              tabIndex={-1}
              aria-selected={i === active}
              className={styles.option}
              onMouseDown={(event) => {
                event.preventDefault();
                setOpen(false);
                router.push(s.href);
              }}
              onMouseEnter={() => {
                setActive(i);
              }}
            >
              <span className={styles.optionIcon}>
                <Icon name={KIND_ICON[s.kind]} size={16} />
              </span>
              <span className={styles.optionText}>
                <span className={styles.optionLabel}>{s.label}</span>
                <span className={styles.optionDetail}>{s.detail}</span>
              </span>
              <span className={styles.optionKind}>{KIND_LABEL[s.kind]}</span>
            </div>
          ))}
          <div
            role="option"
            tabIndex={-1}
            aria-selected={false}
            className={`${styles.option} ${styles.all}`}
            onMouseDown={(event) => {
              event.preventDefault();
              run(query);
            }}
          >
            See all results for “{query.trim()}”
          </div>
        </div>
      </form>
      {variant === 'hero' && (
        <p className={styles.popular}>
          <span>Popular:</span>
          {POPULAR.map((term) => (
            <button
              key={term}
              type="button"
              className={styles.chip}
              onClick={() => {
                setQuery(term);
                run(term);
              }}
            >
              {term}
            </button>
          ))}
        </p>
      )}
    </div>
  );
}
