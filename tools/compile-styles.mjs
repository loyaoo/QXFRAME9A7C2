import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ownRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Plain CSS source build: no SCSS compile, no @import. Modules are concatenated in the fixed
// order declared by tools/manifests/css-order.json, each wrapped in fixed begin/end markers.
export const SEGMENT_BEGIN = '/* @qxframe9a7c2-begin ';
export const SEGMENT_END = '/* @qxframe9a7c2-end ';

export function segmentName(rel) {
  return rel.replace(/^src\/styles\//, '').replace(/\.css$/, '');
}

export function readStyleOrder(root = ownRoot) {
  const order = JSON.parse(fs.readFileSync(path.join(root, 'tools/manifests/css-order.json'), 'utf8'));
  if (!Array.isArray(order.sourceModules) || order.sourceModules.length === 0) {
    throw new Error('CSS source-order manifest must declare sourceModules.');
  }
  return order.sourceModules;
}

export function compileStyles({ root = ownRoot, outputFile = null } = {}) {
  const modules = readStyleOrder(root);
  const parts = [];
  for (const rel of modules) {
    if (!/^src\/styles\/(main|components)\/[a-z0-9-]+\.css$/.test(rel)) {
      throw new Error(`CSS source module outside main/ or components/: ${rel}`);
    }
    let body = fs.readFileSync(path.join(root, rel), 'utf8');
    if (/@import\b/.test(body)) throw new Error(`CSS source module must not use @import: ${rel}`);
    if (!body.endsWith('\n')) body += '\n';
    const name = segmentName(rel);
    parts.push(`${SEGMENT_BEGIN}${name} */\n${body}${SEGMENT_END}${name} */\n`);
  }
  const css = parts.join('');
  if (outputFile) {
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, css);
  }
  return {
    css,
    entry: path.join(root, 'tools/manifests/css-order.json'),
    loadedUrls: modules.map(rel => path.join(root, rel))
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outputArg = process.argv.find(arg => arg.startsWith('--output='));
  const outputFile = outputArg ? path.resolve(ownRoot, outputArg.slice('--output='.length)) : null;
  const result = compileStyles({ outputFile });
  console.log(JSON.stringify({
    ok: true,
    entry: path.relative(ownRoot, result.entry).replaceAll('\\', '/'),
    output: outputFile ? path.relative(ownRoot, outputFile).replaceAll('\\', '/') : null,
    bytes: Buffer.byteLength(result.css),
    modules: result.loadedUrls.map(file => path.relative(ownRoot, file).replaceAll('\\', '/'))
  }));
}
