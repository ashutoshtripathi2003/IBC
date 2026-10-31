import { ConnectSection } from './ConnectSection';
import { DiscoverSection } from './DiscoverSection';
import { FinalCta } from './FinalCta';
import { GlobalSection, type Capabilities } from './GlobalSection';
import { Hero } from './Hero';
import { IntelligenceSection } from './IntelligenceSection';
import { NetworkSection } from './NetworkSection';
import { ProblemSection } from './ProblemSection';
import { Chapter, StoryStage } from './StoryStage';
import { TradeSection } from './TradeSection';
import { TrustSection } from './TrustSection';

/** The home page as one continuous story over a single network stage. */
export function HomeStory({ capabilities }: { capabilities: Capabilities }) {
  return (
    <StoryStage>
      <Chapter scene="formation" name="hero">
        <Hero />
      </Chapter>
      <Chapter scene="fragmented" name="problem">
        <ProblemSection />
      </Chapter>
      <Chapter scene="woven" name="network">
        <NetworkSection />
      </Chapter>
      <Chapter scene="discover" name="discover">
        <DiscoverSection />
      </Chapter>
      <Chapter scene="connect" name="connect">
        <ConnectSection />
      </Chapter>
      <Chapter scene="trade" name="trade">
        <TradeSection />
      </Chapter>
      <Chapter scene="trust" name="trust">
        <TrustSection />
      </Chapter>
      <Chapter scene="intelligence" name="intelligence">
        <IntelligenceSection />
      </Chapter>
      <Chapter scene="global" name="global">
        <GlobalSection capabilities={capabilities} />
      </Chapter>
      <Chapter scene="formation" name="final">
        <FinalCta />
      </Chapter>
    </StoryStage>
  );
}
