import {
  CompanyCard,
  IndustryCard,
  OpportunityCard,
  PersonCard,
  ProductCard,
} from '@/components/catalog/cards';
import { Grid } from '@/components/catalog/Grid';
import { PageSection } from '@/components/catalog/PageSection';
import { Hero } from '@/components/home/Hero';
import { DemoNotice, HowItWorks, JoinBand, TrustPoints } from '@/components/home/HomeSections';
import { companies, industries, opportunities, people, products } from '@/content/catalog';

export default function HomePage() {
  return (
    <>
      <Hero />
      <PageSection
        id="industries"
        title="Explore industries"
        intro="From chemicals to logistics, find the companies, products and people in your sector."
        action={{ href: '/discover', label: 'All industries' }}
      >
        <Grid min={13.5} compact>
          {industries.map((industry) => (
            <IndustryCard key={industry.slug} industry={industry} />
          ))}
        </Grid>
      </PageSection>
      <PageSection
        id="businesses"
        tone="white"
        title="Manufacturers, suppliers and service firms"
        intro="Company profiles describe what a business makes, where it operates and who to talk to."
        action={{ href: '/businesses', label: 'Browse businesses' }}
      >
        <DemoNotice />
        <Grid min={20}>
          {companies.slice(0, 6).map((company) => (
            <CompanyCard key={company.slug} company={company} />
          ))}
        </Grid>
      </PageSection>
      <PageSection
        id="products"
        title="Industrial products"
        intro="Specifications, pricing, minimum order and origin, with a quotation request one click away."
        action={{ href: '/products', label: 'Open the marketplace' }}
      >
        <Grid min={16}>
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </Grid>
      </PageSection>
      <PageSection
        id="network"
        tone="white"
        title="A professional network built around business"
        intro="People and companies are linked: see someone’s role, their company and what they trade."
        action={{ href: '/network', label: 'Meet professionals' }}
      >
        <Grid min={17}>
          {people.slice(0, 4).map((person) => (
            <PersonCard key={person.slug} person={person} />
          ))}
        </Grid>
      </PageSection>
      <PageSection
        id="opportunities"
        title="Opportunities"
        intro="Requests for quotation, distributor searches and partnerships from across the network."
        action={{ href: '/opportunities', label: 'All opportunities' }}
      >
        <Grid min={20}>
          {opportunities.slice(0, 3).map((opportunity) => (
            <OpportunityCard key={opportunity.slug} opportunity={opportunity} />
          ))}
        </Grid>
      </PageSection>
      <PageSection
        id="how"
        tone="white"
        title="How IBC works"
        intro="One place for the whole life of a business relationship."
      >
        <HowItWorks />
      </PageSection>
      <PageSection
        id="trust"
        tone="navy"
        title="Know who you are doing business with"
        intro="Trust is designed in, not added later."
      >
        <TrustPoints />
      </PageSection>
      <JoinBand />
    </>
  );
}
