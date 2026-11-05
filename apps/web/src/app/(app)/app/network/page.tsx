import { AppPage, NotYetAvailable } from '@/components/app/AppPage';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'My Network' };

export default function Page() {
  return (
    <AppPage title="My Network">
      <NotYetAvailable
        icon="users"
        title="Connections are not available yet"
        actions={
          <>
            <Button href="/network" variant="primary" size="sm">
              Browse professionals
            </Button>
          </>
        }
      >
        Your connections with professionals and companies will appear here, with requests you have
        sent and received.
      </NotYetAvailable>
    </AppPage>
  );
}
