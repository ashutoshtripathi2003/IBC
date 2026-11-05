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

/**
 * Unified search across products, companies, people, services and opportunities.
 * Runs on the catalogue in the browser today; the same interface will be served by the
 * Search domain (OpenSearch) later, so callers do not change.
 */
export const SEARCH_KINDS = ['product', 'company', 'person', 'service', 'opportunity'] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number];

/** Tabs shown to users. Manufacturers and suppliers are company filters, not separate data. */
export const SEARCH_SCOPES = [
  { id: 'all', label: 'All' },
  { id: 'product', label: 'Products' },
  { id: 'company', label: 'Companies' },
  { id: 'manufacturer', label: 'Manufacturers' },
  { id: 'supplier', label: 'Suppliers' },
  { id: 'person', label: 'Professionals' },
  { id: 'service', label: 'Services' },
  { id: 'opportunity', label: 'Opportunities' },
] as const;
export type SearchScope = (typeof SEARCH_SCOPES)[number]['id'];

export interface SearchDocument {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  href: string;
  industry: string[];
  country: string;
  businessTypes: BusinessType[];
  /** Lower-cased, accent-free text fields with weights. */
  fields: { text: string; weight: number }[];
}

export function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(/[^\p{L}\p{N}%.]+/u)
    .map((t) => t.replace(/^\.+|\.+$/g, ''))
    .filter((t) => t.length > 0);
}

function industryNames(slugs: readonly string[]): string {
  return slugs.map((slug) => industryBySlug(slug)?.name ?? '').join(' ');
}

function buildIndex(): SearchDocument[] {
  const docs: SearchDocument[] = [];
  for (const product of products) {
    const company = companyBySlug(product.companySlug);
    docs.push({
      kind: 'product',
      id: product.slug,
      title: product.name,
      subtitle: company?.name ?? '',
      summary: product.summary,
      href: `/products/${product.slug}`,
      industry: [product.industry],
      country: product.shipsFrom.country,
      businessTypes: [...(company?.types ?? [])],
      fields: [
        { text: normalize(product.name), weight: 6 },
        { text: normalize(`${product.category} ${industryNames([product.industry])}`), weight: 3 },
        {
          text: normalize(
            `${company?.name ?? ''} ${product.shipsFrom.city} ${countryName(product.shipsFrom.country)}`,
          ),
          weight: 2,
        },
        {
          text: normalize(
            `${product.summary} ${product.specs.map((s) => `${s.label} ${s.value}`).join(' ')}`,
          ),
          weight: 1,
        },
      ],
    });
  }
  for (const company of companies) {
    docs.push({
      kind: 'company',
      id: company.slug,
      title: company.name,
      subtitle: `${company.types.join(', ')} · ${company.location.city}, ${countryName(company.location.country)}`,
      summary: company.summary,
      href: `/businesses/${company.slug}`,
      industry: [...company.industries],
      country: company.location.country,
      businessTypes: [...company.types],
      fields: [
        { text: normalize(company.name), weight: 6 },
        {
          text: normalize(`${industryNames(company.industries)} ${company.types.join(' ')}`),
          weight: 3,
        },
        {
          text: normalize(
            `${company.capabilities.join(' ')} ${company.location.city} ${countryName(company.location.country)}`,
          ),
          weight: 2,
        },
        { text: normalize(`${company.summary} ${company.about}`), weight: 1 },
      ],
    });
  }
  for (const person of people) {
    const current = person.roles.find((role) => role.current);
    const org = current?.companySlug
      ? companyBySlug(current.companySlug)?.name
      : current?.organisation;
    docs.push({
      kind: 'person',
      id: person.slug,
      title: person.name,
      subtitle: [person.headline, org].filter(Boolean).join(' · '),
      summary: person.about,
      href: `/network/${person.slug}`,
      industry: [...person.industries],
      country: person.location.country,
      businessTypes: [],
      fields: [
        { text: normalize(person.name), weight: 6 },
        {
          text: normalize(`${person.headline} ${person.roles.map((r) => r.title).join(' ')}`),
          weight: 3,
        },
        {
          text: normalize(
            `${person.expertise.join(' ')} ${industryNames(person.industries)} ${org ?? ''}`,
          ),
          weight: 2,
        },
        {
          text: normalize(`${person.about} ${person.interests.join(' ')} ${person.location.city}`),
          weight: 1,
        },
      ],
    });
  }
  for (const service of services) {
    const company = companyBySlug(service.companySlug);
    docs.push({
      kind: 'service',
      id: service.slug,
      title: service.name,
      subtitle: company?.name ?? '',
      summary: service.summary,
      href: `/businesses/${service.companySlug}#services`,
      industry: [service.industry],
      country: company?.location.country ?? '',
      businessTypes: [...(company?.types ?? [])],
      fields: [
        { text: normalize(service.name), weight: 6 },
        { text: normalize(industryNames([service.industry])), weight: 3 },
        { text: normalize(`${company?.name ?? ''} ${service.coverage.join(' ')}`), weight: 2 },
        { text: normalize(service.summary), weight: 1 },
      ],
    });
  }
  for (const opportunity of opportunities) {
    docs.push({
      kind: 'opportunity',
      id: opportunity.slug,
      title: opportunity.title,
      subtitle: `${opportunity.kind} · ${opportunity.location.city}, ${countryName(opportunity.location.country)}`,
      summary: opportunity.summary,
      href: `/opportunities#${opportunity.slug}`,
      industry: [opportunity.industry],
      country: opportunity.location.country,
      businessTypes: [],
      fields: [
        { text: normalize(opportunity.title), weight: 6 },
        {
          text: normalize(`${opportunity.kind} ${industryNames([opportunity.industry])}`),
          weight: 3,
        },
        {
          text: normalize(
            `${opportunity.location.city} ${countryName(opportunity.location.country)}`,
          ),
          weight: 2,
        },
        { text: normalize(opportunity.summary), weight: 1 },
      ],
    });
  }
  return docs;
}

