import { AppPage, NotYetAvailable } from '@/components/app/AppPage';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'RFQs' };

export default function Page() {
  return (
    <AppPage title="RFQs">
      <NotYetAvailable
        icon="file"
        title="Quotation requests are not available yet"
        actions={
          <>
            <Button href="/products" variant="primary" size="sm">
              Find products
            </Button>
          </>
        }
      >
        Requests for quotation you send to suppliers, and requests your company receives, will be
        managed here.
      </NotYetAvailable>
    </AppPage>
  );
}
