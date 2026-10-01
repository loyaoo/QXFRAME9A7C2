import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = path.join(root, 'src', 'qxframe9a7c2.css');

function walk(dir, predicate) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes:true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, predicate));
    else if (entry.isFile() && predicate(full)) out.push(full);
  }
  return out;
}

function loc(text, index) {
  return text.slice(0, index).split('\n').length;
}

function collectMatches(text, re, mapper = m => m[0], limit = 5000) {
  const out = [];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(text)) && out.length < limit) {
    out.push({ line: loc(text, m.index), value: mapper(m) });
    if (m[0] === '') re.lastIndex += 1;
  }
  return out;
}

if (!fs.existsSync(cssPath)) {
  throw new Error('Current baseline CSS source is missing: src/qxframe9a7c2.css');
}

const css = fs.readFileSync(cssPath, 'utf8');
const jsFiles = walk(path.join(root, 'src'), file => file.endsWith('.js'));

const px = collectMatches(css, /(-?\d*\.?\d+)px\b/g, m => Number(m[1]));
const rem = collectMatches(css, /(-?\d*\.?\d+)rem\b/g, m => Number(m[1]));
const forbiddenViewport = collectMatches(css, /(-?\d*\.?\d+)(vw|vh|vmin|vmax)\b/g, m => m[0]);
const fr = collectMatches(css, /(-?\d*\.?\d+)fr\b/g, m => m[0]);
const gridDecls = collectMatches(css, /\bdisplay\s*:\s*(?:inline-)?grid\b|\bgrid-(?:template|column|row|area|auto|gap)[a-z-]*\s*:/gi);
const colorMix = collectMatches(css, /\bcolor-mix\s*\(/gi);
const publicDefs = collectMatches(css, /(--qxframe9a7c2-[a-z0-9-]+)\s*:/gi, m => m[1]);
const privateDefs = collectMatches(css, /(--_qxframe9a7c2-[a-z0-9-]+)\s*:/gi, m => m[1]);

const oddPx = px.filter(x => Number.isInteger(x.value) && Math.abs(x.value) > 1 && Math.abs(x.value) % 2 === 1);
const decimalPx = px.filter(x => !Number.isInteger(x.value));
const nonHairlinePx = px.filter(x => Math.abs(x.value) !== 1 && x.value !== 0);

const geometryPatterns = [
  /getBoundingClientRect\s*\(/,
  /\b(?:offsetWidth|offsetHeight|clientWidth|clientHeight|scrollWidth|scrollHeight)\b/,
  /getComputedStyle\s*\(/,
  /ResizeObserver\b/,
  /IntersectionObserver\b/
];
const geometryCoupling = [];
for (const file of jsFiles) {
  const rel = path.relative(root, file).replaceAll('\\', '/');
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    if (geometryPatterns.some(re => re.test(line))) {
      geometryCoupling.push({ file:rel, line:index + 1, text:line.trim().slice(0, 240) });
    }
  });
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  baseline: {
    css: 'src/qxframe9a7c2.css',
    sha256: crypto.createHash('sha256').update(css).digest('hex'),
    bytes: Buffer.byteLength(css),
    lines: css.split(/\r?\n/).length
  },
  counts: {
    publicTokenDefinitions: new Set(publicDefs.map(x => x.value)).size,
    privateTokenDefinitions: new Set(privateDefs.map(x => x.value)).size,
    px: px.length,
    rem: rem.length,
    nonHairlinePx: nonHairlinePx.length,
    oddPx: oddPx.length,
    decimalPx: decimalPx.length,
    forbiddenViewportUnits: forbiddenViewport.length,
    frUnits: fr.length,
    cssGridDeclarations: gridDecls.length,
    colorMixCalls: colorMix.length,
    jsGeometryCouplingSites: geometryCoupling.length
  },
  migrationTables: {
    forbiddenViewport,
    fr,
    cssGrid: gridDecls,
    oddPx,
    decimalPx,
    jsGeometryCoupling: geometryCoupling
  },
  policy: {
    note: 'Inventory only. No value in this report is approval for a mechanical replacement.',
    protected: ['interaction','keyboard','value','popup/overlay','icon-font','24-column-grid-math','responsive-breakpoints','motion-lifecycle']
  }
};

const arg = process.argv.find(x => x.startsWith('--write='));
if (arg) {
  const target = path.resolve(root, arg.slice('--write='.length));
  fs.mkdirSync(path.dirname(target), { recursive:true });
  fs.writeFileSync(target, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ok:true, wrote:path.relative(root, target).replaceAll('\\','/'), counts:report.counts }));
} else {
  console.log(JSON.stringify(report, null, 2));
}
