'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CompanyCard,
  OpportunityCard,
  PersonCard,
  ProductCard,
  ServiceCard,
} from '@/components/catalog/cards';
import { Grid } from '@/components/catalog/Grid';
import { Icon } from '@/components/ui/Icon';
import {
  companies,
  companyBySlug,
  industries,
  industryBySlug,
  opportunities,
  people,
  products,
  services,
  type BusinessType,
} from '@/content/catalog';
import { countryName } from '@/lib/geo';
import styles from './Explorer.module.css';

export type ExplorerKind = 'company' | 'product' | 'person' | 'service' | 'opportunity';

interface Item {
  key: string;
  name: string;
  industries: readonly string[];
  country: string;
  types: readonly string[];
  priced?: boolean;
  node: React.ReactNode;
}

const BUSINESS_TYPES: BusinessType[] = [
  'Manufacturer',
  'Supplier',
  'Distributor',
  'Exporter',
  'Service provider',
];

function itemsFor(kind: ExplorerKind): Item[] {
  switch (kind) {
    case 'company':
      return companies.map((c) => ({
        key: c.slug,
        name: c.name,
        industries: c.industries,
        country: c.location.country,
        types: c.types,
        node: <CompanyCard company={c} />,
      }));
    case 'product':
      return products.map((p) => ({
        key: p.slug,
        name: p.name,
        industries: [p.industry],
        country: p.shipsFrom.country,
        types: companyBySlug(p.companySlug)?.types ?? [],
        priced: p.price !== null,
        node: <ProductCard product={p} />,
      }));
    case 'person':
      return people.map((p) => ({
        key: p.slug,
        name: p.name,
        industries: p.industries,
        country: p.location.country,
        types: [],
        node: <PersonCard person={p} />,
      }));
    case 'service':
      return services.map((s) => ({
        key: s.slug,
        name: s.name,
        industries: [s.industry],
        country: companyBySlug(s.companySlug)?.location.country ?? '',
        types: [],
        node: <ServiceCard service={s} />,
      }));
    case 'opportunity':
      return opportunities.map((o) => ({
        key: o.slug,
        name: o.title,
        industries: [o.industry],
        country: o.location.country,
        types: [o.kind],
        node: <OpportunityCard opportunity={o} />,
      }));
  }
}

interface FilterState {
  industry: string;
  country: string;
  type: string;
  price: string;
  sort: string;
}

const EMPTY: FilterState = { industry: '', country: '', type: '', price: '', sort: 'name' };

function readUrl(): Partial<FilterState> {
  const params = new URLSearchParams(window.location.search);
  const out: Partial<FilterState> = {};
  for (const key of ['industry', 'country', 'type', 'price', 'sort'] as const) {
    const value = params.get(key);
    if (value) out[key] = value;
  }
  return out;
}

/**
 * Filterable, sortable listing for one record type. Filters live in the URL so a
 * filtered view can be shared or bookmarked.
 */
