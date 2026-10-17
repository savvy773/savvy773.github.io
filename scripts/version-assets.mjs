import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const indexPath = new URL('index.html', root);
let html = readFileSync(indexPath, 'utf8');
for (const asset of ['css/site.css', 'js/app.js', 'js/showcase3d.js']) {
  const hash = createHash('sha256').update(readFileSync(new URL(asset, root))).digest('hex').slice(0, 12);
  const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  html = html.replace(new RegExp(`(["'])${escaped}(?:\\?[^"']*)?(["'])`, 'g'), `$1${asset}?v=${hash}$2`);
}
writeFileSync(indexPath, html.replaceAll('\r\n', '\n'));
console.log(`Updated stylesheet and script versions in ${fileURLToPath(indexPath)}`);
