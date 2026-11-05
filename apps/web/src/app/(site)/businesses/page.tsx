import { Explorer } from '@/components/explore/Explorer';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { DemoNotice } from '@/components/home/HomeSections';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Businesses',
  description:
    'Manufacturers, suppliers, distributors and service firms, with what they make and where they operate.',
  path: '/businesses',
});

export default function Page() {
  return (
    <>
      <PageHeader
        title="Businesses"
        intro="Manufacturers, suppliers, distributors and service firms, with what they make and where they operate."
        crumbs={[{ href: '/businesses', label: 'Businesses' }]}
      />
      <PageBody>
        <DemoNotice />
        <Explorer kind="company" noun="business" />
      </PageBody>
    </>
  );
}
