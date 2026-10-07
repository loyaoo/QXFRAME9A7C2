import fs from 'node:fs';
import { parseCss } from '../../css-ast.mjs';
const css = fs.readFileSync('/home/user/QXFRAME9A7C2/dist/qxframe9a7c2.css', 'utf8');
const { rules } = parseCss(css);
const live = new Set(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')));
const isRootSel = r => r.context.length === 0 && r.selectors.every(s => s === ':root' || s === '.dark');
const rootDefs = new Map(), darkDefs = new Map(), otherDefs = new Map();
for (const r of rules) for (const d of r.declarations) {
  if (!d.prop.startsWith('--_qxframe9a7c2-') && !(d.prop.startsWith('--qxframe9a7c2-') && !d.prop.startsWith('--qxframe9a7c2-theme-'))) continue;
  const rootish = isRootSel(r) || (r.context.some(c => /@scope \(:root\)/.test(c)) && r.selectors.every(s => s === ':scope' || s === ':scope,.dark' || s === '.dark'));
  const map = rootish ? (r.selectors.includes('.dark') && !r.selectors.includes(':root') && !r.selectors.includes(':scope') ? darkDefs : rootDefs) : otherDefs;
  if (!map.has(d.prop)) map.set(d.prop, []); map.get(d.prop).push({ v: d.value, seg: r.segment, sel: r.selector });
}
const resolveConst = (name, seen = new Set()) => {
  if (seen.has(name)) return null; seen.add(name);
  if (otherDefs.has(name) || darkDefs.has(name)) return null;
  const ds = rootDefs.get(name); if (!ds || new Set(ds.map(x => x.v)).size !== 1) return null;
  let v = ds[0].v, ok = true;
  v = v.replace(/var\(\s*(--[a-z0-9_-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/gi, (m, n) => { if (n.startsWith('--qxframe9a7c2-theme-')) { ok = false; return m; } const r = resolveConst(n, seen); if (r == null) { ok = false; return m; } return r; });
  return ok ? v : null;
};
const cat = { dead: 0, constInline: 0, mode: 0, overridden: 0, themeDependent: 0, other: 0 };
for (const [name] of rootDefs) {
  if (!live.has(name)) { cat.dead++; continue; }
  if (darkDefs.has(name)) { cat.mode++; continue; }
  if (otherDefs.has(name)) { cat.overridden++; continue; }
  const v = resolveConst(name);
  if (v != null) { cat.constInline++; continue; }
  if (/--qxframe9a7c2-theme-/.test(rootDefs.get(name)[0].v)) { cat.themeDependent++; continue; }
  cat.other++;
}
console.log(JSON.stringify({ rootNames: rootDefs.size, darkNames: darkDefs.size, ...cat }));
