// 2b-B step 1: delete dead root custom properties; inline root-only constants at their use sites.
import fs from 'node:fs';
import path from 'node:path';
import { parseCss } from '../../css-ast.mjs';
const root = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const dry = process.argv.includes('--dry');
const css = fs.readFileSync(root + '/dist/qxframe9a7c2.css', 'utf8');
const live = new Set(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')));
const { rules } = parseCss(css);
const isRoot = r => (r.context.length === 0 && r.selectors.every(s => s === ':root' || s === '.dark'))
  || (r.context.some(c => /@scope \(:root\)/.test(c)) && r.selectors.every(s => s === ':scope' || s === '.dark'));
const rootDefs = new Map(), darkDefs = new Set(), otherDefs = new Set();
for (const r of rules) for (const d of r.declarations) {
  if (!d.prop.startsWith('--') || d.prop.startsWith('--qxframe9a7c2-theme-')) continue;
  if (isRoot(r)) {
    if (r.selectors.includes('.dark') && !r.selectors.some(s => s === ':root' || s === ':scope')) darkDefs.add(d.prop);
    else { if (!rootDefs.has(d.prop)) rootDefs.set(d.prop, new Set()); rootDefs.get(d.prop).add(d.value); }
  } else otherDefs.add(d.prop);
}
// Names referenced outside framework CSS (docs, runtime JS) stay declared.
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const external = new Set();
for (const f of [...walk(root + '/docs'), ...walk(root + '/src').filter(f => !f.includes('/styles/')), ...walk(root + '/tools').filter(f => /verify|probe|smoke/.test(f))]) {
  if (!/\.(css|js|mjs|html)$/.test(f)) continue;
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/--_?qxframe9a7c2-[a-z0-9-]+/g)) external.add(m[0]);
}
function scanVars(text, fn) { // replace var(...) calls (balanced) via fn(name, whole) -> replacement|null
  let out = '', i = 0;
  while (true) {
    const j = text.indexOf('var(', i);
    if (j < 0) { out += text.slice(i); break; }
    let depth = 1, k = j + 4;
    for (; k < text.length && depth; k++) { if (text[k] === '(') depth++; else if (text[k] === ')') depth--; }
    const whole = text.slice(j, k), name = (whole.match(/^var\(\s*(--[a-z0-9_-]+)/i) || [])[1];
    const inner = whole.slice(4, -1);
    const rep = name ? fn(name, whole) : null;
    out += text.slice(i, j) + (rep != null ? rep : 'var(' + scanVarsWrap(inner, fn) + ')');
    i = k;
  }
  return out;
}
const scanVarsWrap = (t, fn) => scanVars(t, fn);
const memo = new Map();
function resolve(name, stack = new Set()) {
  if (memo.has(name)) return memo.get(name);
  let result = null;
  if (!stack.has(name) && !darkDefs.has(name) && !otherDefs.has(name) && !external.has(name) && rootDefs.has(name) && rootDefs.get(name).size === 1) {
    stack.add(name);
    let ok = true;
    const value = scanVars([...rootDefs.get(name)][0], (n) => {
      if (n.startsWith('--qxframe9a7c2-')) { ok = false; return null; } // public / theme inputs stay
      const r = resolve(n, stack); if (r == null) { ok = false; return null; } return r;
    });
    stack.delete(name);
    if (ok) result = value;
  }
  memo.set(name, result);
  return result;
}
const dead = [...rootDefs.keys()].filter(n => !live.has(n) && !external.has(n));
const inline = [...rootDefs.keys()].filter(n => live.has(n) && n.startsWith('--_qxframe9a7c2-') && resolve(n) != null);
const remove = new Set([...dead, ...inline]);
const files = walk(root + '/src/styles').filter(f => f.endsWith('.css'));
let replaced = 0, removed = 0;
for (const f of files) {
  let t = fs.readFileSync(f, 'utf8');
  const before = t;
  // drop declarations of removed names (any block; they are root-only by construction, dead may be anywhere)
  t = t.replace(/(^|[;{\s])(--_?qxframe9a7c2-[a-z0-9-]+)\s*:\s*((?:[^;{}()]|\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\))*)(;|(?=\s*}))/g, (m, pre, name, val, end) => {
    if (!remove.has(name)) return m; removed++; return pre;
  });
  t = scanVars(t, (n) => { if (!inline.includes(n)) return null; replaced++; return resolve(n); });
  if (t !== before && !dry) fs.writeFileSync(f, t);
}
console.log(JSON.stringify({ dead: dead.length, inline: inline.length, removedDecls: removed, replacedUses: replaced, external: external.size }));
