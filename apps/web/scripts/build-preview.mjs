/**
 * Builds a single self-contained HTML preview of the home page (all scripts, styles and
 * fonts inlined; no network requests), for hosts that only serve one file, such as a
 * private Claude Artifact. Run after `IBC_STATIC_EXPORT=1 next build --webpack`:
 *
 *   node scripts/build-preview.mjs [outFile]
 *
 * Links to other pages show a notice instead of navigating, because only the home page is
 * included. The production site is unaffected.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'out');
const outFile = process.argv[2] ?? path.join(root, 'preview.html');
const read = (url) => readFileSync(path.join(root, url.replace(/^\//, '').split('?')[0]));

const MIME = {
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};
const dataUri = (url) =>
  `data:${MIME[path.extname(url.split('?')[0])] ?? 'application/octet-stream'};base64,${read(url).toString('base64')}`;

let html = readFileSync(path.join(root, 'index.html'), 'utf8');

// Stylesheets → inline <style>, with font/image URLs embedded as data URIs.
// The original <link> is kept after the inline copy: React rendered it and expects to find
// it when hydrating (removing it causes a hydration mismatch). Where the host blocks the
// file, the inline copy has already applied the same rules.
html = html.replace(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (tag, href) => {
  const cssDir = path.posix.dirname(href);
  const css = read(href)
    .toString('utf8')
    .replace(/url\(([^)]+)\)/g, (match, raw) => {
      const ref = raw.replace(/["']/g, '');
      if (ref.startsWith('data:') || ref.startsWith('#')) return match;
      const resolved = ref.startsWith('/') ? ref : path.posix.join(cssDir, ref);
      return `url(${dataUri(resolved)})`;
    });
  return `<style>${css}</style>${tag}`;
});

// External scripts → inline scripts, in document order.
html = html.replace(
  /<script([^>]*)\ssrc="(\/_next\/[^"]+)"([^>]*)><\/script>/g,
  (_, before, src, after) => {
    const attrs = `${before} ${after}`.replace(
      /\s(async|defer|nomodule|noModule|crossorigin(="[^"]*")?)\b/g,
      '',
    );
    const code = read(src)
      .toString('utf8')
      .replace(/<\/script/gi, '<\\/script')
      // Literal U+FFFD (used in React's strings) is written as its escape: same value in JS.
      .replace(/\uFFFD/g, '\\uFFFD');
    return `<script${attrs.trim() ? ' ' + attrs.trim() : ''}>${code}</script>`;
  },
);

// Drop hints and assets that would trigger network requests.
html = html
  .replace(
    /<link[^>]+rel="(preload|modulepreload|prefetch|icon|apple-touch-icon|manifest)"[^>]*>/g,
    '',
  )
  .replace(/<meta charSet="utf-8"\s*\/?>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '')
  .replace(/<title>[^<]*<\/title>/, '');

// The host provides the document skeleton: keep head and body contents only.
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';
const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] ?? '';

const guard = `<script>
(function () {
  // Only the home page is in this preview: other internal links show a notice.
  var note;
  function show() {
    if (!note) {
      note = document.createElement('div');
      note.setAttribute('role', 'status');
      note.style.cssText = 'position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:200;max-width:calc(100% - 32px);padding:12px 18px;border-radius:999px;background:#141b4a;color:#eef0fa;border:1px solid rgba(140,155,255,.4);font:500 15px/1.3 system-ui,sans-serif;text-align:center';
      document.body.appendChild(note);
    }
    note.textContent = 'This preview shows the home page. Other pages are on the full site.';
    clearTimeout(note._t);
    note.hidden = false;
    note._t = setTimeout(function () { note.hidden = true; }, 2600);
  }
  window.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^https?:/.test(href)) return;
    if (href === '/' ) { e.preventDefault(); e.stopPropagation(); window.scrollTo(0, 0); return; }
    e.preventDefault(); e.stopPropagation(); show();
  }, true);
})();
</script>`;

// Next.js derives its asset prefix from document.currentScript.src, which inline scripts
// lack. Report a placeholder script under /_next/ whenever the real one has no src.
const shim = `<script>
(function () {
  var desc = Object.getOwnPropertyDescriptor(Document.prototype, 'currentScript');
  var placeholder = document.createElement('script');
  placeholder.src = 'https://preview.invalid/_next/static/chunks/inline.js';
  Object.defineProperty(document, 'currentScript', {
    configurable: true,
    get: function () {
      var real = desc.get.call(document);
      return real && real.src ? real : placeholder;
    }
  });
})();
</script>`;

const page = `<title>IBC Website</title>\n${shim}\n${head}\n${guard}\n${body}\n`;
writeFileSync(outFile, page);
console.log(`wrote ${outFile} (${Math.round(page.length / 1024)} KB)`);
