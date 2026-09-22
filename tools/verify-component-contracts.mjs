import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ComponentContracts } from '../src/core/componentContracts.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiPath = path.join(root, 'docs', 'generated', 'component-api.json');
const demosPath = path.join(root, 'docs', 'assets', 'qxframe9a7c2-component-demos.js');

function fail(message) { throw new Error('[verify-component-contracts] ' + message); }
function assert(condition, message) { if (!condition) fail(message); }

const api = JSON.parse(fs.readFileSync(apiPath, 'utf8'));
const schemas = new Map((api.components || []).map(component => [component.name, new Set(Object.keys(component.schema || {}))]));
assert(schemas.size === 40, `Expected 40 visible component schemas, got ${schemas.size}.`);

const contractMismatches = [];
const contractNames = ComponentContracts.names.slice().sort();
assert(contractNames.length === 40, `Expected 40 runtime component contracts, got ${contractNames.length}.`);
assert(JSON.stringify(contractNames) === JSON.stringify(Array.from(schemas.keys()).sort()), 'Generated component API names drifted from ComponentContracts.');
for (const name of contractNames) {
  const contract = ComponentContracts.get(name);
  const runtimeKeys = Object.keys((contract && contract.schema) || {}).sort();
  const generatedKeys = Array.from(schemas.get(name) || []).sort();
  if (JSON.stringify(runtimeKeys) !== JSON.stringify(generatedKeys)) {
    const missing = runtimeKeys.filter(key => !generatedKeys.includes(key));
    const extra = generatedKeys.filter(key => !runtimeKeys.includes(key));
    contractMismatches.push(`${name}: missing=[${missing.join(', ')}] extra=[${extra.join(', ')}]`);
  }
}
assert(contractMismatches.length === 0, 'Generated Runtime Schema drifted from canonical ComponentContracts:\n' + contractMismatches.join('\n'));

function matchingClose(text, start, open, close) {
  let depth = 0;
  let quote = null;
  let escape = false;
  let comment = null;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1] || '';
    if (comment === 'line') { if (char === '\n') comment = null; continue; }
    if (comment === 'block') { if (char === '*' && next === '/') { comment = null; index += 1; } continue; }
    if (quote) {
      if (escape) escape = false;
      else if (char === '\\') escape = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '/' && next === '/') { comment = 'line'; index += 1; continue; }
    if (char === '/' && next === '*') { comment = 'block'; index += 1; continue; }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === open) depth += 1;
    else if (char === close) {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return text.length;
}

function splitTopLevel(text) {
  const parts = [];
  let start = 0;
  let curly = 0, square = 0, round = 0;
  let quote = null, escape = false, comment = null;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index], next = text[index + 1] || '';
    if (comment === 'line') { if (char === '\n') comment = null; continue; }
    if (comment === 'block') { if (char === '*' && next === '/') { comment = null; index += 1; } continue; }
    if (quote) {
      if (escape) escape = false;
      else if (char === '\\') escape = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '/' && next === '/') { comment = 'line'; index += 1; continue; }
    if (char === '/' && next === '*') { comment = 'block'; index += 1; continue; }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') curly += 1; else if (char === '}') curly -= 1;
    else if (char === '[') square += 1; else if (char === ']') square -= 1;
    else if (char === '(') round += 1; else if (char === ')') round -= 1;
    else if (char === ',' && curly === 0 && square === 0 && round === 0) { parts.push(text.slice(start, index)); start = index + 1; }
  }
  parts.push(text.slice(start));
  return parts;
}

function objectKeys(objectText) {
  const output = [];
  for (const rawPart of splitTopLevel(objectText.slice(1, -1))) {
    const part = rawPart.trim();
    if (!part || part.startsWith('...')) continue;
    const match = part.match(/^(?:["']([^"']+)["']|([A-Za-z_$][\w$]*))\s*:/);
    if (match) output.push(match[1] || match[2]);
  }
  return output;
}

function callObjectArgs(body, method) {
  const output = [];
  const pattern = new RegExp('\\bC\\.' + method + '\\s*\\(', 'g');
  let match;
  while ((match = pattern.exec(body))) {
    const open = body.indexOf('(', match.index);
    const end = matchingClose(body, open, '(', ')');
    const args = splitTopLevel(body.slice(open + 1, end - 1));
    for (const arg of args) {
      const value = arg.trim();
      if (value.startsWith('{')) output.push(value.slice(0, matchingClose(value, 0, '{', '}')));
    }
    pattern.lastIndex = end;
  }
  return output;
}