let cached: SearchDocument[] | null = null;
export function searchIndex(): SearchDocument[] {
  cached ??= buildIndex();
  return cached;
}

export interface SearchFilters {
  scope?: SearchScope;
  industry?: string;
  country?: string;
  sort?: 'relevance' | 'name';
}

export interface SearchResult {
  doc: SearchDocument;
  score: number;
}

function matchesScope(doc: SearchDocument, scope: SearchScope): boolean {
  if (scope === 'all') return true;
  if (scope === 'manufacturer')
    return doc.kind === 'company' && doc.businessTypes.includes('Manufacturer');
  if (scope === 'supplier') {
    return (
      doc.kind === 'company' &&
      doc.businessTypes.some((t) => t === 'Supplier' || t === 'Distributor' || t === 'Exporter')
    );
  }
  return doc.kind === scope;
}

function score(doc: SearchDocument, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 1;
  let total = 0;
  for (const token of queryTokens) {
    let best = 0;
    for (const field of doc.fields) {
      const words = field.text.split(/[^\p{L}\p{N}%.]+/u);
      if (words.includes(token)) best = Math.max(best, field.weight * 2);
      else if (words.some((w) => w.startsWith(token))) best = Math.max(best, field.weight * 1.4);
      else if (token.length >= 4 && field.text.includes(token)) best = Math.max(best, field.weight);
    }
    // Every query word must match somewhere: precise results beat long lists.
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

export function search(query: string, filters: SearchFilters = {}): SearchResult[] {
  const queryTokens = tokens(query);
  const scope = filters.scope ?? 'all';
  const results: SearchResult[] = [];
  for (const doc of searchIndex()) {
    if (!matchesScope(doc, scope)) continue;
    if (filters.industry && !doc.industry.includes(filters.industry)) continue;
    if (filters.country && doc.country !== filters.country) continue;
    const s = score(doc, queryTokens);
    if (s > 0) results.push({ doc, score: s });
  }
  if (filters.sort === 'name') results.sort((a, b) => a.doc.title.localeCompare(b.doc.title));
  else results.sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title));
  return results;
}

export interface Suggestion {
  kind: SearchKind | 'industry';
  label: string;
  detail: string;
  href: string;
}

/** Autocomplete: matching industries first, then the best records of each kind. */
export function suggest(query: string, limit = 7): Suggestion[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  const out: Suggestion[] = industries
    .filter(
      (industry) =>
        normalize(industry.name).includes(q) ||
        industry.segments.some((s) => normalize(s).includes(q)),
    )
    .slice(0, 2)
    .map((industry) => ({
      kind: 'industry',
      label: industry.name,
      detail: 'Industry',
      href: `/industries/${industry.slug}`,
    }));
  for (const result of search(query).slice(0, limit)) {
    if (out.length >= limit) break;
    out.push({
      kind: result.doc.kind,
      label: result.doc.title,
      detail: result.doc.subtitle,
      href: result.doc.href,
    });
  }
  return out;
}

export function countriesInIndex(): string[] {
  return [
    ...new Set(
      searchIndex()
        .map((doc) => doc.country)
        .filter(Boolean),
    ),
  ].sort((a, b) => countryName(a).localeCompare(countryName(b)));
}
