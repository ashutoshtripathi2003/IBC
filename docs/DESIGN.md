# Design system and website

The public website lives in `apps/web` (Next.js App Router, React 19, TypeScript). This
document records the design decisions so the same system carries into the IBC product.

## Concept: the Circle

India's oldest global trade was cloth. IBC's visual identity treats the business network as
woven fabric: people, companies and products are **knots**, relationships are **threads**,
and business moving between them is the **shuttle** (marigold lights). In the hero the
network is woven into a **ring**, the _Circle_ in Indian Business Circle. A single living
network sits behind the home page and re-weaves itself chapter by chapter.

That network is the one bold element. Everything around it stays quiet: one typeface,
left-aligned text, generous space, no decorative gradients or card grids.

## Tokens (`apps/web/src/styles/tokens.css`)

| Token                       | Value                 | Meaning                                                   |
| --------------------------- | --------------------- | --------------------------------------------------------- |
| Indigo night `--indigo-950` | `#0a0f2e`             | Page background (a saturated blue, not tinted black)      |
| Indigo deep `--indigo-800`  | `#141b4a`             | Surfaces                                                  |
| Periwinkle                  | `#8c9bff`             | People, links                                             |
| Marigold                    | `#f4a62a`             | Commerce, primary action, focus ring                      |
| Jade                        | `#39c2a0`             | Trust and verification **only**                           |
| Rose                        | `#ff7a90`             | Opportunities                                             |
| Chalk                       | `#eef0fa`             | Text, companies                                           |
| Mist / Haze                 | `#a9b1dc` / `#8790c4` | Secondary / tertiary text (both ≥ 4.5:1 on every surface) |

Colour encodes meaning, so it is never used decoratively: a jade element always means
verified; marigold always means action or money.

**Type:** one family, Schibsted Grotesk (variable, self-hosted via `@fontsource-variable`, no
third-party font requests). Scale: display, headline, subheadline, lead, body, label, meta.
Display sizes are heavy and tightly tracked; body text stays ≤ 34rem per line.

**Shape:** controls are pills; product surfaces have a 2px top "thread" in their node colour;
radii vary by role rather than one radius everywhere.

## Motion rules

1. One orchestrated opening: the logo ties itself (≤ 1 s, once per session, never with
   reduced motion), then the headline rises word by word.
2. Scroll drives the network's scene changes; text never animates on every section.
3. Motion answers actions: buttons lean toward the pointer (magnetic, fine pointers only),
   the connect button confirms, the menu unfolds.
4. Only `transform` and `opacity` are animated in the DOM; the network is one canvas.
5. Above-the-fold entrances are CSS (they start at first paint, independent of hydration).
   Scroll reveals use `useReveal`, which only hides content after hydration while it is
   still off-screen, so server HTML is always fully visible.
6. `prefers-reduced-motion`: no intro, no entrances, no idle network motion (a single static
   frame per scene), no horizontal scroll sequence (it becomes a list), zero animation delays.

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

UI: `Button` (primary / secondary / quiet), `Heading`, `Text`, `Container`, `Section`, `Card`,
`Badge`, `Tag`, `Modal` (native `<dialog>`), `LoadingState`, `AnimatedCounter`, `RevealText`.
Layout: `Navbar` (transparent → solid on scroll; animated, focus-trapped mobile menu),
`Footer`, `Cursor` (a soft ring that trails the native cursor; fine pointers only), `Intro`,
`AnalyticsBoot`. Cards: `ProfileCard`, `CompanyCard`, `ProductCard`, `SearchPreview`.
Story: one component per chapter, composed in `HomeStory` over a single `StoryStage`.

Content lives in `src/content` (`site.ts`, `examples.ts`), not in components.

## Honesty rules for the website

- No invented member counts, testimonials, logos or press.
- Numbers shown are real platform capabilities computed from the same validation the API
  uses (`@ibc/kernel`): 250 countries/territories, the IANA time zones, every ISO currency.
- Interface previews use example names and say so in a caption.
- IBC is pre-launch: Join and Log in pages state that accounts open first in Maharashtra.

## Quality gates (website)

- Unit tests (Vitest): graph, scenes, analytics, capability counts.
- End-to-end (Playwright, desktop 1440×900 and phone 360×780): every page renders with one
  `h1`, no console errors and no horizontal overflow; **axe WCAG 2.1 AA** has no serious or
  critical violations; navigation, mobile menu focus trap, Escape, skip link, legend dialog,
  reduced motion, analytics events, SEO metadata, robots, sitemap, Open Graph image, security
  headers, 404.
- Measured (local, phone viewport, 4× CPU throttle): LCP ≈ 0.55 s, CLS 0, network animation
  ~30 fps under throttling; ≈ 200 KB gzipped JS (React, Next.js, Motion).

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
IBC_STATIC_EXPORT=1 npx next build --webpack
node scripts/build-preview.mjs   # writes out/preview.html (~1 MB, no network requests)
```

All scripts, styles and fonts are inlined. Links to other pages show a notice, because only
the home page is included. This is a preview aid only; the production build is unchanged.
