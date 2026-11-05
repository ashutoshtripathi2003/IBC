# Design system and website

The public website lives in `apps/web` (Next.js App Router, React 19, TypeScript). This
document records the design decisions so the same system carries into the IBC product.

## Direction: an enterprise industrial network

IBC — Industrial Business Circle is a working B2B platform, so the site reads like one:
light surfaces, dense but calm information, clear actions. It combines professional
networking (people, roles, connections) with product and supplier discovery (catalogue,
specifications, minimum order, quotations), with its own identity rather than any other
platform's look. The brand mark is the founder's logo (navy and gold: gear, orbit, globe,
factory skyline), stored in `public/brand/` (a dark-on-light and a light-on-navy variant).
The logo carries the ® symbol at the founder's instruction (2026-11-05), who confirmed the
mark is registered.

The one expressive element is the network visual in the hero (the woven ring, the _Circle_);
everything else is product UI.

## Tokens (`apps/web/src/styles/tokens.css`)

| Token                        | Value         | Meaning                                                                    |
| ---------------------------- | ------------- | -------------------------------------------------------------------------- |
| Deep navy `--navy-900`       | `#10243e`     | Brand, primary actions, headings, footer                                   |
| Industrial gold `--gold-500` | `#c49a42`     | Accent: Join, highlights, focus; `--gold-text` `#7d5f1f` for text on light |
| Warm white `--warm-white`    | `#f7f8fa`     | Page background                                                            |
| White `--white`              | `#ffffff`     | Cards and panels                                                           |
| Graphite `--graphite`        | `#303846`     | Body text                                                                  |
| Muted `--muted`              | `#5f6b7b`     | Secondary text (darkened from `#697586` to pass 4.5:1 on warm white)       |
| Border `--border`            | `#e5e9ef`     | Dividers, card outlines                                                    |
| `--verified`                 | success green | Verification **only**, shown only for genuinely verified records           |

Colour carries meaning: green only ever means verified; gold means action, money or emphasis.

**Type:** one family, IBM Plex Sans (variable, self-hosted via `@fontsource-variable`, no
third-party requests) — a technical, industrial sans that stays readable in dense tables.
Scale `--text-xs` … `--text-4xl`; the hero headline is capped so it stays on two lines.

**Shape:** 6–12px radii, 1px borders first, soft shadows only on hover/raised surfaces.

## Information architecture

Public: Home · Discover (`/discover`, industries) · Industries (`/industries/[slug]`) ·
Businesses (+ profile) · Products (marketplace + detail) · Services · Network (people +
profile) · Opportunities · Search (`/search`) · About · Join · Log in.
People and companies are separate entities; a person can hold several roles (company or
other organisation). The signed-in app shell (Dashboard, My Network, RFQs, Messages,
Notifications, Profile, Settings) is a separate, later stage.

## Accounts and the signed-in app

Join and Log in show real forms when accounts are available (the server has `IBC_API_URL`),
otherwise the pre-launch message (also what renders without JavaScript). Forms use visible
labels, inline field errors from the API's `errors[]`, plain-language messages for each error
code, and a show/hide password toggle. Recovery pages: `/forgot-password`, `/reset-password`,
`/verify-email` (tokens read from the URL fragment).

`/app` is the signed-in workspace: a top bar (brand, member, Log out) and a sidebar
(Dashboard, My Network, Discover, Businesses, Products, RFQs, Messages, Opportunities,
Notifications, My Profile, Settings) that becomes a scrolling tab strip on phones. Settings
(account details, email confirmation, devices/sessions) and the dashboard work today; the
other sections state plainly what will be there and link to the public directory — no
invented data.

## Data and search

- `src/content/catalog/` holds typed **demo** records (industries, companies, products,
  people, services, opportunities). Every company, product, person and opportunity is
  `demo: true` and `verified: false`, and the UI marks each with a Demo badge. Prices use
  kernel `Money` (integer minor units + ISO 4217); locations use ISO 3166-1 codes.
- `lib/search`: client-side index over the catalogue; every query token must match; ranking
  exact > prefix > substring with field weights; scopes (all, product, company, manufacturer,
  supplier, person, service, opportunity), industry/country filters, sort; suggestions
  (industries first). It is replaced by the API search service when the catalogue moves to
  the backend; the components only depend on its result shape.
- Listing pages use `Explorer` (URL-synced filters: industry, country, type, price; sort;
  grid/list for products; empty state with a reset).

