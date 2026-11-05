import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { site } from '@/content/site';

export const dynamic = 'force-static';
export const alt = site.fullName;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Social preview: the IBC mark, the headline and the brand name on warm white with a navy band. */
export default async function OpengraphImage() {
  // Rendered once at build time, from the web app's directory.
  const mark = await readFile(join(process.cwd(), 'public', 'brand', 'ibc-mark@2x.png'));
  const markSrc = `data:image/png;base64,${mark.toString('base64')}`;
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#f7f8fa',
        color: '#10243e',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '64px 80px 0' }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img */}
        <img src={markSrc} width={210} height={100} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 28 }}>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>INDUSTRIAL</div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>BUSINESS CIRCLE</div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '0 80px',
        }}
      >
        <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2 }}>
          Where Industries Connect.
        </div>
        <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2 }}>
          And Business Moves Forward.
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '28px 80px',
          background: '#10243e',
          color: '#f7f8fa',
          fontSize: 26,
        }}
      >
        <div style={{ display: 'flex' }}>{site.tagline}</div>
        <div style={{ display: 'flex', color: '#c49a42', fontWeight: 700 }}>{site.motto}</div>
      </div>
    </div>,
    size,
  );
}