export function Explorer({
  kind,
  noun,
  fixedIndustry,
}: {
  kind: ExplorerKind;
  noun: string;
  fixedIndustry?: string;
}) {
  const all = useMemo(() => itemsFor(kind), [kind]);
  const [filters, setFilters] = useState<FilterState>(EMPTY);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    // Apply filters from a shared link after hydration.
    // Runs after hydration on purpose: the server-rendered list is unfiltered, and reading the
    // URL during render would make the first client render differ from the server HTML.
    const fromUrl = readUrl();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (Object.keys(fromUrl).length > 0) setFilters((current) => ({ ...current, ...fromUrl }));
  }, []);

  const update = (patch: Partial<FilterState>) => {
    setFilters((current) => {
      const next = { ...current, ...patch };
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(next))
        if (value && !(key === 'sort' && value === 'name')) params.set(key, value);
      const qs = params.toString();
      window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
      return next;
    });
  };

  const scoped = fixedIndustry ? all.filter((i) => i.industries.includes(fixedIndustry)) : all;
  const countries = [...new Set(scoped.map((i) => i.country).filter(Boolean))].sort((a, b) =>
    countryName(a).localeCompare(countryName(b)),
  );
  const industryOptions = industries.filter((ind) =>
    scoped.some((i) => i.industries.includes(ind.slug)),
  );
  const typeOptions =
    kind === 'company'
      ? BUSINESS_TYPES
      : kind === 'opportunity'
        ? [...new Set(scoped.flatMap((i) => i.types))]
        : [];

  const results = scoped
    .filter((i) => !filters.industry || i.industries.includes(filters.industry))
    .filter((i) => !filters.country || i.country === filters.country)
    .filter((i) => !filters.type || i.types.includes(filters.type))
    .filter((i) => !filters.price || (filters.price === 'priced' ? i.priced : !i.priced))
    .sort((a, b) =>
      filters.sort === 'name-desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name),
    );

  const active = (['industry', 'country', 'type', 'price'] as const).filter((k) => filters[k]);
  const label = (key: (typeof active)[number]) => {
    const value = filters[key];
    if (key === 'industry') return industryBySlug(value)?.name ?? value;
    if (key === 'country') return countryName(value);
    if (key === 'price') return value === 'priced' ? 'Price listed' : 'Price on request';
    return value;
  };

  // Rendered twice (sidebar on wide screens, disclosure on phones); radio names stay unique.
  const filterFields = (surface: 'side' | 'mobile') => (
    <>
      {!fixedIndustry && industryOptions.length > 1 && (
        <label className={styles.field}>
          <span>Industry</span>
          <select
            value={filters.industry}
            onChange={(e) => {
              update({ industry: e.target.value });
            }}
          >
            <option value="">All industries</option>
            {industryOptions.map((ind) => (
              <option key={ind.slug} value={ind.slug}>
                {ind.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {countries.length > 1 && (
        <label className={styles.field}>
          <span>Country</span>
          <select
            value={filters.country}
            onChange={(e) => {
              update({ country: e.target.value });
            }}
          >
            <option value="">All countries</option>
            {countries.map((code) => (
              <option key={code} value={code}>
                {countryName(code)}
              </option>
            ))}
          </select>
        </label>
      )}
      {typeOptions.length > 0 && (
        <fieldset className={styles.fieldset}>
          <legend>{kind === 'company' ? 'Business type' : 'Type'}</legend>
          {typeOptions.map((t) => (
            <label key={t} className={styles.radio}>
              <input
                type="radio"
                name={`${kind}-type-${surface}`}
                checked={filters.type === t}
                onChange={() => {
                  update({ type: t });
                }}
              />
              {t}
            </label>
          ))}
          {filters.type && (
            <button
              type="button"
              className={styles.clearOne}
              onClick={() => {
                update({ type: '' });
              }}
            >
              Any type
            </button>
          )}
        </fieldset>
      )}
      {kind === 'product' && (
        <label className={styles.field}>
          <span>Price</span>
          <select
            value={filters.price}
            onChange={(e) => {
              update({ price: e.target.value });
            }}
          >
            <option value="">Any</option>
            <option value="priced">Price listed</option>
            <option value="request">Price on request</option>
          </select>
        </label>
      )}
    </>
  );

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar} aria-label="Filters">
        <h2 className={styles.sideTitle}>
          <Icon name="filter" size={16} /> Filters
        </h2>
        {filterFields('side')}
      </aside>

      <div className={styles.main}>
        <details className={styles.mobileFilters}>
          <summary>
            <Icon name="filter" size={16} /> Filters{active.length > 0 ? ` (${active.length})` : ''}
          </summary>
          <div className={styles.mobilePanel}>{filterFields('mobile')}</div>
        </details>

        <div className={styles.toolbar}>
          <p className={styles.count} aria-live="polite">
            {results.length} {results.length === 1 ? noun : `${noun}s`}
          </p>
          <div className={styles.toolbarRight}>
            <label className={styles.sort}>
              <span>Sort</span>
              <select
                value={filters.sort}
                onChange={(e) => {
                  update({ sort: e.target.value });
                }}
              >
                <option value="name">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
              </select>
            </label>
            {kind === 'product' && (
              <div className={styles.viewToggle} role="group" aria-label="Layout">
                <button
                  type="button"
                  aria-pressed={view === 'grid'}
                  onClick={() => {
                    setView('grid');
                  }}
                  title="Grid"
                >
                  <Icon name="grid" size={16} label="Grid view" />
                </button>
                <button
                  type="button"
                  aria-pressed={view === 'list'}
                  onClick={() => {
                    setView('list');
                  }}
                  title="List"
                >
                  <Icon name="list" size={16} label="List view" />
                </button>
              </div>
            )}
          </div>
        </div>

        {active.length > 0 && (
          <div className={styles.chips}>
            {active.map((key) => (
              <button
                key={key}
                type="button"
                className={styles.chip}
                onClick={() => {
                  update({ [key]: '' });
                }}
              >
                {label(key)}
                <Icon name="close" size={14} label={`Remove ${label(key)} filter`} />
              </button>
            ))}
            <button
              type="button"
              className={styles.clearAll}
              onClick={() => {
                update({ industry: '', country: '', type: '', price: '' });
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {results.length === 0 ? (
          <div className={styles.empty}>
            <Icon name="search" size={28} />
            <h3>No {noun}s match these filters</h3>
            <p>Remove a filter to see more results.</p>
            <button
              type="button"
              className={styles.clearAll}
              onClick={() => {
                update({ industry: '', country: '', type: '', price: '' });
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className={view === 'list' ? styles.listView : undefined}>
            <Grid min={kind === 'product' ? 15.5 : 19}>
              {results.map((item) => (
                <div key={item.key} className={styles.item}>
                  {item.node}
                </div>
              ))}
            </Grid>
          </div>
        )}
      </div>
    </div>
  );
}
