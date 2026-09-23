import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const srcRoot=path.join(root,'src');
const utilsFile=path.join(srcRoot,'utils','utils.js');

function walk(dir){
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()){
      if(entry.name==='vendor') continue;
      out.push(...walk(file));
    } else if(entry.isFile()&&file.endsWith('.js')) out.push(file);
  }
  return out;
}
function relativeImport(from,to){
  let rel=path.relative(path.dirname(from),to).split(path.sep).join('/');
  if(!rel.startsWith('.')) rel='./'+rel;
  return rel;
}
let filesChanged=0,replacements=0,importsAdded=0;
for(const file of walk(srcRoot)){
  if(file===utilsFile) continue;
  let source=fs.readFileSync(file,'utf8');
  const matches=source.match(/Object\.assign\(\s*\{\}\s*,/g);
  if(!matches||!matches.length) continue;
  if(/\b(?:const|let|var|class|function)\s+Utils\b/.test(source)&&!/import\s*\{[^}]*\bUtils\b[^}]*\}/.test(source)){
    throw new Error('Cannot safely add Utils import because local Utils binding exists: '+path.relative(root,file));
  }
  source=source.replace(/Object\.assign\(\s*\{\}\s*,/g,'Utils.mergeOwn(');
  replacements+=matches.length;
  if(!/import\s*\{[^}]*\bUtils\b[^}]*\}\s*from\s*['"][^'"]*utils\.js['"]/.test(source)){
    source="import { Utils } from '"+relativeImport(file,utilsFile)+"';\n"+source;
    importsAdded+=1;
  }
  fs.writeFileSync(file,source);
  filesChanged+=1;
}
if(!replacements) throw new Error('No empty-target Object.assign candidates were found.');
console.log(JSON.stringify({ok:true,filesChanged,replacements,importsAdded}));
