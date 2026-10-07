// Stage-0 visual equivalence: render every canonical docs page twice — once with a baseline
// CSS file and once with a candidate CSS file — and compare full-page screenshots pixel by pixel
// plus the computed style / geometry of every element. Runs in the dev session (Playwright);
// the summary report is committed under tools/qa/reports/.
//
//   node tools/qa/css-equivalence.mjs --baseline=<old.css> --candidate=<new.css> --out=<dir>
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arg = name => (process.argv.find(a => a.startsWith(`--${name}=`)) || '').slice(name.length + 3);
const baselineCss = fs.readFileSync(path.resolve(arg('baseline')));
const candidateCss = fs.readFileSync(path.resolve(arg('candidate') || 'dist/qxframe9a7c2.css'));
const outDir = path.resolve(arg('out') || 'tools/qa/reports/stage-0');
const only = arg('only');
fs.mkdirSync(outDir, { recursive: true });

function loadPlaywright() {
  const bases = [root + '/', process.env.QX_PLAYWRIGHT_ROOT, execSync('npm root -g').toString().trim() + '/'].filter(Boolean);
  for (const base of bases) {
    try { return createRequire(base.endsWith('/') ? base : base + '/')('playwright'); } catch {}
  }
  throw new Error('playwright is required for tools/qa (npm i -g playwright).');
}
const { chromium } = loadPlaywright();

function pages() {
  const list = ['docs/index.html', 'docs/admin-dashboard-static.html', 'docs/admin-form-static.html', 'docs/admin-list-static.html',
    'docs/all-components-static.html', 'docs/theme-playground.html', 'docs/tokens.html', 'docs/admin/index.html', 'docs/admin/login.html'];
  for (const dir of ['docs/components', 'docs/admin/views']) {
    for (const f of fs.readdirSync(path.join(root, dir)).sort()) if (f.endsWith('.html')) list.push(`${dir}/${f}`);
  }
  return only ? list.filter(p => p.includes(only)) : list;
}

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
let activeCss = baselineCss;
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url.endsWith('/dist/qxframe9a7c2.css')) { res.writeHead(200, { 'Content-Type': 'text/css' }); return res.end(activeCss); }
  const file = path.join(root, url);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  res.end(fs.readFileSync(file));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const STYLE_PROBE = () => {
  // Per element: tag/class key, rounded geometry and a hash of every non-custom computed property.
  const out = [];
  const first = getComputedStyle(document.body);
  const names = [];
  for (let i = 0; i < first.length; i++) if (!first[i].startsWith('--')) names.push(first[i]);
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el); const r = el.getBoundingClientRect();
    let h = 2166136261;
    for (const p of names) { const v = s.getPropertyValue(p); for (let i = 0; i < v.length; i++) h = Math.imul(h ^ v.charCodeAt(i), 16777619); h = Math.imul(h ^ 59, 16777619); }
    out.push([el.tagName + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : ''),
      [r.x, r.y, r.width, r.height].map(v => Math.round(v * 100) / 100).join(','), (h >>> 0).toString(16)]);
  }
  return out;
};

const browser = await chromium.launch();
// Every render gets a fresh context so storage, caches and focus state cannot leak between pages.
async function newContext() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    let seed = 42; Math.random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  });
  await context.route('**/*', route => route.request().url().startsWith(origin) || route.request().url().startsWith('data:') ? route.continue() : route.abort());
  return context;
}
const context = await newContext();

async function render(rel, mode, css) {
  activeCss = css;
  const ctx = await newContext();
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date('2026-01-15T10:00:00Z'));
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`${origin}/${rel}`, { waitUntil: 'load' });
  if (mode === 'dark') await page.evaluate(() => { document.documentElement.setAttribute('data-qxframe9a7c2-theme', 'dark'); document.documentElement.classList.add('dark'); });
  await page.waitForTimeout(800);
  await page.evaluate(() => document.fonts.ready);
  const shot = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' });
  const styles = await page.evaluate(STYLE_PROBE);
  await ctx.close();
  return { shot, styles, errors };
}

async function pixelDiff(a, b) {
  const page = await context.newPage();
  const result = await page.evaluate(async ([a, b]) => {
    const load = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + src; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { sizeMismatch: [ia.width, ia.height, ib.width, ib.height], pixels: -1 };
    const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height; const g = c.getContext('2d');
    g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, c.width, c.height).data;
    g.clearRect(0, 0, c.width, c.height); g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 0; i < da.length; i += 4) if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2] || da[i + 3] !== db[i + 3]) n++;
    return { pixels: n, total: da.length / 4 };
  }, [a.toString('base64'), b.toString('base64')]);
  await page.close();
  return result;
}

