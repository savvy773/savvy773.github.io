// Run before deploying after CSS/JS or shared-markup changes.
// 1. Copies the shared blocks (<!-- shared:NAME --> … <!-- /shared:NAME -->) from index.html into every other page,
//    so the head, topbar, footer and dialog stay identical without a build step.
// 2. Stamps each CSS/JS reference with a content hash (?v=…), so year-long caching never serves a stale file.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const pages = ['index.html', 'projects/index.html', 'projects/prism/index.html'];
const assets = ['css/site.css', 'js/app.js'];
const read = (p) => readFileSync(new URL(p, root), 'utf8');

const blockRe = /<!-- shared:([a-z-]+) -->[\s\S]*?<!-- \/shared:\1 -->/g;
const shared = new Map([...read('index.html').matchAll(blockRe)].map((m) => [m[1], m[0]]));

const hashes = assets.map((asset) => [asset, createHash('sha256').update(readFileSync(new URL(asset, root))).digest('hex').slice(0, 12)]);

for (const page of pages) {
  let html = read(page).replace(blockRe, (block, name) => shared.get(name) ?? block);
  for (const [asset, hash] of hashes) {
    const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`(["'])/?${escaped}(?:\\?[^"']*)?(["'])`, 'g'), `$1/${asset}?v=${hash}$2`);
  }
  writeFileSync(new URL(page, root), html.replaceAll('\r\n', '\n'));
}
console.log(`Synced shared blocks and stamped ${assets.length} assets in ${pages.length} pages`);