const demos = fs.readFileSync(demosPath, 'utf8');
const demoMismatches = [];
for (const match of demos.matchAll(/function\s+mount([A-Za-z0-9_$]+)\s*\(ctx\)\s*\{/g)) {
  const name = match[1];
  if (!schemas.has(name)) continue;
  const open = demos.indexOf('{', match.index);
  const end = matchingClose(demos, open, '{', '}');
  const body = demos.slice(open, end);
  const keys = new Set();
  ['create', 'enhance'].forEach(method => callObjectArgs(body, method).forEach(objectText => objectKeys(objectText).forEach(key => keys.add(key))));
  const missing = Array.from(keys).filter(key => !schemas.get(name).has(key)).sort();
  if (missing.length) demoMismatches.push(`${name}: ${missing.join(', ')}`);
}
assert(demoMismatches.length === 0, 'Canonical component demos use options missing from Runtime Schema:\n' + demoMismatches.join('\n'));

function apiSchemaRule(componentName, optionName) {
  const component = api.components.find(item => item.name === componentName);
  assert(component && component.schema && Object.prototype.hasOwnProperty.call(component.schema, optionName), `${componentName}.${optionName} must exist in generated Runtime Schema.`);
  return component.schema[optionName];
}
function assertTypes(componentName, optionName, expectedTypes) {
  const rule = apiSchemaRule(componentName, optionName);
  const actual = rule && Array.isArray(rule.types) ? rule.types.slice().sort() : [];
  const expected = expectedTypes.slice().sort();
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${componentName}.${optionName} must accept [${expected.join(', ')}], got ${JSON.stringify(rule)}.`);
}

// Polymorphic public options that previously drifted under global name-based inference.
assertTypes('InputNumber', 'step', ['number', 'string']);
assertTypes('InputOTP', 'separator', ['string', 'function']);
assertTypes('InputOTP', 'placeholder', ['string', 'array']);
['Select','Tags'].forEach(name => assertTypes(name, 'tokenSeparators', ['array', 'function']));
['Trigger','Dropdown'].forEach(name => assertTypes(name, 'offset', ['number', 'object', 'function']));
['Menu','Dropdown'].forEach(name => assertTypes(name, 'submenuOffset', ['number', 'object', 'function']));
['Drawer','Modal'].forEach(name => assertTypes(name, 'closable', ['boolean', 'object']));
assertTypes('Result', 'size', ['string', 'number']);
['Autocomplete','Cascader','ColorPicker','DatePicker','Select','TimePicker','TreeSelect','WheelPicker'].forEach(name => {
  assert(apiSchemaRule(name, 'renderControl') === 'boolean', `${name}.renderControl must remain boolean.`);
});
assert(apiSchemaRule('Select', 'getKey').type === 'function', 'Select.getKey must remain a callback option.');

// Custom validators must survive the generated JSON/TypeScript contract rather than disappearing via JSON.stringify(function).
assert((api.components.find(item => item.name === 'Drawer') || {}).schema.autoFocus === 'custom', 'Drawer.autoFocus custom Runtime validator must remain visible in generated API metadata.');
assert((api.components.find(item => item.name === 'Modal') || {}).schema.autoFocus === 'custom', 'Modal.autoFocus custom Runtime validator must remain visible in generated API metadata.');

// Result canonical spelling: do not reintroduce an accidental subTitle parallel option in the Result demo.
const resultDemoMatch = demos.match(/function\s+mountResult\s*\(ctx\)\s*\{/);
if (resultDemoMatch) { const open = demos.indexOf('{', resultDemoMatch.index); const end = matchingClose(demos, open, '{', '}'); assert(!/\bsubTitle\s*:/.test(demos.slice(open, end)), 'Result demos must use canonical subtitle, not accidental subTitle.'); }

console.log(JSON.stringify({ ok: true, schemas: schemas.size, canonicalContracts: contractNames.length, contractDrift: 0, demoContractDrift: 0 }));
