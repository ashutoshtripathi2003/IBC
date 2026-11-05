import { AppPage, NotYetAvailable } from '@/components/app/AppPage';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Products' };

export default function Page() {
  return (
    <AppPage title="Products">
      <NotYetAvailable
        icon="box"
        title="Product listings are not available yet"
        actions={
          <>
            <Button href="/products" variant="primary" size="sm">
              Browse the marketplace
            </Button>
          </>
        }
      >
        Your company will list products here with specifications, pricing, minimum order quantities
        and availability.
      </NotYetAvailable>
    </AppPage>
  );
}
