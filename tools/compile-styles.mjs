import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';

const ownRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function compileStyles({ root = ownRoot, outputFile = null } = {}) {
  const entry = path.join(root, 'src/styles/qxframe9a7c2.scss');
  const result = sass.compile(entry, {
    style: 'expanded',
    charset: false,
    sourceMap: false,
    quietDeps: true
  });
  const css = result.css.endsWith('\n') ? result.css : result.css + '\n';
  if (outputFile) {
    fs.mkdirSync(path.dirname(outputFile), { recursive:true });
    fs.writeFileSync(outputFile, css);
  }
  return {
    css,
    entry,
    loadedUrls: result.loadedUrls.map(url => fileURLToPath(url))
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outputArg = process.argv.find(arg => arg.startsWith('--output='));
  const outputFile = outputArg ? path.resolve(ownRoot, outputArg.slice('--output='.length)) : null;
  const result = compileStyles({ outputFile });
  console.log(JSON.stringify({
    ok:true,
    entry:path.relative(ownRoot,result.entry).replaceAll('\\','/'),
    output:outputFile ? path.relative(ownRoot,outputFile).replaceAll('\\','/') : null,
    bytes:Buffer.byteLength(result.css),
    modules:result.loadedUrls.map(file => path.relative(ownRoot,file).replaceAll('\\','/'))
  }));
}
