// Fast computed-style equivalence (2b-B refactors): every canonical docs page is loaded once; the
// baseline and candidate stylesheets are swapped in place and every element's non-custom computed
// properties + geometry are compared in light and dark. Screenshot-free complement of
// css-equivalence.mjs for large mechanical CSS refactors.
//   node tools/qa/css-style-equivalence.mjs --baseline=<old.css> --candidate=<new.css> [--only=<substr>] [--jobs=4]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arg = name => (process.argv.find(a => a.startsWith(`--${name}=`)) || '').slice(name.length + 3);
const css = { a: fs.readFileSync(path.resolve(arg('baseline'))), b: fs.readFileSync(path.resolve(arg('candidate') || 'dist/qxframe9a7c2.css')) };
const only = arg('only'), jobs = Number(arg('jobs') || 4);
const bases = [root + '/', process.env.QX_PLAYWRIGHT_ROOT, execSync('npm root -g').toString().trim() + '/'].filter(Boolean);
let chromium; for (const b of bases) { try { ({ chromium } = createRequire(b.endsWith('/') ? b : b + '/')('playwright')); break; } catch {} }

const list = ['docs/index.html', 'docs/admin-dashboard-static.html', 'docs/admin-form-static.html', 'docs/admin-list-static.html',
  'docs/all-components-static.html', 'docs/theme-playground.html', 'docs/tokens.html', 'docs/admin/index.html', 'docs/admin/login.html'];
for (const dir of ['docs/components', 'docs/admin/views']) for (const f of fs.readdirSync(path.join(root, dir)).sort()) if (f.endsWith('.html')) list.push(`${dir}/${f}`);
const pages = only ? list.filter(p => p.includes(only)) : list;

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const q = req.url.includes('?v=b') ? 'b' : 'a';
  if (url.endsWith('/dist/qxframe9a7c2.css')) { res.writeHead(200, { 'Content-Type': 'text/css', 'Cache-Control': 'no-store' }); return res.end(css[q]); }
  const file = path.join(root, url);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); res.end(fs.readFileSync(file));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

// Snapshots stay inside the page (window.__qxSnap); only differences cross the CDP boundary.
const SNAP = slot => {
  const names = []; const first = getComputedStyle(document.body);
  for (let i = 0; i < first.length; i++) if (!first[i].startsWith('--') && !/^(transition|animation)/.test(first[i])) names.push(first[i]);
  window.__qxSnap = window.__qxSnap || {};
  window.__qxSnap[slot] = [...document.querySelectorAll('html, body, body *')].map(el => {
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return { el, geo: [r.x, r.y, r.width, r.height].map(n => Math.round(n * 4) / 4).join(','), v: names.map(p => s.getPropertyValue(p)), names };
  });
  return window.__qxSnap[slot].length;
};
const DIFF = ([sa, sb]) => {
  const A = window.__qxSnap[sa], B = window.__qxSnap[sb], out = [];
  if (A.length !== B.length) return [{ prop: 'element-count', a: A.length, b: B.length }];
  for (let i = 0; i < A.length; i++) {
    const key = A[i].el.tagName + '.' + (typeof A[i].el.className === 'string' ? A[i].el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
    if (A[i].geo !== B[i].geo) out.push({ el: key, prop: 'geometry', a: A[i].geo, b: B[i].geo });
    for (let j = 0; j < A[i].v.length; j++) if (A[i].v[j] !== B[i].v[j]) out.push({ el: key, prop: A[i].names[j], a: A[i].v[j], b: B[i].v[j] });
  }
  return out;
};
const browser = await chromium.launch();
const results = [];
async function run(rel) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { let seed = 42; Math.random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; });
  await ctx.route('**/*', r => r.request().url().startsWith(origin) || r.request().url().startsWith('data:') ? r.continue() : r.abort());
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date('2026-01-15T10:00:00Z'));
  await page.goto(`${origin}/${rel}`, { waitUntil: 'load' });
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
  await page.waitForTimeout(600);
  const snap = async tag => { for (const mode of ['light', 'dark']) { await page.evaluate(m => document.documentElement.classList.toggle('dark', m === 'dark'), mode); await page.waitForTimeout(60); await page.evaluate(SNAP, tag + mode); } };
  await snap('a');
  await page.evaluate(() => new Promise(res => { const link = [...document.querySelectorAll('link[rel=stylesheet]')].find(l => /qxframe9a7c2\.css/.test(l.href)); if (!link) return res(); link.onload = res; link.href = link.href.split('?')[0] + '?v=b'; }));
  await page.waitForTimeout(200);
  await snap('b');
  const diffs = [];
  for (const mode of ['light', 'dark']) for (const d of await page.evaluate(DIFF, ['a' + mode, 'b' + mode])) diffs.push({ mode, ...d });
  await ctx.close();
  results.push({ page: rel, diffs: diffs.length, samples: diffs.slice(0, 8) });
  console.log(JSON.stringify(results.at(-1)));
}
const queue = [...pages];
await Promise.all(Array.from({ length: jobs }, async () => { while (queue.length) await run(queue.shift()); }));
await browser.close(); server.close();
const total = results.reduce((n, r) => n + r.diffs, 0);
console.log(JSON.stringify({ ok: total === 0, pages: results.length, diffs: total }));
process.exit(total === 0 ? 0 : 1);
