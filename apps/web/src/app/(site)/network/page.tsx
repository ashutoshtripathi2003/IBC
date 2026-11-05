import { Explorer } from '@/components/explore/Explorer';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { DemoNotice } from '@/components/home/HomeSections';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Professional network',
  description: 'Professionals across industries, with their roles, companies and expertise.',
  path: '/network',
});

export default function Page() {
  return (
    <>
      <PageHeader
        title="Professional network"
        intro="Professionals across industries, with their roles, companies and expertise."
        crumbs={[{ href: '/network', label: 'Professional network' }]}
      />
      <PageBody>
        <DemoNotice />
        <Explorer kind="person" noun="professional" />
      </PageBody>
    </>
  );
}
