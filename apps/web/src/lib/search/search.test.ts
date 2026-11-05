import { describe, expect, it } from 'vitest';
import { companies, industries, products } from '@/content/catalog';
import { countriesInIndex, normalize, search, searchIndex, suggest } from './index';

describe('unified search', () => {
  it('indexes every catalogue record once', () => {
    const ids = searchIndex().map((d) => `${d.kind}:${d.id}`);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((i) => i.startsWith('product:'))).toHaveLength(products.length);
    expect(ids.filter((i) => i.startsWith('company:'))).toHaveLength(companies.length);
  });

  it('ranks a name match above a description match', () => {
    const results = search('pump');
    expect(results[0]!.doc.title.toLowerCase()).toContain('pump');
  });

  it('requires every query word to match', () => {
    expect(
      search('cotton yarn').every((r) => /cotton|yarn/i.test(JSON.stringify(r.doc.fields))),
    ).toBe(true);
    expect(search('cotton zzzunknown')).toHaveLength(0);
  });

  it('matches prefixes and ignores accents and case', () => {
    expect(search('polypro').some((r) => r.doc.id === 'polypropylene-homopolymer')).toBe(true);
    expect(search('GOIANIA').some((r) => r.doc.id === 'cerrado-agri-commodities')).toBe(true);
    expect(normalize('Goiânia')).toBe('goiania');
  });

  it('filters by scope, industry and country', () => {
    expect(
      search('', { scope: 'manufacturer' }).every((r) =>
        r.doc.businessTypes.includes('Manufacturer'),
      ),
    ).toBe(true);
    expect(search('', { scope: 'person' }).every((r) => r.doc.kind === 'person')).toBe(true);
    expect(
      search('', { industry: 'textiles' }).every((r) => r.doc.industry.includes('textiles')),
    ).toBe(true);
    expect(search('', { country: 'DE' }).every((r) => r.doc.country === 'DE')).toBe(true);
  });

  it('sorts by name when asked', () => {
    const titles = search('', { scope: 'company', sort: 'name' }).map((r) => r.doc.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });

  it('suggests industries and records, nothing for one character', () => {
    expect(suggest('c')).toEqual([]);
    const s = suggest('chem');
    expect(s[0]).toMatchObject({
      kind: 'industry',
      label: 'Chemicals',
      href: '/industries/chemicals',
    });
    expect(s.length).toBeGreaterThan(1);
  });

  it('only refers to industries that exist', () => {
    const known = new Set(industries.map((i) => i.slug));
    for (const doc of searchIndex())
      for (const i of doc.industry) expect(known.has(i), `${doc.id}: ${i}`).toBe(true);
    expect(countriesInIndex().length).toBeGreaterThan(5);
  });
});
