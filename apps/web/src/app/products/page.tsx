import { Explorer } from '@/components/explore/Explorer';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { DemoNotice } from '@/components/home/HomeSections';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Product marketplace',
  description:
    'Industrial products with specifications, pricing, minimum order and origin. Request a quotation from any listing.',
  path: '/products',
});

export default function Page() {
  return (
    <>
      <PageHeader
        title="Product marketplace"
        intro="Industrial products with specifications, pricing, minimum order and origin. Request a quotation from any listing."
        crumbs={[{ href: '/products', label: 'Product marketplace' }]}
      />
      <PageBody>
        <DemoNotice />
        <Explorer kind="product" noun="product" />
      </PageBody>
    </>
  );
}
