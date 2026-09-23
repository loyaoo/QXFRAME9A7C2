import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=path.join(root,'src');
const utilsFile=path.join(src,'utils','utils.js');
const changed=[];
let replacements=0;

function walk(dir){
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()){
      if(full===path.join(src,'vendor')) continue;
      out.push(...walk(full));
    } else if(entry.isFile() && /\.(?:js|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}
function importSpec(file){
  let rel=path.relative(path.dirname(file),utilsFile).split(path.sep).join('/');
  if(!rel.startsWith('.')) rel='./'+rel;
  return rel;
}
for(const file of walk(src)){
  if(file===utilsFile) continue;
  let text=fs.readFileSync(file,'utf8');
  const count=(text.match(/\bObject\.assign\s*\(/g)||[]).length;
  if(!count) continue;
  if(!/\bimport\s*\{[^}]*\bUtils\b[^}]*\}\s*from\s*['"][^'"]*utils\.js['"]/.test(text)){
    if(/\b(?:const|let|var|function|class)\s+Utils\b/.test(text)) throw new Error('Utils binding collision: '+path.relative(root,file));
    text="import { Utils } from '"+importSpec(file)+"';\n"+text;
  }
  text=text.replace(/\bObject\.assign\s*\(/g,'Utils.assignOwn(');
  fs.writeFileSync(file,text);
  changed.push(path.relative(root,file).split(path.sep).join('/'));
  replacements+=count;
}
console.log(JSON.stringify({ok:true,replacements,files:changed.length,changed:changed.sort()},null,2));
