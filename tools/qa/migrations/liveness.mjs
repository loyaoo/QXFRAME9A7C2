// Which custom properties declared in main/fixed-values + main/foundation :root/.dark blocks are live?
import fs from 'node:fs';
import { parseCss } from '../../css-ast.mjs';
const root = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const css = fs.readFileSync(root + '/dist/qxframe9a7c2.css', 'utf8');
const { rules } = parseCss(css);
const refs = v => [...v.matchAll(/var\(\s*(--[a-z0-9_-]+)/gi)].map(m => m[1]);
const defs = new Map(); // name -> [values]
// Names re-declared on every element by a universal rule shadow their :root / .dark definitions.
const shadowed = new Set();
for (const r of rules) if (r.selectors.length === 1 && r.selectors[0] === '*') for (const d of r.declarations) if (d.prop.startsWith('--')) shadowed.add(d.prop);
const rootish = r => (r.context.length === 0 && r.selectors.every(s => s === ':root' || s === '.dark')) || (r.context.some(c => /@scope \(:root\)/.test(c)) && r.selectors.every(s => s === ':scope' || s === '.dark'));
const live = new Set(); const queue = [];
const mark = n => { if (!live.has(n)) { live.add(n); queue.push(n); } };
for (const r of rules) for (const d of r.declarations) {
  if (d.prop.startsWith('--')) { if (shadowed.has(d.prop) && rootish(r)) continue; if (!defs.has(d.prop)) defs.set(d.prop, []); defs.get(d.prop).push(d.value); }
  else refs(d.value).forEach(mark);
}
// External roots: docs assets, src JS, docs html (inline styles/scripts).
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(dir + '/' + e.name) : [dir + '/' + e.name]);
for (const f of [...walk(root + '/docs'), ...walk(root + '/src').filter(f => !f.includes('/styles/'))]) {
  if (!/\.(css|js|mjs|html)$/.test(f)) continue;
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/--_?qxframe9a7c2-[a-z0-9-]+/g)) if (defs.has(m[0])) mark(m[0]);
}
while (queue.length) { const n = queue.pop(); for (const v of defs.get(n) || []) refs(v).forEach(mark); }
const bySeg = {};
for (const r of rules) {
  if (!/^main\/(fixed-values|foundation)$|^components\/component-foundation$/.test(r.segment)) continue;
  if (!r.selectors.every(s => [':root', '.dark'].includes(s) || /^\.is-/.test(s))) continue;
  for (const d of r.declarations) if (d.prop.startsWith('--')) {
    const k = r.segment + (live.has(d.prop) && !shadowed.has(d.prop) ? ' live' : ' dead'); bySeg[k] = (bySeg[k] || 0) + 1;
  }
}
console.log(JSON.stringify(bySeg));
fs.writeFileSync(process.argv[2], JSON.stringify([...live].filter(n => !shadowed.has(n))));
fs.writeFileSync(process.argv[2] + '.shadowed', JSON.stringify([...shadowed]));
