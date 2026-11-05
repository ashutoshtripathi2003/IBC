import { Explorer } from '@/components/explore/Explorer';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { DemoNotice } from '@/components/home/HomeSections';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Services',
  description: 'Engineering, logistics, testing and advisory services for industrial businesses.',
  path: '/services',
});

export default function Page() {
  return (
    <>
      <PageHeader
        title="Services"
        intro="Engineering, logistics, testing and advisory services for industrial businesses."
        crumbs={[{ href: '/services', label: 'Services' }]}
      />
      <PageBody>
        <DemoNotice />
        <Explorer kind="service" noun="service" />
      </PageBody>
    </>
  );
}
