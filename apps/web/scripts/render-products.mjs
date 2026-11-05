// Renders the product illustrations in public/products/ with the offline studio.
// Usage (from apps/web): node scripts/render-products.mjs   — needs Playwright's Chromium.
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = fileURLToPath(new URL('..', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript' };
const server = createServer((req, res) => {
  const path = normalize(join(web, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!path.startsWith(web) || !existsSync(path) || !statSync(path).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
  createReadStream(path).pipe(res);
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const { port } = server.address();
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
page.on('pageerror', (e) => console.error(e.message));
await page.goto(`http://127.0.0.1:${port}/scripts/render-studio/index.html`);
await page.waitForFunction(() => window.studioReady === true, null, { timeout: 60000 });
const outDir = join(web, 'public', 'products');
mkdirSync(outDir, { recursive: true });
for (const name of process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['drum', 'ingots', 'housing', 'yarn', 'pump', 'pellets']) {
  const images = await page.evaluate((n) => window.renderProduct(n), name);
  for (const [w, url] of Object.entries(images)) {
    const file = join(outDir, `${name}-${w}.webp`);
    writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log(file, statSync(file).size);
  }
}
await browser.close();
server.close();
