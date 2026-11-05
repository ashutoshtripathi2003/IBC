import { IndustryCard } from '@/components/catalog/cards';
import { Grid } from '@/components/catalog/Grid';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { SearchBox } from '@/components/search/SearchBox';
import { industries } from '@/content/catalog';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Discover',
  description:
    'Browse industries and search products, companies, professionals and services on IBC.',
  path: '/discover',
});

export default function DiscoverPage() {
  return (
    <>
      <PageHeader
        title="Discover"
        intro="Start with an industry, or search across every product, company, professional and service."
        crumbs={[{ href: '/discover', label: 'Discover' }]}
      >
        <div style={{ maxWidth: '44rem' }}>
          <SearchBox />
        </div>
      </PageHeader>
      <PageBody>
        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-5)' }}>Industries</h2>
        <Grid min={13.5} compact>
          {industries.map((industry) => (
            <IndustryCard key={industry.slug} industry={industry} />
          ))}
        </Grid>
      </PageBody>
    </>
  );
}