// Rule-level check: both sheets parsed by Chromium must yield the same rule sequence. Values that
// contain var() keep their author text, so math serialization (spacing, 0.5 vs .5, an implicit
// calc() inside min()/max()) is normalized before comparing; everything else must match exactly.
async function cssomCompare() {
  const page = await context.newPage();
  const serialize = css => page.evaluate(css => {
    const sheet = new CSSStyleSheet(); sheet.replaceSync(css); const out = [];
    const walk = rules => { for (const r of rules) { if (r.cssRules && !(r instanceof CSSStyleRule)) { out.push('@' + r.constructor.name + ' ' + (r.conditionText || r.media?.mediaText || r.name || '')); walk(r.cssRules); out.push('}'); } else out.push(r.cssText); } };
    walk(sheet.cssRules); return out;
  }, css.toString('utf8'));
  const a = await serialize(baselineCss), b = await serialize(candidateCss);
  await page.close();
  const norm = s => (s || '').replace(/\s+/g, '').replace(/(^|[^0-9.])0\.(?=[0-9])/g, '$1.').replace(/calc\(/g, '(').replace(/[()]/g, '');
  let exact = 0, normalized = 0; const unequal = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === b[i]) exact++;
    else if (norm(a[i]) === norm(b[i])) normalized++;
    else unequal.push({ index: i, baseline: a[i]?.slice(0, 200), candidate: b[i]?.slice(0, 200) });
  }
  return { baselineRules: a.length, candidateRules: b.length, exact, mathSerializationOnly: normalized, unequal };
}
const cssom = await cssomCompare();
console.log(JSON.stringify({ cssom: { ...cssom, unequal: cssom.unequal.length } }));

const results = [];
for (const rel of pages()) {
  for (const mode of ['light', 'dark']) {
    // Up to three attempts: a page with live timers/caret can repaint a few pixels between two
    // renders of the same CSS; a real difference reproduces on every attempt.
    let base, cand, identicalPng, diff, styleDiffs, samples, attempts = 0;
    do {
      attempts++;
      base = await render(rel, mode, baselineCss);
      cand = await render(rel, mode, candidateCss);
      identicalPng = base.shot.equals(cand.shot);
      diff = identicalPng ? { pixels: 0 } : await pixelDiff(base.shot, cand.shot);
      styleDiffs = 0; samples = [];
      const n = Math.max(base.styles.length, cand.styles.length);
      for (let i = 0; i < n; i++) {
        const x = base.styles[i], y = cand.styles[i];
        if (!x || !y || x[0] !== y[0] || x[1] !== y[1] || x[2] !== y[2]) { styleDiffs++; if (samples.length < 3) samples.push(x?.[0] || y?.[0]); }
      }
    } while ((diff.pixels !== 0 || styleDiffs !== 0) && attempts < 3);
    const entry = { page: rel, mode, attempts, elements: base.styles.length, identicalPng, diffPixels: diff.pixels, sizeMismatch: diff.sizeMismatch || null, styleDiffs, samples, errors: cand.errors.length };
    if (!identicalPng) {
      const slug = rel.replace(/[\/.]/g, '_') + '-' + mode;
      fs.writeFileSync(path.join(outDir, slug + '-baseline.png'), base.shot);
      fs.writeFileSync(path.join(outDir, slug + '-candidate.png'), cand.shot);
    }
    results.push(entry);
    console.log(JSON.stringify(entry));
  }
}
await browser.close();
server.close();

const summary = {
  generatedAt: new Date().toISOString(),
  baselineBytes: baselineCss.length,
  candidateBytes: candidateCss.length,
  cssom,
  renders: results.length,
  pixelIdentical: results.filter(r => r.diffPixels === 0).length,
  computedStyleIdentical: results.filter(r => r.styleDiffs === 0).length,
  elementsCompared: results.reduce((s, r) => s + r.elements, 0),
  failures: [...(cssom.unequal.length || cssom.baselineRules !== cssom.candidateRules ? ['cssom'] : []), ...results.filter(r => r.diffPixels !== 0 || r.styleDiffs !== 0).map(r => `${r.page} (${r.mode})`)],
  results
};
fs.writeFileSync(path.join(outDir, 'css-equivalence.json'), JSON.stringify(summary, null, 1) + '\n');
console.log(JSON.stringify({ ok: summary.failures.length === 0, renders: summary.renders, pixelIdentical: summary.pixelIdentical, computedStyleIdentical: summary.computedStyleIdentical, elementsCompared: summary.elementsCompared, failures: summary.failures }));
process.exitCode = summary.failures.length === 0 ? 0 : 1;
