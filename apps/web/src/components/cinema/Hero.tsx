import Link from 'next/link';
import { HeroMotion } from './HeroMotion';
import { skylineLayer, type SkylineLayer } from './skyline';
import styles from './Hero.module.css';

const W = 2000;
const H = 1000;

/** Layers from far (hazy, small) to near (dark, large). Fixed seeds: a composed frame. */
const LAYERS: { name: string; layer: SkylineLayer; fill: string; lightOpacity: number }[] = [
  {
    name: 'far',
    layer: skylineLayer(11, W, 735, 0.5, 46, 520),
    fill: 'url(#hz-far)',
    lightOpacity: 0.45,
  },
  {
    name: 'mid',
    layer: skylineLayer(23, W, 830, 0.92, 150, 1180),
    fill: 'url(#hz-mid)',
    lightOpacity: 0.85,
  },
  {
    name: 'near',
    layer: skylineLayer(47, W, 990, 2.2, 200),
    fill: 'url(#hz-near)',
    lightOpacity: 1,
  },
];

function Lights({ layer, opacity }: { layer: SkylineLayer; opacity: number }) {
  return (
    <g opacity={opacity}>
      {layer.lights.map((l, i) => (
        <circle
          key={i}
          cx={l.x}
          cy={l.y}
          r={l.kind === 'beacon' ? l.r * 1.4 : l.r}
          className={l.kind === 'beacon' ? styles.beacon : styles.work}
          style={{ animationDelay: `${(i * 0.37) % 3}s` }}
        />
      ))}
    </g>
  );
}

/**
 * Scene 01 — "The world runs on industry". A dusk refinery rendered as layered
 * silhouettes (server-side SVG), with flare light, steam and work lights. The entrance is
 * CSS (it starts at first paint); scroll and pointer depth are added by <HeroMotion>.
 */
export function CinematicHero() {
  return (
    <HeroMotion className={styles.hero}>
      <div className={styles.sky} data-depth="sky" aria-hidden="true" />
      <div className={styles.sun} data-depth="sun" aria-hidden="true" />
      <svg
        className={styles.scape}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="hz-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4d5a6c" />
            <stop offset="0.8" stopColor="#3a4659" />
          </linearGradient>
          <linearGradient id="hz-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.1" stopColor="#1c2a3f" />
            <stop offset="0.9" stopColor="#0f1a2b" />
          </linearGradient>
          <linearGradient id="hz-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.3" stopColor="#070d18" />
            <stop offset="1" stopColor="#03060b" />
          </linearGradient>
          <radialGradient id="flare-glow">
            <stop offset="0" stopColor="#ffe2a6" stopOpacity="0.95" />
            <stop offset="0.25" stopColor="#e0a347" stopOpacity="0.45" />
            <stop offset="1" stopColor="#c49a42" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="steam">
            <stop offset="0" stopColor="#c9cfd8" stopOpacity="0.14" />
            <stop offset="1" stopColor="#c9cfd8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ground-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d9c7a0" stopOpacity="0" />
            <stop offset="0.55" stopColor="#d9c7a0" stopOpacity="0.16" />
            <stop offset="1" stopColor="#d9c7a0" stopOpacity="0" />
          </linearGradient>
        </defs>
        {LAYERS.map(({ name, layer, fill, lightOpacity }, index) => (
          <g key={name} data-depth={name}>
            <g className={styles.layer} style={{ animationDelay: `${0.15 + index * 0.18}s` }}>
              {(name === 'mid' ? layer.plumes : []).map((p, i) => (
                <ellipse
                  key={`p${i}`}
                  className={styles.steam}
                  cx={p.x}
                  cy={p.y - p.w * 0.5}
                  rx={p.w * 0.8}
                  ry={p.w * 0.55}
                  fill="url(#steam)"
                  style={{ animationDelay: `${i * 1.7}s` }}
                />
              ))}
              {layer.flares.map((fl, i) => (
                <g key={`f${i}`} className={styles.flare}>
                  <circle
                    cx={fl.x}
                    cy={fl.y - 18}
                    r={170}
                    fill="url(#flare-glow)"
                    className={styles.flareGlow}
                  />
                  <path
                    className={styles.flame}
                    d={`M${fl.x - 7} ${fl.y}C${fl.x - 10} ${fl.y - 24} ${fl.x - 2} ${fl.y - 36} ${fl.x + 1} ${fl.y - 58}C${fl.x + 4} ${fl.y - 34} ${fl.x + 11} ${fl.y - 22} ${fl.x + 7} ${fl.y}Z`}
                    style={{ transformOrigin: `${fl.x}px ${fl.y}px` }}
                  />
                </g>
              ))}
              <path d={layer.d} fill={fill} />
              <Lights layer={layer} opacity={lightOpacity} />
              {index < LAYERS.length - 1 && (
                <rect
                  x="0"
                  y={index === 0 ? 700 : 790}
                  width={W}
                  height="120"
                  fill="url(#ground-haze)"
                />
              )}
            </g>
          </g>
        ))}
      </svg>
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />

      <div className={styles.content} data-depth="content">
        <p className={`eyebrow ${styles.eyebrow}`}>Industrial Business Circle</p>
        <h1 id="hero-title" className={`display ${styles.title}`}>
          <span className="mask-line">
            <span>The world</span>
          </span>
          <span className="mask-line">
            <span>runs on</span>
          </span>
          <span className="mask-line">
            <span className={styles.accentWord}>industry.</span>
          </span>
        </h1>
        <p className={styles.lede}>
          Connecting the people, companies and opportunities that move global business forward.
        </p>
        <div className={styles.actions}>
          <Link href="#discover" className={styles.primary} data-cta="explore">
            Explore IBC
          </Link>
          <Link href="/join" className={styles.secondary} data-cta="join">
            Join IBC
          </Link>
        </div>
      </div>
      <a href="#connections" className={styles.cue}>
        <span>Scroll</span>
        <span className={styles.cueLine} aria-hidden="true" />
      </a>
    </HeroMotion>
  );
}