## Motion rules

1. Motion is functional: hover elevation, the Discover panel, the mobile menu, a 0.25s page
   fade, scroll-linked section reveals (CSS scroll timelines, content visible without them).
2. Only `transform` and `opacity` animate; the network is one canvas.
3. `prefers-reduced-motion`: durations and delays are zeroed and the network shows a static
   frame. Content never depends on JavaScript to become visible.

Shared values: `lib/motion` (easings, durations, springs, hooks).

## The network engine (`components/network`)

Framework-agnostic TypeScript, wrapped by the `<NetworkGraph>` React component so it can be
reused in the product (e.g. a member's own network view).

- `engine/graph.ts`: deterministic (seeded) graph of people, companies, products, services and
  opportunities; local threads within ecosystems, cross threads between them, a trade path.
- `engine/scenes.ts`: declarative scenes (`formation` ring, `fragmented`, `woven` loom,
  `discover`, `connect`, `trade`, `trust`, `intelligence`, `global`, `focus`).
- `engine/renderer.ts`: Canvas 2D, pseudo-3D projection. It eases toward each scene's targets;
  threads are drawn in, long threads fade, shuttles travel along threads, nodes respond to
  hover. Device pixel ratio is capped; node count scales with viewport; the loop pauses when
  the tab is hidden (and, inline, when off-screen).
- WebGL/Three.js was deliberately not used: Canvas 2D gives the effect at ~0 KB of library
  code and runs on mid-range phones. Without canvas or JavaScript the page reads completely;
  the canvas is `aria-hidden` and everything it shows is also stated in text.

## Components

UI: `Button` (primary navy / accent gold / secondary / ghost), `Badge` (verified / demo /
neutral / gold), `DemoBadge`, `Tag`, `Icon` (line icons for industries and UI), `Monogram`,
`Modal`, `ResultSkeleton`. Layout: `Navbar` (Discover panel, search, Log in, Join IBC;
focus-trapped mobile menu), `Footer`, `Brand`. Search: `SearchBox` (WAI-ARIA combobox with
scopes and suggestions), `SearchResults`. Catalogue: `CompanyCard`, `ProductCard`,
`PersonCard`, `ServiceCard`, `OpportunityCard`, `IndustryCard`, `ProductVisual`, `Grid`,
`PageSection`. Explore: `Explorer`, `PageHeader`. Home: `Hero`, `HomeSections`.

Actions that need an account (Request quotation, Connect, Message, Respond) go to
`/join?intent=…`, which explains that the action opens with accounts at launch.

## Honesty rules for the website

- No invented member counts, statistics, testimonials, ratings, customers, logos or press.
- Every listing is a labelled demo; nothing shows a Verified badge until verification exists.
- Product image areas show the industry icon on a technical grid, not stock photos, until
  suppliers upload photos. Demo prices are marked as illustrative.
- IBC is pre-launch: Join and Log in pages say so.

## Quality gates (website)

- Unit tests (Vitest): graph, scenes, analytics, search.
- End-to-end (Playwright, desktop 1440×900 and phone 360×780): 16 representative pages
  (every section plus each detail type) render with one `h1`, no console errors, no
  horizontal overflow and no serious/critical **axe WCAG 2.1 AA** violations; hero search
  autocomplete and keyboard, search scopes and empty state, marketplace filters and URL
  sync, product detail → supplier, quotation intent, Discover menu, mobile menu focus trap,
  skip link, reduced motion, analytics, SEO metadata, robots, sitemap, Open Graph image,
  security headers, 404.

## Analytics

`lib/analytics` is vendor-neutral: typed events (`page_view`, `cta_click`, `join_click`,
`login_click`, `nav_click`, `section_view`, `pillar_explore`, `network_interaction`,
`signup_start`) go to registered providers. Today: a DOM event (`ibc:analytics`, for tests and
tag managers) and a console logger in development. A vendor is added as one provider.
**No vendor has been chosen** (founder decision).

## Single-file preview

For sharing a live preview where only one file can be hosted (for example a private Claude
Artifact), build a self-contained copy of the home page:

```sh
cd apps/web
pnpm build:export                # static export; account endpoints are left out
node scripts/build-preview.mjs   # writes out/preview.html (~1 MB, no network requests)
```

All scripts, styles and fonts are inlined. Links to other pages show a notice, because only
the home page is included. This is a preview aid only; the production build is unchanged.
