import { ImageResponse } from 'next/og';
import { site } from '@/content/site';

export const dynamic = 'force-static';
export const alt = site.fullName;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const COLORS = ['#8c9bff', '#eef0fa', '#f4a62a', '#c9a8ff', '#ff7a90'];

/** Social preview: the woven ring of the network beside the headline. */
export default function OpengraphImage() {
  const knots = Array.from({ length: 64 }, (_, i) => {
    const angle = (i / 64) * Math.PI * 2;
    const wobble = Math.sin(i * 2.3) * 14;
    return {
      x: 880 + Math.cos(angle) * (200 + wobble),
      y: 315 + Math.sin(angle) * (170 + wobble * 0.8),
      color: COLORS[i % COLORS.length]!,
      size: 6 + (i % 3) * 2,
    };
  });
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: 'radial-gradient(60% 70% at 72% 50%, #2a3482 0%, #0a0f2e 70%)',
        color: '#eef0fa',
        fontFamily: 'sans-serif',
      }}
    >
      {knots.map((k, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: k.x,
            top: k.y,
            width: k.size,
            height: k.size,
            borderRadius: 999,
            background: k.color,
          }}
        />
      ))}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          width: 680,
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 800, color: '#f4a62a', marginBottom: 24 }}>IBC</div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>
          The network where business happens.
        </div>
        <div style={{ fontSize: 26, marginTop: 28, color: '#a9b1dc' }}>Indian Business Circle</div>
      </div>
    </div>,
    size,
  );
}
