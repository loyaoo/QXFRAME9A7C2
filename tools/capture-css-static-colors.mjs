// Migration evidence only. Chromium evaluates the old formula graph offline;
// no calculator is shipped to framework runtime or invoked by normal builds.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCanonicalStyleModulePaths } from './style-source.mjs';
import { browserProbes } from './audit-css-schema-acceptance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entries = [];
for (const file of getCanonicalStyleModulePaths({ root })) {
  const text = fs.readFileSync(path.join(root, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of text.matchAll(/color-mix\s*\(/g)) {
    let end = match.index + match[0].length, depth = 1;
    while (depth && end < text.length) { const c = text[end++]; if (c === '(') depth++; if (c === ')') depth--; }
    const expression = text.slice(match.index, end);
    const normalized = expression.replace(/\s+/g, '');
    let entry = entries.find(item => item.normalized === normalized);
    if (!entry) {
      const prefix = text.slice(0, match.index), property = prefix.match(/([\w-]+)\s*:[^;{}]*$/)?.[1] || 'color';
      const owner = property.replace(/^--_?qxframe9a7c2-/, '');
      const ordinal = entries.filter(item => item.owner === owner).length + 1;
      entry = { id: owner + '-' + ordinal, owner, expression, normalized, consumers: [] };
      entries.push(entry);
    }
    entry.consumers.push({ file, line: text.slice(0, match.index).split('\n').length });
  }
}
const variants = ['', 'grey', 'gray', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange', 'red', 'pink', 'purple', 'blue', 'azure', 'white', 'black', 'primary', 'success', 'warning', 'error', 'info'];
const expression = `(() => {
  const entries = ${JSON.stringify(entries)}, variants = ${JSON.stringify(variants)}, result = {};
  const scope = document.getElementById('scope');
  const probe = document.createElement('div'); scope.appendChild(probe);
  for (const mode of ['light', 'dark']) {
    scope.setAttribute('data-qxframe9a7c2-theme', mode); result[mode] = {};
    for (const variant of variants) {
      probe.className = 'qxframe9a7c2-button' + (variant ? ' is-' + variant : '');
      result[mode][variant || 'default'] = entries.map(entry => {
        probe.style.backgroundColor = ''; probe.style.backgroundColor = entry.expression;
        const value = getComputedStyle(probe).backgroundColor;
        return value;
      });
    }
  }
  return { entries, variants, colors: result, browser: navigator.userAgent };
})()`;
const result = await browserProbes({ expression });
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/css-static-color-baseline.json'), JSON.stringify(result, null, 2) + '\n');
// Chunked log records allow evidence retrieval through the authenticated connector.
for (const mode of ['light', 'dark']) for (const variant of variants) {
  console.log('STATIC_COLOR_ROW ' + JSON.stringify({ mode, variant: variant || 'default', values: result.colors[mode][variant || 'default'] }));
}
console.log(JSON.stringify({ ok: true, expressions: entries.length, consumers: entries.reduce((n, e) => n + e.consumers.length, 0), browser: result.browser }));
