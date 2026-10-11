// Shared collectors for the v3 CSS gates (createApp redesign, sections 5 and 6).
// Each collector returns violations as { rule, segment, detail }. The verify scripts compare the
// per-rule/per-segment counts against tools/manifests/css-gate-baseline.json (ratchet): a count may
// fall but never rise. The baseline must reach zero by the end of the redesign.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseCss, splitSelectors } from './css-ast.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BASELINE_FILE = path.join(root, 'tools/manifests/css-gate-baseline.json');
// The closed token list is registered in docs/create/tokens.js (shared with the createApp compiler).
export const REGISTRY_FILE = path.join(root, 'docs/create/tokens.js');
const registryModule = await import(pathToFileURL(REGISTRY_FILE).href);
export const THEME_FILE_WARN_BYTES = 16 * 1024;

export const THEME_PREFIX = '--qxframe9a7c2-theme-';
const THEME_SELECTORS = new Set([':root', '.dark']);

const VIEWPORT_UNIT = /(?:^|[^a-z0-9_.#-])-?(?:\d*\.)?\d+(?:vw|vh|vmin|vmax|vi|vb|dvh|dvw|svh|svw|lvh|lvw|dvi|dvb|svi|svb|lvi|lvb)\b/i;
const FR_UNIT = /(?:^|[^a-z0-9_.#-])-?(?:\d*\.)?\d+fr\b/i;
const LENGTH = /(?:^|[^a-z0-9_.#-])(-?(?:\d*\.)?\d+)(px|em|ex|ch|pt|pc|cm|mm|in|q)\b/gi;
const COLOR_FUNCTION = /(?:^|[^a-z0-9_-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
const HEX_COLOR = /(?:^|[^a-z0-9_&-])#[0-9a-f]{3,8}\b/i;
const NAMED_COLORS = ['white', 'black', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'gray', 'grey', 'silver', 'navy', 'teal', 'maroon', 'olive', 'lime', 'aqua', 'fuchsia', 'cyan', 'magenta'];
const NAMED_COLOR = new RegExp(`(?:^|[\\s,(])(?:${NAMED_COLORS.join('|')})(?=$|[\\s,)])`, 'i');
const NON_COLOR_PROPS = /^(?:font|font-family|content|animation|animation-name|transition|transition-property|will-change|grid-area|counter-|list-style-type|quotes)/;

export function readDistCss() {
  const file = path.join(root, 'dist/qxframe9a7c2.css');
  if (!fs.existsSync(file)) throw new Error('dist/qxframe9a7c2.css is missing; run npm run build first.');
  return fs.readFileSync(file, 'utf8');
}

export function readRegistry() {
  return {
    tokens: registryModule.THEME_TOKENS.map(t => ({ name: registryModule.TOKEN_PREFIX + t.name, mode: t.mode })),
  };
}

function isRootSelector(sel, context) {
  if (sel === ':root') return true;
  return sel === ':scope' && context.some(c => /^@scope\s*\(\s*:root\s*\)/.test(c));
}

// A theme block is a top-level :root / .dark rule that declares theme tokens. Other :root /
// .dark rules are ordinary framework rules (e.g. legacy dark palettes still to be removed).
export function isThemeBlock(rule) {
  return rule.context.length === 0 && rule.selectors.length > 0 && rule.selectors.every(s => THEME_SELECTORS.has(s))
    && rule.declarations.some(d => d.prop.startsWith(THEME_PREFIX));
}

function stripVarNames(value) {
  // Custom-property names inside var() must not be mistaken for color keywords or units.
  return value.replace(/--[a-z0-9_-]+/gi, '');
}

export function hasColorLiteral(prop, value) {
  if (NON_COLOR_PROPS.test(prop)) return false;
  const v = stripVarNames(value);
  return COLOR_FUNCTION.test(v) || HEX_COLOR.test(v) || NAMED_COLOR.test(v);
}

function nonRemLengths(value) {
  const out = [];
  for (const m of stripVarNames(value).matchAll(LENGTH)) {
    const num = Math.abs(Number(m[1]));
    if (m[2].toLowerCase() === 'px' && (num === 0 || num === 1)) continue;
    out.push(m[1] + m[2]);
  }
  return out;
}

// Section 6: framework CSS constraints.
export function collectSection6(css) {
  const { rules, atRules } = parseCss(css);
  const v = [];
  const add = (rule, segment, detail) => v.push({ rule, segment: segment || '(none)', detail });
  if (/@import\b/.test(css.replace(/\/\*[\s\S]*?\*\//g, ''))) add('import', null, '@import');
  for (const at of atRules) {
    if (/^@layer\b/.test(at.prelude)) add('layer', at.segment, at.prelude);
    if (/:(?:is|where)\(/.test(at.prelude)) add('is-where', at.segment, at.prelude);
    if (/^@media\b/.test(at.prelude)) {
      if (VIEWPORT_UNIT.test(at.prelude)) add('viewport-unit', at.segment, at.prelude);
      for (const len of nonRemLengths(at.prelude)) add('non-rem-length', at.segment, `${at.prelude} → ${len}`);
    }
    if (at.keyframes) {
      for (const d of at.body.split(/[;{}]/)) {
        const [prop, ...rest] = d.split(':');
        const value = rest.join(':').trim();
        if (!value) continue;
        if (/!\s*important/i.test(value)) add('important', at.segment, `${at.prelude} ${prop.trim()}`);
        if (VIEWPORT_UNIT.test(value)) add('viewport-unit', at.segment, `${at.prelude} ${prop.trim()}: ${value}`);
        for (const len of nonRemLengths(value)) add('non-rem-length', at.segment, `${at.prelude} ${prop.trim()} → ${len}`);
      }
    }
  }
  for (const r of rules) {
    if (!r.segment) add('outside-segment', null, r.selector);
    if (/:(?:is|where)\(/.test(r.selector)) add('is-where', r.segment, r.selector);
    for (const d of r.declarations) {
      const where = `${r.selector} { ${d.prop} }`;
      if (d.important) add('important', r.segment, where);
      if (/^grid(?:-|$)/.test(d.prop) || (/^display$/.test(d.prop) && /\b(?:inline-)?grid\b/.test(d.value))) add('grid', r.segment, `${where}: ${d.value}`);
      if (FR_UNIT.test(stripVarNames(d.value))) add('fr-unit', r.segment, `${where}: ${d.value}`);
      if (VIEWPORT_UNIT.test(stripVarNames(d.value))) add('viewport-unit', r.segment, `${where}: ${d.value}`);
      if (!r.atBlock) for (const len of nonRemLengths(d.value)) add('non-rem-length', r.segment, `${where} → ${len}`);
    }
  }
  return v;
}

// Section 5: theme token rules.
export function collectSection5(css, { registry = readRegistry() } = {}) {
  const { rules } = parseCss(css);
  const v = [];
  const add = (rule, segment, detail) => v.push({ rule, segment: segment || '(none)', detail });
  const registered = registry ? new Set(registry.tokens.map(t => t.name)) : new Set();
  const seenTheme = new Set();
  const owners = new Map();
  for (const r of rules) {
    const themeBlock = isThemeBlock(r);
    const rootish = r.selectors.some(s => isRootSelector(s, r.context));
    for (const d of r.declarations) {
      const where = `${r.context.length ? r.context.join(' ') + ' ' : ''}${r.selector} { ${d.prop} }`;
      if (d.prop.startsWith(THEME_PREFIX)) {
        seenTheme.add(d.prop);
        if (!themeBlock) add('theme-token-outside-root', r.segment, where);
      } else if (d.prop.startsWith('--qxframe9a7c2-')) {
        add('public-component-token-declared', r.segment, where);
      }
      if ((themeBlock || rootish) && d.prop.startsWith('--') && !d.prop.startsWith(THEME_PREFIX)) add('root-non-theme-declaration', r.segment, where);
      if (!themeBlock && hasColorLiteral(d.prop, d.value)) add('hardcoded-color', r.segment, `${where}: ${d.value}`);
      for (const m of d.value.matchAll(/--qxframe9a7c2-theme-[a-z0-9-]+/g)) seenTheme.add(m[0]);
      if (!r.atBlock) {
        for (const sel of r.selectors) {
          const key = `${r.context.join(' | ')}§${sel}§${d.prop}`;
          const prev = owners.get(key);
          if (prev && prev !== r) add('duplicate-owner', r.segment, `${r.context.length ? r.context.join(' ') + ' ' : ''}${sel} { ${d.prop} } (also line ${prev.line})`);
          else if (!prev) owners.set(key, r);
        }
      }
    }
  }
  for (const name of [...seenTheme].sort()) if (!registered.has(name)) add('unregistered-theme-token', null, name);
  return v;
}

// A theme file (exported or the default block) may only hold :root / .dark blocks of registered
// --qxframe9a7c2-theme-* declarations.
export function checkThemeFile(css, { registry = readRegistry() } = {}) {
  const { rules, atRules } = parseCss(css);
  const errors = [];
  const registered = registry ? new Set(registry.tokens.map(t => t.name)) : null;
  for (const at of atRules) errors.push(`at-rule not allowed in a theme file: ${at.prelude}`);
  for (const r of rules) {
    if (!isThemeBlock(r)) { errors.push(`selector not allowed in a theme file: ${r.selector}`); continue; }
    for (const d of r.declarations) {
      if (!d.prop.startsWith(THEME_PREFIX)) errors.push(`${r.selector}: only ${THEME_PREFIX}* is allowed, found ${d.prop}`);
      else if (registered && !registered.has(d.prop)) errors.push(`${r.selector}: unregistered theme token ${d.prop}`);
    }
  }
  // v3 §5.2: both :root and .dark must declare the entire registered token inventory.
  if (registry) {
    const declared = sel => new Set(rules.filter(r => r.selectors.includes(sel)).flatMap(r => r.declarations.map(d => d.prop)));
    const rootSet = declared(':root'), darkSet = declared('.dark');
    for (const t of registry.tokens) {
      if (!rootSet.has(t.name)) errors.push(`:root is missing ${t.name}`);
      if (!darkSet.has(t.name)) errors.push(`.dark is missing ${t.name}`);
    }
  }
  const bytes = Buffer.byteLength(css);
  return { errors, bytes, warn: bytes > THEME_FILE_WARN_BYTES };
}

export function extractDefaultThemeBlocks(css) {
  // The default theme is the set of top-level :root / .dark rules that declare theme tokens.
  const { rules } = parseCss(css);
  return rules
    .filter(r => isThemeBlock(r) && r.declarations.some(d => d.prop.startsWith(THEME_PREFIX)))
    .map(r => `${r.selector} {\n${r.declarations.map(d => `  ${d.prop}: ${d.value};`).join('\n')}\n}\n`)
    .join('');
}

export function countViolations(violations) {
  const counts = {};
  for (const { rule, segment } of violations) {
    counts[rule] ??= {};
    counts[rule][segment] = (counts[rule][segment] || 0) + 1;
  }
  for (const rule of Object.keys(counts)) {
    counts[rule] = Object.fromEntries(Object.entries(counts[rule]).sort(([a], [b]) => a.localeCompare(b)));
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

export function readBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) return { section5: {}, section6: {} };
  return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
}

// Ratchet comparison: returns { increased: [...], decreased: [...] } rows of rule/segment/baseline/actual.
export function compareToBaseline(actual, baseline, rules) {
  const increased = [], decreased = [];
  for (const rule of rules) {
    const a = actual[rule] || {}, b = baseline[rule] || {};
    for (const seg of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const av = a[seg] || 0, bv = b[seg] || 0;
      if (av > bv) increased.push({ rule, segment: seg, baseline: bv, actual: av });
      else if (av < bv) decreased.push({ rule, segment: seg, baseline: bv, actual: av });
    }
  }
  return { increased, decreased };
}

export function writeBaselineSection(section, counts, { allowIncrease = false, rules } = {}) {
  const baseline = readBaseline();
  const current = baseline[section] || {};
  if (!allowIncrease) {
    const { increased } = compareToBaseline(counts, current, rules);
    if (increased.length && Object.keys(current).length) {
      throw new Error('Refusing to raise the ratchet baseline without --allow-increase:\n' + increased.map(r => `  ${r.rule} ${r.segment}: ${r.baseline} → ${r.actual}`).join('\n'));
    }
  }
  baseline[section] = Object.fromEntries(rules.map(rule => [rule, counts[rule] || {}]));
  baseline.note = 'Ratchet baseline for the v3 createApp redesign CSS gates. Counts may only fall; every rule must reach zero by stage 5.';
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2) + '\n');
}

export { splitSelectors };
