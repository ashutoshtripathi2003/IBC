import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodeDots, HUBS, project, START_VIEW } from './geo';

const R = 480;
const C = 500;

/**
 * Server-rendered globe (orthographic, centred on India) drawn as one SVG path of land
 * dots. It is the first frame of the scene, the no-JavaScript view and the reduced-motion
 * view; the WebGL globe takes over on top of it once loaded.
 */
export function GlobePoster({ className }: { className?: string | undefined }) {
  const dots = decodeDots(
    readFileSync(join(process.cwd(), 'public', 'globe', 'land-dots-lite.bin')),
  );
  let near = '';
  let far = '';
  for (let i = 0; i < dots.length; i += 2) {
    const p = project(dots[i] ?? 0, dots[i + 1] ?? 0, START_VIEW);
    if (!p.visible) continue;
    const x = Math.round((C + p.x * R) * 10) / 10;
    const y = Math.round((C + p.y * R) * 10) / 10;
    const s = p.depth > 0.35 ? 3.6 : 2.6;
    const cmd = `M${x} ${y}h${s}v${s}h-${s}z`;
    if (p.depth > 0.35) near += cmd;
    else far += cmd;
  }
  return (
    <svg className={className} viewBox="0 0 1000 1000" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="globe-body" cx="42%" cy="38%" r="70%">
          <stop offset="0" stopColor="#15243a" />
          <stop offset="1" stopColor="#070d17" />
        </radialGradient>
        <radialGradient id="globe-rim" r="50%">
          <stop offset="0.9" stopColor="#c49a42" stopOpacity="0" />
          <stop offset="0.965" stopColor="#d9c7a0" stopOpacity="0.28" />
          <stop offset="1" stopColor="#c49a42" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={R + 40} fill="url(#globe-rim)" />
      <circle cx={C} cy={C} r={R} fill="url(#globe-body)" />
      <path d={far} fill="#5d6c82" opacity="0.5" />
      <path d={near} fill="#b7c2d2" opacity="0.85" />
      {HUBS.map((h) => {
        const p = project(h.lat, h.lon, START_VIEW);
        if (!p.visible) return null;
        return <circle key={h.id} cx={C + p.x * R} cy={C + p.y * R} r="6" fill="#c49a42" />;
      })}
    </svg>
  );
}
