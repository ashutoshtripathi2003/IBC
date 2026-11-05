import { AppPage, NotYetAvailable } from '@/components/app/AppPage';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Discover' };

export default function Page() {
  return (
    <AppPage title="Discover">
      <NotYetAvailable
        icon="search"
        title="Personalised discovery opens with profiles"
        actions={
          <>
            <Button href="/search" variant="primary" size="sm">
              Search IBC
            </Button>
            <Button href="/discover" variant="secondary" size="sm">
              Browse industries
            </Button>
          </>
        }
      >
        Recommendations based on your industries and interests will appear here. Until then, search
        the directory.
      </NotYetAvailable>
    </AppPage>
  );
}
