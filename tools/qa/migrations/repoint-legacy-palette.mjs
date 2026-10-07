// 2b-B step 3b: repoint consumers of the retired legacy palette roles (fed by the removed
// --_qxframe9a7c2-mode-color-* palettes) to theme tokens, then drop their :root / .dark definitions.
import fs from 'node:fs';
import path from 'node:path';
const root = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const T = n => `var(--qxframe9a7c2-theme-${n})`;
const mix = (c, p) => `color-mix(in oklab, ${c} ${p}%, transparent)`;
const TYPE = `var(--_qxframe9a7c2-v2-type, ${T('primary')})`;
const status = { success: 'success', warning: 'warning', error: 'destructive', info: 'info', accent: 'primary' };
function map(name) {
  const n = name.replace(/^--_?qxframe9a7c2-/, '');
  let m;
  if ((m = /^color-button-(border|hover-border|active-border|disabled-border)-\d+$/.exec(n))) return T('input');
  if (/^color-button-focus-border-\d+$/.test(n)) return T('ring');
  if (/^color-button-(hover|active)-bg-\d+$/.test(n)) return T('muted');
  if (/^color-button-(focus|disabled)-bg-\d+$/.test(n)) return 'transparent';
  if (/^color-button-disabled-text-\d+$/.test(n)) return T('muted-foreground');
  if (/^color-button-(hover-|active-)?shadow-\d+$/.test(n)) return 'transparent';
  if (/^color-accent-1$/.test(n) || /^color-accent-border-1$/.test(n) || /^color-accent-active-1$/.test(n)) return TYPE;
  if (/^color-accent-hover-1$/.test(n)) return mix(TYPE, 80);
  if (/^color-accent-soft-1$/.test(n)) return mix(TYPE, 10);
  if (/^color-accent-soft-hover-1$/.test(n)) return mix(TYPE, 20);
  if (/^color-accent-ring-1$/.test(n)) return mix(T('ring'), 50);
  if (/^primary-\d+$/.test(n)) return T('primary');
  if ((m = /^(?:mode|semantic)-(accent|success|warning|error|info)$/.exec(n))) return T(status[m[1]]);
  if ((m = /^(?:mode|semantic)-(accent|success|warning|error|info)-(hover|active)$/.exec(n))) return m[2] === 'hover' ? mix(T(status[m[1]]), 80) : T(status[m[1]]);
  if ((m = /^semantic-(accent|success|warning|error|info)-soft(-hover)?$/.exec(n))) return mix(T(status[m[1]]), m[2] ? 20 : 10);
  if (/^semantic-accent-ring-color$/.test(n)) return mix(T('ring'), 50);
  if (/^semantic-overlay-control$/.test(n)) return T('muted');
  if (/^semantic-overlay-divider$/.test(n)) return T('border');
  if (/^(mode-)?loading-mask$|^mode-loading-mask$/.test(n)) return T('overlay');
  if (/^(mode-)?popup-shadow$|^overlay-shadow$/.test(n)) return T('shadow-popup');
  if ((m = /^feedback-(info|warning|error)$/.exec(n))) return T(status[m[1]]);
  if (/^focus-ring$/.test(n)) return `0 0 0 .125rem ${mix(T('ring'), 50)}`;
  if ((m = /^validation-(error|warning)-ring$/.exec(n))) return `0 0 0 .125rem ${mix(T(status[m[1]]), 20)}`;
  if ((m = /^color-(primary|success|warning|error)(-soft)?$/.exec(n))) return m[2] ? mix(T(status[m[1] === 'primary' ? 'accent' : m[1]]), 10) : T(status[m[1] === 'primary' ? 'accent' : m[1]]);
  return null;
}
const names = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const table = {}; const unmapped = [];
for (const n of names) { const v = map(n); if (v) table[n] = v; else unmapped.push(n); }
function scanVars(text, fn) {
  let out = '', i = 0;
  while (true) {
    const j = text.indexOf('var(', i); if (j < 0) { out += text.slice(i); break; }
    let depth = 1, k = j + 4; for (; k < text.length && depth; k++) { if (text[k] === '(') depth++; else if (text[k] === ')') depth--; }
    const whole = text.slice(j, k), name = (whole.match(/^var\(\s*(--[a-z0-9_-]+)/i) || [])[1];
    const rep = name ? fn(name) : null;
    out += text.slice(i, j) + (rep != null ? rep : 'var(' + scanVars(whole.slice(4, -1), fn) + ')'); i = k;
  }
  return out;
}
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
let removed = 0, replaced = 0;
for (const f of walk(root + '/src/styles').filter(f => f.endsWith('.css'))) {
  let t = fs.readFileSync(f, 'utf8'); const before = t;
  if (/main\/(fixed-values|foundation)\.css$/.test(f)) {
    t = t.replace(/(^|[;{\s])(--_?qxframe9a7c2-[a-z0-9-]+)\s*:\s*((?:[^;{}()]|\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\))*)(;|(?=\s*}))/g, (m, pre, name) => { if (!table[name]) return m; removed++; return pre; });
  }
  t = scanVars(t, n => { if (!table[n]) return null; replaced++; return table[n]; });
  if (t !== before) fs.writeFileSync(f, t);
}
console.log(JSON.stringify({ mapped: Object.keys(table).length, unmapped, removed, replaced }));
