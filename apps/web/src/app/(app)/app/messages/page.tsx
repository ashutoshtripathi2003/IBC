import { AppPage, NotYetAvailable } from '@/components/app/AppPage';

export const metadata = { title: 'Messages' };

export default function Page() {
  return (
    <AppPage title="Messages">
      <NotYetAvailable icon="message" title="Messaging is not available yet">
        Conversations with your connections, suppliers and buyers will appear here.
      </NotYetAvailable>
    </AppPage>
  );
}
