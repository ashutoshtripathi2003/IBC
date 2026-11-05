import { Suspense } from 'react';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { SearchResults } from '@/components/search/SearchResults';
import { ResultSkeleton } from '@/components/ui/LoadingState';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Search',
  description:
    'Search products, companies, manufacturers, suppliers, professionals, services and opportunities.',
  path: '/search',
});

export default function SearchPage() {
  return (
    <>
      <PageHeader title="Search IBC" crumbs={[{ href: '/search', label: 'Search' }]} />
      <PageBody>
        <Suspense fallback={<ResultSkeleton rows={4} />}>
          <SearchResults />
        </Suspense>
      </PageBody>
    </>
  );
}
