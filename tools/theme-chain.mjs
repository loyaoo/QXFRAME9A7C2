// Print the full chain of a component property from its final declaration back to the theme
// inputs, and flag duplicate owners (the same selector/property written by more than one rule).
//   node tools/theme-chain.mjs --selector=.qxframe9a7c2-button --prop=border-radius [--css=<file>]
import fs from 'node:fs';
import path from 'node:path';
import { parseCss } from './css-ast.mjs';
import { root, THEME_PREFIX } from './css-gates.mjs';

const arg = name => (process.argv.find(a => a.startsWith(`--${name}=`)) || '').slice(name.length + 3);
const selector = arg('selector');
const prop = arg('prop');
if (!selector || !prop) {
  console.error('usage: node tools/theme-chain.mjs --selector=<class selector> --prop=<property> [--css=<file>]');
  process.exit(2);
}
const css = fs.readFileSync(arg('css') || path.join(root, 'dist/qxframe9a7c2.css'), 'utf8');
const { rules } = parseCss(css);

const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matchesSelector = sel => new RegExp(`${escaped}(?![a-z0-9_-])`).test(sel);
const declarationsOf = (name, filter = () => true) => rules.flatMap(r => r.declarations
  .filter(d => d.prop === name && filter(r))
  .map(d => ({ rule: r, decl: d })));

function where(r) {
  return `${r.segment}:${r.line}  ${r.context.length ? r.context.join(' ') + ' ' : ''}${r.selector.length > 140 ? r.selector.slice(0, 140) + '…' : r.selector}`;
}

const seen = new Set();
let depth = 0;
const maxDepth = 12;
function explain(value, indent) {
  for (const m of value.matchAll(/var\(\s*(--[a-z0-9_-]+)/gi)) {
    const name = m[1];
    const pad = '  '.repeat(indent);
    if (name.startsWith(THEME_PREFIX)) {
      const owners = declarationsOf(name);
      console.log(`${pad}↳ ${name}  [theme input${owners.length ? '' : ', not declared'}]`);
      for (const { rule, decl } of owners) console.log(`${pad}    = ${decl.value}    @ ${where(rule)}`);
      continue;
    }
    if (seen.has(name) || indent > maxDepth) { console.log(`${pad}↳ ${name}  (see above)`); continue; }
    seen.add(name);
    const owners = declarationsOf(name, r => r.selectors.some(matchesSelector) || r.selectors.some(s => /^(?::root|\.dark|:scope|\[data-qxframe9a7c2-theme[^\]]*\]|\[class[\^*]=.*\])$/.test(s)));
    const all = owners.length ? owners : declarationsOf(name);
    const kind = name.startsWith('--_') ? 'private' : 'public override (no default)';
    console.log(`${pad}↳ ${name}  [${kind}; ${all.length} declaration${all.length === 1 ? '' : 's'}${owners.length ? '' : ' elsewhere'}]`);
    for (const { rule, decl } of all.slice(0, 6)) {
      console.log(`${pad}    = ${decl.value}    @ ${where(rule)}`);
      explain(decl.value, indent + 2);
    }
    if (all.length > 6) console.log(`${pad}    … ${all.length - 6} more`);
  }
}

const finals = declarationsOf(prop, r => r.selectors.some(matchesSelector));
console.log(`${selector} { ${prop} } — ${finals.length} writer rule${finals.length === 1 ? '' : 's'}`);
for (const { rule, decl } of finals) {
  console.log(`● ${decl.value}${decl.important ? ' !important' : ''}    @ ${where(rule)}`);
  explain(decl.value, 1);
}
const exact = finals.filter(({ rule }) => rule.selectors.includes(selector) && rule.context.length === 0);
if (exact.length > 1) {
  console.log(`\nDUPLICATE OWNER: ${selector} { ${prop} } is written by ${exact.length} unconditional rules.`);
  process.exitCode = 1;
}
