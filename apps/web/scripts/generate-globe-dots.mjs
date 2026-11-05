// Generates public/globe/land-dots*.bin: points on a Fibonacci sphere that fall on land,
// from Natural Earth 1:50m land polygons (public domain) via the world-atlas package.
// Not a project dependency; run in a scratch folder:
//   npm i world-atlas@2.0.2 topojson-client@3.1.0
//   node generate-globe-dots.mjs 42000 land-dots.bin   (and 14000 land-dots-lite.bin)
// Output: Int16 pairs (lat × 100, lon × 100). Antarctica is left out.

import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
const topo = JSON.parse(readFileSync('node_modules/world-atlas/land-50m.json', 'utf8'));
const land = feature(topo, topo.objects.land);
const polys = [];
for (const f of land.features) {
  const g = f.geometry;
  const list = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const p of list) {
    const ring = p[0];
    let minX = 180,
      maxX = -180,
      minY = 90,
      maxY = -90;
    for (const [x, y] of ring) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    polys.push({ rings: p, minX, maxX, minY, maxY });
  }
}
const inRing = (x, y, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i],
      [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const onLand = (x, y) =>
  polys.some(
    (p) =>
      x >= p.minX &&
      x <= p.maxX &&
      y >= p.minY &&
      y <= p.maxY &&
      inRing(x, y, p.rings[0]) &&
      !p.rings.slice(1).some((h) => inRing(x, y, h)),
  );
const N = Number(process.argv[2] ?? 40000);
const out = [];
const golden = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2;
  const lat = (Math.asin(y) * 180) / Math.PI;
  const lon = (((((i * golden * 180) / Math.PI) % 360) + 540) % 360) - 180;
  if (lat < -60) continue; // no Antarctica: keeps the composition on trade geography
  if (onLand(lon, lat)) out.push(Math.round(lat * 100), Math.round(lon * 100));
}
const buf = Buffer.from(new Int16Array(out).buffer);
writeFileSync(process.argv[3], buf);
console.log(out.length / 2, 'points', buf.length, 'bytes');
