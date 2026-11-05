'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDeferredValue, useMemo } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ResultSkeleton } from '@/components/ui/LoadingState';
import { DemoBadge } from '@/components/ui/Badge';
import { Monogram } from '@/components/ui/Monogram';
import { industries, industryBySlug } from '@/content/catalog';
import { countryName } from '@/lib/geo';
import {
  countriesInIndex,
  search,
  SEARCH_SCOPES,
  type SearchKind,
  type SearchScope,
} from '@/lib/search';
import { SearchBox, searchHref } from './SearchBox';
import styles from './SearchResults.module.css';

const KIND_LABEL: Record<SearchKind, string> = {
  product: 'Product',
  company: 'Company',
  person: 'Professional',
  service: 'Service',
  opportunity: 'Opportunity',
};

const KIND_ICON = {
  product: 'box',
  company: 'building',
  person: 'user',
  service: 'wrench',
  opportunity: 'briefcase',
} as const;

function isScope(value: string | null): value is SearchScope {
  return SEARCH_SCOPES.some((s) => s.id === value);
}

/** Search results driven entirely by the URL, so every search can be shared. */
export function SearchResults() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const scopeParam = params.get('scope');
  const scope: SearchScope = isScope(scopeParam) ? scopeParam : 'all';
  const industry = params.get('industry') ?? '';
  const country = params.get('country') ?? '';
  const sort = params.get('sort') === 'name' ? 'name' : 'relevance';

  const deferredQ = useDeferredValue(q);
  const pending = deferredQ !== q;
  const filters = { industry: industry || undefined, country: country || undefined };
  const results = useMemo(
    () =>
      search(deferredQ, {
        scope,
        ...(filters.industry ? { industry } : {}),
        ...(filters.country ? { country } : {}),
        sort,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deferredQ, scope, industry, country, sort],
  );
  const counts = useMemo(
    () =>
      Object.fromEntries(
        SEARCH_SCOPES.map((s) => [
          s.id,
          search(deferredQ, {
            scope: s.id,
            ...(industry ? { industry } : {}),
            ...(country ? { country } : {}),
          }).length,
        ]),
      ) as Record<SearchScope, number>,
    [deferredQ, industry, country],
  );

  const setParam = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    router.replace(qs ? `/search?${qs}` : '/search', { scroll: false });
  };

  return (
    <div className={styles.page}>
      <div className={styles.searchRow}>
        <SearchBox
          key={q}
          initialQuery={q}
          initialScope={scope}
          onSearch={(nextQ) => {
            setParam({ q: nextQ });
          }}
        />
      </div>

      <nav className={styles.scopes} aria-label="Result types">
        {SEARCH_SCOPES.map((s) => (
          <Link
            key={s.id}
            href={
              searchHref(q, s.id) +
              (industry ? `&industry=${industry}` : '') +
              (country ? `&country=${country}` : '')
            }
            replace
            scroll={false}
            className={styles.scope}
            aria-current={scope === s.id ? 'page' : undefined}
          >
            {s.label}
            <span className={styles.scopeCount}>{counts[s.id]}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.toolbar}>
        <p className={styles.summary} aria-live="polite">
          {results.length} {results.length === 1 ? 'result' : 'results'}
          {q && (
            <>
              {' '}
              for <strong>“{q}”</strong>
            </>
          )}
        </p>
        <div className={styles.filters}>
          <label>
            <span className="visually-hidden">Industry</span>
            <select
              value={industry}
              onChange={(e) => {
                setParam({ industry: e.target.value });
              }}
            >
              <option value="">All industries</option>
              {industries.map((i) => (
                <option key={i.slug} value={i.slug}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="visually-hidden">Country</span>
            <select
              value={country}
              onChange={(e) => {
                setParam({ country: e.target.value });
              }}
            >
              <option value="">All countries</option>
              {countriesInIndex().map((c) => (
                <option key={c} value={c}>
                  {countryName(c)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="visually-hidden">Sort</span>
            <select
              value={sort}
              onChange={(e) => {
                setParam({ sort: e.target.value === 'name' ? 'name' : '' });
              }}
            >
              <option value="relevance">Most relevant</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
      </div>

      {pending ? (
        <ResultSkeleton />
      ) : results.length === 0 ? (
        <div className={styles.empty}>
          <Icon name="search" size={30} />
          <h2>No results{q ? ` for “${q}”` : ''}</h2>
          <p>Check the spelling, use fewer words, or search all types and industries.</p>
          <div className={styles.emptyActions}>
            {(scope !== 'all' || industry || country) && (
              <button
                type="button"
                onClick={() => {
                  setParam({ scope: '', industry: '', country: '' });
                }}
              >
                Search everything
              </button>
            )}
            <Link href="/discover">Browse industries</Link>
          </div>
        </div>
      ) : (
        <ol className={styles.results}>
          {results.map(({ doc }) => (
            <li key={`${doc.kind}-${doc.id}`} className={styles.result}>
              {doc.kind === 'company' || doc.kind === 'person' ? (
                <Monogram
                  name={doc.title}
                  size={44}
                  shape={doc.kind === 'person' ? 'circle' : 'square'}
                />
              ) : (
                <span className={styles.kindIcon}>
                  <Icon name={KIND_ICON[doc.kind]} size={20} />
                </span>
              )}
              <div className={styles.resultText}>
                <p className={styles.resultKind}>
                  {KIND_LABEL[doc.kind]}
                  {doc.industry[0] && <> · {industryBySlug(doc.industry[0])?.name}</>}
                </p>
                <h2 className={styles.resultTitle}>
                  <Link href={doc.href}>{doc.title}</Link>
                </h2>
                {doc.subtitle && <p className={styles.resultSub}>{doc.subtitle}</p>}
                <p className={styles.resultSummary}>{doc.summary}</p>
              </div>
              <DemoBadge />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
