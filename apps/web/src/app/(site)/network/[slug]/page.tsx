import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from '@/components/explore/detail.module.css';
import { PageBody, PageHeader } from '@/components/explore/PageHeader';
import { DemoBadge, Tag } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Monogram } from '@/components/ui/Monogram';
import { companyBySlug, industryBySlug, people, personBySlug } from '@/content/catalog';
import { formatLocation } from '@/lib/geo';
import { pageMetadata } from '@/lib/seo';

export const dynamicParams = false;
export const generateStaticParams = () => people.map((p) => ({ slug: p.slug }));

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const person = personBySlug((await params).slug);
  return person
    ? pageMetadata({
        title: person.name,
        description: person.headline,
        path: `/network/${person.slug}`,
      })
    : {};
}

export default async function PersonPage({ params }: { params: Params }) {
  const person = personBySlug((await params).slug);
  if (!person) notFound();

  return (
    <>
      <PageHeader
        title={person.name}
        crumbs={[
          { href: '/network', label: 'Network' },
          { href: `/network/${person.slug}`, label: person.name },
        ]}
      >
        <div className={styles.profileHead}>
          <Monogram name={person.name} size={76} shape="circle" />
          <div className={styles.profileText}>
            <p className={styles.roleTitle}>{person.headline}</p>
            <p className={styles.profileMeta}>
              <span>
                <Icon name="pin" size={15} />
                {formatLocation(person.location)}
              </span>
              {person.demo && <DemoBadge />}
            </p>
          </div>
          <div className={styles.actions}>
            <Button href={`/join?intent=connect&person=${person.slug}`}>Connect</Button>
            <Button href={`/join?intent=message&person=${person.slug}`} variant="secondary">
              Message
            </Button>
          </div>
        </div>
      </PageHeader>
      <PageBody>
        <div className={styles.layout}>
          <div className={styles.mainCol}>
            <section className={styles.panel} aria-labelledby="about-title">
              <h2 id="about-title" className={styles.panelTitle}>
                About
              </h2>
              <p className={styles.prose}>{person.about}</p>
            </section>
            <section className={styles.panel} aria-labelledby="roles-title">
              <h2 id="roles-title" className={styles.panelTitle}>
                Roles
              </h2>
              <ul className={styles.roles}>
                {person.roles.map((role) => {
                  const company = role.companySlug ? companyBySlug(role.companySlug) : undefined;
                  const org = company?.name ?? role.organisation ?? '';
                  return (
                    <li key={`${role.title}-${org}`} className={styles.role}>
                      <Monogram name={org || role.title} size={44} />
                      <div>
                        <p className={styles.roleTitle}>{role.title}</p>
                        <p className={styles.roleOrg}>
                          {company ? (
                            <Link href={`/businesses/${company.slug}`}>{company.name}</Link>
                          ) : (
                            org
                          )}
                        </p>
                        <p className={styles.note}>{role.current ? 'Current' : 'Previous'}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
            <section className={styles.panel} aria-labelledby="posts-title">
              <h2 id="posts-title" className={styles.panelTitle}>
                Posts
              </h2>
              <p className={styles.emptySmall}>
                No posts yet. Professional posts will appear here once members start sharing.
              </p>
            </section>
          </div>
          <aside className={styles.sideCol} aria-label="Expertise and interests">
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Expertise</h2>
              <div className={styles.tags}>
                {person.expertise.map((e) => (
                  <Tag key={e}>{e}</Tag>
                ))}
              </div>
            </div>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Business interests</h2>
              <div className={styles.tags}>
                {person.interests.map((e) => (
                  <Tag key={e}>{e}</Tag>
                ))}
              </div>
            </div>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Industries</h2>
              <div className={styles.tags}>
                {person.industries.map((i) => (
                  <Tag key={i}>{industryBySlug(i)?.name}</Tag>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </PageBody>
    </>
  );
}
