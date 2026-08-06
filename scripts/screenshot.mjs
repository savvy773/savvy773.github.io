/**
 * README 미리보기 스샷 캡처
 *
 * Usage:
 *   node scripts/screenshot.mjs
 *   node scripts/screenshot.mjs --url http://localhost:4173 --out .github/preview.png
 *
 * Requires: npx playwright (or global playwright) + browser
 * Serves the site itself if --url is omitted.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const out = path.resolve(root, arg('--out', '.github/preview.png'));
const viewport = arg('--viewport', '1440,900');
const waitMs = arg('--wait', '2500');
const browser = arg('--browser', 'chromium');
let url = arg('--url', '');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
        if (urlPath === '/') urlPath = '/index.html';
        const filePath = path.normalize(path.join(root, urlPath));
        if (!filePath.startsWith(root) || !existsSync(filePath)) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        createReadStream(filePath).pipe(res);
      } catch (e) {
        res.writeHead(500);
        res.end(String(e));
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
    server.on('error', reject);
  });
}

function runPlaywright(targetUrl) {
  return new Promise((resolve, reject) => {
    // Windows: npx.cmd; shell string avoids DEP0190 (argv + shell:true)
    const cmd = [
      'npx playwright screenshot',
      `--browser ${browser}`,
      `--viewport-size ${viewport}`,
      `--wait-for-timeout ${waitMs}`,
      JSON.stringify(targetUrl),
      JSON.stringify(out),
    ].join(' ');
    const child = spawn(cmd, {
      cwd: root,
      stdio: 'inherit',
      shell: true,
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`playwright exited ${code}`));
    });
    child.on('error', reject);
  });
}

const { server, port } = url
  ? { server: null, port: null }
  : await startStaticServer();

if (!url) url = `http://127.0.0.1:${port}/`;

console.log(`Capture: ${url}`);
console.log(`Out:     ${out}`);
console.log(`Viewport ${viewport}, wait ${waitMs}ms`);

try {
  await runPlaywright(url);
  console.log('Done.');
} finally {
  if (server) server.close();
}
