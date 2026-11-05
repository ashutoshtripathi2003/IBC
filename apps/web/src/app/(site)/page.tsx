import { DiscoveryScene } from '@/components/cinema/DiscoveryScene';
import { EcosystemScene } from '@/components/cinema/EcosystemScene';
import { FinaleScene } from '@/components/cinema/FinaleScene';
import { GlobeScene } from '@/components/cinema/globe/GlobeScene';
import { CinematicHero } from '@/components/cinema/Hero';
import { IndustryChapters } from '@/components/cinema/industries/IndustryChapters';
import { MarketplaceScene } from '@/components/cinema/MarketplaceScene';
import { PeopleScene } from '@/components/cinema/PeopleScene';

/**
 * The homepage is one continuous story (docs/DESIGN.md → Homepage storyboard):
 * 01 industry · 02 the connected world · 03 industries · 04 people · 05 the ecosystem ·
 * 06 the marketplace · 07 where business happens · 08 the connected future.
 */
export default function HomePage() {
  return (
    <>
      <CinematicHero />
      <GlobeScene />
      <IndustryChapters />
      <PeopleScene />
      <EcosystemScene />
      <MarketplaceScene />
      <DiscoveryScene />
      <FinaleScene />
    </>
  );
}
