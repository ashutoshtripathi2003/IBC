import styles from '@/components/explore/detail.module.css';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <SiteChrome>
      <PageHeader
        title="Page not found"
        intro="The page may have moved, or the link may be mistyped."
      />
      <PageBody>
        <div className={styles.actions}>
          <Button href="/">Go to the home page</Button>
          <Button href="/search" variant="secondary">
            Search IBC
          </Button>
        </div>
      </PageBody>
    </SiteChrome>
  );
}
