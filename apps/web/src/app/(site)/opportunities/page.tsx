import { Explorer } from '@/components/explore/Explorer';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { DemoNotice } from '@/components/home/HomeSections';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Opportunities',
  description: 'Requests for quotation, distributor searches, partnerships and export enquiries.',
  path: '/opportunities',
});

export default function Page() {
  return (
    <>
      <PageHeader
        title="Opportunities"
        intro="Requests for quotation, distributor searches, partnerships and export enquiries."
        crumbs={[{ href: '/opportunities', label: 'Opportunities' }]}
      />
      <PageBody>
        <DemoNotice />
        <Explorer kind="opportunity" noun="opportunity" />
      </PageBody>
    </>
  );
}
