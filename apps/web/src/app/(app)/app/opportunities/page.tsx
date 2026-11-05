import { AppPage, NotYetAvailable } from '@/components/app/AppPage';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Opportunities' };

export default function Page() {
  return (
    <AppPage title="Opportunities">
      <NotYetAvailable
        icon="briefcase"
        title="Opportunities are not available yet"
        actions={
          <>
            <Button href="/opportunities" variant="primary" size="sm">
              Browse opportunities
            </Button>
          </>
        }
      >
        Tenders, partnership requests and other opportunities you follow or respond to will appear
        here.
      </NotYetAvailable>
    </AppPage>
  );
}
