import { AppPage, NotYetAvailable } from '@/components/app/AppPage';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Businesses' };

export default function Page() {
  return (
    <AppPage title="Businesses">
      <NotYetAvailable
        icon="building"
        title="Company pages are not available yet"
        actions={
          <>
            <Button href="/businesses" variant="primary" size="sm">
              Browse businesses
            </Button>
          </>
        }
      >
        You will be able to create your company page, invite colleagues and manage what your
        business makes and offers.
      </NotYetAvailable>
    </AppPage>
  );
}
