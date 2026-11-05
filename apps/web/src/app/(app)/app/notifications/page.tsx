import { AppPage, NotYetAvailable } from '@/components/app/AppPage';

export const metadata = { title: 'Notifications' };

export default function Page() {
  return (
    <AppPage title="Notifications">
      <NotYetAvailable icon="bell" title="No notifications">
        You will be notified here about connection requests, messages, quotations and account
        security.
      </NotYetAvailable>
    </AppPage>
  );
}
