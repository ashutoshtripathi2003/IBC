import { SearchPreview } from '@/components/cards/SearchPreview';
import { Section } from '@/components/ui/Section';
import styles from './split.module.css';
import story from './story.module.css';

export function DiscoverSection() {
  return (
    <Section id="discover" labelledBy="discover-title" align="wide">
      <div className={styles.split}>
        <div>
          <h2 id="discover-title" className={story.title}>
            Find what you need by describing it.
          </h2>
          <p className={story.body}>
            Search across people, companies, products and services at once. Ask the way you would
            ask a colleague, and IBC finds the businesses that fit, with the person to talk to.
          </p>
        </div>
        <SearchPreview />
      </div>
    </Section>
  );
}
