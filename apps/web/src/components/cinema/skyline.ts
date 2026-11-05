/**
 * Deterministic industrial skyline generator. Produces SVG path data for silhouette layers
 * (distillation columns, spheres, tanks, flare stacks, cooling towers, lattice towers,
 * chimneys, pipe racks) so the hero "matte painting" renders on the server: crisp at any
 * size, no image download, identical on every render for the same seed.
 */

export interface Light {
  x: number;
  y: number;
  r: number;
  kind: 'work' | 'beacon';
}

export interface SkylineLayer {
  d: string;
  lights: Light[];
  flares: { x: number; y: number }[];
  plumes: { x: number; y: number; w: number }[];
}

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => Math.round(n * 10) / 10;
const rect = (x: number, y: number, w: number, h: number) =>
  `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}z`;

type Rand = () => number;
type Builder = (x: number, base: number, s: number, r: Rand, out: SkylineLayer) => number;

const column: Builder = (x, base, s, r, out) => {
  const w = (14 + r() * 10) * s;
  const h = (170 + r() * 150) * s;
  out.d += rect(x, base - h, w, h) + rect(x - 2 * s, base - h - 6 * s, w + 4 * s, 6 * s);
  for (let y = base - h + 30 * s; y < base - 20 * s; y += (28 + r() * 18) * s) {
    out.d += rect(x - 6 * s, y, w + 12 * s, 2.2 * s);
    if (r() > 0.55) out.lights.push({ x: x + w + 5 * s, y: y - 1.5 * s, r: 1.3 * s, kind: 'work' });
  }
  out.d += rect(x + w, base - h * 0.62, 34 * s, 2 * s);
  if (r() > 0.45)
    out.lights.push({ x: x + w / 2, y: base - h - 9 * s, r: 1.7 * s, kind: 'beacon' });
  return w;
};

const sphere: Builder = (x, base, s, r, out) => {
  const rad = (22 + r() * 14) * s;
  const cy = base - rad - 16 * s;
  out.d += `M${f(x)} ${f(cy)}a${f(rad)} ${f(rad)} 0 1 0 ${f(rad * 2)} 0a${f(rad)} ${f(rad)} 0 1 0 ${f(-rad * 2)} 0z`;
  for (const lx of [0.22, 0.5, 0.78])
    out.d += rect(x + rad * 2 * lx - 1.5 * s, cy, 3 * s, base - cy);
  out.d += rect(x - 4 * s, cy + rad * 0.2, rad * 2 + 8 * s, 1.6 * s);
  out.lights.push({ x: x + rad, y: cy - rad - 3 * s, r: 1.3 * s, kind: 'work' });
  return rad * 2;
};

const tank: Builder = (x, base, s, r, out) => {
  const w = (60 + r() * 50) * s;
  const h = (28 + r() * 26) * s;
  out.d += `M${f(x)} ${f(base)}v${f(-h)}q${f(w / 2)} ${f(-h * 0.3)} ${f(w)} 0v${f(h)}z`;
  // spiral stair hint
  out.d += `M${f(x + w * 0.1)} ${f(base)}L${f(x + w * 0.7)} ${f(base - h)}l${f(2 * s)} 0L${f(x + w * 0.1 + 2 * s)} ${f(base)}z`;
  return w;
};

const flare: Builder = (x, base, s, r, out) => {
  const h = (300 + r() * 110) * s;
  const w = 5 * s;
  out.d += rect(x, base - h, w, h);
  out.d += `M${f(x - 46 * s)} ${f(base)}L${f(x + w / 2)} ${f(base - h * 0.72)}l${f(0.8 * s)} 0L${f(x - 44 * s)} ${f(base)}z`;
  out.d += `M${f(x + 46 * s)} ${f(base)}L${f(x + w / 2)} ${f(base - h * 0.72)}l${f(-0.8 * s)} 0L${f(x + 44 * s)} ${f(base)}z`;
  out.flares.push({ x: x + w / 2, y: base - h });
  out.lights.push({ x: x + w / 2, y: base - h * 0.55, r: 1.8 * s, kind: 'beacon' });
  return w;
};

const cooling: Builder = (x, base, s, r, out) => {
  const w = (90 + r() * 40) * s;
  const h = (110 + r() * 50) * s;
  const k = w * 0.3;
  out.plumes.push({ x: x + w / 2, y: base - h, w: w * 0.66 });
  out.d += `M${f(x)} ${f(base)}C${f(x + k)} ${f(base - h * 0.45)} ${f(x + k * 0.9)} ${f(base - h * 0.8)} ${f(x + w * 0.17)} ${f(base - h)}L${f(x + w * 0.83)} ${f(base - h)}C${f(x + w - k * 0.9)} ${f(base - h * 0.8)} ${f(x + w - k)} ${f(base - h * 0.45)} ${f(x + w)} ${f(base)}z`;
  return w;
};

const lattice: Builder = (x, base, s, r, out) => {
  const w = (26 + r() * 14) * s;
  const h = (140 + r() * 110) * s;
  out.d += rect(x, base - h, 2.4 * s, h) + rect(x + w - 2.4 * s, base - h, 2.4 * s, h);
  const step = 18 * s;
  for (let y = base - h; y < base - step; y += step) {
    out.d += `M${f(x)} ${f(y)}L${f(x + w)} ${f(y + step)}l0 ${f(1.6 * s)}L${f(x)} ${f(y + 1.6 * s)}z`;
    out.d += rect(x, y, w, 1.6 * s);
  }
  out.lights.push({ x: x + w / 2, y: base - h - 3 * s, r: 1.6 * s, kind: 'beacon' });
  return w;
};

const chimney: Builder = (x, base, s, r, out) => {
  const w = (10 + r() * 6) * s;
  const h = (220 + r() * 140) * s;
  out.d += `M${f(x)} ${f(base)}L${f(x + w * 0.15)} ${f(base - h)}h${f(w * 0.7)}L${f(x + w)} ${f(base)}z`;
  for (const k of [0.1, 0.18]) out.d += rect(x + w * 0.05, base - h * (1 - k), w * 0.9, 3 * s);
  out.lights.push({ x: x + w / 2, y: base - h - 3 * s, r: 1.8 * s, kind: 'beacon' });
  return w;
};

const BUILDERS: readonly Builder[] = [
  column,
  column,
  column,
  sphere,
  sphere,
  tank,
  tank,
  cooling,
  lattice,
  chimney,
];

/**
 * One silhouette layer across `width`, standing on `base`. `scale` sets structure size
 * (far layers are smaller); `gap` the average spacing between structures.
 */
export function skylineLayer(
  seed: number,
  width: number,
  base: number,
  scale: number,
  gap: number,
  flareAt?: number,
): SkylineLayer {
  const r = rng(seed);
  const out: SkylineLayer = { d: rect(0, base, width, 600), lights: [], flares: [], plumes: [] };
  const rackH = 24 * scale;
  out.d += rect(0, base - rackH, width, 3 * scale) + rect(0, base - rackH * 0.55, width, 2 * scale);
  for (let x = 0; x < width; x += 34 * scale) out.d += rect(x, base - rackH, 2.4 * scale, rackH);
  let x = r() * 60 * scale;
  while (x < width) {
    const build = BUILDERS[Math.floor(r() * BUILDERS.length)] ?? column;
    const w = build(x, base, scale, r, out);
    x += w + (10 + r() * gap) * scale;
  }
  // A composed flare stack (the scene's light source) at a chosen position.
  if (flareAt !== undefined) flare(flareAt, base, scale * 1.15, r, out);
  return out;
}
