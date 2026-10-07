// 2b-B cleanup: drop custom-property declarations in main/fixed-values + main/foundation whose value
// can no longer resolve (references a private variable defined nowhere, without fallback).
import fs from 'node:fs';
const root = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const files = ['src/styles/main/fixed-values.css', 'src/styles/main/foundation.css'].map(f => root + '/' + f);
const all = () => fs.readdirSync(root + '/src/styles/components').map(f => root + '/src/styles/components/' + f).concat(fs.readdirSync(root + '/src/styles/main').map(f => root + '/src/styles/main/' + f)).filter(f => f.endsWith('.css'));
const DECL = /(^|[;{\s])(--_?qxframe9a7c2-[a-z0-9-]+)\s*:\s*((?:[^;{}()]|\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\))*)(;|(?=\s*}))/g;
// A var() without fallback whose target is private and undefined makes the declaration unresolvable.
const brokenIn = (value, defined) => {
  for (const m of value.matchAll(/var\(\s*(--_qxframe9a7c2-[a-z0-9-]+)\s*\)/g)) if (!defined.has(m[1])) return true;
  return false;
};
let total = 0;
for (let pass = 0; pass < 20; pass++) {
  const defined = new Set();
  for (const f of all()) for (const m of fs.readFileSync(f, 'utf8').matchAll(DECL)) defined.add(m[2]);
  let removed = 0;
  for (const f of files) {
    const t = fs.readFileSync(f, 'utf8');
    const n = t.replace(DECL, (m, pre, name, value) => { if (brokenIn(value, defined)) { removed++; return pre; } return m; });
    if (n !== t) fs.writeFileSync(f, n);
  }
  total += removed;
  if (!removed) break;
}
console.log(JSON.stringify({ removed: total }));
