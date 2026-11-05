import Link from 'next/link';
import { PATHS } from '@/components/ui/Icon';
import { companies, industries, products, type Industry } from '@/content/catalog';
import { ChaptersMotion } from './ChaptersMotion';
import styles from './Industries.module.css';

const TONES = ['ink', 'navy', 'charcoal'] as const;

/** An engraved "technical plate" of the industry's mark: rings, ticks, grid and label. */
function Plate({ industry, index }: { industry: Industry; index: number }) {
  let minor = '';
  let major = '';
  for (let i = 0; i < 72; i += 1) {
    const a = (i / 72) * Math.PI * 2;
    const r2 = i % 6 === 0 ? 222 : 230;
    const seg = `M${(300 + Math.cos(a) * 238).toFixed(1)} ${(300 + Math.sin(a) * 238).toFixed(1)}L${(300 + Math.cos(a) * r2).toFixed(1)} ${(300 + Math.sin(a) * r2).toFixed(1)}`;
    if (i % 6 === 0) major += seg;
    else minor += seg;
  }
  return (
    <svg className={styles.plate} viewBox="0 0 600 600" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={`grid-${index}`} width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M30 0H0V30" fill="none" stroke="currentColor" strokeOpacity="0.07" />
        </pattern>
        <radialGradient id={`glow-${index}`}>
          <stop offset="0" stopColor="#c49a42" stopOpacity="0.22" />
          <stop offset="1" stopColor="#c49a42" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="600" height="600" fill={`url(#grid-${index})`} />
      <circle cx="300" cy="300" r="250" fill={`url(#glow-${index})`} />
      <g data-plate-ring className={styles.ring}>
        <circle cx="300" cy="300" r="238" fill="none" stroke="currentColor" strokeOpacity="0.28" />
        <circle
          cx="300"
          cy="300"
          r="200"
          fill="none"
          stroke="#c49a42"
          strokeOpacity="0.55"
          strokeDasharray="2 6"
        />
        <path d={minor} stroke="currentColor" strokeOpacity="0.22" />
        <path d={major} stroke="currentColor" strokeOpacity="0.5" />
      </g>
      <path
        d="M300 40V90M300 510V560M40 300H90M510 300H560"
        stroke="currentColor"
        strokeOpacity="0.35"
      />
      <g data-plate-mark transform="translate(156 156) scale(12)">
        <path
          d={PATHS[industry.icon]}
          fill="none"
          stroke="#c49a42"
          strokeOpacity={0.25}
          strokeWidth={0.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(0.25 0.35)"
        />
        <path
          d={PATHS[industry.icon]}
          fill="none"
          stroke="#d4b06a"
          strokeWidth={0.16}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <text x="300" y="586" textAnchor="middle" className={styles.plateLabel}>
        {`PLATE ${String(index + 1).padStart(2, '0')} · ${industry.name.toUpperCase()}`}
      </text>
    </svg>
  );
}

/** Scene 03 — "The industries that move the world": one chapter per industry. */
export function IndustryChapters() {
  return (
    <ChaptersMotion className={styles.scene} trackClass={styles.track} stageClass={styles.stage}>
      <article className={`${styles.panel} ${styles.intro}`}>
        <div className={styles.introInner}>
          <p className={`eyebrow ${styles.eyebrow}`}>Fifteen chapters</p>
          <h2 id="industries-title" className={`display ${styles.introTitle}`}>
            The industries that <span className={styles.gold}>move the world.</span>
          </h2>
          <p className={styles.introText}>
            From molecules to megastructures. Each industry on IBC has its own companies, products,
            people and opportunities.
          </p>
          <p className={styles.hint} aria-hidden="true">
            Keep scrolling <span>→</span>
          </p>
        </div>
      </article>
      {industries.map((industry, i) => {
        const productCount = products.filter((p) => p.industry === industry.slug).length;
        const companyCount = companies.filter((c) => c.industries.includes(industry.slug)).length;
        return (
          <article
            key={industry.slug}
            className={`${styles.panel} ${styles[TONES[i % TONES.length]!]} ${i % 2 ? styles.flip : ''}`}
            aria-labelledby={`chapter-${industry.slug}`}
          >
            <span className={styles.ghost} aria-hidden="true">
              {industry.name}
            </span>
            <div className={styles.chapterText}>
              <p className={styles.chapterNum}>
                <span>{String(i + 1).padStart(2, '0')}</span> / {industries.length}
              </p>
              <h3 id={`chapter-${industry.slug}`} className={`display ${styles.chapterName}`}>
                {industry.name}
              </h3>
              <ul className={styles.segments}>
                {industry.segments.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              {(productCount > 0 || companyCount > 0) && (
                <p className={styles.counts}>
                  {companyCount > 0 &&
                    `${companyCount} demo ${companyCount === 1 ? 'company' : 'companies'}`}
                  {companyCount > 0 && productCount > 0 && ' · '}
                  {productCount > 0 &&
                    `${productCount} demo ${productCount === 1 ? 'product' : 'products'}`}
                </p>
              )}
              <Link href={`/industries/${industry.slug}`} className={styles.explore}>
                Explore {industry.name.toLowerCase()} <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className={styles.plateWrap}>
              <Plate industry={industry} index={i} />
            </div>
          </article>
        );
      })}
    </ChaptersMotion>
  );
}
