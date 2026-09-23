import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=path.join(root,'src');
const marker=/\bStage\s+\d+\s*→\s*\d+|legacy-tail|extracted from (?:the )?frozen HOTFIX6/i;
let files=0,lines=0;
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(full);
    else if(entry.isFile()&&/\.js$/.test(entry.name)){
      const before=fs.readFileSync(full,'utf8');
      const srcLines=before.split(/\r?\n/);
      let index=0;
      while(index<srcLines.length && srcLines[index].trim()==='') index++;
      if(index>=srcLines.length || !srcLines[index].trim().startsWith('//') || !marker.test(srcLines[index])) continue;
      const start=index;
      while(index<srcLines.length && srcLines[index].trim().startsWith('//')) index++;
      while(index<srcLines.length && srcLines[index].trim()==='') index++;
      const next=srcLines.slice(0,start).concat(srcLines.slice(index));
      fs.writeFileSync(full,next.join('\n'));
      files++; lines+=index-start;
    }
  }
}
walk(src);
console.log(JSON.stringify({ok:true,files,removedHeaderLines:lines}));
