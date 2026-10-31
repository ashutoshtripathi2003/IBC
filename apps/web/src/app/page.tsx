import { HomeStory } from '@/components/story/HomeStory';
import { platformCapabilities } from '@/lib/platform/capabilities';

export default function HomePage() {
  // Computed at build time from the shared validation used by the API.
  const { countries, timeZones } = platformCapabilities();
  return <HomeStory capabilities={{ countries, timeZones }} />;
}
