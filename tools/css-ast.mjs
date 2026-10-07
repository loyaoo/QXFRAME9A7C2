// Minimal CSS parser for framework gates. Handles comments, strings, nested at-rules and the
// release segment markers emitted by tools/compile-styles.mjs. Produces flat style rules with
// their at-rule context, source segment and declarations.

const MARKER = /^\/\* @qxframe9a7c2-(begin|end) ([a-z0-9/-]+) \*\/$/;

function splitDeclarations(body) {
  const out = [];
  let depth = 0, quote = null, start = 0;
  for (let i = 0; i <= body.length; i++) {
    const ch = body[i];
    if (quote) { if (ch === '\\') i++; else if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if ((ch === ';' && depth === 0) || i === body.length) {
      const text = body.slice(start, i).trim();
      start = i + 1;
      if (!text) continue;
      const colon = text.indexOf(':');
      if (colon < 0) continue;
      const prop = text.slice(0, colon).trim();
      let value = text.slice(colon + 1).trim();
      const important = /!\s*important\s*$/i.test(value);
      if (important) value = value.replace(/!\s*important\s*$/i, '').trim();
      out.push({ prop, value, important });
    }
  }
  return out;
}

export function splitSelectors(selector) {
  const out = [];
  let depth = 0, quote = null, start = 0;
  for (let i = 0; i <= selector.length; i++) {
    const ch = selector[i];
    if (quote) { if (ch === '\\') i++; else if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if ((ch === ',' && depth === 0) || i === selector.length) {
      const s = selector.slice(start, i).trim().replace(/\s+/g, ' ');
      if (s) out.push(s);
      start = i + 1;
    }
  }
  return out;
}

export function parseCss(css) {
  const rules = [];
  const atRules = [];
  const stack = [];
  let segment = null;
  let i = 0, buf = '', line = 1, bufLine = 1;
  const n = css.length;
  while (i < n) {
    const ch = css[i];
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      const comment = css.slice(i, end + 2);
      const m = MARKER.exec(comment);
      if (m) segment = m[1] === 'begin' ? m[2] : null;
      for (const c of comment) if (c === '\n') line++;
      i = end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < n && css[j] !== ch) { if (css[j] === '\\') j++; j++; }
      buf += css.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (ch === '\n') line++;
    if (ch === '{') {
      const prelude = buf.trim().replace(/\s+/g, ' ');
      buf = '';
      if (prelude.startsWith('@')) {
        const atRule = { prelude, segment, line: bufLine };
        if (/^@(?:font-face|page|property|counter-style)\b/.test(prelude)) {
          // Declaration-bearing at-rule: read its body as declarations.
          const end = findBlockEnd(css, i + 1);
          const body = css.slice(i + 1, end);
          rules.push({ selector: prelude, selectors: [prelude], context: stack.map(s => s.prelude), segment, line: bufLine, declarations: splitDeclarations(stripComments(body)), atBlock: true });
          for (const c of body) if (c === '\n') line++;
          i = end + 1;
          bufLine = line;
          continue;
        }
        if (/^@keyframes\b|^@-webkit-keyframes\b/.test(prelude)) {
          const end = findBlockEnd(css, i + 1);
          const body = css.slice(i + 1, end);
          atRules.push({ ...atRule, context: stack.map(s => s.prelude), keyframes: true, body });
          for (const c of body) if (c === '\n') line++;
          i = end + 1;
          bufLine = line;
          continue;
        }
        atRules.push({ ...atRule, context: stack.map(s => s.prelude) });
        stack.push({ prelude, type: 'at' });
        i++;
        bufLine = line;
        continue;
      }
      // Style rule: read declarations until the matching close brace (no nesting in QX CSS).
      const end = findBlockEnd(css, i + 1);
      const body = css.slice(i + 1, end);
      rules.push({ selector: prelude, selectors: splitSelectors(prelude), context: stack.map(s => s.prelude), segment, line: bufLine, declarations: splitDeclarations(stripComments(body)) });
      for (const c of body) if (c === '\n') line++;
      i = end + 1;
      bufLine = line;
      continue;
    }
    if (ch === '}') {
      stack.pop();
      buf = '';
      i++;
      bufLine = line;
      continue;
    }
    if (ch === ';' && buf.trim().startsWith('@')) {
      atRules.push({ prelude: buf.trim(), segment, line: bufLine, context: stack.map(s => s.prelude), statement: true });
      buf = '';
      i++;
      bufLine = line;
      continue;
    }
    if (!buf.trim()) bufLine = line;
    buf += ch;
    i++;
  }
  return { rules, atRules };
}

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '');
}

function findBlockEnd(css, from) {
  let depth = 1, quote = null;
  for (let i = from; i < css.length; i++) {
    const ch = css[i];
    if (quote) { if (ch === '\\') i++; else if (ch === quote) quote = null; continue; }
    if (ch === '/' && css[i + 1] === '*') { i = css.indexOf('*/', i + 2) + 1; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return i; }
  }
  throw new Error('Unbalanced CSS block starting at offset ' + from);
}
